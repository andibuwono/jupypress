"""
JupyPress: A JupyterLab extension for converting notebooks into HTML slide presentations.
"""

from ._version import __version__


def _jupyter_server_extension_points():
    """
    Entry point for Jupyter Server extension.

    Returns a list of dicts with the following keys:
      - module: the fully qualified module name for the extension
      - app: the Jupyter application instance (always 'lab' for JupyterLab)
    """
    return [{"module": "jupypress.extension"}]


__all__ = ["__version__", "_jupyter_server_extension_points"]
