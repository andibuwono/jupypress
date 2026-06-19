/**
 * HTML builder for presentation output.
 *
 * Generates a self-contained HTML file using the reference framework
 * (letterbox shell, slide-frame, full slide-ui overlay).
 */

import { INotebookModel } from '@jupyterlab/notebook';
import { SlideViewModel, CellSlot } from './slideMapper';
import { baseCss } from './css/base.css';
import { defaultThemeCss } from './css/theme.css';
import { navigationJs } from './js/navigation.js';
import { renderOutputs } from './outputRenderer';


/**
 * Build a self-contained HTML presentation from slide view models.
 */
export interface BuildPresentationOptions {
  customCss?: string;
  themeCss?: string;
  enableLiveCoding?: boolean;
}

export function buildStandalonePresentationHtml(
  slides: SlideViewModel[],
  notebook?: INotebookModel | null,
  options?: BuildPresentationOptions
): string {
  const { customCss, themeCss, enableLiveCoding } = options ?? {};
  const nb = notebook ?? null;
  const liveCoding = enableLiveCoding ?? false;

  const slideSections = slides
    .map((slide, idx) => buildSlideSection(slide, idx, nb, liveCoding))
    .join('\n');

  const pickerItems = slides
    .map((slide, idx) =>
      `<button class="slide-picker__item" data-slide-index="${idx}">` +
      `<span class="slide-picker__num">${idx + 1}</span>` +
      `<span class="slide-picker__name">${escapeHtml(slide.name)}</span>` +
      `</button>`
    )
    .join('\n');

  const widgetState = extractWidgetState(nb);
  const needsWidgetRuntime = liveCoding || !!widgetState || slidesHaveWidgetOutput(slides, nb);

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"><\/script>
${needsWidgetRuntime ? `  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jupyter-widgets/html-manager@1.0.11/dist/embed.css" />
  <script src="https://cdn.jsdelivr.net/npm/@jupyter-widgets/html-manager@1.0.11/dist/embed-amd.js" crossorigin="anonymous"><\/script>` : ''}
  <style>
${baseCss}
${defaultThemeCss}
${themeCss ?? ''}
${customCss ?? ''}
  </style>
</head>
<body>
  <div class="letterbox" role="application" aria-label="Slide presentation">
    <div class="slide-frame">
${slideSections}

      ${liveCoding ? `
      <!-- Kernel Connection Indicator -->
      <div class="kernel-indicator" title="Live coding available">
        <div class="kernel-indicator__dot"></div>
        <span class="kernel-indicator__label">Live coding available</span>
      </div>
      <script>(function(){var k=document.querySelector('.kernel-indicator');if(k)k.classList.add('kernel-indicator--visible');})();</script>` : ''}

      <!-- Slide UI Overlay -->
      <div class="slide-ui" aria-hidden="true">
        <button class="slide-ui__btn slide-ui__btn--prev" title="Previous (←)" data-nav="prev">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span class="sr-only">Previous</span>
        </button>
        <button class="slide-ui__btn slide-ui__btn--next" title="Next (→)" data-nav="next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="sr-only">Next</span>
        </button>
        <div class="slide-ui__toolbar">
          <button class="slide-ui__btn slide-ui__btn--home" title="First slide (Home)" data-nav="home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
          <div class="slide-picker" data-nav="picker">
            <button class="slide-picker__trigger" title="Jump to slide">
              <span class="progress">1 / ${slides.length}</span>
              <svg class="slide-picker__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="slide-picker__menu" hidden>
${pickerItems}
            </div>
          </div>
          <button class="slide-ui__btn slide-ui__btn--fullscreen" title="Fullscreen (F)" data-nav="fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
          <div class="slide-ui__font-scale" data-nav="fontscale">
            <button class="slide-ui__btn slide-ui__btn--font-down" title="Decrease font (−)" data-nav="font-down">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="slide-ui__font-label">100%</span>
            <button class="slide-ui__btn slide-ui__btn--font-up" title="Increase font (+)" data-nav="font-up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <button class="slide-ui__btn slide-ui__btn--theme" title="Toggle theme (T)" data-nav="theme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </div>
      </div>

    </div>
  </div>

  <div class="sr-only" aria-live="polite" id="slide-announce"></div>

  <script>${navigationJs}<\/script>
  <script>if (typeof hljs !== 'undefined') hljs.highlightAll();<\/script>
${needsWidgetRuntime ? `
${widgetState ? `
  <script type="application/vnd.jupyter.widget-state+json">
${JSON.stringify(widgetState, null, 2)}
  <\/script>` : ''}
  <script>
    (function() {
      window.jupypressInitWidgets = function(root) {
        if (typeof require !== 'undefined' && require.defined && require.defined('@jupyter-widgets/html-manager')) {
          require(['@jupyter-widgets/html-manager'], function(manager) {
            manager.WidgetManager.prototype.renderWidgets(root || document.body);
          });
        }
      };
      if (typeof window.require !== 'undefined') {
        window.jupypressInitWidgets();
      } else {
        window.addEventListener('load', function() { window.jupypressInitWidgets(); });
      }
    })();
  <\/script>` : ''}
</body>
</html>`;
}

/**
 * Backward-compatible alias for the standalone export builder.
 *
 * New JupyterLab-backed preview/present code should not use this. It should
 * render through JupyterLab output widgets instead.
 */
export function buildPresentationHtml(
  slides: SlideViewModel[],
  notebook?: INotebookModel | null,
  options?: BuildPresentationOptions
): string {
  return buildStandalonePresentationHtml(slides, notebook, options);
}


/* ─── Slide Section ──────────────────────────────────────────────────────── */

function buildSlideSection(
  slide: SlideViewModel,
  idx: number,
  notebook: INotebookModel | null,
  enableLiveCoding?: boolean
): string {
  const layoutClass = getLayoutClass(slide.layout);
  const hidden = idx === 0 ? '' : 'hidden';
  const content = buildSlideContent(slide, notebook, enableLiveCoding);

  return [
    `      <section class="slide ${layoutClass}" id="slide-${idx + 1}"`,
    `               role="group" aria-label="Slide ${idx + 1}"`,
    `               data-name="${escapeHtml(slide.name)}" ${hidden}>`,
    content,
    `      </section>`,
  ].join('\n');
}


function getLayoutClass(layout: string): string {
  switch (layout) {
    case 'title':      return 'slide--title';
    case 'two-col-h':   return 'slide--two-col';
    case 'two-col-v':   return 'slide--two-col';
    case 'three-row-v': return 'slide--three-row';
    case 'three-row-h': return 'slide--three-col';
    default:            return 'slide--default';
  }
}


function buildSlideContent(
  slide: SlideViewModel,
  notebook: INotebookModel | null,
  enableLiveCoding?: boolean
): string {
  const renderSlot = (slotName: string): string => {
    const cells: CellSlot[] = slide.slots[slotName] ?? [];
    if (cells.length === 0) return '';
    const inner = cells
      .map(cs => `<div class="cell">${renderCell(notebook, cs, enableLiveCoding)}</div>`)
      .join('\n');
    return `<div class="slot-${slotName}">${inner}</div>`;
  };

  switch (slide.layout) {
    case 'title':
      return [
        '        <div class="slide-content slide-content--title">',
        '          ' + renderSlot('title'),
        '          ' + renderSlot('subtitle'),
        '        </div>',
      ].join('\n');

    case 'two-col-h':
      return [
        '        <div class="slide-content">',
        '          ' + renderSlot('heading'),
        '          ' + renderSlot('sub-heading'),
        '          <div class="columns">',
        '            <div class="col">' + renderSlot('left') + '</div>',
        '            <div class="col">' + renderSlot('right') + '</div>',
        '          </div>',
        '        </div>',
      ].join('\n');

    case 'two-col-v':
      return [
        '        <div class="slide-content">',
        '          ' + renderSlot('heading'),
        '          ' + renderSlot('sub-heading'),
        '          <div class="columns" style="flex-direction:column;">',
        '            <div class="col">' + renderSlot('top') + '</div>',
        '            <div class="col">' + renderSlot('bottom') + '</div>',
        '          </div>',
        '        </div>',
      ].join('\n');

    case 'three-row-v':
      return [
        '        <div class="slide-content">',
        '          ' + renderSlot('heading'),
        '          ' + renderSlot('sub-heading'),
        '          <div class="columns" style="flex-direction:column;">',
        '            <div class="col">' + renderSlot('content-1') + '</div>',
        '            <div class="col">' + renderSlot('content-2') + '</div>',
        '            <div class="col">' + renderSlot('content-3') + '</div>',
        '          </div>',
        '        </div>',
      ].join('\n');

    case 'three-row-h':
      return [
        '        <div class="slide-content">',
        '          ' + renderSlot('heading'),
        '          ' + renderSlot('sub-heading'),
        '          <div class="columns">',
        '            <div class="col">' + renderSlot('content-1') + '</div>',
        '            <div class="col">' + renderSlot('content-2') + '</div>',
        '            <div class="col">' + renderSlot('content-3') + '</div>',
        '          </div>',
        '        </div>',
      ].join('\n');

    default: // 'default'
      return [
        '        <div class="slide-content">',
        '          ' + renderSlot('heading'),
        '          ' + renderSlot('sub-heading'),
        '          ' + renderSlot('content'),
        '        </div>',
      ].join('\n');
  }
}


/* ─── Cell Rendering ─────────────────────────────────────────────────────── */

function renderCell(
  notebook: INotebookModel | null,
  cs: CellSlot,
  enableLiveCoding?: boolean
): string {
  if (!notebook) return '';
  const cell = notebook.cells.get(cs.cellIndex);
  if (!cell) return '';

  const source: string =
    (cell as any).sharedModel?.source ?? (cell as any).source ?? '';

  if (cs.cellType === 'markdown') {
    return `<div class="cell-markdown">${renderMarkdown(source)}</div>`;
  }

  if (cs.cellType === 'code') {
    const showInput = cs.include === 'full' || cs.include === 'input-only';
    const showOutput = cs.include === 'full' || cs.include === 'output-only';

    const inputHtml = showInput
      ? `<pre class="cell-code-input"><code class="language-python">${escapeHtml(source)}</code></pre>`
      : '';

    const outputs: any[] = (cell as any).sharedModel?.outputs ?? [];
    const out = renderOutputs(outputs);
    const outputHtml = showOutput
      ? `<div class="cell-code-output">${out}</div>`
      : '';

    const editOverlay = enableLiveCoding
      ? `<button class="cell-edit-btn" title="Edit &amp; Run">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>` +
        `<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` +
        `<div class="cell-code-editor" hidden>` +
        `<textarea class="cell-code-textarea">${escapeHtml(source)}</textarea>` +
        `<div class="cell-code-actions">` +
        `<button class="cell-code-cancel-btn">Cancel</button>` +
        `<button class="cell-code-run-btn">&#9654; Run</button>` +
        `</div></div>`
      : '';

    return `<div class="cell-code-wrapper" data-cell-index="${cs.cellIndex}">${inputHtml}${editOverlay}${outputHtml}</div>`;
  }

  return `<pre>${escapeHtml(source)}</pre>`;
}


