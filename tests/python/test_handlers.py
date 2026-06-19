"""
Tests for handlers module.
"""


def test_handlers_import():
    """Test that handlers can be imported."""
    from jupypress.handlers import ExportHandler, ThemesHandler, setup_handlers

    assert ExportHandler is not None
    assert ThemesHandler is not None
    assert setup_handlers is not None


def test_export_handler_class():
    """Test export handler class exists."""
    from jupypress.handlers import ExportHandler

    handler = ExportHandler.__new__(ExportHandler)
    assert hasattr(handler, "post")


def test_themes_handler_class():
    """Test themes handler class exists."""
    from jupypress.handlers import ThemesHandler

    handler = ThemesHandler.__new__(ThemesHandler)
    assert hasattr(handler, "get")
