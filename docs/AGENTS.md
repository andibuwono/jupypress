# AGENTS.md — JupyPress

> Coding agent reference for the JupyPress project.

---

## 1. Project Overview

**JupyPress** is a JupyterLab extension that converts notebooks into standalone HTML slide presentations. It consists of:

- **Backend (Python)**: Jupyter Server extension with HTTP handlers for export/themes, plus notebook parsing, slide building, and cell rendering.
- **Frontend (TypeScript/React)**: JupyterLab plugin with React UI panels for slide editing, cell assignment, theme customization, live preview, and export.

**Key docs**: `README.md` (users), `DEVELOPMENT.md` (dev setup), `BACKEND_STRUCTURE.md` / `FRONTEND_STRUCTURE.md` (code maps), `TEST.md` (testing), `CONTRIBUTING.md` (PR workflow), `docs/theming.md` (CSS variables).

---

## 2. Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| Python | CPython | 3.10–3.13 |
| JupyterLab | `@jupyterlab/application` | ^4.0.0 |
| Node.js | `nodejs` | 25.x |
| Package manager | `jlpm` (JupyterLab-managed Yarn) | — |
| Build backend | `hatchling` | — |
| Test (Python) | `pytest` + `pytest-asyncio` | — |
| Test (JS) | `jest` + `ts-jest` | — |
| Lint (Python) | `ruff` | — |
| Lint (JS) | `eslint` + `prettier` | — |

---

## 3. Directory Structure

```
jupypress/                      # Python backend
├── __init__.py                 # Extension entry point
├── _version.py                 # Version string
├── extension.py                # Server extension loader
├── handlers.py                 # HTTP API: /jupypress/export, /jupypress/themes
├── exporter.py                 # Notebook → HTML orchestrator
├── slide_builder.py            # Slide metadata parser
├── cell_renderer.py            # Markdown/code → HTML
├── metadata_utils.py           # Read/write jupypress metadata
└── templates/                  # Jinja2 templates + static assets
    ├── deck.html.j2            # Main presentation template
    ├── static/css/base.css     # Base presentation styles
    ├── static/js/navigation.js # Keyboard navigation
    └── themes/default/theme.css

src/                            # TypeScript/React frontend
├── index.ts                    # Plugin registration
├── commands.ts                 # Command palette commands
├── toolbar.ts                  # Toolbar button
├── service.ts                  # HTTP service (export, themes)
├── tokens.ts                   # TypeScript interfaces
├── components/                 # React UI
│   ├── SlideEditorPanel.tsx    # Main editor container
│   ├── SlideList.tsx           # Slide list sidebar
│   ├── SlideItem.tsx           # Individual slide editor
│   ├── CellAssigner.tsx        # Cell assignment UI
│   ├── CellPickerModal.tsx     # Cell picker modal
│   ├── LayoutSelector.tsx      # Layout/theme picker
│   ├── ThemeEditor.tsx         # Custom CSS editor
│   ├── JupyterLabPresentation.tsx # JupyterLab-backed live preview/present renderer
│   ├── DocsModal.tsx           # Documentation modal
│   └── icons/Icons.tsx         # Inline SVG icons
├── hooks/
│   └── useNotebookModel.ts     # React hooks for metadata
└── utils/
    ├── htmlBuilder.ts          # HTML generation
    ├── metadata.ts             # Metadata parser
    ├── slideMapper.ts          # Cell-to-slide mapping
    ├── kernelExecutor.ts       # Kernel execution
    ├── css/base.css.ts         # CSS-in-JS base styles
    ├── css/theme.css.ts        # Theme CSS utilities
    └── js/navigation.js.ts     # Navigation JS

tests/
├── python/                     # pytest tests
│   ├── conftest.py             # Fixtures
│   ├── test_exporter.py
│   ├── test_slide_builder.py
│   ├── test_cell_renderer.py
│   ├── test_handlers.py
│   └── notebooks/sample.ipynb
└── js/                         # Jest tests
    ├── htmlBuilder.test.ts
    ├── metadata.test.ts
    └── slideMapper.test.ts
```

---

## 4. Build System

### Python
- Build backend: `hatchling`
- Entry point: `jupyter_server.extension` → `jupypress:_jupyter_server_extension_points`
- `pyproject.toml` defines dependencies, build hooks, and hatch scripts.

### TypeScript
- `package.json` scripts use `jlpm` (Yarn 3 via JupyterLab)
- `build:lib` → compiles TS to `lib/`
- `build:labextension` → builds JupyterLab extension bundle to `jupypress/labextension/`
- `watch:labextension` → watch mode for development

### Wheel Build
```bash
# Full package (runs jlpm build automatically if labextension not yet built)
python -m build

# JS-only rebuild
jlpm run build:labextension
```

> **Important**: Always use `pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl` on reinstall. Plain `pip install` over an existing install can fail because pip's atomic swap deletes `share/jupyter/labextensions/jupypress/` before writing new files.

---

## 5. Testing

### Python Tests
```bash
# Run all Python tests
hatch run test

# Or directly
pytest tests/python -v

# Specific file
pytest tests/python/test_exporter.py -v
```

