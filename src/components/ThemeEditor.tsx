/**
 * Theme Editor Component - CSS editor + save/load named themes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { saveIcon } from './icons/Icons';
import { IJupypressService, ThemeInfo } from '../tokens';

const SaveIcon = saveIcon.react;
const BUILTIN_THEME_NAMES = new Set(['default', 'jupypress', 'jupyterlab']);

const STARTER_CSS = `/* JupyPress Starter CSS – key variables.
 * Scope: applies inside the exported presentation only.
 * Edit any variable or selector below to customize your presentation.
 */

:root {
  /* ── Brand colours ───────────────────────────────────────── */
  --color-primary:       #e63946;
  --color-primary-soft:  rgba(230, 57, 70, 0.10);
  --color-accent:        #457b9d;
  --color-accent-soft:   rgba(69, 123, 157, 0.12);

  /* ── Text ───────────────────────────────────────────────── */
  --text-heading: #1a1a2e;
  --text-body:    #2d2d44;
  --text-muted:   #7878a0;

  /* ── Backgrounds ────────────────────────────────────────── */
  --bg-slide:        #ffffff;
  --bg-alt:          #f6f7fb;
  --border:          rgba(0, 0, 0, 0.06);
  --code-bg:         #f3f4f8;
  --code-text:       #2d2d44;
  --output-bg:       #fafbfc;
  --output-border:   rgba(0, 0, 0, 0.07);

  /* ── Chrome ─────────────────────────────────────────────── */
  --letterbox-bg:     #16213e;
}

/* Dark mode overrides — toggled by the ☀/☾ button in the toolbar */
[data-theme="dark"] {
  --letterbox-bg:  #0d0d1a;
  --bg-slide:      #1a1a2e;
  --bg-alt:        #1e1e32;
  --text-heading:  #e8e8f8;
  --text-body:     #b0b0cc;
  --text-muted:    #606080;
  --border:        rgba(255, 255, 255, 0.06);
  --code-bg:       #12121e;
  --code-text:     #cdd0e0;
  --output-bg:     #151520;
  --output-border: rgba(255, 255, 255, 0.06);
  --ui-toolbar-bg:    rgba(20, 20, 38, 0.85);
  --ui-toolbar-border:rgba(255,255,255,0.08);

  --ui-btn-color:        rgba(255,255,255,0.5);
  --ui-btn-hover:        rgba(255,255,255,0.9);
  --ui-btn-bg:           rgba(30, 30, 50, 0.7);
  --ui-btn-bg-hover:     rgba(30, 30, 50, 0.9);
  --ui-progress-color:   rgba(255,255,255,0.7);
  --ui-btn-inline-hover: rgba(255,255,255,0.08);

  --picker-bg:       rgba(20, 20, 38, 0.97);
  --picker-border:   rgba(255,255,255,0.12);
  --picker-text:     rgba(255,255,255,0.8);
  --picker-hover:    rgba(255,255,255,0.07);
  --picker-num-bg:   rgba(255,255,255,0.10);
}

