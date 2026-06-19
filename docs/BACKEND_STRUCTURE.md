# JupyPress Server Backend Structure

Python server code location guide for JupyPress extension development.

## Directory Structure

```
jupypress/
├── __init__.py                 # Package initialization & extension entry point
├── _version.py                 # Version string
├── extension.py                # Server extension loader (called by Jupyter)
├── handlers.py                 # HTTP API endpoints (export, themes)
├── exporter.py                 # Orchestrator: notebook → HTML pipeline
├── slide_builder.py            # Build slide metadata & structure from notebook
├── cell_renderer.py            # Render notebook cells to HTML
├── metadata_utils.py           # Read/write jupypress metadata on notebook
├── templates/                  # Jinja2 templates & static assets
│   ├── deck.html.j2            # Main presentation HTML template
│   ├── static/
│   │   ├── css/
│   │   │   └── base.css        # Default presentation styles
│   │   └── js/
│   │       └── navigation.js   # Presentation keyboard/click navigation
│   └── themes/
│       └── default/
│           └── theme.css       # Default theme CSS
tests/python/
├── conftest.py                 # Pytest fixtures & setup
├── test_exporter.py            # Export pipeline tests
├── test_slide_builder.py       # Slide metadata tests
├── test_cell_renderer.py       # Cell HTML rendering tests
├── test_handlers.py            # HTTP endpoint tests
└── notebooks/
    └── sample.ipynb            # Test notebook
```

---

## Feature Locations

### 1. **Server Extension Loading**

**Extension Entry Point:**
- [jupypress/extension.py](jupypress/extension.py)
  - `load_jupyter_server_extension(server_app)` — Called by JupyterLab on startup
  - Registers HTTP handlers via `setup_handlers()`
  - Logs "JupyPress extension loaded"

**Extension Registration:**
- [jupypress/__init__.py](jupypress/__init__.py)
  - `_jupyter_server_extension_points()` — Returns extension module metadata
  - Entry point: `jupyter_server.extension` in `pyproject.toml`

**Handler Registration:**
- [jupypress/handlers.py](jupypress/handlers.py) — `setup_handlers()` function
  - Mounts ExportHandler → `/jupypress/export` (POST)
  - Mounts ThemesHandler → `/jupypress/themes` (GET, PUT)

---

### 2. **Export Endpoint**

**HTTP Handler:**
- [jupypress/handlers.py](jupypress/handlers.py) — `ExportHandler` class
  - **Endpoint:** `POST /jupypress/export`
  - **Request body:**
    ```json
    {
      "path": "/path/to/notebook.ipynb",
      "executeNotebook": false,
      "theme": "default",
      "customCss": ""
    }
    ```
  - **Response:**
    ```json
    {
      "html": "<html>...</html>"
    }
    ```
  - **Flow:**
    1. Validate notebook path exists
    2. Create `Exporter` instance
    3. Call `exporter.export()`
    4. Return HTML in JSON response
    5. Error handling & logging

---

### 3. **Export Pipeline (Notebook → HTML)**

**Main Orchestrator:**
- [jupypress/exporter.py](jupypress/exporter.py)
  - `Exporter.export()` — Main export method
    1. Load notebook with `nbformat`
    2. Optional: Execute cells with `nbconvert.ExecutePreprocessor`
    3. Build slides via `SlideBuilder`
    4. Render cells via `CellRenderer`
    5. Load Jinja2 template (`deck.html.j2`)
    6. Render template with slide data
    7. Inline CSS/JS for standalone HTML
    8. Return complete HTML string

**Key Methods:**
- `_execute_notebook()` — Run cells via nbconvert
- `_build_slides()` — Extract slide structure from metadata
- `_render_cells()` — Convert notebook cells to HTML
- `_render_template()` — Fill Jinja2 template with slide data
- `_inline_assets()` — Embed CSS/JS directly in HTML (no external files)

