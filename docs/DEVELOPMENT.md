# Development Guide

## Prerequisites

- Python 3.10+
- conda environment `jupypress` — contains **everything**: Node.js 25, npm, jlpm, JupyterLab 4.x
- `build` package (`pip install build`) — required for `python -m build`
- `hatch` package (`pip install hatch`) — required for `hatch run test`

> **Always activate the env first.** Node, npm, and jlpm all live inside the conda env:
> ```bash
> conda activate jupypress
> node --version   # v25.8.2
> jlpm --version   # 3.5.0
> ```
> Running `node` or `jlpm` in a shell where the env is not activated will give "command not found".

## Additional Python Dependencies

Beyond JupyterLab itself, the following must be installed in the conda/venv environment:

```bash
# Build tooling
pip install build          # python -m build (PEP 517 frontend)
pip install hatch          # hatch run test

# Runtime deps (also pulled in by pip install of the wheel, but needed for dev)
pip install markdown-it-py pygments nbformat jupyter_server

# Optional: linting
pip install ruff
```

> **Quick one-liner for a fresh env:**
> ```bash
> pip install jupyterlab build hatch markdown-it-py pygments nbformat jupyter_server
> ```

---

## First-Time Setup (Fresh Clone)

```bash
git clone https://github.com/your-org/jupypress.git
cd jupypress

# 0. Install jupyterlab + required build tools
pip install jupyterlab build hatch markdown-it-py pygments nbformat jupyter_server

# 1. Install JS dependencies
jlpm install

# 2. Build the labextension
jlpm run build:labextension

# 3. Build and install the wheel
python -m build
pip install ./dist/jupypress-0.1.0-py3-none-any.whl

# 4. Start JupyterLab
jupyter lab
```

> **Why wheel instead of editable install?**  
> `pip install -e .` installs shared Jupyter data files by linking into the source tree
> (`/mnt/c/...`). On WSL this causes pip to track those Windows paths in its RECORD,
> leading to broken upgrades. The wheel install keeps everything inside the conda env.

## Development Cycle

After any code change:

**1. Rebuild and reinstall (stop JupyterLab first with Ctrl+C):**
```bash
# TypeScript or Python changed
jlpm run build:labextension && python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
```

For Python-only changes the jlpm step can be skipped:
```bash
python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
```

**2. Restart JupyterLab:**
```bash
jupyter lab --no-browser
```

**3.** Hard-refresh the browser (Ctrl+Shift+R).

> **Why not just `python -m build`?**  
> `python -m build` skips the jlpm step when `jupypress/labextension/static/style.js`
> already exists (`skip-if-exists` in pyproject.toml). TypeScript changes require an
> explicit `jlpm run build:labextension` first.

> **Always use `--force-reinstall`** — plain `pip install ./dist/jupypress.whl` over an
> existing install fails because pip's atomic swap deletes the
> `share/jupyter/labextensions/jupypress/` directory before writing new files into it.

## Building

```bash
# JS only
jlpm run build:labextension

# Full wheel (runs jlpm build automatically if labextension not yet built)
python -m build
```

## Testing

```bash
# Python tests
hatch run test

# JavaScript tests
jlpm run test
```

## Directory Structure

See [BACKEND_STRUCTURE.md](BACKEND_STRUCTURE.md) and [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md) for detailed file references and feature locations.

## Architecture

### Data Flow

1. **Metadata Storage** (in notebook)
   - `notebook.metadata.jupypress` - slide configuration
   - `cell.metadata.jupypress` - per-cell assignments

2. **Export Pipeline**
   - Handler receives POST request with notebook path
   - Exporter loads notebook with nbformat
   - Optional execution via ExecutePreprocessor
   - SlideBuilder parses metadata + cells → SlideData[]
   - CellRenderer converts cells to HTML
   - Jinja2 renders template with HTML + CSS/JS inlined

3. **Frontend**
   - SlideEditorPanel manages UI
   - SlideList shows/reorders slides
   - LayoutSelector chooses layout (5 options)
   - CellAssigner maps cells to slots
   - ThemeEditor allows custom CSS
   - JupyterLabPresentation renders live preview and present mode through JupyterLab OutputArea
   - htmlBuilder generates standalone/static HTML for export

## Adding New Layouts

1. Add to `LAYOUTS` array in `src/components/LayoutSelector.tsx`
2. Add CSS class in `jupypress/templates/static/css/base.css`
3. Update `slide_builder.py` validation

## Adding New Themes

1. Create `jupypress/templates/themes/my-theme/theme.css`
2. Define CSS variables following the pattern in `default` theme
3. Accessible via ThemesHandler API

## Troubleshooting

### Extension not appearing in JupyterLab
```bash
jlpm run build:labextension
python -m build
pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
```
Then hard-refresh the browser (Ctrl+Shift+R).

### Python changes not taking effect
Rebuild and reinstall the wheel, then restart JupyterLab:
```bash
python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
```

### `pip install` fails mid-install
Always use `--force-reinstall` when reinstalling the wheel. See the
[Development Cycle](#development-cycle) section above.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Write/update tests
5. Submit a pull request

## License

BSD-3-Clause
