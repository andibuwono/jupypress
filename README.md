# JupyPress

JupyPress is a JupyterLab extension for turning notebooks into HTML slide presentations.

It supports two output paths:

- JupyterLab-backed preview and present modes for live notebook outputs, widgets, and live code execution.
- Standalone HTML export for static, shareable presentations that do not require a running kernel.

## Requirements

- Python 3.10 or newer
- JupyterLab 4.x
- A modern Chromium, Firefox, or Safari browser

## Installation

```bash
pip install jupypress
jupyter lab
```

Open a notebook, then use the JupyPress toolbar button or the command palette command `JupyPress: Open Editor`.

## Basic Usage

1. Create slides in the JupyPress editor.
2. Choose a slide layout.
3. Assign notebook cells to slide slots.
4. Use preview for JupyterLab-backed rendering.
5. Use present mode for a browser presentation backed by the active notebook session.
6. Export to HTML for a static file that can be opened without JupyterLab.

## Features

- Slide metadata stored directly in the notebook.
- Built-in layouts for title, content, two-column, and multi-row slides.
- JupyterLab-backed preview and present modes using notebook output areas.
- Static HTML export with embedded presentation CSS and navigation.
- Theme support through CSS variables.
- Markdown, code, rich outputs, images, Plotly, Leaflet/Folium, and saved widget output support.
- Live code execution in JupyterLab-backed presentation mode.

## Output Modes

### Preview and Present

Preview and present modes run inside the JupyterLab environment and render assigned cells with JupyterLab output areas. This is the right mode for live notebook work, active kernels, widgets, and outputs that need JupyterLab renderers.

### HTML Export

HTML export creates a standalone static presentation. The exported file is designed for sharing and viewing without JupyterLab. Dynamic widget kernels are not available in this mode, but saved/static DOM output is included where possible.

## Screenshots

Release screenshots are stored under `docs/images/`:

- `docs/images/editor.png`
- `docs/images/export-html.png`
- `docs/images/launch.png`
- `docs/images/present-livecode.png`

See `docs/images/README.md` for the intended use of each capture.

## Development

```bash
git clone https://github.com/andibuwono/jupypress.git
cd jupypress
jlpm install
jlpm run build:labextension
python -m build
pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
jupyter lab
```

Use `jlpm` rather than `npm`; JupyterLab manages the Yarn environment.

See:

- `docs/DEVELOPMENT.md` for local setup and development workflow.
- `docs/BACKEND_STRUCTURE.md` for the Python backend map.
- `docs/FRONTEND_STRUCTURE.md` for the TypeScript/React frontend map.
- `docs/TEST.md` for test commands.
- `docs/theming.md` for theme variables.

## Testing

```bash
hatch run test
jlpm run test
jlpm run build:labextension
```

## Release

See `docs/RELEASE.md` for the PyPI and GitHub release checklist.

## Contributing

Contributions are welcome. See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## License

JupyPress is distributed under the BSD 3-Clause License. See `LICENSE`.
