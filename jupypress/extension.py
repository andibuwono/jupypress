"""
JupyterLab server extension registration and setup.
"""

from jupypress.handlers import setup_handlers


def load_jupyter_server_extension(server_app):
    """
    Loads the JupyPress server extension.

    Called when JupyterLab starts up.
    Registers the extension's HTTP handlers.
    """
    setup_handlers(server_app)
    server_app.log.info("JupyPress extension loaded")
