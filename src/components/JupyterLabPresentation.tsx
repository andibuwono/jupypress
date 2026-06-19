/**
 * JupyterLab-backed presentation renderer.
 *
 * This is the live/kernel-aware path. It intentionally renders code outputs
 * through JupyterLab OutputArea instead of the standalone HTML export renderer.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { ISessionContext } from '@jupyterlab/apputils';
import { INotebookModel } from '@jupyterlab/notebook';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Widget } from '@lumino/widgets';
import { SlideViewModel, CellSlot, buildSlideViewModel } from '../utils/slideMapper';
import { executeCellRequest } from '../utils/kernelExecutor';
import { baseCss } from '../utils/css/base.css';
import { defaultThemeCss } from '../utils/css/theme.css';

export interface JupyterLabPresentationProps {
  notebook: INotebookModel;
  rendermime: IRenderMimeRegistry;
  sessionContext?: ISessionContext;
  slides?: SlideViewModel[];
  selectedSlideIndex?: number;
  assignmentVersion?: number;
  externalRefreshKey?: number;
  themeCss?: string;
  customCss?: string;
  enableLiveCoding?: boolean;
  navigation?: 'none' | 'basic';
}

export const JupyterLabPresentation: React.FC<JupyterLabPresentationProps> = ({
  notebook,
  rendermime,
  sessionContext,
  slides,
  selectedSlideIndex = 0,
  assignmentVersion = 0,
  externalRefreshKey = 0,
  themeCss,
  customCss,
  enableLiveCoding = true,
  navigation = 'none',
}) => {
  const [modelVersion, setModelVersion] = useState(0);
  const [localSlideIndex, setLocalSlideIndex] = useState(selectedSlideIndex);
  const [frameScale, setFrameScale] = useState(1);
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const [uiVisible, setUiVisible] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [kernelConnected, setKernelConnected] = useState(!!sessionContext?.session?.kernel);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const uiTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const slideViewModel = useMemo(
    () => slides ?? buildSlideViewModel(notebook),
    // assignmentVersion and modelVersion intentionally trigger rebuilds from
    // metadata/cell changes without requiring callers to recreate `slides`.
    [slides, notebook, assignmentVersion, modelVersion, externalRefreshKey]
  );
  const iframeSrcDoc = useMemo(
    () => buildIframeDocument([
      baseCss,
      defaultThemeCss,
      themeCss ?? '',
      customCss ?? '',
      nativeIframeCss,
    ].join('\n')),
    [themeCss, customCss]
  );

  const currentSlideIndex = navigation === 'basic' ? localSlideIndex : selectedSlideIndex;
  const boundedSlideIndex = clamp(currentSlideIndex, 0, Math.max(slideViewModel.length - 1, 0));

  useEffect(() => {
    setLocalSlideIndex(selectedSlideIndex);
  }, [selectedSlideIndex]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const updateScale = () => {
      const frameWindow = iframeDocument?.defaultView;
      const isFrameFullscreen = !!iframeDocument?.fullscreenElement;
      const rect = iframe.getBoundingClientRect();
      const viewportWidth = isFrameFullscreen && frameWindow ? frameWindow.innerWidth : rect.width;
      const viewportHeight = isFrameFullscreen && frameWindow ? frameWindow.innerHeight : rect.height;
      const nextScale = Math.min(viewportWidth / 1200, viewportHeight / 675);
      setFrameScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateScale();
    const updateScaleSoon = () => {
      updateScale();
      window.setTimeout(updateScale, 50);
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(iframe);
    const frameWindow = iframeDocument?.defaultView;
    frameWindow?.addEventListener('resize', updateScaleSoon);
    iframeDocument?.addEventListener('fullscreenchange', updateScaleSoon);
    iframeDocument?.addEventListener('webkitfullscreenchange', updateScaleSoon);
    return () => {
      observer.disconnect();
      frameWindow?.removeEventListener('resize', updateScaleSoon);
      iframeDocument?.removeEventListener('fullscreenchange', updateScaleSoon);
      iframeDocument?.removeEventListener('webkitfullscreenchange', updateScaleSoon);
    };
  }, [iframeDocument]);

  useEffect(() => {
    if (!iframeDocument) return;
    iframeDocument.documentElement.setAttribute('data-theme', themeMode);
  }, [iframeDocument, themeMode]);

  useEffect(() => {
    return () => {
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    };
  }, []);

  const revealUi = useCallback((autoHide = true) => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    if (autoHide) {
      uiTimerRef.current = setTimeout(() => setUiVisible(false), 2000);
    }
  }, []);

  const hideUiSoon = useCallback(() => {
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = setTimeout(() => {
      if (!pickerOpen) setUiVisible(false);
    }, 500);
  }, [pickerOpen]);

  useEffect(() => {
    if (pickerOpen) {
      revealUi(false);
    }
  }, [pickerOpen, revealUi]);

  useEffect(() => {
    setPickerOpen(false);
  }, [boundedSlideIndex]);

  useEffect(() => {
    if (!iframeDocument) return;
    copyHostStyles(iframeDocument);
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => copyHostStyles(iframeDocument), 100);
    });
    observer.observe(document.head, { childList: true, subtree: true });
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      observer.disconnect();
    };
  }, [iframeDocument]);

  useEffect(() => {
    const handler = () => setModelVersion(v => v + 1);
    notebook.cells.changed.connect(handler);
    return () => {
      notebook.cells.changed.disconnect(handler);
    };
  }, [notebook]);

  useEffect(() => {
    setKernelConnected(!!sessionContext?.session?.kernel);
    const onKernelChanged = (_: unknown, kernel: unknown) => {
      setKernelConnected(!!kernel);
    };
    sessionContext?.kernelChanged?.connect(onKernelChanged);
    return () => {
      sessionContext?.kernelChanged?.disconnect(onKernelChanged);
    };
  }, [sessionContext]);

  useEffect(() => {
    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setModelVersion(v => v + 1), 250);
    };
    (notebook as any).contentChanged?.connect(debouncedRefresh);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      (notebook as any).contentChanged?.disconnect(debouncedRefresh);
    };
  }, [notebook]);

  const handleExecuted = useCallback(() => {
    setModelVersion(v => v + 1);
  }, []);

  const goTo = useCallback((delta: number) => {
    setLocalSlideIndex(index =>
      clamp(index + delta, 0, Math.max(slideViewModel.length - 1, 0))
    );
  }, [slideViewModel.length]);

  const jumpTo = useCallback((index: number) => {
    setLocalSlideIndex(clamp(index, 0, Math.max(slideViewModel.length - 1, 0)));
  }, [slideViewModel.length]);

  const changeFontScale = useCallback((delta: number) => {
    setFontScale(value => clamp(value + delta, 50, 150));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode => mode === 'light' ? 'dark' : 'light');
  }, []);

  const handleFrameClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (navigation !== 'basic' || isInteractiveElement(event.target)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) goTo(-1);
    if (x > third * 2) goTo(1);
  }, [goTo, navigation]);

  useEffect(() => {
    if (!iframeDocument || navigation !== 'basic') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveElement(event.target)) return;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          goTo(1);
          revealUi();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goTo(-1);
          revealUi();
          break;
        case 'Home':
          event.preventDefault();
          jumpTo(0);
          revealUi();
          break;
        case 'End':
          event.preventDefault();
          jumpTo(Math.max(slideViewModel.length - 1, 0));
          revealUi();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen(iframeDocument);
          revealUi(false);
          break;
        case 't':
        case 'T':
          event.preventDefault();
          toggleTheme();
          revealUi(false);
          break;
        case '+':
        case '=':
          event.preventDefault();
          changeFontScale(10);
          revealUi(false);
          break;
        case '-':
        case '_':
          event.preventDefault();
          changeFontScale(-10);
          revealUi(false);
          break;
        case 'Escape':
          setPickerOpen(false);
          break;
      }
    };
    iframeDocument.addEventListener('keydown', handleKeyDown);
    return () => iframeDocument.removeEventListener('keydown', handleKeyDown);
  }, [
    changeFontScale,
    goTo,
    iframeDocument,
    jumpTo,
    navigation,
    revealUi,
    slideViewModel.length,
    toggleTheme,
  ]);

  const activeSlide = slideViewModel[boundedSlideIndex];
  const portalHost = iframeDocument?.getElementById('jupypress-root');
  const slideContent = (
    <div className="letterbox" role="application" aria-label="Slide presentation">
      <div
        className="slide-frame"
        style={{
          transform: `translate(-50%, -50%) scale(${frameScale})`,
          transformOrigin: 'center center',
        }}
        onMouseMove={() => navigation === 'basic' && revealUi()}
        onMouseLeave={() => navigation === 'basic' && hideUiSoon()}
        onClick={handleFrameClick}
      >
        {activeSlide ? (
          <SlideSection
            key={activeSlide.id}
            slide={activeSlide}
            slideIndex={boundedSlideIndex}
            notebook={notebook}
            rendermime={rendermime}
            sessionContext={sessionContext}
            enableLiveCoding={enableLiveCoding}
            fontScale={fontScale}
            onExecuted={handleExecuted}
          />
        ) : (
          <section className="slide slide--default" role="group" aria-label="Empty presentation">
            <div className="slide-content">
              <div className="slot-content">
                <div className="cell">
                  <div className="cell-markdown">
                    <p>No slides configured.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {enableLiveCoding && (
          <div
            className={`kernel-indicator ${kernelConnected ? 'kernel-indicator--visible' : ''}`}
            title={kernelConnected ? 'Kernel connected' : 'Kernel not connected'}
          >
            <div className="kernel-indicator__dot"></div>
            <span className="kernel-indicator__label">
              {kernelConnected ? 'Kernel connected' : 'Kernel not connected'}
            </span>
          </div>
        )}
        {navigation === 'basic' && slideViewModel.length > 0 && (
          <div className={`slide-ui ${uiVisible ? 'slide-ui--visible' : ''}`} aria-hidden={!uiVisible}>
            <button
              className="slide-ui__btn slide-ui__btn--prev"
              title="Previous (←)"
              onClick={(event) => {
                event.stopPropagation();
                goTo(-1);
                revealUi();
              }}
              disabled={boundedSlideIndex === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              <span className="sr-only">Previous</span>
            </button>
            <button
              className="slide-ui__btn slide-ui__btn--next"
              title="Next (→)"
              onClick={(event) => {
                event.stopPropagation();
                goTo(1);
                revealUi();
              }}
              disabled={boundedSlideIndex >= slideViewModel.length - 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="sr-only">Next</span>
            </button>
            <div className="slide-ui__toolbar" onClick={event => event.stopPropagation()}>
              <button
                className="slide-ui__btn slide-ui__btn--home"
                title="First slide (Home)"
                onClick={() => {
                  jumpTo(0);
                  revealUi();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </button>
              <div className={`slide-picker ${pickerOpen ? 'slide-picker--open' : ''}`}>
                <button
                  className="slide-picker__trigger"
                  title="Jump to slide"
                  onClick={() => setPickerOpen(open => !open)}
                >
                  <span className="progress jp-JupypressSlideProgress">{boundedSlideIndex + 1} / {slideViewModel.length}</span>
                  <svg className="slide-picker__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div className="slide-picker__menu" hidden={!pickerOpen}>
                  {slideViewModel.map((slide, index) => (
                    <button
                      className={`slide-picker__item ${index === boundedSlideIndex ? 'slide-picker__item--active' : ''}`}
                      key={slide.id}
                      onClick={() => {
                        jumpTo(index);
                        revealUi();
                      }}
                    >
                      <span className="slide-picker__num">{index + 1}</span>
                      <span className="slide-picker__name">{slide.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="slide-ui__btn slide-ui__btn--fullscreen"
                title="Fullscreen (F)"
                onClick={() => {
                  if (iframeDocument) toggleFullscreen(iframeDocument);
                  revealUi(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
              <div className="slide-ui__font-scale">
                <button
                  className="slide-ui__btn slide-ui__btn--font-down"
                  title="Decrease font (-)"
                  onClick={() => {
                    changeFontScale(-10);
                    revealUi(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="slide-ui__font-label">{fontScale}%</span>
                <button
                  className="slide-ui__btn slide-ui__btn--font-up"
                  title="Increase font (+)"
                  onClick={() => {
                    changeFontScale(10);
                    revealUi(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              <button
                className="slide-ui__btn slide-ui__btn--theme"
                title="Toggle theme (T)"
                onClick={() => {
                  toggleTheme();
                  revealUi(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="jp-JupypressNativePresentation"
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}
    >
      <iframe
        ref={iframeRef}
        className="jp-JupypressNativePresentation-iframe"
        title="JupyPress presentation"
        srcDoc={iframeSrcDoc}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        onLoad={() => setIframeDocument(iframeRef.current?.contentDocument ?? null)}
      />
      {portalHost ? createPortal(slideContent, portalHost) : null}
    </div>
  );
};

interface SlideSectionProps {
  slide: SlideViewModel;
  slideIndex: number;
  notebook: INotebookModel;
  rendermime: IRenderMimeRegistry;
  sessionContext?: ISessionContext;
  enableLiveCoding: boolean;
  fontScale: number;
  onExecuted: () => void;
}

const SlideSection: React.FC<SlideSectionProps> = ({
  slide,
  slideIndex,
  notebook,
  rendermime,
  sessionContext,
  enableLiveCoding,
  fontScale,
  onExecuted,
}) => (
  <section
    className={`slide ${getLayoutClass(slide.layout)}`}
    id={`slide-${slideIndex + 1}`}
    role="group"
    aria-label={`Slide ${slideIndex + 1}`}
    data-name={slide.name}
    style={{ zoom: fontScale / 100 }}
  >
    {renderSlideContent(slide, notebook, rendermime, sessionContext, enableLiveCoding, onExecuted)}
  </section>
);

function renderSlideContent(
  slide: SlideViewModel,
  notebook: INotebookModel,
  rendermime: IRenderMimeRegistry,
  sessionContext: ISessionContext | undefined,
  enableLiveCoding: boolean,
  onExecuted: () => void
): React.ReactNode {
  const renderSlot = (slotName: string) => (
    <Slot
      slotName={slotName}
      cells={slide.slots[slotName] ?? []}
      notebook={notebook}
      rendermime={rendermime}
      sessionContext={sessionContext}
      enableLiveCoding={enableLiveCoding}
      onExecuted={onExecuted}
    />
  );

  switch (slide.layout) {
    case 'title':
      return (
        <div className="slide-content slide-content--title">
          {renderSlot('title')}
          {renderSlot('subtitle')}
        </div>
      );
    case 'two-col-h':
      return (
        <div className="slide-content">
          {renderSlot('heading')}
          {renderSlot('sub-heading')}
          <div className="columns">
            <div className="col">{renderSlot('left')}</div>
            <div className="col">{renderSlot('right')}</div>
          </div>
        </div>
      );
    case 'two-col-v':
      return (
        <div className="slide-content">
          {renderSlot('heading')}
          {renderSlot('sub-heading')}
          <div className="columns" style={{ flexDirection: 'column' }}>
            <div className="col">{renderSlot('top')}</div>
            <div className="col">{renderSlot('bottom')}</div>
          </div>
        </div>
      );
    case 'three-row-v':
      return (
        <div className="slide-content">
          {renderSlot('heading')}
          {renderSlot('sub-heading')}
          <div className="columns" style={{ flexDirection: 'column' }}>
            <div className="col">{renderSlot('content-1')}</div>
            <div className="col">{renderSlot('content-2')}</div>
            <div className="col">{renderSlot('content-3')}</div>
          </div>
        </div>
      );
    case 'three-row-h':
      return (
        <div className="slide-content">
          {renderSlot('heading')}
          {renderSlot('sub-heading')}
          <div className="columns">
            <div className="col">{renderSlot('content-1')}</div>
            <div className="col">{renderSlot('content-2')}</div>
            <div className="col">{renderSlot('content-3')}</div>
          </div>
        </div>
      );
    default:
      return (
        <div className="slide-content">
          {renderSlot('heading')}
          {renderSlot('sub-heading')}
          {renderSlot('content')}
        </div>
      );
  }
}

interface SlotProps {
  slotName: string;
  cells: CellSlot[];
  notebook: INotebookModel;
  rendermime: IRenderMimeRegistry;
  sessionContext?: ISessionContext;
  enableLiveCoding: boolean;
  onExecuted: () => void;
}

const Slot: React.FC<SlotProps> = ({
  slotName,
  cells,
  notebook,
  rendermime,
  sessionContext,
  enableLiveCoding,
  onExecuted,
}) => {
  if (cells.length === 0) return null;
  return (
    <div className={`slot-${slotName}`}>
      {cells.map(cellSlot => (
        <div className="cell" key={`${cellSlot.cellIndex}-${cellSlot.order}`}>
          <SlideCell
            cellSlot={cellSlot}
            notebook={notebook}
            rendermime={rendermime}
            sessionContext={sessionContext}
            enableLiveCoding={enableLiveCoding}
            onExecuted={onExecuted}
          />
        </div>
      ))}
    </div>
  );
};

interface SlideCellProps {
  cellSlot: CellSlot;
  notebook: INotebookModel;
  rendermime: IRenderMimeRegistry;
  sessionContext?: ISessionContext;
  enableLiveCoding: boolean;
  onExecuted: () => void;
}

const SlideCell: React.FC<SlideCellProps> = ({
  cellSlot,
  notebook,
  rendermime,
  sessionContext,
  enableLiveCoding,
  onExecuted,
}) => {
  const cell = notebook.cells.get(cellSlot.cellIndex);
  if (!cell) return null;

  const source = getCellSource(cell);

  if (cellSlot.cellType === 'markdown') {
    return (
      <div
        className="cell-markdown"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
      />
    );
  }

  if (cellSlot.cellType !== 'code') {
    return <pre>{source}</pre>;
  }

  const outputs = ((cell as any).sharedModel?.outputs ?? []) as any[];
  const showInput = cellSlot.include === 'full' || cellSlot.include === 'input-only';
  const showOutput = cellSlot.include === 'full' || cellSlot.include === 'output-only';

  return (
    <LiveCodeCell
      cellIndex={cellSlot.cellIndex}
      source={source}
      outputs={outputs}
      rendermime={rendermime}
      sessionContext={sessionContext}
      notebook={notebook}
      showInput={showInput}
      showOutput={showOutput}
      enableLiveCoding={enableLiveCoding}
      onExecuted={onExecuted}
    />
  );
};

interface LiveCodeCellProps {
  cellIndex: number;
  source: string;
  outputs: any[];
  rendermime: IRenderMimeRegistry;
  sessionContext?: ISessionContext;
  notebook: INotebookModel;
  showInput: boolean;
  showOutput: boolean;
  enableLiveCoding: boolean;
  onExecuted: () => void;
}

const LiveCodeCell: React.FC<LiveCodeCellProps> = ({
  cellIndex,
  source,
  outputs,
  rendermime,
  sessionContext,
  notebook,
  showInput,
  showOutput,
  enableLiveCoding,
  onExecuted,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(source);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(source);
  }, [editing, source]);

  const run = async () => {
    setRunning(true);
    setError(null);
    const payload = await executeCellRequest(sessionContext, notebook, cellIndex, draft);
    setRunning(false);
    if (payload.error) {
      setError(payload.error);
    }
    setEditing(false);
    onExecuted();
  };

  return (
    <div
      className="cell-code-wrapper"
      data-cell-index={cellIndex}
      onClick={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
    >
      {showInput && !editing && (
        <pre className="cell-code-input">
          <code
            className="language-python hljs"
            dangerouslySetInnerHTML={{ __html: highlightPython(source) }}
          />
        </pre>
      )}
      {enableLiveCoding && (
        <>
          {!editing && (
            <button
              className="cell-edit-btn"
              title="Edit & Run"
              onClick={event => {
                event.stopPropagation();
                setEditing(true);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          {editing && (
            <div
              className="cell-code-editor"
              onClick={event => event.stopPropagation()}
              onPointerDown={event => event.stopPropagation()}
            >
              <CodeMirrorCodeEditor
                value={draft}
                onChange={setDraft}
                autoFocus
              />
              <div className="cell-code-actions">
                <button
                  className="cell-code-cancel-btn"
                  onClick={event => {
                    event.stopPropagation();
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="cell-code-run-btn"
                  onClick={event => {
                    event.stopPropagation();
                    void run();
                  }}
                  disabled={running}
                >
                  {running ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {showOutput && (
        <div className="cell-code-output">
          {error ? (
            <pre className="cell-output-error">{error}</pre>
          ) : (
            <JupyterOutputArea outputs={outputs} rendermime={rendermime} />
          )}
        </div>
      )}
    </div>
  );
};

interface CodeMirrorCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

const codeMirrorExtensions: Extension[] = [
  lineNumbers(),
  foldGutter(),
  highlightActiveLineGutter(),
  history(),
  indentOnInput(),
  bracketMatching(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  python(),
  highlightActiveLine(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  EditorView.lineWrapping,
  EditorView.theme({
    '&': {
      backgroundColor: 'transparent',
      color: 'var(--code-text, #24292e)',
      fontSize: '0.82em',
    },
    '.cm-scroller': {
      fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
      lineHeight: '1.5',
      maxHeight: '360px',
      overflow: 'auto',
    },
    '.cm-content': {
      caretColor: 'var(--code-text, #24292e)',
      minHeight: '120px',
      padding: '0',
    },
    '.cm-line': {
      padding: '0 4px',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid rgba(127,127,127,0.22)',
      color: 'var(--text-muted, #6a6f7a)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(127,127,127,0.08)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(127,127,127,0.08)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--code-text, #24292e)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(79, 140, 255, 0.28)',
    },
  }),
];

const CodeMirrorCodeEditor: React.FC<CodeMirrorCodeEditorProps> = ({
  value,
  onChange,
  autoFocus = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          ...codeMirrorExtensions,
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    if (autoFocus) {
      window.setTimeout(() => view.focus(), 0);
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Create the editor once for each edit session. External value changes are
    // synchronized by the effect below without rebuilding the editor DOM.
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="cell-code-editor-host" />;
};

interface JupyterOutputAreaProps {
  outputs: any[];
  rendermime: IRenderMimeRegistry;
}

const JupyterOutputArea: React.FC<JupyterOutputAreaProps> = ({ outputs, rendermime }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let model: OutputAreaModel | null = new OutputAreaModel({
      values: outputs as any,
      trusted: true,
    });
    let outputArea: OutputArea | null = new OutputArea({
      model,
      rendermime,
      showInputPlaceholder: false,
    });

    try {
      Widget.attach(outputArea, host);
    } catch (err) {
      outputArea.dispose();
      model.dispose();
      outputArea = null;
      model = null;
      throw err;
    }

    return () => {
      if (outputArea) {
        try {
          if (outputArea.isAttached && outputArea.node.isConnected) {
            Widget.detach(outputArea);
          }
        } catch (_) {
          // The iframe document can be torn down before React cleanup runs.
        }
        try {
          outputArea.dispose();
        } catch (_) {
          // Lumino dispose may attempt a second detach after iframe teardown.
        }
      }
      if (model) {
        try {
          model.dispose();
        } catch (_) {
          // Ignore disposal races during slide/iframe replacement.
        }
      }
    };
  }, [outputs, rendermime]);

  return <div ref={hostRef} className="jp-JupypressNativeOutput" />;
};

function getCellSource(cell: any): string {
  return cell.sharedModel?.source ?? cell.source ?? '';
}

function getLayoutClass(layout: string): string {
  switch (layout) {
    case 'title': return 'slide--title';
    case 'two-col-h': return 'slide--two-col';
    case 'two-col-v': return 'slide--two-col';
    case 'three-row-v': return 'slide--three-row';
    case 'three-row-h': return 'slide--three-col';
    default: return 'slide--default';
  }
}

function renderMarkdown(source: string): string {
  const lines = source.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      out.push(`<h${lvl}>${inlineMarkdown(hMatch[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      out.push('<hr>');
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || 'plaintext';
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre><code class="language-${escapeAttribute(lang)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        items.push(inlineMarkdown(lines[i].replace(/^>\s?/, '')));
        i++;
      }
      out.push(`<blockquote><p>${items.join('<br>')}</p></blockquote>`);
      continue;
    }

    if (/^[\-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-*+]\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^[\-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[\-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      para.push(inlineMarkdown(lines[i]));
      i++;
    }
    if (para.length) out.push(`<p>${para.join('<br>')}</p>`);
  }

  return out.join('\n');
}

function inlineMarkdown(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, '&#96;');
}

function highlightPython(source: string): string {
  const keywords = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
  ]);
  const builtins = new Set([
    'display', 'HTML', 'len', 'range', 'print', 'str', 'int', 'float', 'list',
    'dict', 'set', 'tuple', 'sum', 'min', 'max', 'enumerate', 'zip',
  ]);
  const tokenPattern = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/g;
  let result = '';
  let lastIndex = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    result += escapeHtml(source.slice(lastIndex, index));
    result += highlightPythonToken(token, keywords, builtins);
    lastIndex = index + token.length;
  }
  result += escapeHtml(source.slice(lastIndex));
  return result;
}

function highlightPythonToken(
  token: string,
  keywords: Set<string>,
  builtins: Set<string>
): string {
  const escaped = escapeHtml(token);
  if (token.startsWith('#')) return `<span class="hljs-comment">${escaped}</span>`;
  if (token.startsWith('"') || token.startsWith("'")) return `<span class="hljs-string">${escaped}</span>`;
  if (/^\d/.test(token)) return `<span class="hljs-number">${escaped}</span>`;
  if (keywords.has(token)) return `<span class="hljs-keyword">${escaped}</span>`;
  if (builtins.has(token)) return `<span class="hljs-built_in">${escaped}</span>`;
  return escaped;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest([
    '.slide-ui',
    '.jp-JupypressNativeOutput',
    '.cell-code-editor',
    'a',
    'button',
    'input',
    'textarea',
    'select',
    'label',
    'video',
    'audio',
    '[contenteditable="true"]',
    '[role="slider"]',
    '[role="button"]',
  ].join(','));
}

function toggleFullscreen(doc: Document): void {
  try {
    if (!doc.fullscreenElement) {
      doc.documentElement.requestFullscreen?.();
    } else {
      doc.exitFullscreen?.();
    }
  } catch (_) {
    // Browsers can reject fullscreen from embedded documents.
  }
}

function buildIframeDocument(css: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <style id="jupypress-presentation-css">${css}</style>
</head>
<body>
  <div id="jupypress-root"></div>
</body>
</html>`;
}

function copyHostStyles(targetDocument: Document): void {
  const presentationStyle = targetDocument.getElementById('jupypress-presentation-css');
  if (!presentationStyle || !targetDocument.head) return;

  targetDocument
    .querySelectorAll('[data-jupypress-host-style="true"], #jupypress-native-overrides')
    .forEach(node => node.remove());

  let insertAfter: ChildNode = presentationStyle;
  document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style').forEach(node => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-jupypress-host-style', 'true');
    targetDocument.head.insertBefore(clone, insertAfter.nextSibling);
    insertAfter = clone;
  });

  const overrideStyle = targetDocument.createElement('style');
  overrideStyle.id = 'jupypress-native-overrides';
  overrideStyle.textContent = nativeOverrideCss;
  targetDocument.head.insertBefore(overrideStyle, insertAfter.nextSibling);
}

const nativeIframeCss = `
html,
body,
#jupypress-root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

.letterbox {
  position: fixed;
  inset: 0;
  background: var(--letterbox-bg, #1a1a2e);
  overflow: hidden;
}

.slide-frame {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1200px;
  height: 675px;
  overflow: hidden;
}

.slide-content,
.col,
.cell-code-output,
.jp-JupypressNativeOutput,
.jp-JupypressNativeOutput .jp-OutputArea-output {
  min-height: 0;
}

.slide-content {
  overflow: auto;
  scrollbar-gutter: stable;
}

.col,
.cell-code-output,
.jp-JupypressNativeOutput .jp-OutputArea-output {
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--jupypress-scrollbar-thumb, rgba(35, 44, 64, 0.24)) transparent;
}

.slide-content::-webkit-scrollbar,
.col::-webkit-scrollbar,
.cell-code-output::-webkit-scrollbar,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.slide-content::-webkit-scrollbar-track,
.col::-webkit-scrollbar-track,
.cell-code-output::-webkit-scrollbar-track,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar-track {
  background: transparent;
}

.slide-content::-webkit-scrollbar-thumb,
.col::-webkit-scrollbar-thumb,
.cell-code-output::-webkit-scrollbar-thumb,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar-thumb {
  background: var(--jupypress-scrollbar-thumb, rgba(35, 44, 64, 0.24));
  border-radius: 999px;
}

.slide-content::-webkit-scrollbar-thumb:hover,
.col::-webkit-scrollbar-thumb:hover,
.cell-code-output::-webkit-scrollbar-thumb:hover,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar-thumb:hover {
  background: var(--jupypress-scrollbar-thumb-hover, rgba(35, 44, 64, 0.38));
}

.jp-JupypressNativeOutput,
.jp-JupypressNativeOutput * {
  pointer-events: auto;
}

.jp-JupypressNativePresentation {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.jp-JupypressNativePresentation-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.jp-JupypressNativeOutput .jp-OutputArea {
  margin: 0;
}

.jp-JupypressNativeOutput .jp-OutputArea-child {
  padding: 0;
}

.jp-JupypressNativeOutput .jp-OutputPrompt {
  display: none;
}

.slide-ui__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
`;

const nativeOverrideCss = `
.slide-ui__toolbar .progress,
.slide-ui__toolbar .jp-JupypressSlideProgress {
  background: transparent;
  border: 0;
  box-shadow: none;
  color: var(--ui-progress-color, rgba(0,0,0,0.65));
  display: inline;
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1;
  margin: 0;
  padding: 0;
  pointer-events: none;
  user-select: none;
  width: auto;
}

[data-theme="dark"] .slide-ui__toolbar .progress,
[data-theme="dark"] .slide-ui__toolbar .jp-JupypressSlideProgress {
  color: var(--ui-progress-color, rgba(255,255,255,0.72));
}

.slide-ui__toolbar {
  color: var(--ui-progress-color, rgba(0,0,0,0.65));
}

.slide-frame:hover .slide-ui:not(.slide-ui--visible) {
  opacity: 0;
}

[data-theme="dark"] .slide-ui__toolbar {
  color: var(--ui-progress-color, rgba(255,255,255,0.72));
}

.cell-code-wrapper {
  position: relative;
}

.cell-code-editor {
  margin: 0 0 8px;
  background: var(--code-bg, #f6f8fa);
  border: 0;
  border-left: 4px solid var(--color-primary, #e63946);
  border-radius: 0 6px 6px 0;
  box-shadow: none;
  padding: 10px 12px;
  position: relative;
}

.cell-code-editor-host {
  min-height: 120px;
  width: 100%;
}

.cell-code-editor-host .cm-editor {
  background: transparent;
  border: 0;
}

.cell-code-editor-host .cm-scroller {
  scrollbar-width: thin;
}

.cell-code-actions {
  align-items: center;
  border-top: 1px solid rgba(0,0,0,0.08);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 8px;
}

[data-theme="dark"] .cell-code-actions {
  border-top-color: rgba(255,255,255,0.12);
}

.cell-code-run-btn,
.cell-code-cancel-btn {
  border-radius: 5px;
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 12px;
  line-height: 1;
  padding: 7px 12px;
}

.cell-code-cancel-btn {
  background: transparent;
}

.cell-code-output,
.jp-JupypressNativeOutput .jp-OutputArea-output {
  scrollbar-width: thin;
  scrollbar-color: var(--jupypress-scrollbar-thumb, rgba(35, 44, 64, 0.22)) transparent;
}

.slide-content {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.slide-content:hover,
.col:hover,
.cell-code-output:hover,
.jp-JupypressNativeOutput .jp-OutputArea-output:hover {
  scrollbar-color: var(--jupypress-scrollbar-thumb, rgba(35, 44, 64, 0.22)) transparent;
}

.slide-content::-webkit-scrollbar,
.col::-webkit-scrollbar,
.cell-code-output::-webkit-scrollbar,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.slide-content::-webkit-scrollbar-track,
.col::-webkit-scrollbar-track,
.cell-code-output::-webkit-scrollbar-track,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar-track {
  background: transparent;
}

.slide-content::-webkit-scrollbar-thumb,
.col::-webkit-scrollbar-thumb,
.cell-code-output::-webkit-scrollbar-thumb,
.jp-JupypressNativeOutput .jp-OutputArea-output::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px;
}

.slide-content:hover::-webkit-scrollbar-thumb,
.col:hover::-webkit-scrollbar-thumb,
.cell-code-output:hover::-webkit-scrollbar-thumb,
.jp-JupypressNativeOutput .jp-OutputArea-output:hover::-webkit-scrollbar-thumb {
  background: var(--jupypress-scrollbar-thumb, rgba(35, 44, 64, 0.22));
}

.slide-content:hover::-webkit-scrollbar-thumb:hover,
.col:hover::-webkit-scrollbar-thumb:hover,
.cell-code-output:hover::-webkit-scrollbar-thumb:hover,
.jp-JupypressNativeOutput .jp-OutputArea-output:hover::-webkit-scrollbar-thumb:hover {
  background: var(--jupypress-scrollbar-thumb-hover, rgba(35, 44, 64, 0.36));
}

[data-theme="dark"] .slide-content:hover::-webkit-scrollbar-thumb,
[data-theme="dark"] .col:hover::-webkit-scrollbar-thumb,
[data-theme="dark"] .cell-code-output:hover::-webkit-scrollbar-thumb,
[data-theme="dark"] .jp-JupypressNativeOutput .jp-OutputArea-output:hover::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.22);
}

.jp-JupypressNativeOutput .widget-inline-hbox,
.jp-JupypressNativeOutput .widget-hbox,
.jp-JupypressNativeOutput .widget-vbox {
  align-items: center;
  gap: 8px;
}

.jp-JupypressNativeOutput .widget-label {
  color: var(--text-body, #333);
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 0.9em;
}

.jp-JupypressNativeOutput .widget-readout {
  color: var(--text-body, #333);
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 0.85em;
  min-width: 32px;
}

.jp-JupypressNativeOutput input[type="range"] {
  accent-color: var(--color-primary, #e63946);
  height: 18px;
}

.jp-JupypressNativeOutput .slider-container,
.jp-JupypressNativeOutput .widget-slider {
  min-width: 180px;
}

.jp-JupypressNativeOutput .noUi-target {
  background: rgba(35, 44, 64, 0.12);
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  height: 6px;
}

.jp-JupypressNativeOutput .noUi-connect {
  background: var(--color-primary, #e63946);
}

.jp-JupypressNativeOutput .noUi-horizontal .noUi-handle {
  width: 16px;
  height: 16px;
  right: -8px;
  top: -5px;
  border: 2px solid var(--color-primary, #e63946);
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  cursor: grab;
}

.jp-JupypressNativeOutput .noUi-handle::before,
.jp-JupypressNativeOutput .noUi-handle::after {
  display: none;
}

.jp-JupypressNativeOutput .noUi-active {
  cursor: grabbing;
}

[data-theme="dark"] .jp-JupypressNativeOutput .widget-label,
[data-theme="dark"] .jp-JupypressNativeOutput .widget-readout {
  color: var(--text-body, rgba(255,255,255,0.86));
}

[data-theme="dark"] .jp-JupypressNativeOutput .noUi-target {
  background: rgba(255,255,255,0.16);
}
`;