/* Add scoped rules below when you want to override the default theme. */
`;

const CSS_REFERENCE = [
  { group: 'Brand', vars: [
    ['--color-primary', 'Headings h1/h2, link color, inline code color'],
    ['--color-primary-soft', 'Table header background, blockquote background'],
    ['--color-accent', 'h3 color, code-output left border, link underline'],
    ['--color-accent-soft', 'Ambient glow decorations'],
  ]},
  { group: 'Text', vars: [
    ['--text-heading', 'Main headings, strong text'],
    ['--text-body', 'Paragraphs, lists, slide base color'],
    ['--text-muted', 'Captions, meta, muted content, sub-headings'],
  ]},
  { group: 'Background', vars: [
    ['--bg-slide', 'Slide surface'],
    ['--bg-alt', 'Code blocks, table rows, cell inputs'],
    ['--border', 'Borders, dividers, table borders'],
    ['--code-bg', 'Code block background'],
    ['--output-bg', 'Cell output background'],
  ]},
  { group: 'Chrome', vars: [
    ['--letterbox-bg', 'Area surrounding the slide (outside 16:9 frame)'],
    ['--ui-toolbar-bg', 'Navigation toolbar background'],
    ['--ui-toolbar-border', 'Navigation toolbar border'],
  ]},
  { group: 'UI Controls', vars: [
    ['--ui-btn-color', 'Toolbar button icon color'],
    ['--ui-btn-hover', 'Toolbar button hover color'],
    ['--ui-btn-bg', 'Prev/Next arrow background'],
    ['--ui-btn-bg-hover', 'Prev/Next arrow hover background'],
    ['--ui-progress-color', 'Slide counter text color'],
    ['--ui-btn-inline-hover', 'Inline button hover background'],
  ]},
  { group: 'Slide Picker', vars: [
    ['--picker-bg', 'Picker menu background'],
    ['--picker-border', 'Picker menu border'],
    ['--picker-text', 'Picker item text color'],
    ['--picker-hover', 'Picker item hover background'],
    ['--picker-num-bg', 'Picker number badge background'],
  ]},
];

export interface ThemeEditorProps {
  globalTheme?: string;
  customCss?: string;
  themes: ThemeInfo[];
  onThemesChange: (themes: ThemeInfo[]) => void;
  onThemeChange: (theme: string, css: string) => void;
  onCustomCssChange?: (css: string) => void;
  onSaveCustomTheme: (name: string, css: string) => Promise<void>;
  service: IJupypressService;
}


export const ThemeEditor: React.FC<ThemeEditorProps> = ({
  globalTheme,
  customCss,
  themes,
  onThemesChange,
  onThemeChange,
  onCustomCssChange,
  onSaveCustomTheme,
  service,
}) => {
  const [localCss, setLocalCss] = useState(customCss ?? '');
  const [themeName, setThemeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const availableThemes = themes.length > 0
    ? themes
    : [{ name: 'Jupypress', css: '', builtin: true }];
  const selectedName = globalTheme === 'default' ? 'Jupypress' : (globalTheme || 'Jupypress');
  const selectedTheme = availableThemes.find(t => t.name === selectedName) ?? availableThemes[0];
  const reservedNames = useMemo(
    () => new Set(availableThemes.filter(t => t.builtin).map(t => t.name.toLowerCase())),
    [availableThemes]
  );
  const trimmedThemeName = themeName.trim();
  const canSave = trimmedThemeName.length > 0 && !reservedNames.has(trimmedThemeName.toLowerCase()) && !saving;
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(localCss.split('\n').length, 18) }, (_, i) => i + 1).join('\n'),
    [localCss]
  );
  const visibleReferenceGroups = CSS_REFERENCE;

  useEffect(() => {
    if (themes.length > 0) return;
    service.getThemes().then(onThemesChange).catch(console.error);
  }, [service, themes.length, onThemesChange]);

  useEffect(() => {
    setLocalCss(customCss ?? selectedTheme?.css ?? '');
  }, [customCss, selectedTheme]);

  const handleCssChange = (css: string) => {
    setLocalCss(css);
    onCustomCssChange?.(css);
  };

  const handleThemeSelect = (theme: ThemeInfo) => {
    setSaveError(null);
    setThemeName(theme.builtin ? '' : theme.name);
    setLocalCss(theme.css);
    onThemeChange(theme.name, theme.css);
  };

  const startNewTheme = () => {
    setSaveError(null);
    setThemeName('');
    handleCssChange(STARTER_CSS);
  };

  const saveTheme = async () => {
    if (!trimmedThemeName) {
      setSaveError('Enter a theme name.');
      return;
    }

    if (BUILTIN_THEME_NAMES.has(trimmedThemeName.toLowerCase()) || reservedNames.has(trimmedThemeName.toLowerCase())) {
      setSaveError('Default is built in. Save this CSS with a new theme name.');
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSaveCustomTheme(trimmedThemeName, localCss);
      const updated = await service.getThemes();
      onThemesChange(updated);
      onThemeChange(trimmedThemeName, localCss);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save theme');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jp-JupypressThemeEditor">
      <div className="jp-JupypressThemeEditor-label">Theme</div>
      <div className="jp-JupypressThemeEditor-themeList">
        {availableThemes.map((t) => (
          <button
            key={t.name}
            className={`jp-JupypressThemeEditor-themeBtn${selectedName === t.name ? ' jp-mod-active' : ''}`}
            onClick={() => handleThemeSelect(t)}
          >
            {t.name}
          </button>
        ))}
        <button className="jp-JupypressThemeEditor-addBtn" onClick={startNewTheme} title="Start a new theme">
          +
        </button>
      </div>

      <div className="jp-JupypressThemeEditor-label">Custom CSS Editor</div>

      <div className="jp-JupypressThemeEditor-workspace">
        <aside className="jp-JupypressThemeRef">
          <div className="jp-JupypressThemeRef-title">
            <span className="jp-JupypressThemeRef-dot">i</span>
            <span>Reference</span>
          </div>
          {visibleReferenceGroups.map(group => (
            <div className="jp-JupypressThemeRef-group" key={group.group}>
              <div className="jp-JupypressThemeRef-section">{group.group}</div>
              {group.vars.map(([name, description]) => (
                <code key={name} title={description}>{name}</code>
              ))}
            </div>
          ))}
          <div className="jp-JupypressThemeRef-note">
            Use these variables to override presentation styles. Scoped to this project.
          </div>
        </aside>

        <div className="jp-JupypressThemeEditor-codeBox">
          <pre className="jp-JupypressThemeEditor-lineNumbers" aria-hidden="true">{lineNumbers}</pre>
          <textarea
            className="jp-JupypressThemeEditor-textarea"
            value={localCss}
            onChange={(e) => handleCssChange(e.target.value)}
            spellCheck={false}
            wrap="off"
            rows={18}
          />
        </div>
      </div>

      <div className="jp-JupypressThemeEditor-controls">
        <input
          type="text"
          placeholder={selectedTheme?.builtin ? 'New theme name' : selectedTheme?.name || 'New theme name'}
          value={themeName}
          onChange={(e) => {
            setSaveError(null);
            setThemeName(e.target.value);
          }}
        />
        <button className="jp-JupypressThemeEditor-saveButton" onClick={saveTheme} disabled={!canSave}>
          <SaveIcon tag="span" />
          <span>{saving ? 'Saving...' : 'Save Theme'}</span>
        </button>
      </div>
      {saveError && <div className="jp-JupypressThemeEditor-error">{saveError}</div>}
    </div>
  );
};