/* ─── Markdown Renderer ──────────────────────────────────────────────────── */

function renderMarkdown(source: string): string {
  const lines = source.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Heading
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      out.push(`<h${lvl}>${inlineMarkdown(hMatch[2])}</h${lvl}>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      out.push('<hr>'); i++; continue;
    }

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || 'plaintext';
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]); i++;
      }
      i++; // skip closing ```
      out.push(`<pre><code class="language-${lang}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        items.push(inlineMarkdown(lines[i].replace(/^>\s?/, ''))); i++;
      }
      out.push(`<blockquote><p>${items.join('<br>')}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[\-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-*+]\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^[\-*+]\s/, ''))}</li>`); i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s/, ''))}</li>`); i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Paragraph
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
      para.push(inlineMarkdown(lines[i])); i++;
    }
    if (para.length) out.push(`<p>${para.join('<br>')}</p>`);
  }

  return out.join('\n');
}


function inlineMarkdown(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g,       '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g,            '<em>$1</em>');
  s = s.replace(/_(.+?)_/g,             '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g,           '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}


/* ─── Widget State Extraction ────────────────────────────────────────────── */

function extractWidgetState(notebook: INotebookModel | null): any | null {
  if (!notebook) return null;
  try {
    const meta = notebook.getMetadata('widgets') as any;
    if (meta && meta['application/vnd.jupyter.widget-state+json']) {
      return meta['application/vnd.jupyter.widget-state+json'];
    }
  } catch (_) { /* ignore */ }
  return null;
}

function slidesHaveWidgetOutput(
  slides: SlideViewModel[],
  notebook: INotebookModel | null
): boolean {
  if (!notebook) return false;
  return slides.some(slide =>
    Object.values(slide.slots).some(slots =>
      slots.some(slot => {
        if (slot.cellType !== 'code') return false;
        const cell = notebook.cells.get(slot.cellIndex);
        const outputs: any[] = (cell as any)?.sharedModel?.outputs ?? [];
        return outputs.some(output =>
          !!output?.data?.['application/vnd.jupyter.widget-view+json']
        );
      })
    )
  );
}


/* ─── Utilities ──────────────────────────────────────────────────────────── */

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}
