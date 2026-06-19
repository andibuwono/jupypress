/**
 * Slide Editor Panel Component - WYSIWYG editor UI.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { INotebookModel } from '@jupyterlab/notebook';
import { ISessionContext } from '@jupyterlab/apputils';
import { SlideList } from './SlideList';
import { SlideItem } from './SlideItem';
import { ThemeEditor } from './ThemeEditor';
import { JupyterLabPresentation } from './JupyterLabPresentation';
import { CellPickerModal, AssignedCell } from './CellPickerModal';
import { DocsModal } from './DocsModal';
import { useNotebookMetadata, useSlides } from '../hooks/useNotebookModel';
import { IJupypressService, ThemeInfo } from '../tokens';
import { buildStandalonePresentationHtml } from '../utils/htmlBuilder';
import { buildSlideViewModel } from '../utils/slideMapper';
import { getCellMeta, setCellMeta } from '../utils/metadata';
import { jupypressIcon } from './icons/Icons';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

const JupypressIcon = jupypressIcon.react;

export interface SlideEditorPanelProps {
  notebook: INotebookModel;
  service: IJupypressService;
  /** Relative path to the notebook file, e.g. "path/to/notebook.ipynb" */
  notebookPath?: string;
  sessionContext?: ISessionContext;
  rendermime: IRenderMimeRegistry;
  onOpenPresentation?: (themeCss?: string, initialSlideIndex?: number) => void;
}


