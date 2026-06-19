# Release Checklist

Use this checklist for PyPI and GitHub releases.

## Prepare

1. Update versions in:
   - `pyproject.toml`
   - `package.json`
   - `jupypress/_version.py`
2. Update `CHANGELOG.md`.
3. Refresh screenshots in `docs/images/` if the UI changed.
4. Confirm the repository URLs in `pyproject.toml` and `package.json`.

## Validate

```bash
jlpm install
jlpm run build:labextension
jlpm run test
hatch run test
hatch run lint
python -m build
python -m twine check dist/*
```

## Publish

1. Create and push a version tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. Create a GitHub release from the tag and paste the matching `CHANGELOG.md` section.
3. Publish to PyPI using trusted publishing or a scoped PyPI API token.
4. Install from PyPI in a clean environment and smoke-test:

   ```bash
   pip install jupypress
   jupyter lab
   ```

## Notes

- Always run `jlpm run build:labextension` before `python -m build` after TypeScript changes.
- On WSL, prefer wheel reinstall:

  ```bash
  pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl
  ```