---

### 4. **Slide Structure & Metadata**

**Slide Builder:**
- [jupypress/slide_builder.py](jupypress/slide_builder.py)
  - `SlideBuilder.build()` — Parse notebook metadata → list of SlideData
  - Reads `notebook.metadata.jupypress.slides` array
  - Maps cell indices to slide slots by ID
  - Returns list of SlideData objects

**Data Models:**
- `SlideData` — Represents one slide
  - `id`, `name`, `layout` (title, default, two-col-h, two-col-v, three-row-v)
  - `show_header`, `slots` (dict of cell assignments)

- `CellSlot` — Single cell on a slide
  - `cell_index`, `cell_type` (markdown/code)
  - `include` (full, input-only, output-only)
  - `order` — Position in slot

**Notebook Metadata Schema:**
```json
{
  "metadata": {
    "jupypress": {
      "globalTheme": "default",
      "slides": [
        {
          "id": "slide-1",
          "name": "Title",
          "layout": "title",
          "slots": {
            "main": [{"cellIndex": 0, "include": "full"}]
          }
        }
      ]
    }
  }
}
```

---

### 5. **Cell Rendering**

**Cell Renderer:**
- [jupypress/cell_renderer.py](jupypress/cell_renderer.py)
  - `CellRenderer.render_markdown(source)` → HTML
    - Uses `markdown-it-py` for markdown → HTML
    - Syntax highlighting with `pygments`

  - `CellRenderer.render_code_cell(cell)` → HTML
    - Input: syntax highlighted with pygments
    - Output: display_data cells (HTML, images, etc.)

**Highlighting:**
- Uses `pygments` for code syntax highlighting
- Auto-detects language from fence (`python`, `javascript`, etc.)
- Falls back to `PythonLexer` if unknown

**Markdown Rendering:**
- `markdown-it-py` for CommonMark compliance
- Code blocks auto-highlighted via `_highlight_code()` callback

---

### 6. **Themes**

**Themes Handler:**
- [jupypress/handlers.py](jupypress/handlers.py) — `ThemesHandler` class
  - **GET /jupypress/themes** → List available themes
    ```json
    {
      "themes": [
        {"name": "default", "css": "...", "builtin": true},
        {"name": "dark", "css": "...", "builtin": true}
      ]
    }
    ```
  - Scans `jupypress/templates/themes/` directory
  - Reads `theme.css` from each theme folder

**Theme Application:**
- Passed to `exporter.export(theme="default")`
- Loaded and inlined in final HTML
- Can be overridden with custom CSS

**Built-in Themes:**
- [jupypress/templates/themes/default/theme.css](jupypress/templates/themes/default/theme.css)

---

### 7. **HTML Template & Static Assets**

**Main Template:**
- [jupypress/templates/deck.html.j2](jupypress/templates/deck.html.j2)
  - Jinja2 template for rendered presentation
  - Variables passed from `Exporter`:
    - `slides` — List of SlideData objects
    - `theme_css` — Inlined theme CSS
    - `custom_css` — User custom CSS
    - `base_css` — Base presentation styles
    - `navigation_js` — Inline JS for keyboard navigation
  - Renders slide HTML via loops & conditionals
  - No external dependencies (all inlined)

**Base Styles:**
- [jupypress/templates/static/css/base.css](jupypress/templates/static/css/base.css)
  - Default presentation layout & typography
  - Responsive layout (fullscreen, slides)
  - Print styles for PDF export

**Navigation JavaScript:**
- [jupypress/templates/static/js/navigation.js](jupypress/templates/static/js/navigation.js)
  - Keyboard shortcuts (arrow keys, space bar)
  - Click-to-advance slides
  - Fullscreen mode toggle
  - Slide counter display

---

### 8. **Metadata Utilities**