### JavaScript Tests
```bash
# Run all JS tests with coverage
jlpm run test

# Watch mode
jlpm run test:watch

# Specific file
jlpm run test -- --testPathPattern="metadata" --no-coverage
```

### Lint
```bash
# Python
hatch run lint
# or directly
ruff check . --exclude reference

# JavaScript
jlpm run lint
```

### Format
```bash
# Python
hatch run format
# or directly
ruff format . --exclude reference

# JavaScript
jlpm run format
```

---

## 6. Code Style Conventions

### Python
- **Formatter/Linter**: `ruff` (replaces black + isort)
- **Line length**: 100 (`tool.ruff.line-length`)
- **Target Python**: 3.10 (`tool.ruff.target-version`)
- **Docstrings**: Google-style (Args/Returns sections)
- **Type hints**: Used throughout (`str`, `dict`, `List[SlideData]`)
- **Dataclasses**: Prefer `@dataclass` for models (`SlideData`, `CellSlot`)
- **Error handling**: Use `try/except` with specific exceptions; log with `self.log.exception()` in handlers

### TypeScript / React
- **Formatter**: Prettier (`jlpm run format`)
- **Linter**: ESLint (`jlpm run lint`)
- **Components**: Functional components with hooks
- **State**: React `useState`/`useEffect`; no Redux
- **Props interfaces**: Named `*Props` (e.g., `SlideEditorPanelProps`)
- **Service pattern**: `JupypressService` class wraps `ServerConnection` calls
- **Icons**: Inline SVGs in `src/components/icons/Icons.tsx`

### CSS
- CSS custom properties (variables) for theming
- Class naming: `jp-JupypressEditor-*` for component styles
- Base presentation styles in `jupypress/templates/static/css/base.css`

---

## 7. Environment Setup

### Prerequisites
- `micromamba` (or `conda`/`mamba`)
- Git

### Create Environment
```bash
micromamba create -n jupypress -c conda-forge python=3.10 nodejs=25 jupyterlab markdown-it-py pygments nbformat nbconvert jupyter_server ruff pytest pytest-asyncio hatch
micromamba activate jupypress
pip install build
```

### First-Time Setup
```bash
# Install JS dependencies
jlpm install

# Build labextension
jlpm run build:labextension

# Build and install wheel
python -m build
pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl

# Start JupyterLab
jupyter lab
```

### Dev Cycle (after changes)
```bash
# TypeScript + Python changed
jlpm run build:labextension && python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl

# Python-only changed
python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
```

Then restart JupyterLab and hard-refresh browser (Ctrl+Shift+R).

---

## 8. Common Agent Tasks

### Add a new HTTP endpoint
1. Add handler class in `jupypress/handlers.py`
2. Register route in `setup_handlers()` at bottom of same file
3. Add frontend service method in `src/service.ts`
4. Add test in `tests/python/test_handlers.py`

### Add a new React component
1. Create component in `src/components/`
2. Export from `src/components/index.ts`
3. Import and use in parent component
4. Add styles via `src/style/index.css` or CSS-in-JS in `src/utils/css/`

### Add a new slide layout
1. Add layout name to `valid_layouts` in `jupypress/slide_builder.py`
2. Add CSS class in `jupypress/templates/static/css/base.css`
3. Update `src/components/LayoutSelector.tsx`
4. Update Jinja2 template `jupypress/templates/deck.html.j2`

### Modify metadata schema
1. Update `jupypress/metadata_utils.py` if read/write helpers change
2. Update `src/utils/metadata.ts` for frontend parsing
3. Update `jupypress/slide_builder.py` for backend parsing
4. Update `tests/python/conftest.py` fixture if needed

---

## 9. Data Flow

```
Notebook (.ipynb)
  ├─ metadata.jupypress  →  slides config, global theme, custom CSS
  └─ cells[*].metadata.jupypress  →  slideId, slot, order, include

Frontend:
  useNotebookModel.ts  →  reads/writes notebook metadata
  useSlides()  →  CRUD on slides array
  slideMapper.ts  →  builds view model from cell metadata
  htmlBuilder.ts  →  generates standalone HTML (client-side export)
  JupyterLabPresentation.tsx  →  renders preview/present through JupyterLab OutputArea
  service.ts  →  POST /jupypress/export (server-side export)

Backend:
  ExportHandler  →  validates path, calls Exporter
  Exporter.export()  →  load notebook → SlideBuilder → CellRenderer → Jinja2 template
  ThemesHandler  →  scans templates/themes/, returns CSS
```

---

## 10. Notes

- **WSL caveat**: `pip install -e .` causes issues on WSL due to Windows path tracking in pip RECORD. Always build wheel and install it.
- **jlpm vs npm**: Use `jlpm` (not `npm`) for all JS package operations. `jlpm` is JupyterLab's managed Yarn.
- **skip-if-exists**: `pyproject.toml` has `skip-if-exists = ["jupypress/labextension/static/style.js"]`. This means `python -m build` skips the JS build if the labextension already exists. Always run `jlpm run build:labextension` explicitly after TS changes.
- **Widget state**: The exporter extracts `notebook.metadata.widgets` for static widget rendering.
- **Live coding**: Preview and present mode use `JupyterLabPresentation.tsx` plus `kernelExecutor.ts` against the active JupyterLab kernel. Static export remains non-live.
