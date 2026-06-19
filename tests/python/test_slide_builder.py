"""
Tests for slide_builder module.
"""

import pytest

from jupypress.slide_builder import SlideBuilder, SlideData


def test_slide_builder_basic(sample_notebook):
    """Test basic slide building."""
    builder = SlideBuilder(sample_notebook)
    slides = builder.build()

    assert len(slides) == 2
    assert slides[0].name == "Title Slide"
    assert slides[0].layout == "title"
    assert slides[1].name == "Content Slide"
    assert slides[1].layout == "default"


def test_slide_builder_cell_assignment(sample_notebook):
    """Test that cells are correctly assigned to slides."""
    builder = SlideBuilder(sample_notebook)
    slides = builder.build()

    # First slide should have title slot
    assert "title" in slides[0].slots
    assert len(slides[0].slots["title"]) == 1
    assert slides[0].slots["title"][0].cell_index == 0

    # Second slide should have heading and content slots
    assert "heading" in slides[1].slots
    assert "content" in slides[1].slots
    assert len(slides[1].slots["content"]) == 2  # markdown + code cell


def test_slide_builder_cell_order(sample_notebook):
    """Test that cells within a slot are ordered correctly."""
    builder = SlideBuilder(sample_notebook)
    slides = builder.build()

    content_cells = slides[1].slots["content"]
    assert content_cells[0].order == 0
    assert content_cells[1].order == 1
    assert content_cells[0].cell_index == 2
    assert content_cells[1].cell_index == 3


def test_slide_data_validation():
    """Test that SlideData validates layout."""
    with pytest.raises(ValueError):
        SlideData(id="test", name="Test", layout="invalid-layout")
