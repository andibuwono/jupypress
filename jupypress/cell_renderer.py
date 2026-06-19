"""
Render individual notebook cells to HTML.

Handles:
  - Markdown cells: convert to HTML using markdown-it-py
  - Code cells: syntax highlight input using pygments, include outputs
"""

from markdown_it import MarkdownIt
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import PythonLexer, get_lexer_by_name


class CellRenderer:
    """
    Renders notebook cells to HTML.
    """

    def __init__(self):
        """Initialize the renderer with markdown-it instance."""
        self.md = MarkdownIt("commonmark", {"highlight": self._highlight_code})
        # Use 'default' style which is always available
        self.formatter = HtmlFormatter(noclasses=False, style="default")

    def _highlight_code(self, code: str, lang: str, title: str) -> str:
        """
        Highlight code block using pygments.

        Args:
            code: Code to highlight
            lang: Language identifier
            title: Code block title

        Returns:
            HTML string with highlighted code
        """
        if not lang:
            lang = "text"

        try:
            lexer = get_lexer_by_name(lang, stripall=True)
        except Exception:
            lexer = PythonLexer()

        return highlight(code, lexer, self.formatter)

    def render_markdown(self, source: str) -> str:
        """
        Render markdown cell to HTML.

        Args:
            source: Markdown source

        Returns:
            HTML string
        """
        return self.md.render(source)

    def render_code_input(self, source: str) -> str:
        """
        Render code input (syntax highlighted).

        Args:
            source: Python code

        Returns:
            HTML <pre><code> block
        """
        html = highlight(source, PythonLexer(), self.formatter)
        return f'<div class="cell-code-input">{html}</div>'

    def render_code_output(self, outputs: list) -> str:
        """
        Render code cell outputs.

        Handles:
          - stream (stdout/stderr)
          - execute_result (repr output)
          - display_data (images, HTML, etc.)
          - error (exception traceback)

        Args:
            outputs: List of output objects

        Returns:
            HTML string
        """
        if not outputs:
            return ""

        html_parts = ['<div class="cell-code-output">']

        for output in outputs:
            output_type = output.get("output_type", "")

            if output_type == "stream":
                text = output.get("text", "")
                html_parts.append(
                    f'<pre class="stream">{self._escape_html(text)}</pre>'
                )

            elif output_type == "execute_result":
                data = output.get("data", {})
                html_parts.append(self._render_output_data(data))

            elif output_type == "display_data":
                data = output.get("data", {})
                html_parts.append(self._render_output_data(data))

            elif output_type == "error":
                ename = output.get("ename", "Error")
                evalue = output.get("evalue", "")
                html_parts.append(
                    f'<pre class="error">{self._escape_html(ename)}: {self._escape_html(evalue)}</pre>'
                )

        html_parts.append("</div>")
        return "".join(html_parts)

    def _render_output_data(self, data: dict) -> str:
        """Render output data based on mimetype priority."""
        if "text/html" in data:
            return f'<div class="output-html">{data["text/html"]}</div>'
        elif "image/png" in data:
            img_data = data["image/png"]
            if isinstance(img_data, list):
                img_data = "".join(img_data)
            return f'<img class="cell-output-image" src="data:image/png;base64,{img_data}" />'
        elif "image/jpeg" in data:
            img_data = data["image/jpeg"]
            if isinstance(img_data, list):
                img_data = "".join(img_data)
            return f'<img class="cell-output-image" src="data:image/jpeg;base64,{img_data}" />'
        elif "application/vnd.jupyter.widget-view+json" in data:
            model_id = data["application/vnd.jupyter.widget-view+json"].get(
                "model_id", ""
            )
            fallback = data.get("text/plain", "")
            return (
                f'<div class="cell-output-html jupyter-widgets">'
                f'<div class="widget-subarea widget-subarea-output">'
                f'<div class="jupyter-widgets widget-output" data-model-id="{model_id}"></div>'
                f"</div>"
                f'<pre class="cell-output-text" style="display:none">{self._escape_html(fallback)}</pre>'
                f"</div>"
            )
        elif "text/plain" in data:
            text = data["text/plain"]
            if isinstance(text, list):
                text = "".join(text)
            return f'<pre class="output-text">{self._escape_html(text)}</pre>'
        else:
            return ""

    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters."""
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
        )
