# Contributing to JupyPress

We welcome contributions! Here's how to get started.

## Code of Conduct

Be respectful and inclusive. We're building a welcoming community.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Follow [DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup
4. Create a feature branch: `git checkout -b feature/my-feature`

## Development Workflow

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full setup and dev-cycle instructions.

### Making Changes

1. Write code following the style guide
2. Write tests for new features
3. Rebuild and reinstall: `python -m build && pip install --force-reinstall ./dist/jupypress-0.1.0-py3-none-any.whl`
4. Ensure all tests pass: `hatch run test && jlpm run test`
5. Format code: `jlpm run format`
6. Lint: `jlpm run lint` and `hatch run lint`

### Testing

```bash
# Python tests
hatch run test

# JavaScript tests
jlpm run test

# Watch mode (JS)
jlpm run test:watch
```

### Code Style

- **Python**: PEP 8, enforced by `ruff`
- **TypeScript**: ESLint + Prettier
- **React**: Functional components with hooks
- **CSS**: CSS variables for theming

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new layout type
fix: correct slide ordering bug
docs: update theming guide
test: add tests for cell renderer
chore: update dependencies
```

## Submitting Changes

1. Push to your fork
2. Create a Pull Request
3. Describe what your PR does
4. Link any related issues
5. Ensure CI passes
6. Request review

## Adding Features

### New Slide Layouts

1. Add to `LAYOUTS` in `src/components/LayoutSelector.tsx`
2. Add CSS in `jupypress/templates/static/css/base.css`
3. Update `slide_builder.py` validation
4. Write tests

### New Themes

1. Create `jupypress/templates/themes/my-theme/theme.css`
2. Define CSS variables
3. Add tests
4. Document in README

### New Renderers

1. Extend `CellRenderer` in `jupypress/cell_renderer.py`
2. Add MIME type handler
3. Write tests with sample outputs

## Documentation

- Update README.md for user-facing changes
- Add docstrings to Python functions
- Add JSDoc comments to TypeScript
- Update docs/DEVELOPMENT.md for setup changes

## Performance

- Profile before optimizing
- Consider notebook size (large notebooks should still export quickly)
- Minimize CSS/JS bundle size
- Cache theme parsing

## Accessibility

- Ensure keyboard navigation works
- Add ARIA labels to UI components
- Test with screen readers
- Maintain color contrast ratios

## Security

- Validate file paths (prevent directory traversal)
- Escape HTML properly
- Don't execute untrusted code by default
- Review dependencies for vulnerabilities

## Questions?

- Check existing issues
- Start a discussion
- Contact maintainers

Thank you for contributing!