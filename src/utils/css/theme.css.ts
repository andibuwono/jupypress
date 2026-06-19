/**
 * Default slide theme for JupyPress.
 * Clean, modern, professional — designed for 1200×675 px slides.
 */

export const defaultThemeCss = `
/* ── Google Fonts ───────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── CSS Variables ──────────────────────────────────────────── */
:root {
  --color-primary:       #e63946;
  --color-primary-soft:  rgba(230, 57, 70, 0.10);
  --color-accent:        #457b9d;
  --color-accent-soft:   rgba(69, 123, 157, 0.12);
  --letterbox-bg:        #16213e;

  /* Light theme (default) */
  --bg-slide:     #ffffff;
  --bg-alt:       #f6f7fb;
  --text-heading: #1a1a2e;
  --text-body:    #2d2d44;
  --text-muted:   #7878a0;
  --border:       rgba(0, 0, 0, 0.06);
  --code-bg:      #f3f4f8;
  --code-text:    #2d2d44;
  --output-bg:    #fafbfc;
  --output-border:rgba(0, 0, 0, 0.07);

  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

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

  /* Dark nav UI */
  --ui-btn-bg:          rgba(30, 30, 50, 0.7);
  --ui-btn-bg-hover:    rgba(30, 30, 50, 0.9);
  --ui-btn-color:       rgba(255,255,255,0.5);
  --ui-btn-hover:       rgba(255,255,255,0.9);
  --ui-toolbar-bg:      rgba(20, 20, 38, 0.85);
  --ui-toolbar-border:  rgba(255,255,255,0.08);
  --ui-progress-color:  rgba(255,255,255,0.7);
  --ui-btn-inline-hover:rgba(255,255,255,0.08);
  --picker-bg:          rgba(20, 20, 38, 0.97);
  --picker-border:      rgba(255,255,255,0.12);
  --picker-text:        rgba(255,255,255,0.8);
  --picker-hover:       rgba(255,255,255,0.07);
  --picker-num-bg:      rgba(255,255,255,0.10);
}

/* ── Base Slide ─────────────────────────────────────────────── */
.slide {
  background: var(--bg-slide);
  font-family: var(--font-body);
  color: var(--text-body);
}

/* ═══════════════════════════════════════════════════════════════
   TITLE SLIDE
   ═══════════════════════════════════════════════════════════════ */

.slide--title .slide-content--title {
  background: var(--bg-slide);
  position: relative;
  overflow: hidden;
  gap: 0;
}

/* Ambient glow decorations */
.slide--title .slide-content--title::before,
.slide--title .slide-content--title::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.slide--title .slide-content--title::before {
  width: 600px; height: 600px;
  top: -220px; right: -180px;
  background: radial-gradient(circle, var(--color-primary-soft) 0%, transparent 65%);
}
.slide--title .slide-content--title::after {
  width: 400px; height: 400px;
  bottom: -140px; left: -100px;
  background: radial-gradient(circle, var(--color-accent-soft) 0%, transparent 65%);
}

.slot-title,
.slot-subtitle {
  position: relative;
  z-index: 1;
}

/* Title text — h1 */
.slot-title .cell-markdown h1 {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.04em;
  color: var(--text-heading);
  margin: 0;
}

/* Gradient accent bar under title */
.slot-title::after {
  content: '';
  display: block;
  width: 88px;
  height: 5px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  margin: 16px auto 0;
}

/* Subtitle text */
.slot-subtitle .cell-markdown p,
.slot-subtitle .cell-markdown h2,
.slot-subtitle .cell-markdown h3 {
  font-size: 1.45rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 14px 0 0;
  letter-spacing: -0.01em;
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE HEADING & SUB-HEADING (default / two-col / three-row)
   ═══════════════════════════════════════════════════════════════ */

.slot-heading .cell-markdown h1,
.slot-heading .cell-markdown h2 {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--text-heading);
  margin: 0;
  padding-bottom: 14px;
  border-bottom: 3px solid var(--color-primary);
}

.slot-sub-heading .cell-markdown p,
.slot-sub-heading .cell-markdown h3,
.slot-sub-heading .cell-markdown h4 {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-muted);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ═══════════════════════════════════════════════════════════════
   BODY TEXT
   ═══════════════════════════════════════════════════════════════ */

/* All content slots share the same body text rules */
.slot-content .cell-markdown p,
.slot-left   .cell-markdown p,
.slot-right  .cell-markdown p,
.slot-top    .cell-markdown p,
.slot-bottom .cell-markdown p,
.slot-content-1 .cell-markdown p,
.slot-content-2 .cell-markdown p,
.slot-content-3 .cell-markdown p {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-body);
  margin-bottom: 0.65em;
}

.cell-markdown h1 { font-size: 1.85rem; font-weight: 700; color: var(--text-heading); letter-spacing: -0.02em; margin-bottom: 0.4em; }
.cell-markdown h2 { font-size: 1.5rem;  font-weight: 700; color: var(--text-heading); margin-bottom: 0.35em; }
.cell-markdown h3 { font-size: 1.2rem;  font-weight: 600; color: var(--color-accent); margin-bottom: 0.3em; }
.cell-markdown h4 { font-size: 1.0rem;  font-weight: 600; color: var(--text-body);    margin-bottom: 0.25em; }

.cell-markdown ul,
.cell-markdown ol {
  padding-left: 1.5em;
  margin-bottom: 0.65em;
  color: var(--text-body);
}

.cell-markdown li {
  font-size: 1.1rem;
  line-height: 1.65;
  margin-bottom: 0.22em;
}

.cell-markdown strong { font-weight: 700; color: var(--text-heading); }
.cell-markdown em     { font-style: italic; color: var(--text-muted); }

.cell-markdown a {
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid rgba(69,123,157,0.3);
}
.cell-markdown a:hover { border-bottom-color: var(--color-accent); }

.cell-markdown blockquote {
  border-left: 4px solid var(--color-primary);
  padding: 0.5em 1.2em;
  color: var(--text-muted);
  background: var(--color-primary-soft);
  border-radius: 0 8px 8px 0;
  margin: 0.8em 0;
  font-style: italic;
}

.cell-markdown hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.9em 0;
}

/* Inline code in markdown */
.cell-markdown code {
  font-family: var(--font-mono);
  font-size: 0.87em;
  background: var(--code-bg);
  color: var(--color-primary);
  border-radius: 4px;
  padding: 0.12em 0.4em;
}

/* Fenced code block inside markdown */
.cell-markdown pre {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0.6em 0;
}

.cell-markdown pre code {
  background: none;
  color: var(--code-text);
  font-size: 0.9rem;
  padding: 0;
  border-radius: 0;
}

/* ═══════════════════════════════════════════════════════════════
   CELL: CODE INPUT
   ═══════════════════════════════════════════════════════════════ */

.cell-code-input {
  background: var(--code-bg);
  color: var(--code-text);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 10px 10px 0;
  padding: 14px 18px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.65;
  white-space: pre;
  overflow-x: auto;
  margin: 6px 0;
}

/* ═══════════════════════════════════════════════════════════════
   CELL: OUTPUT
   ═══════════════════════════════════════════════════════════════ */

.cell-output-stream,
.cell-output-text {
  background: var(--output-bg);
  border: 1px solid var(--output-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--text-muted);
  margin: 4px 0;
}

.cell-output-error {
  background: rgba(230, 57, 70, 0.05);
  border: 1px solid rgba(230, 57, 70, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--color-primary);
  margin: 4px 0;
}

.cell-output-image {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
  margin: 4px 0;
  display: block;
}

.cell-output-html {
  margin: 4px 0;
}

/* ═══════════════════════════════════════════════════════════════
   MULTI-COLUMN DIVIDERS
   ═══════════════════════════════════════════════════════════════ */

.slide--two-col .columns .col + .col {
  border-left: 1px solid var(--border);
  padding-left: 32px;
}

/* ═══════════════════════════════════════════════════════════════
   HIGHLIGHT.JS DARK MODE OVERRIDE
   ═══════════════════════════════════════════════════════════════ */

[data-theme="dark"] .hljs {
  background: var(--code-bg);
  color: #abb2bf;
}

.hljs {
  background: var(--code-bg);
  color: var(--code-text);
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-literal {
  color: #d73a49;
}

.hljs-string,
.hljs-doctag {
  color: #032f62;
}

.hljs-number,
.hljs-attr {
  color: #005cc5;
}

.hljs-built_in,
.hljs-title.function_ {
  color: #6f42c1;
}

.hljs-comment {
  color: #6a737d;
}

[data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-selector-tag,
[data-theme="dark"] .hljs-literal {
  color: #ff7b72;
}

[data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-doctag {
  color: #a5d6ff;
}

[data-theme="dark"] .hljs-number,
[data-theme="dark"] .hljs-attr {
  color: #79c0ff;
}

[data-theme="dark"] .hljs-built_in,
[data-theme="dark"] .hljs-title.function_ {
  color: #d2a8ff;
}

[data-theme="dark"] .hljs-comment {
  color: #8b949e;
}
`;
