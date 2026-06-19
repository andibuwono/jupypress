"""
Test configuration and fixtures for pytest.
"""

import nbformat
import pytest


@pytest.fixture
def sample_notebook():
    """Create a sample notebook with jupypress metadata."""
    nb = nbformat.v4.new_notebook()

    # Add notebook-level metadata
    nb.metadata["jupypress"] = {
        "version": "1",
        "slides": [
            {
                "id": "slide-1",
                "name": "Title Slide",
                "layout": "title",
                "showHeader": False,
            },
            {
                "id": "slide-2",
                "name": "Content Slide",
                "layout": "default",
                "showHeader": True,
            },
        ],
        "globalTheme": "default",
    }

    # Add cells
    # Slide 1: Title cell
    title_cell = nbformat.v4.new_markdown_cell("# My Presentation")
    title_cell.metadata["jupypress"] = {
        "slideId": "slide-1",
        "slot": "title",
        "order": 0,
    }
    nb.cells.append(title_cell)

    # Slide 2: Header
    header_cell = nbformat.v4.new_markdown_cell("## Content Slide")
    header_cell.metadata["jupypress"] = {
        "slideId": "slide-2",
        "slot": "heading",
        "order": 0,
    }
    nb.cells.append(header_cell)

    # Slide 2: Content
    content_cell = nbformat.v4.new_markdown_cell("Some content here")
    content_cell.metadata["jupypress"] = {
        "slideId": "slide-2",
        "slot": "content",
        "order": 0,
    }
    nb.cells.append(content_cell)

    # Slide 2: Code cell
    code_cell = nbformat.v4.new_code_cell("print('Hello')")
    code_cell.metadata["jupypress"] = {
        "slideId": "slide-2",
        "slot": "content",
        "order": 1,
        "include": "full",
    }
    nb.cells.append(code_cell)

    return nb


@pytest.fixture
def notebook_file(sample_notebook, tmp_path):
    """Write sample notebook to a temporary file."""
    nb_path = tmp_path / "test.ipynb"
    with open(nb_path, "w") as f:
        nbformat.write(sample_notebook, f)
    return str(nb_path)
