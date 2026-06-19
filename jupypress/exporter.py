"""
Exporter: orchestrates notebook → HTML pipeline.

Handles:
  - Loading notebook
  - Optional execution
  - Building slides
  - Rendering cells
  - Jinja2 template rendering
  - Inlining CSS/JS for standalone HTML
"""

import importlib.resources
import re
from pathlib import Path

import nbformat
from jinja2 import Environment, PackageLoader
from jupyter_core.paths import jupyter_data_dir
from nbconvert.preprocessors import ExecutePreprocessor

from jupypress.cell_renderer import CellRenderer
from jupypress.slide_builder import SlideBuilder, SlideData

THEME_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$")
BUILTIN_THEME_FILES = {
    "default": "default",
    "jupypress": "default",
    "jupyterlab": "jupyterlab",
}


class Exporter:
    """
    Main orchestrator for notebook → HTML export.
    """

    def __init__(self):
        """Initialize exporter with Jinja2 environment."""
        self.jinja_env = Environment(
            loader=PackageLoader("jupypress", "templates"),
            autoescape=False,  # We handle escaping manually in template
        )
        self.renderer = CellRenderer()

    def export(
        self,
        notebook_path: str,
        execute: bool = False,
        theme: str = "default",
        custom_css: str = "",
    ) -> str:
        """
        Export notebook to standalone HTML.

        Args:
            notebook_path: Path to .ipynb file
            execute: Whether to execute cells before export
            theme: Theme name to apply
            custom_css: Additional custom CSS

        Returns:
            HTML string (complete, standalone document)
        """
        # Load notebook
        with open(notebook_path, "r") as f:
            notebook = nbformat.read(f, as_version=4)

        # Optional: execute notebook
        if execute:
            ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
            notebook, _ = ep.preprocess(notebook, {"metadata": {"path": "."}})

        # Build slides
        builder = SlideBuilder(notebook)
        slides_data = builder.build()

        # Render slides to HTML
        rendered_slides = []
        for slide in slides_data:
            slot_html = self._render_slide_slots(notebook, slide)
            rendered_slides.append(
                {
                    "id": slide.id,
                    "name": slide.name,
                    "layout": slide.layout,
                    "layout_class": f"slide--{slide.layout}",
                    "show_header": slide.show_header,
                    "slot_html": slot_html,
                }
            )

        # Load CSS and JS files
        base_css = self._load_template_file("static/css/base.css")
        theme_css = self._load_theme_css(theme)
        if custom_css:
            theme_css += "\n" + custom_css
        navigation_js = self._load_template_file("static/js/navigation.js")

        # Get notebook title
        title = notebook.metadata.get("title", "Presentation")

        # Extract widget state for static widget rendering
        widget_state = self._extract_widget_state(notebook)

        # Render template
        template = self.jinja_env.get_template("deck.html.j2")
        html = template.render(
            title=title,
            slides=rendered_slides,
            base_css=base_css,
            theme_css=theme_css,
            navigation_js=navigation_js,
            widget_state=widget_state,
        )

        return html

    def _extract_widget_state(self, notebook) -> dict | None:
        """Extract Jupyter widget state from notebook metadata."""
        try:
            widgets_meta = notebook.metadata.get("widgets", {})
            state = widgets_meta.get("application/vnd.jupyter.widget-state+json")
            if state:
                return state
        except Exception:
            pass
        return None

    def _render_slide_slots(self, notebook, slide: SlideData) -> dict[str, str]:
        """
        Render each slot of a slide to HTML.

        Returns:
            Dict mapping slot name → HTML string
        """
        slot_html: dict[str, str] = {}

        for slot_name, cell_slots in slide.slots.items():
            parts = []
            for cell_slot in cell_slots:
                cell = notebook.cells[cell_slot.cell_index]

                if cell.cell_type == "markdown":
                    cell_html = self.renderer.render_markdown(cell.source)
                    parts.append(
                        f'<div class="slide-cell markdown-cell">{cell_html}</div>'
                    )

                elif cell.cell_type == "code":
                    if cell_slot.include in ("full", "input-only"):
                        code_html = self.renderer.render_code_input(cell.source)
                        parts.append(code_html)

                    if cell_slot.include in ("full", "output-only"):
                        outputs = cell.get("outputs", [])
                        output_html = self.renderer.render_code_output(outputs)
                        if output_html:
                            parts.append(output_html)

            slot_html[slot_name] = "".join(parts)

        return slot_html

    def _load_template_file(self, filename: str) -> str:
        """
        Load a template file (CSS or JS) for inlining.

        Args:
            filename: File path relative to templates/

        Returns:
            File contents as string
        """
        try:
            # Use importlib.resources to load template files
            parts = filename.split("/")
            if len(parts) == 1:
                # File in templates/ root
                resource = importlib.resources.files("jupypress").joinpath(
                    "templates", filename
                )
            else:
                # File in subdirectory like templates/static/css/base.css
                resource = importlib.resources.files("jupypress").joinpath(
                    "templates", *parts
                )

            return resource.read_text(encoding="utf-8")
        except Exception as e:
            raise IOError(f"Failed to load template file {filename}: {e}")

    def _load_theme_css(self, theme: str) -> str:
        """Load a built-in or user-saved theme CSS file."""
        if not THEME_NAME_RE.match(theme):
            raise ValueError(f"Invalid theme name: {theme}")

        default_css = self._load_template_file("themes/default/theme.css")
        theme_key = theme.lower()
        if theme_key in ("default", "jupypress"):
            return default_css

        if theme_key in BUILTIN_THEME_FILES:
            return (
                default_css
                + "\n"
                + self._load_template_file(
                    f"themes/{BUILTIN_THEME_FILES[theme_key]}/theme.css"
                )
            )

        user_theme = (
            Path(jupyter_data_dir()) / "jupypress" / "themes" / theme / "theme.css"
        )
        if user_theme.exists():
            return default_css + "\n" + user_theme.read_text(encoding="utf-8")

        return (
            default_css + "\n" + self._load_template_file(f"themes/{theme}/theme.css")
        )
