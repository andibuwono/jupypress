# JupyPress Frontend Code Structure

Frontend TypeScript/React code location guide for JupyPress extension development.

## Directory Structure

```
src/
├── index.ts                    # Extension entry point & plugin registration
├── commands.ts                 # Command definitions & execution logic
├── toolbar.ts                  # Toolbar button factory
├── service.ts                  # API service for server communication
├── tokens.ts                   # TypeScript interfaces & service tokens
├── components/                 # React components
│   ├── SlideEditorPanel.tsx    # Main editor UI container
│   ├── SlideList.tsx           # Slide list sidebar (add/remove/reorder)
│   ├── SlideItem.tsx           # Individual slide editor
│   ├── CellAssigner.tsx        # Cell-to-slide assignment dialog
│   ├── CellPickerModal.tsx     # Cell picker modal dialog
│   ├── LayoutSelector.tsx      # Layout/theme picker
│   ├── ThemeEditor.tsx         # Theme customization panel
│   ├── JupyterLabPresentation.tsx # JupyterLab-backed live preview/present renderer
│   ├── DocsModal.tsx           # Documentation modal
│   ├── icons/
│   │   └── Icons.tsx           # Icon definitions
│   └── index.ts                # Component exports
├── hooks/
│   ├── useNotebookModel.ts     # Notebook metadata & slide state hooks
│   └── index.ts                # Hook exports
└── utils/
    ├── htmlBuilder.ts          # HTML generation utilities
    ├── metadata.ts             # Notebook metadata parser
    ├── slideMapper.ts          # Cell-to-slide mapping logic
    ├── kernelExecutor.ts       # Kernel execution utilities
    ├── css/
    │   ├── base.css.ts         # CSS-in-JS base styles
    │   └── theme.css.ts        # Theme CSS utilities
    ├── js/
    │   └── navigation.js.ts   # Presentation navigation JS
    └── index.ts                # Utility exports
```

---

## Feature Locations

### 1. **Launcher Icon & Command Registration**

**Toolbar Button (Click-to-launch):**
- [src/toolbar.ts](src/toolbar.ts) — Creates the toolbar button with icon
  - Uses `slidesIcon` from `src/components/icons/Icons.tsx`
  - Executes `CommandIDs.openEditor` when clicked
  - Added to notebook toolbar via [src/index.ts](src/index.ts)

**Command Palette Entry:**
- [src/commands.ts](src/commands.ts) — Registers commands in palette
- Command: `jupypress:open-editor` → Opens SlideEditorPanel
- Command: `jupypress:open-presentation` → Preview in new tab
- Command: `jupypress:export-html` → Download HTML file

**Entry Point:**
- [src/index.ts](src/index.ts) — Plugin activation & initialization

---

### 2. **Slide Editor Panel**

**Main Container:**
- [src/components/SlideEditorPanel.tsx](src/components/SlideEditorPanel.tsx)
  - Root component for the editor UI
  - Handles slide configuration, live preview, present actions, and export
  - Three-column workflow: slide list, slide configuration, JupyterLab-backed preview

**Slide Management:**
- [src/components/SlideList.tsx](src/components/SlideList.tsx) — Left sidebar
  - Add new slide button
  - Delete slide button
  - Move slide up/down buttons
  - Slide selection & highlighting

**Individual Slide Editor:**
- [src/components/SlideItem.tsx](src/components/SlideItem.tsx) — Main editor pane
  - Edit slide name/title
  - Assign cells to slide
  - Layout selector
  - Cell assignment management

---

### 3. **Cell Assignment**

**Assignment Dialog/Interface:**
- [src/components/CellAssigner.tsx](src/components/CellAssigner.tsx)
  - Modal/panel for assigning notebook cells to slides
  - Checkbox-based cell selection
  - Bulk assignment UI

**Cell Picker Modal:**
- [src/components/CellPickerModal.tsx](src/components/CellPickerModal.tsx)
  - Modal for picking cells to assign to slides

**Mapping Logic:**
- [src/utils/slideMapper.ts](src/utils/slideMapper.ts)
  - `mapCellsToSlides()` — Associate cells with slide IDs
  - `getSlidesForCell()` — Lookup which slides contain a cell
  - `updateCellAssignment()` — Modify cell-slide relationships

**State Management:**
- [src/hooks/useNotebookModel.ts](src/hooks/useNotebookModel.ts)
  - `useSlides()` — Manage slide metadata
  - `useNotebookMetadata()` — Read/write notebook metadata

---

### 4. **Preview / Present**

**JupyterLab-backed renderer:**
- [src/components/JupyterLabPresentation.tsx](src/components/JupyterLabPresentation.tsx)
  - Renders preview and present modes through JupyterLab `OutputArea`
  - Supports live code edit/run through [src/utils/kernelExecutor.ts](src/utils/kernelExecutor.ts)
  - Uses the same slide shell and theme CSS as exported presentations
  - Uses an iframe for slide CSS isolation, but output rendering remains JupyterLab/rendermime-backed

**Editor preview:**
- [src/components/SlideEditorPanel.tsx](src/components/SlideEditorPanel.tsx)
  - Embeds `JupyterLabPresentation`
  - Follows the selected slide in the editor

**Presenter tab:**
- [src/commands.ts](src/commands.ts)
  - Opens a browser tab backed by `JupyterLabPresentation`
  - Supports presenting from the first slide or the current slide

---

### 5. **Theme Selection & Editor**

**Theme Picker:**
- [src/components/LayoutSelector.tsx](src/components/LayoutSelector.tsx)
  - Dropdown/selector for available themes
  - Previews theme options
  - Sets global theme in metadata

