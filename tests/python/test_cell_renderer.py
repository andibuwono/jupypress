"""
Tests for cell_renderer module.
"""

import pytest

from jupypress.cell_renderer import CellRenderer


@pytest.fixture
def renderer():
    """Create a CellRenderer instance."""
    return CellRenderer()


def test_render_markdown_basic(renderer):
    """Test basic markdown rendering."""
    md_source = "# Hello\n\nThis is a paragraph."
    html = renderer.render_markdown(md_source)

    assert "<h1" in html
    assert "Hello" in html
    assert "<p" in html
    assert "paragraph" in html


def test_render_code_input(renderer):
    """Test code input rendering."""
    code = "print('Hello')"
    html = renderer.render_code_input(code)

    assert "cell-code-input" in html
    assert "print" in html
    assert "Hello" in html


def test_escape_html(renderer):
    """Test HTML escaping."""
    text = "<script>alert('xss')</script>"
    escaped = renderer._escape_html(text)

    assert "&lt;" in escaped
    assert "&gt;" in escaped
    assert "&quot;" in escaped or "&#39;" in escaped
    assert "<script>" not in escaped


def test_render_code_output_stream(renderer):
    """Test rendering stream output."""
    outputs = [{"output_type": "stream", "name": "stdout", "text": "Hello World\n"}]
    html = renderer.render_code_output(outputs)

    assert "cell-code-output" in html
    assert "stream" in html
    assert "Hello World" in html


def test_render_code_output_error(renderer):
    """Test rendering error output."""
    outputs = [
        {
            "output_type": "error",
            "ename": "ValueError",
            "evalue": "invalid value",
            "traceback": ["Traceback..."],
        }
    ]
    html = renderer.render_code_output(outputs)

    assert "cell-code-output" in html
    assert "error" in html
    assert "ValueError" in html
