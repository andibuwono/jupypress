"""
Tests for exporter module.
"""

import pytest

from jupypress.exporter import Exporter


def test_exporter_init():
    """Test that exporter initializes without error."""
    exporter = Exporter()
    assert exporter is not None
    assert exporter.renderer is not None
    assert exporter.jinja_env is not None


def test_exporter_export_basic(notebook_file):
    """Test basic notebook export."""
    exporter = Exporter()
    html = exporter.export(notebook_path=notebook_file, execute=False, theme="default")

    assert html is not None
    assert "<html" in html
    assert "Title Slide" in html
    assert "Content Slide" in html


def test_exporter_export_with_custom_css(notebook_file):
    """Test export with custom CSS."""
    exporter = Exporter()
    custom_css = ":root { --color-primary: #blue; }"
    html = exporter.export(
        notebook_path=notebook_file, theme="default", custom_css=custom_css
    )

    assert custom_css in html


def test_exporter_export_nonexistent_file():
    """Test that export handles missing files."""
    exporter = Exporter()
    with pytest.raises(Exception):
        exporter.export(notebook_path="/nonexistent/notebook.ipynb", execute=False)


def test_exporter_loads_templates():
    """Test that templates are loaded correctly."""
    exporter = Exporter()
    template = exporter.jinja_env.get_template("deck.html.j2")
    assert template is not None
