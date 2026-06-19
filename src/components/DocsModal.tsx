/**
 * DocsModal - Explains the JupyPress workflow to the user.
 */

import React from 'react';

export interface DocsModalProps {
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ onClose }) => (
  <div
    className="jp-JupypressDocsModal"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="jp-JupypressDocsModal-content">
      <div className="jp-JupypressDocsModal-header">
        <h3>JupyPress — How it works</h3>
        <button className="jp-JupypressDocsModal-close" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="jp-JupypressDocsModal-body">

        <section className="jp-JupypressDocsModal-section">
          <h4>Overview</h4>
          <p>
            JupyPress turns your Jupyter notebook into a live slide presentation. Each slide is built
            by assigning existing notebook cells (markdown or code) to layout slots — no copy-pasting needed.
            Changes in the notebook are instantly reflected in the preview.
          </p>
        </section>

        <section className="jp-JupypressDocsModal-section">
          <h4>Step-by-step workflow</h4>
          <ol>
            <li><strong>Add slides</strong> — Click <em>Add Slide</em> in the left panel. Each slide is independent.</li>
            <li><strong>Pick a layout</strong> — Choose from 6 layout presets (Title, Content, 2-column, 3-column, etc.).</li>
            <li><strong>Assign cells</strong> — For each slot (e.g. <em>heading</em>, <em>content</em>), click <em>+ Add cells</em> to open the cell picker. Select one or more cells from your notebook.</li>
            <li><strong>Preview</strong> — The right panel updates automatically as you assign cells or edit notebook content.</li>
            <li><strong>Export</strong> — Click <em>Export</em> to download a self-contained HTML file, or <em>Present</em> to open in a new browser tab.</li>
          </ol>
        </section>

        <section className="jp-JupypressDocsModal-section">
          <h4>Layout types &amp; slots</h4>
          <table className="jp-JupypressDocsModal-table">
            <thead>
              <tr><th>Layout</th><th>Slots</th></tr>
            </thead>
            <tbody>
              <tr><td><code>Title</code></td><td>title, subtitle</td></tr>
              <tr><td><code>Content</code></td><td>heading *, sub-heading *, content</td></tr>
              <tr><td><code>2-Col Horizontal</code></td><td>heading *, sub-heading *, left, right</td></tr>
              <tr><td><code>2-Col Vertical</code></td><td>heading *, sub-heading *, top, bottom</td></tr>
              <tr><td><code>3-Row Vertical</code></td><td>heading *, sub-heading *, top, middle, bottom</td></tr>
              <tr><td><code>3-Col Horizontal</code></td><td>heading *, sub-heading *, left, center, right</td></tr>
            </tbody>
          </table>
          <p className="jp-JupypressDocsModal-note">* <em>heading</em> and <em>sub-heading</em> are optional — the band is hidden if empty.</p>
        </section>

        <section className="jp-JupypressDocsModal-section">
          <h4>Cell inclusion modes (code cells)</h4>
          <p>When assigning a code cell you can choose:</p>
          <ul>
            <li><strong>Both</strong> — Show code input and output.</li>
            <li><strong>Input only</strong> — Show code, hide output.</li>
            <li><strong>Output only</strong> — Hide code, show output (charts, tables, images).</li>
          </ul>
          <p>A single cell can only be assigned once across the whole presentation, but a slot can hold multiple cells.</p>
        </section>

        <section className="jp-JupypressDocsModal-section">
          <h4>Themes</h4>
          <p>
            Open the <em>Theme</em> modal (⚙ icon) to choose a built-in theme or write custom CSS using
            JupyterLab CSS variables. Custom CSS is saved inside the notebook metadata so it travels with the file.
          </p>
        </section>

        <section className="jp-JupypressDocsModal-section">
          <h4>Tips</h4>
          <ul>
            <li>Click the slide name to rename it inline.</li>
            <li>Drag/reorder slides with the ▲▼ arrows in the slide list.</li>
            <li>Changing a slide&apos;s layout will clear its cell assignments — you will be warned first.</li>
            <li>The <em>Present</em> button opens the presentation in a new browser tab for fullscreen display.</li>
          </ul>
        </section>

      </div>
    </div>
  </div>
);