**Theme Customization:**
- [src/components/ThemeEditor.tsx](src/components/ThemeEditor.tsx)
  - Custom CSS editor
  - Theme variable override panel
  - Live theme preview

**Theme API:**
- [src/service.ts](src/service.ts) — `getThemes()`
  - Fetches available themes from server
  - Returns theme metadata & CSS

---

### 6. **Export / Download**

**Export Command:**
- [src/commands.ts](src/commands.ts) — `CommandIDs.exportHtml`
  - Calls `service.exportNotebook()`
  - Triggers download dialog
  - Saves as `presentation-<timestamp>.html`

**Export Button:**
- [src/components/SlideEditorPanel.tsx](src/components/SlideEditorPanel.tsx) — `handleExport()`
  - Export button with spinner state
  - Error handling & display
  - File download via Blob/URL
  - Always exports standalone/static HTML without live edit controls

**Server Export Endpoint:**
- [src/service.ts](src/service.ts) — `exportNotebook()`
  - POST to `/jupypress/export`
  - Passes notebook path, theme, execution options
  - Returns rendered HTML

---

### 7. **Present in Browser Tab**

**Open Presentation Command:**
- [src/commands.ts](src/commands.ts) — `CommandIDs.openPresentation`
  - Opens a JupyterLab-backed presenter tab
  - Uses the current notebook model, rendermime registry, and kernel session
  - Does not use the static export HTML path

**Present split button:**
- [src/components/SlideEditorPanel.tsx](src/components/SlideEditorPanel.tsx)
  - Main action presents from the first slide
  - Dropdown option presents from the selected/current slide

---

### 8. **Documentation**

**Docs Modal:**
- [src/components/DocsModal.tsx](src/components/DocsModal.tsx)
  - Displays usage documentation
  - Keyboard shortcuts reference
  - Layout descriptions

---

## API Service Layer

**Server Communication:**
- [src/service.ts](src/service.ts) — `JupypressService` class
  - `exportNotebook(path, options)` → POST `/jupypress/export`
  - `getThemes()` → GET `/jupypress/themes`
  - Handles ServerConnection & response parsing

**Service Token:**
- [src/tokens.ts](src/tokens.ts)
  - `IJupypressService` interface definition
  - `ExportOptions` type
  - `ThemeInfo` type

---

## Styling

**Component Styles:**
- [src/style/index.css](src/style/index.css) — Global CSS (if exists)
  - Tailwind or custom classes
  - JupyterLab theme variables

**CSS-in-JS Utilities:**
- [src/utils/css/base.css.ts](src/utils/css/base.css.ts)
  - Base presentation CSS
  - Default theme styles
  - Layout templates
- [src/utils/css/theme.css.ts](src/utils/css/theme.css.ts)
  - Theme CSS utilities

---

## State Management

**Notebook Metadata:**
- [src/hooks/useNotebookModel.ts](src/hooks/useNotebookModel.ts) — React hooks
  - `useNotebookMetadata(notebook)` → Read/write `notebook.metadata.jupypress`
  - `useSlides(notebook)` → Slide CRUD operations

**Metadata Schema:**
- [src/utils/metadata.ts](src/utils/metadata.ts)
  - `parseMetadata()` — Extract jupypress metadata
  - `serializeMetadata()` → Save back to notebook
  - Metadata structure definitions

---

## Icons

**All Icons Located:**
- [src/components/icons/Icons.tsx](src/components/icons/Icons.tsx)
  - `slidesIcon` → Toolbar button icon
  - `eyeIcon` → Preview/view button
  - `exportIcon` → Download button
  - `editIcon` → Edit mode indicator
  - `addIcon` → Add slide button
  - `deleteIcon` → Remove slide button
  - `chevronUpIcon`, `chevronDownIcon` → Reorder buttons

---

## Quick Dev Paths

| Feature | Main File | Related |
|---------|-----------|---------|
| Add toolbar button | `toolbar.ts` | `commands.ts`, `icons/Icons.tsx` |
| Add command to palette | `commands.ts` | `index.ts` (activation) |
| Change editor layout | `SlideEditorPanel.tsx` | `SlideList.tsx`, `SlideItem.tsx` |
| Modify cell assignment UI | `CellAssigner.tsx` | `slideMapper.ts`, `useNotebookModel.ts` |
| Add theme option | `LayoutSelector.tsx` | `service.ts` (getThemes endpoint) |
| Change export flow | `SlideEditorPanel.tsx` | `service.ts` (exportNotebook) |
| Update styles | `style/index.css` | `css/base.css.ts` |
| Fix preview/present | `JupyterLabPresentation.tsx` | `kernelExecutor.ts`, `htmlBuilder.ts` |

---

## Testing

**Component Tests:**
- [tests/js/](tests/js/) directory
  - `htmlBuilder.test.ts` — HTML generation tests
  - `metadata.test.ts` — Metadata parsing tests
  - `slideMapper.test.ts` — Cell mapping tests

**Run Tests:**
```bash
jlpm test
```

---

## Development Workflow

**Watch Mode (auto-rebuild on save):**
```bash
jlpm run watch:labextension
```

**Browser Refresh (Ctrl+Shift+R):**
- Hard refresh to clear cache
- Picks up latest compiled code from `lib/`

**Entry Points to Trace:**
1. Extension loads → [src/index.ts](src/index.ts)
2. Plugin activates → Registers commands & toolbar button
3. User clicks toolbar → Executes `CommandIDs.openEditor`
4. Command executes → [src/commands.ts](src/commands.ts) opens SlideEditorPanel
5. Editor mounts → [src/components/SlideEditorPanel.tsx](src/components/SlideEditorPanel.tsx)
6. Service calls → [src/service.ts](src/service.ts) (POST/GET to Python backend)
