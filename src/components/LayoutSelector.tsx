/**
 * Layout Selector Component - Visual card picker for 6 layouts.
 */

import React from 'react';


export interface LayoutSelectorProps {
  slide: any;
  onLayoutChange: (layout: string) => void;
}

/* ── Div-based layout preview components (16:9) ─────────────────────── */

const PreviewTitle: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame jp-JupypressLayoutCard-frame--centered">
    <div className="jp-JupypressLayoutCard-titleBar" />
    <div className="jp-JupypressLayoutCard-subtitleBar" />
  </div>
);

const PreviewContent: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame">
    <div className="jp-JupypressLayoutCard-headerBar" />
    <div className="jp-JupypressLayoutCard-contentBlock" />
  </div>
);

const PreviewTwoColH: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame">
    <div className="jp-JupypressLayoutCard-headerBar" />
    <div className="jp-JupypressLayoutCard-columns">
      <div className="jp-JupypressLayoutCard-colBlock" />
      <div className="jp-JupypressLayoutCard-colBlock" />
    </div>
  </div>
);

const PreviewTwoColV: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame">
    <div className="jp-JupypressLayoutCard-headerBar" />
    <div className="jp-JupypressLayoutCard-rowBlock" />
    <div className="jp-JupypressLayoutCard-rowBlock" />
  </div>
);

const PreviewThreeRowV: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame">
    <div className="jp-JupypressLayoutCard-headerBar" />
    <div className="jp-JupypressLayoutCard-rowBlock" />
    <div className="jp-JupypressLayoutCard-rowBlock" />
    <div className="jp-JupypressLayoutCard-rowBlock" />
  </div>
);

const PreviewThreeColH: React.FC = () => (
  <div className="jp-JupypressLayoutCard-frame">
    <div className="jp-JupypressLayoutCard-headerBar" />
    <div className="jp-JupypressLayoutCard-columns">
      <div className="jp-JupypressLayoutCard-colBlock" />
      <div className="jp-JupypressLayoutCard-colBlock" />
      <div className="jp-JupypressLayoutCard-colBlock" />
    </div>
  </div>
);

/* ── Layout definitions ───────────────────────────────────────────────── */

const LAYOUTS = [
  {
    id: 'title',
    name: 'Title',
    description: 'Centered title page',
    slots: ['title', 'subtitle'],
    Preview: PreviewTitle,
  },
  {
    id: 'default',
    name: 'Content',
    description: 'Header + content',
    slots: ['heading', 'sub-heading', 'content'],
    Preview: PreviewContent,
  },
  {
    id: 'two-col-h',
    name: '2-Col Horizontal',
    description: 'Header + 2 columns',
    slots: ['heading', 'sub-heading', 'left', 'right'],
    Preview: PreviewTwoColH,
  },
  {
    id: 'two-col-v',
    name: '2-Col Vertical',
    description: 'Header + 2 rows',
    slots: ['heading', 'sub-heading', 'top', 'bottom'],
    Preview: PreviewTwoColV,
  },
  {
    id: 'three-row-v',
    name: '3-Row Vertical',
    description: 'Header + 3 rows',
    slots: ['heading', 'sub-heading', 'top', 'middle', 'bottom'],
    Preview: PreviewThreeRowV,
  },
  {
    id: 'three-row-h',
    name: '3-Col Horizontal',
    description: 'Header + 3 columns',
    slots: ['heading', 'sub-heading', 'left', 'center', 'right'],
    Preview: PreviewThreeColH,
  },
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  slide,
  onLayoutChange,
}) => {
  const currentLayout = slide?.layout || 'default';

  return (
    <div className="jp-JupypressLayoutSelector">
      <h4>Layout</h4>
      <div className="jp-JupypressLayoutSelector-grid">
        {LAYOUTS.map((layout) => {
          const { Preview } = layout;
          return (
            <div
              key={layout.id}
              className={`jp-JupypressLayoutSelector-card${currentLayout === layout.id ? ' jp-mod-active' : ''}`}
              onClick={() => onLayoutChange(layout.id)}
              title={`${layout.name} — ${layout.description}\nSlots: ${layout.slots.join(', ')}`}
            >
              <div className="jp-JupypressLayoutSelector-preview">
                <Preview />
              </div>
              <div className="jp-JupypressLayoutSelector-name">{layout.name}</div>
              <div className="jp-JupypressLayoutSelector-desc">{layout.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
