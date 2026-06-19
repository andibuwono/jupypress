/**
 * Slide Item Component - Per-slide config: name, layout, cell assignment.
 */

import React, { useState } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { LayoutSelector } from './LayoutSelector';
import { CellAssigner } from './CellAssigner';
import { getCellMeta, setCellMeta } from '../utils/metadata';

/** Modal overlay confirmation dialog */
const LayoutChangeConfirm: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
  <div
    className="jp-JupypressModal-overlay"
    onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
  >
    <div className="jp-JupypressModal-dialog">
      <p className="jp-JupypressConfirm-msg">
        Changing the layout will clear all cell assignments for this slide.
        This cannot be undone.
      </p>
      <div className="jp-JupypressConfirm-actions">
        <button className="jp-JupypressConfirm-cancel" onClick={onCancel}>Cancel</button>
        <button className="jp-JupypressConfirm-ok" onClick={onConfirm}>Continue</button>
      </div>
    </div>
  </div>
);


export interface SlideItemSlide {
  id: string;
  name: string;
  layout: string;
}

export interface SlideItemProps {
  slide: SlideItemSlide;
  notebook: INotebookModel;
  onUpdateSlide: (updates: Partial<SlideItemSlide>) => void;
  onAssignmentChanged?: () => void;
  onOpenPicker: (slot: string) => void;
  externalVersion?: number;
}


export const SlideItem: React.FC<SlideItemProps> = ({
  slide,
  notebook,
  onUpdateSlide,
  onAssignmentChanged,
  onOpenPicker,
  externalVersion = 0,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(slide.name);
  const [pendingLayout, setPendingLayout] = useState<string | null>(null);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      onUpdateSlide({ name: trimmed });
    } else {
      setNameDraft(slide.name);
    }
    setEditingName(false);
  };

  const handleLayoutChange = (newLayout: string) => {
    if (newLayout === slide.layout) return;
    // Check if any cells are currently assigned to this slide
    let hasCells = false;
    const cellCount = notebook?.cells?.length ?? 0;
    for (let i = 0; i < cellCount; i++) {
      const cell = notebook.cells.get(i);
      if (cell && getCellMeta(cell as any).slideId === slide.id) {
        hasCells = true;
        break;
      }
    }
    if (hasCells) {
      setPendingLayout(newLayout);
      return;
    }
    onUpdateSlide({ layout: newLayout });
  };

  const confirmLayoutChange = () => {
    if (!pendingLayout) return;
    const cellCount = notebook?.cells?.length ?? 0;
    for (let i = 0; i < cellCount; i++) {
      const cell = notebook.cells.get(i);
      if (cell && getCellMeta(cell as any).slideId === slide.id) {
        setCellMeta(cell as any, { slideId: undefined, slot: undefined, order: undefined, include: undefined });
      }
    }
    onAssignmentChanged?.();
    onUpdateSlide({ layout: pendingLayout });
    setPendingLayout(null);
  };

  return (
    <div className="jp-JupypressSlideItem">
      {pendingLayout && (
        <LayoutChangeConfirm
          onConfirm={confirmLayoutChange}
          onCancel={() => setPendingLayout(null)}
        />
      )}
      {/* Slide name */}
      <div className="jp-JupypressSlideItem-nameRow">
        {editingName ? (
          <input
            className="jp-JupypressSlideItem-nameInput"
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setNameDraft(slide.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <span
            className="jp-JupypressSlideItem-name jp-JupypressSlideItem-name--editable"
            onClick={() => {
              setNameDraft(slide.name);
              setEditingName(true);
            }}
            title="Click to rename"
          >
            {slide.name}
            <svg className="jp-JupypressSlideItem-editIcon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
        )}
      </div>

      {/* Layout picker */}
      <LayoutSelector
        slide={slide}
        onLayoutChange={handleLayoutChange}
      />

      {/* Cell assignment */}
      <CellAssigner
        slideId={slide.id}
        layout={slide.layout}
        notebook={notebook}
        onAssignmentChanged={onAssignmentChanged}
        onOpenPicker={onOpenPicker}
        externalVersion={externalVersion}
      />
    </div>
  );
};
