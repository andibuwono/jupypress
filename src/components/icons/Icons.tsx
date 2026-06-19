/**
 * JupyPress LabIcon instances.
 *
 * All icons are created via LabIcon so they automatically recolor to match
 * the active JupyterLab theme (jp-icon3 class in SVG fills).
 */

import { LabIcon } from '@jupyterlab/ui-components';

/* ── SVG sources (inline, jp-icon3 class for theme-aware color) ──────── */

const jupypressSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <rect class="jp-icon3" stroke="#616161" fill="none" x="4" y="4.5" width="16" height="10.5" rx="1.6"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M8 19h8"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M12 15v4"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M8 8h4.5"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M8 11h8"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M16 4.5l4 3.5"/>
</svg>`;

const slidesSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect class="jp-icon3" stroke="#616161" fill="none" x="2" y="7" width="20" height="14" rx="2" ry="2"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
</svg>`;

const addSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line class="jp-icon3" stroke="#616161" x1="12" y1="5" x2="12" y2="19"/>
  <line class="jp-icon3" stroke="#616161" x1="5" y1="12" x2="19" y2="12"/>
</svg>`;

const deleteSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="3 6 5 6 21 6"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>`;

const chevronUpSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="18 15 12 9 6 15"/>
</svg>`;

const chevronDownSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="6 9 12 15 18 9"/>
</svg>`;

const exportSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path class="jp-icon3" stroke="#616161" fill="none" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="7 10 12 15 17 10"/>
  <line class="jp-icon3" stroke="#616161" x1="12" y1="15" x2="12" y2="3"/>
</svg>`;

const fullscreenSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path class="jp-icon3" stroke="#616161" fill="none" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
</svg>`;

const saveSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path class="jp-icon3" stroke="#616161" fill="none" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="17 21 17 13 7 13 7 21"/>
  <polyline class="jp-icon3" stroke="#616161" fill="none" points="7 3 7 8 15 8"/>
</svg>`;

const eyeSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path class="jp-icon3" stroke="#616161" fill="none" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle class="jp-icon3" stroke="#616161" fill="none" cx="12" cy="12" r="3"/>
</svg>`;

const editSvgstr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path class="jp-icon3" stroke="#616161" fill="none" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path class="jp-icon3" stroke="#616161" fill="none" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

/* ── LabIcon exports ─────────────────────────────────────────────────── */

export const jupypressIcon = new LabIcon({ name: 'jupypress:brand', svgstr: jupypressSvgstr });
export const slidesIcon = new LabIcon({ name: 'jupypress:slides', svgstr: slidesSvgstr });
export const addIcon = new LabIcon({ name: 'jupypress:add', svgstr: addSvgstr });
export const deleteIcon = new LabIcon({ name: 'jupypress:delete', svgstr: deleteSvgstr });
export const chevronUpIcon = new LabIcon({ name: 'jupypress:chevron-up', svgstr: chevronUpSvgstr });
export const chevronDownIcon = new LabIcon({ name: 'jupypress:chevron-down', svgstr: chevronDownSvgstr });
export const exportIcon = new LabIcon({ name: 'jupypress:export', svgstr: exportSvgstr });
export const fullscreenIcon = new LabIcon({ name: 'jupypress:fullscreen', svgstr: fullscreenSvgstr });
export const saveIcon = new LabIcon({ name: 'jupypress:save', svgstr: saveSvgstr });
export const eyeIcon = new LabIcon({ name: 'jupypress:eye', svgstr: eyeSvgstr });
export const editIcon = new LabIcon({ name: 'jupypress:edit', svgstr: editSvgstr });