export const SlideEditorPanel: React.FC<SlideEditorPanelProps> = ({
  notebook,
  service,
  notebookPath,
  sessionContext,
  rendermime,
  onOpenPresentation,
}) => {
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [assignmentVersion, setAssignmentVersion] = useState(0);
  const [showTheme, setShowTheme] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [pickerState, setPickerState] = useState<{ slideId: string; slot: string } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPresentMenu, setShowPresentMenu] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const presentMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showExportMenu && !showPresentMenu) return;
    const close = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (!presentMenuRef.current?.contains(e.target as Node)) {
        setShowPresentMenu(false);
      }
    };
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [showExportMenu, showPresentMenu]);

  const [meta, updateMeta] = useNotebookMetadata(notebook);
  const { slides, addSlide, updateSlide, removeSlide, moveSlide } = useSlides(notebook);

  const refreshThemes = useCallback(async () => {
    const nextThemes = await service.getThemes();
    setThemes(nextThemes);
    return nextThemes;
  }, [service]);

  useEffect(() => {
    refreshThemes().catch(console.error);
  }, [refreshThemes]);

  const notebookName = notebookPath
    ? (notebookPath.split('/').pop()?.replace(/\.ipynb$/i, '') ?? 'Notebook')
    : 'Notebook';

  // Set first slide as selected on init
  useEffect(() => {
    if (slides.length > 0 && !selectedSlide) {
      setSelectedSlide(slides[0].id);
    }
  }, [slides, selectedSlide]);

  const activeThemeCss = useMemo(() => {
    if (meta?.customCss) return meta.customCss;
    const selectedTheme = themes.find(t => t.name === (meta?.globalTheme || 'Jupypress'));
    return selectedTheme?.css;
  }, [meta?.customCss, meta?.globalTheme, themes]);

  const buildHtml = (): string => {
    const viewModel = buildSlideViewModel(notebook);
    return buildStandalonePresentationHtml(viewModel, notebook, {
      themeCss: activeThemeCss,
      enableLiveCoding: false,
    });
  };

  const handleExport = () => {
    try {
      const html = buildHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${notebookName}-presentation.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
      console.error('Export error:', err);
    }
  };

  const handleOpenInTab = (initialSlideIndex = 0) => {
    onOpenPresentation?.(activeThemeCss, initialSlideIndex);
  };

  const handleRefresh = () => setPreviewRefreshKey((k) => k + 1);

  /** Assign cells selected in the picker to a slot. */
  const handleAssignCells = (slideId: string, slot: string, cells: AssignedCell[]) => {
    // Determine starting order = count of cells already in this slot
    let order = 0;
    const count = notebook.cells.length;
    for (let i = 0; i < count; i++) {
      const m = getCellMeta(notebook.cells.get(i) as any);
      if (m.slideId === slideId && m.slot === slot) order++;
    }
    for (const { cellIdx, include } of cells) {
      const cell = notebook.cells.get(cellIdx);
      if (cell) {
        setCellMeta(cell as any, { slideId, slot, order: order++, include });
      }
    }
    setAssignmentVersion((v) => v + 1);
    setPickerState(null);
  };

  if (!meta) {
    return <div className="jp-JupypressEditor"><p>Loading…</p></div>;
  }

  const currentSlide = slides.find((s: any) => s.id === selectedSlide);
  const selectedSlideIndex = slides.findIndex((s: any) => s.id === selectedSlide);

  return (
    <div className="jp-JupypressEditor">
      {/* ── Navbar ── */}
      <header className="jp-JupypressEditor-navbar">
        <div className="jp-JupypressEditor-brand">
          <JupypressIcon tag="span" className="jp-JupypressEditor-brandIcon" />
          <span>JupyPress</span>
        </div>
        <div className="jp-JupypressEditor-navCenter">
          <button className="jp-JupypressEditor-navBtn" onClick={() => setShowDocs(true)} title="Documentation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Docs</span>
          </button>
          <button className="jp-JupypressEditor-navBtn" onClick={() => setShowTheme(true)} title="Theme settings">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
          </button>
          <button
            className={`jp-JupypressEditor-navBtn${meta.liveCodingEnabled !== false ? ' jp-JupypressEditor-navBtn--active' : ''}`}
            onClick={() => updateMeta({ liveCodingEnabled: !(meta.liveCodingEnabled ?? true) })}
            title={meta.liveCodingEnabled !== false ? 'Live coding: on' : 'Live coding: off'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Live</span>
          </button>
          <button className="jp-JupypressEditor-navBtn" onClick={handleRefresh} title="Refresh preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        <div className="jp-JupypressEditor-navRight">
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <div className="jp-JupypressEditor-exportSplit">
              <button className="jp-JupypressEditor-exportSplit-main" onClick={handleExport} title="Export as HTML">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Export</span>
              </button>
              <button
                className="jp-JupypressEditor-exportSplit-arrow"
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowPresentMenu(false);
                }}
                title="Export options"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            {showExportMenu && (
              <div className="jp-JupypressEditor-exportMenu">
                <button onClick={() => { handleExport(); setShowExportMenu(false); }}>Export as HTML</button>
              </div>
            )}
          </div>
          <div ref={presentMenuRef} style={{ position: 'relative' }}>
            <div className="jp-JupypressEditor-presentSplit">
              <button
                className="jp-JupypressEditor-presentSplit-main"
                onClick={() => handleOpenInTab(0)}
                title="Present from first slide"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>Present</span>
              </button>
              <button
                className="jp-JupypressEditor-presentSplit-arrow"
                onClick={() => {
                  setShowPresentMenu(!showPresentMenu);
                  setShowExportMenu(false);
                }}
                title="Present options"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            {showPresentMenu && (
              <div className="jp-JupypressEditor-presentMenu">
                <button onClick={() => { handleOpenInTab(0); setShowPresentMenu(false); }}>
                  Present from first slide
                </button>
                <button onClick={() => { handleOpenInTab(Math.max(selectedSlideIndex, 0)); setShowPresentMenu(false); }}>
                  Present from current slide
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {exportError && (
        <div className="jp-JupypressEditor-error">
          <p>{exportError}</p>
          <button onClick={() => setExportError(null)}>Dismiss</button>
        </div>
      )}

      {/* ── WYSIWYG body: slide list | slide editor | live preview ── */}
      <div className="jp-JupypressEditor-content">
        {/* Left: slide list */}
        <SlideList
          slides={slides}
          selectedSlide={selectedSlide}
          onSelectSlide={setSelectedSlide}
          notebookName={notebookName}
          notebookPath={notebookPath}
          notebook={notebook}
          onAddSlide={() =>
            addSlide({
              name: `Slide ${slides.length + 1}`,
              layout: 'default',
              showHeader: true,
            })
          }
          onRemoveSlide={removeSlide}
          onMoveSlide={moveSlide}
        />

        {/* Middle: slide configuration */}
        {currentSlide ? (
          <div className="jp-JupypressEditor-slideEditor">
            <SlideItem
              slide={currentSlide}
              notebook={notebook}
              onUpdateSlide={(updates) => updateSlide(selectedSlide!, updates)}
              onAssignmentChanged={() => setAssignmentVersion((v) => v + 1)}
              onOpenPicker={(slot) => setPickerState({ slideId: currentSlide.id, slot })}
              externalVersion={assignmentVersion}
            />
          </div>
        ) : (
          <div className="jp-JupypressEditor-slideEditor jp-JupypressEditor-slideEditor--empty">
            <p>Select or add a slide to edit.</p>
          </div>
        )}

        {/* Right: JupyterLab-backed live preview */}
        <div className="jp-JupypressEditor-previewColumn">
          <JupyterLabPresentation
            notebook={notebook}
            rendermime={rendermime}
            assignmentVersion={assignmentVersion}
            externalRefreshKey={previewRefreshKey}
            selectedSlideIndex={selectedSlideIndex}
            sessionContext={sessionContext}
            themeCss={activeThemeCss}
            enableLiveCoding={meta.liveCodingEnabled ?? true}
          />
        </div>
      </div>

      {/* ── Cell picker modal ── */}
      {pickerState && (
        <CellPickerModal
          slot={pickerState.slot}
          slideId={pickerState.slideId}
          notebook={notebook}
          onAssign={(cells) => handleAssignCells(pickerState.slideId, pickerState.slot, cells)}
          onClose={() => setPickerState(null)}
        />
      )}

      {/* ── Theme modal overlay ── */}
      {showTheme && createPortal(
        <div
          className="jp-JupypressThemeModal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTheme(false);
          }}
        >
          <div className="jp-JupypressThemeModal-content">
            <div className="jp-JupypressThemeModal-header">
              <h3>Theme</h3>
              <button
                className="jp-JupypressThemeModal-close"
                onClick={() => setShowTheme(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <ThemeEditor
              globalTheme={meta.globalTheme}
              customCss={(meta as any).customCss}
              themes={themes}
              onThemesChange={setThemes}
              onThemeChange={(theme, css) => updateMeta({ globalTheme: theme, customCss: css } as any)}
              onCustomCssChange={(css) => updateMeta({ customCss: css } as any)}
              onSaveCustomTheme={async (name, css) => {
                await service.saveTheme(name, css);
                await refreshThemes();
              }}
              service={service}
            />
          </div>
        </div>,
        document.body
      )}
      {/* ── Docs modal ── */}
      {showDocs && <DocsModal onClose={() => setShowDocs(false)} />}
    </div>
  );
};