**Metadata Read/Write:**
- [jupypress/metadata_utils.py](jupypress/metadata_utils.py)
  - `get_notebook_meta(notebook)` → dict
  - `set_notebook_meta(notebook, data)` → None (modifies in-place)
  - `get_cell_meta(cell)` → dict
  - `set_cell_meta(cell, data)` → None
  - All stored under `metadata.jupypress` key in notebook

---

## API Reference

### HTTP Endpoints

**Export Notebook:**
```
POST /jupypress/export
Content-Type: application/json

{
  "path": "/path/to/notebook.ipynb",
  "executeNotebook": false,
  "theme": "default",
  "customCss": ""
}

Response:
{
  "html": "<html>...</html>"
}
```

**List Themes:**
```
GET /jupypress/themes

Response:
{
  "themes": [
    {"name": "default", "css": "...", "builtin": true}
  ]
}
```

---

## Python Classes & Methods

### Exporter

```python
class Exporter:
    def export(
        notebook_path: str,
        execute: bool = False,
        theme: str = "default",
        custom_css: str = ""
    ) -> str:
        """Returns complete HTML string"""
```

### SlideBuilder

```python
class SlideBuilder:
    def build() -> List[SlideData]:
        """Parse notebook metadata → slide objects"""
```

### CellRenderer

```python
class CellRenderer:
    def render_markdown(source: str) -> str:
        """Markdown → HTML"""

    def render_code_cell(cell) -> str:
        """Code cell (input + output) → HTML"""
```

### Handlers

```python
class ExportHandler(APIHandler):
    async def post(self):
        """POST /jupypress/export"""

class ThemesHandler(APIHandler):
    async def get(self):
        """GET /jupypress/themes"""
    async def put(self):
        """PUT /jupypress/themes (save custom theme)"""
```

---

## Data Flow

```
Frontend (TypeScript)
    ↓ service.exportNotebook(path, options)
    ↓ POST /jupypress/export
    ↓
ExportHandler.post()
    ↓
Exporter.export(notebook_path, execute, theme, custom_css)
    ├→ Load notebook with nbformat
    ├→ [Optional] Execute cells (ExecutePreprocessor)
    ├→ SlideBuilder: Parse notebook.metadata.jupypress.slides
    ├→ CellRenderer: Render cells to HTML
    ├→ Load theme CSS from /templates/themes/
    ├→ Load Jinja2 template (deck.html.j2)
    ├→ Load base CSS & navigation JS
    ├→ Render template with: slides, theme_css, custom_css, base_css, navigation_js
    └→ Return HTML string
    ↓
ExportHandler response: {"html": "..."}
    ↓
Frontend: Display in iframe or download as file
```

---

## Testing

**Test Files:**
- [tests/python/test_exporter.py](tests/python/test_exporter.py) — Full export pipeline
- [tests/python/test_slide_builder.py](tests/python/test_slide_builder.py) — Slide metadata parsing
- [tests/python/test_cell_renderer.py](tests/python/test_cell_renderer.py) — Cell rendering
- [tests/python/test_handlers.py](tests/python/test_handlers.py) — HTTP endpoints
- [tests/python/conftest.py](tests/python/conftest.py) — Pytest fixtures
- [tests/python/notebooks/sample.ipynb](tests/python/notebooks/sample.ipynb) — Test notebook

**Run Tests:**
```bash
hatch run test
```

---

## Quick Dev Paths

| Feature | Main File | Related |
|---------|-----------|---------|
| Add HTTP endpoint | `handlers.py` | `extension.py` (setup_handlers) |
| Change export flow | `exporter.py` | All other classes |
| Modify slide structure | `slide_builder.py` | `exporter.py` (calls build) |
| Render cell differently | `cell_renderer.py` | `exporter.py` (calls renderer) |
| Add new theme | `templates/themes/` | `handlers.py` (get method) |
| Change HTML layout | `templates/deck.html.j2` | `exporter.py` (render_template) |
| Add navigation feature | `templates/static/js/navigation.js` | (inlined in deck.html.j2) |
| Update styles | `templates/static/css/base.css` | `exporter.py` (loads base.css) |
| Modify metadata schema | `metadata_utils.py` | `slide_builder.py` (reads metadata) |

