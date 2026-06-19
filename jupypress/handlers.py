"""
HTTP request handlers for the JupyPress extension.

Provides endpoints for:
  - POST /jupypress/export: Export notebook to HTML
  - GET /jupypress/themes: List available themes
  - PUT /jupypress/themes: Save custom theme
"""

import os
import re
from pathlib import Path

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.base.handlers import APIHandler

from jupypress.exporter import Exporter

THEME_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$")
BUILTIN_THEME_NAMES = {"default", "jupypress", "jupyterlab"}
BUILTIN_THEMES = (
    ("Jupypress", "default"),
    ("Jupyterlab", "jupyterlab"),
)


def user_themes_dir() -> Path:
    """Return the JupyPress user themes directory in Jupyter's data/share area."""
    return Path(jupyter_data_dir()) / "jupypress" / "themes"


def validate_theme_name(name: str) -> str:
    """Validate a display theme name before using it as a directory name."""
    theme_name = name.strip()
    if not THEME_NAME_RE.match(theme_name):
        raise ValueError(
            "Theme name must start with a letter or number and use only letters, numbers, spaces, hyphens, or underscores"
        )
    if theme_name.lower() in BUILTIN_THEME_NAMES:
        raise ValueError(
            f'"{theme_name}" is a built-in theme name. Save it with a new name.'
        )
    return theme_name


class BaseJupypressHandler(APIHandler):
    """Base handler for JupyPress API endpoints."""

    pass


class ExportHandler(BaseJupypressHandler):
    """
    Handles POST /jupypress/export

    Request body:
      {
        "path": "/path/to/notebook.ipynb",
        "executeNotebook": false,
        "theme": "default",
        "customCss": ""
      }

    Response:
      {
        "html": "<html>...</html>"
      }
    """

    async def post(self):
        """Export notebook to HTML."""
        try:
            data = self.get_json_body()
            notebook_path = data.get("path")
            execute = data.get("executeNotebook", False)
            theme = data.get("theme", "default")
            custom_css = data.get("customCss", "")

            if not notebook_path:
                self.set_status(400)
                self.finish({"error": "Missing notebook path"})
                return

            # Resolve path (handle Jupyter server path conversions)
            notebook_path = os.path.expanduser(notebook_path)
            if not os.path.exists(notebook_path):
                self.set_status(404)
                self.finish({"error": f"Notebook not found: {notebook_path}"})
                return

            # Export
            exporter = Exporter()
            html = exporter.export(
                notebook_path=notebook_path,
                execute=execute,
                theme=theme,
                custom_css=custom_css,
            )

            self.finish({"html": html})

        except Exception as e:
            self.set_status(500)
            self.finish({"error": f"Export failed: {str(e)}"})
            self.log.exception(e)


class ThemesHandler(BaseJupypressHandler):
    """
    Handles:
      - GET /jupypress/themes: List saved themes
      - PUT /jupypress/themes: Save custom theme

    GET Response:
      {
        "themes": [
          {"name": "default", "css": "..."},
          {"name": "dark", "css": "..."}
        ]
      }

    PUT Request body:
      {
        "name": "my-theme",
        "css": ":root { ... }"
      }
    """

    async def get(self):
        """List available themes."""
        try:
            themes_dir = Path(__file__).parent / "templates" / "themes"
            user_dir = user_themes_dir()
            themes = []

            for display_name, directory_name in BUILTIN_THEMES:
                css_file = themes_dir / directory_name / "theme.css"
                if css_file.exists():
                    with open(css_file, "r", encoding="utf-8") as f:
                        css = f.read()
                    themes.append(
                        {
                            "name": display_name,
                            "css": css,
                            "builtin": True,
                        }
                    )

            # Scan user-saved themes from Jupyter's user data/share directory.
            if user_dir.exists():
                for theme_dir in sorted(
                    user_dir.iterdir(), key=lambda p: p.name.lower()
                ):
                    if theme_dir.is_dir():
                        css_file = theme_dir / "theme.css"
                        if css_file.exists():
                            with open(css_file, "r", encoding="utf-8") as f:
                                css = f.read()
                            themes.append(
                                {
                                    "name": theme_dir.name,
                                    "css": css,
                                    "builtin": False,
                                }
                            )

            self.finish({"themes": themes})

        except Exception as e:
            self.set_status(400)
            self.finish({"error": str(e)})
            self.log.exception(e)

    async def put(self):
        """Save a custom theme."""
        try:
            data = self.get_json_body()
            theme_name = data.get("name", "")
            css = data.get("css", "")

            if not theme_name:
                self.set_status(400)
                self.finish({"error": "Missing theme name"})
                return

            theme_name = validate_theme_name(theme_name)
            theme_dir = user_themes_dir() / theme_name
            theme_dir.mkdir(parents=True, exist_ok=True)
            (theme_dir / "theme.css").write_text(css, encoding="utf-8")

            self.finish({"success": True, "name": theme_name})

        except Exception as e:
            self.set_status(400)
            self.finish({"error": str(e)})
            self.log.exception(e)


def setup_handlers(server_app):
    """
    Register the JupyPress handlers with the Jupyter Server app.
    """
    handlers = [
        (r"/jupypress/export", ExportHandler),
        (r"/jupypress/themes", ThemesHandler),
    ]

    server_app.web_app.add_handlers(r".*", handlers)
