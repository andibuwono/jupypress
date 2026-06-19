# Testing JupyPress

## Python Tests

```bash
hatch run test
```

Runs all pytest tests across `tests/python/` covering slide builder, cell renderer, exporter, and handlers.

To test a specific file:

```bash
hatch run pytest tests/python/test_exporter.py -v
```

## JavaScript Tests

```bash
jlpm run test
```

Runs all Jest tests across `tests/js/` with coverage report for `metadata.ts`, `slideMapper.ts`, and `htmlBuilder.ts`.

To run a specific test file:

```bash
jlpm run test -- --testPathPattern="metadata" --no-coverage
```

To run in watch mode:

```bash
jlpm run test:watch
```

## Lint

```bash
# Python (ruff)
hatch run lint

# JavaScript (eslint)
jlpm run lint
```

## Format

```bash
# JavaScript (prettier)
jlpm run format
```

## Build

```bash
# TypeScript only
jlpm run build:lib

# Full labextension
jlpm run build:labextension

# Full Python package
python -m build
```

## Full CI Locally (via act)

[act](https://github.com/nektos/act) runs GitHub Actions jobs in Docker, matching the `ci.yml` matrix exactly.

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Run all jobs
act

# Run a specific job
act -j test-python
act -j test-js
act -j build
```
