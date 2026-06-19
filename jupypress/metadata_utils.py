"""
Utility functions for working with notebook metadata.
"""


def get_notebook_meta(notebook_model) -> dict:
    """
    Get jupypress metadata from notebook.

    Args:
        notebook_model: The notebook model

    Returns:
        dict: jupypress metadata or empty dict
    """
    return notebook_model.metadata.get("jupypress", {})


def set_notebook_meta(notebook_model, data: dict):
    """
    Set jupypress metadata on notebook.

    Args:
        notebook_model: The notebook model
        data: Metadata to set
    """
    if "jupypress" not in notebook_model.metadata:
        notebook_model.metadata["jupypress"] = {}
    notebook_model.metadata["jupypress"].update(data)


def get_cell_meta(cell) -> dict:
    """
    Get jupypress metadata from cell.

    Args:
        cell: The cell object

    Returns:
        dict: jupypress metadata or empty dict
    """
    return cell.metadata.get("jupypress", {})


def set_cell_meta(cell, data: dict):
    """
    Set jupypress metadata on cell.

    Args:
        cell: The cell object
        data: Metadata to set
    """
    if "jupypress" not in cell.metadata:
        cell.metadata["jupypress"] = {}
    cell.metadata["jupypress"].update(data)