---

## Configuration

**Environment:**
- Python 3.10–3.13
- jupyter-server >= 2.0.0
- nbformat, nbconvert, jinja2, pygments, markdown-it-py

**Setup:**
```bash
pip install -e .  # Install in development mode
```

**Extension Registration:**
- Entry point: `jupyter_server.extension` → `jupypress:_jupyter_server_extension_points`
- Config file: `jupyter-config/jupyter_server_config.d/jupypress.json`
- Auto-enable: `{"ServerApp": {"jpserver_extensions": {"jupypress": true}}}`

---

## Key Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| `jupyter-server` | HTTP handlers, integration | APIHandler base class |
| `nbformat` | Read .ipynb files | Load & parse notebooks |
| `nbconvert` | Execute cells | ExecutePreprocessor |
| `jinja2` | Template rendering | deck.html.j2 |
| `markdown-it-py` | Markdown → HTML | Render markdown cells |
| `pygments` | Syntax highlighting | Code cell highlighting |

---

## Extension Lifecycle

1. JupyterLab starts up
2. Jupyter server loads extensions from entry points
3. Calls `_jupyter_server_extension_points()` from `jupypress/__init__.py`
4. Calls `load_jupyter_server_extension(server_app)` from `jupypress/extension.py`
5. `extension.py` calls `setup_handlers(server_app)` from `jupypress/handlers.py`
6. Handlers are mounted on server: `/jupypress/export`, `/jupypress/themes`
7. Extension ready → Frontend can make API calls

---

## Common Tasks

### Add a New Export Option

1. Update `ExportHandler.post()` in [handlers.py](jupypress/handlers.py) to accept the option
2. Update `Exporter.export()` in [exporter.py](jupypress/exporter.py) to handle it
3. Update frontend service call in `src/service.ts`
4. Add test in [tests/python/test_exporter.py](tests/python/test_exporter.py)

### Add a New Slide Layout

1. Add layout name to `SlideData.layout` valid values in [slide_builder.py](jupypress/slide_builder.py)
2. Add layout CSS to [base.css](jupypress/templates/static/css/base.css)
3. Update template in [deck.html.j2](jupypress/templates/deck.html.j2) to render layout
4. Update frontend LayoutSelector in `src/components/LayoutSelector.tsx`

### Customize Cell Rendering

1. Modify `CellRenderer` methods in [cell_renderer.py](jupypress/cell_renderer.py)
2. Call modified renderer in [exporter.py](jupypress/exporter.py)
3. Update cell HTML in [deck.html.j2](jupypress/templates/deck.html.j2) if layout changes
4. Add test in [tests/python/test_cell_renderer.py](tests/python/test_cell_renderer.py)

### Add a Built-in Theme

1. Create folder: `jupypress/templates/themes/my-theme/`
2. Add `theme.css` file
3. Place CSS variables & styles in the file
4. Handler automatically scans & lists it in `GET /jupypress/themes`
5. User can select it from frontend LayoutSelector

---

## Debugging

**Enable Debug Logging:**
```bash
jupyter lab --log-level=DEBUG 2>&1 | grep jupypress
```

**Test Export Directly:**
```bash
python -c "
from jupypress.exporter import Exporter
e = Exporter()
html = e.export('/path/to/notebook.ipynb')
print(html[:500])  # First 500 chars
"
```

**Check Metadata:**
```bash
python -c "
import nbformat
nb = nbformat.read('/path/to/notebook.ipynb', as_version=4)
print(nb.metadata.get('jupypress', {}))
"
```

**Trace Handler Execution:**
Add `self.log.info()` statements in handler methods, then check JupyterLab terminal output.