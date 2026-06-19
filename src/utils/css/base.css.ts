/**
 * Base Framework CSS — HTML Presentation Framework.
 * Source: jupypress/templates/static/css/base.css
 * Exported as a TypeScript constant for inlining in generated HTML.
 */

export const baseCss = `
/* ==========================================================================
   Base Framework CSS — HTML Presentation Framework
   Provides: letterbox shell, slide frame, layouts, UI overlay, accessibility
   ========================================================================== */

/* ---------- Reset & Box Model ---------- */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ---------- Letterbox Shell ---------- */

html, body {
  height: 100%;
  overflow: hidden;
  background: var(--letterbox-bg, #1a1a2e);
}

.letterbox {
  position: fixed;
  inset: 0;
  background: var(--letterbox-bg, #1a1a2e);
  overflow: hidden;
}

/* ---------- Slide Frame ---------- */

.slide-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 1200px;
  height: 675px;
  transform-origin: 0 0;
  overflow: hidden;
}

/* ---------- Slide Visibility ---------- */

.slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide[hidden] {
  display: none !important;
}

/* ---------- Slide Layout: Default ---------- */

.slide--default .slide-content {
  padding: 48px 60px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ---------- Slide Layout: Title ---------- */

.slide--title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide--title .slide-content,
.slide--title .slide-content--title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  padding: 48px 80px;
}

/* ---------- Slide Layout: Two-Column ---------- */

.slide--two-col .slide-content {
  padding: 48px 60px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slide--two-col .columns {
  display: flex;
  gap: 40px;
  flex: 1;
  min-height: 0;
}

.slide--two-col .col {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ---------- Slide Layout: Three-Row ---------- */

.slide--three-row .slide-content {
  padding: 48px 60px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slide--three-row .columns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.slide--three-row .col {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ---------- Slide Layout: Three-Column ---------- */

.slide--three-col .slide-content {
  padding: 48px 60px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slide--three-col .columns {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.slide--three-col .col {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ---------- Slot Layout ---------- */

/* Heading slots: fixed height, don't grow */
.slide-content > .slot-heading,
.slide-content > .slot-sub-heading {
  flex: 0 0 auto;
}

/* Content slot: fills remaining space */
.slide-content > .slot-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* Title slide slots */
.slide-content--title > .slot-title,
.slide-content--title > .slot-subtitle {
  flex: 0 0 auto;
}

/* Cell spacing */
.cell {
  margin-bottom: 8px;
}

/* ---------- Code Cell Edit/Run Overlay ---------- */

.cell-code-wrapper {
  position: relative;
}

.cell-code-output {
  margin-top: 4px;
}

.cell-edit-btn {
  display: none;
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(30,30,30,0.65);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 7px;
  cursor: pointer;
  z-index: 5;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  line-height: 1;
}

.cell-code-wrapper:hover .cell-edit-btn:not([hidden]) {
  display: flex;
}

.cell-edit-btn svg {
  width: 13px;
  height: 13px;
}

.cell-edit-btn:hover {
  background: rgba(0,0,0,0.85);
}

.cell-code-editor {
  position: relative;
  z-index: 10;
  margin-top: 4px;
  background: var(--bg-slide, #fff);
  border: 2px solid var(--color-accent, #e57200);
  border-radius: 5px;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}

.cell-code-textarea {
  width: 100%;
  min-height: 70px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.82em;
  line-height: 1.45;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  resize: vertical;
  box-sizing: border-box;
  background: var(--code-bg, #f6f8fa);
  color: var(--code-text, #24292e);
}

.cell-code-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}

.cell-code-run-btn {
  background: var(--color-accent, #e57200);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 14px;
  cursor: pointer;
  font-size: 0.82em;
  font-weight: 600;
}

.cell-code-run-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cell-code-cancel-btn {
  background: none;
  border: 1px solid var(--border, #ccc);
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.82em;
  color: var(--text-body, #333);
}

.cell-output-stream,
.cell-output--stream {
  white-space: pre-wrap;
  margin: 0;
  font-size: 0.82em;
}

.cell-output-error,
.cell-output--error {
  color: #c0392b;
  white-space: pre-wrap;
  margin: 0;
  font-size: 0.8em;
}

/* ---------- Slide UI Overlay ----------
   Navigation arrows on sides, toolbar at bottom.
   Appears on hover / mouse move, auto-hides after 2s idle.
   ------------------------------------------------------------------ */

.slide-ui {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.slide-frame:hover .slide-ui,
.slide-ui.slide-ui--visible {
  opacity: 1;
}

/* Navigation arrows — left/right edges */
.slide-ui__btn {
  pointer-events: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ui-btn-color, rgba(0,0,0,0.35));
  transition: color 0.2s, background 0.2s, opacity 0.2s;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-ui__btn:hover {
  color: var(--ui-btn-hover, rgba(0,0,0,0.7));
}

.slide-ui__btn--prev,
.slide-ui__btn--next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 64px;
  border-radius: 8px;
  background: var(--ui-btn-bg, rgba(255,255,255,0.6));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.slide-ui__btn--prev:hover,
.slide-ui__btn--next:hover {
  background: var(--ui-btn-bg-hover, rgba(255,255,255,0.85));
}

.slide-ui__btn--prev {
  left: 12px;
}

.slide-ui__btn--next {
  right: 12px;
}

.slide-ui__btn svg {
  width: 22px;
  height: 22px;
}

/* Bottom toolbar — progress + fullscreen + theme toggle */
.slide-ui__toolbar {
  pointer-events: auto;
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ui-toolbar-bg, rgba(255,255,255,0.7));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 6px 16px;
  border: 1px solid var(--ui-toolbar-border, rgba(0,0,0,0.08));
}

/* Home button */
.slide-ui__btn--home {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.slide-ui__btn--home:hover {
  background: var(--ui-btn-inline-hover, rgba(0,0,0,0.06));
}

.slide-ui__btn--home svg {
  width: 16px;
  height: 16px;
}

/* Slide picker */
.slide-picker {
  position: relative;
}

.slide-picker__trigger {
  pointer-events: auto;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}

.slide-picker__trigger:hover {
  background: var(--ui-btn-inline-hover, rgba(0,0,0,0.06));
}

.slide-picker__trigger .progress {
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-progress-color, rgba(0,0,0,0.65));
  pointer-events: none;
  user-select: none;
  font-family: -apple-system, "Segoe UI", sans-serif;
  padding: 0;
  letter-spacing: 0.01em;
}

.slide-picker__caret {
  width: 14px;
  height: 14px;
  color: var(--ui-btn-color, rgba(0,0,0,0.35));
  transition: transform 0.2s;
}

.slide-picker.slide-picker--open .slide-picker__caret {
  transform: rotate(180deg);
}

.slide-picker__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 210px;
  max-height: 320px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--picker-bg, rgba(255,255,255,0.97));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--picker-border, rgba(0,0,0,0.12));
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

.slide-picker__menu::-webkit-scrollbar {
  width: 6px;
}

.slide-picker__menu::-webkit-scrollbar-track {
  background: transparent;
}

.slide-picker__menu::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}

.slide-picker__menu::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.25);
}

.slide-picker__menu[hidden] {
  display: none;
}

.slide-picker__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 7px;
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--picker-text, rgba(0,0,0,0.75));
  text-align: left;
  transition: background 0.15s;
}

.slide-picker__item:hover {
  background: var(--picker-hover, rgba(0,0,0,0.06));
}

.slide-picker__item.slide-picker__item--active {
  background: var(--color-primary-soft, rgba(230,57,70,0.1));
  color: var(--color-primary, #e63946);
  font-weight: 700;
}

.slide-picker__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--picker-num-bg, rgba(0,0,0,0.06));
  font-family: -apple-system, "Segoe UI", sans-serif;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  color: var(--picker-text, rgba(0,0,0,0.6));
}

.slide-picker__item--active .slide-picker__num {
  background: var(--color-primary, #e63946);
  color: #fff;
}

.slide-picker__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fullscreen + theme buttons */
.slide-ui__btn--fullscreen,
.slide-ui__btn--theme {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.slide-ui__btn--fullscreen:hover,
.slide-ui__btn--theme:hover {
  background: var(--ui-btn-inline-hover, rgba(0,0,0,0.06));
}

.slide-ui__btn--fullscreen svg,
.slide-ui__btn--theme svg {
  width: 16px;
  height: 16px;
}

/* Font scale control */
.slide-ui__font-scale {
  display: flex;
  align-items: center;
  gap: 2px;
}

.slide-ui__btn--font-down,
.slide-ui__btn--font-up {
  width: 26px;
  height: 26px;
  border-radius: 5px;
}

.slide-ui__btn--font-down:hover,
.slide-ui__btn--font-up:hover {
  background: var(--ui-btn-inline-hover, rgba(0,0,0,0.06));
}

.slide-ui__btn--font-down svg,
.slide-ui__btn--font-up svg {
  width: 14px;
  height: 14px;
}

.slide-ui__font-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-progress-color, rgba(0,0,0,0.55));
  min-width: 36px;
  text-align: center;
  font-family: -apple-system, "Segoe UI", sans-serif;
  user-select: none;
}

/* Hide the old standalone progress (replaced by toolbar) */
.slide-frame > .progress {
  display: none;
}

/* ---------- Accessibility: Screen-Reader Only ---------- */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ---------- Kernel Connection Indicator ---------- */

.kernel-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.kernel-indicator.kernel-indicator--visible {
  opacity: 1;
  pointer-events: auto;
}

.kernel-indicator__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18);
}

.kernel-indicator__label {
  display: none;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  font-family: -apple-system, "Segoe UI", sans-serif;
  letter-spacing: 0.02em;
}

.kernel-indicator:hover .kernel-indicator__label {
  display: block;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 6px;
  padding: 6px 10px;
  white-space: nowrap;
  z-index: 26;
}

/* ---------- Code & Content Styling ---------- */

code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

pre {
  overflow-x: auto;
  background: var(--bg-alt, #f5f5f5);
  padding: 1em;
  border-radius: 6px;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

p {
  margin-bottom: 0.5em;
  line-height: 1.6;
}

ul, ol {
  margin-left: 2em;
  margin-bottom: 0.5em;
}
`;
