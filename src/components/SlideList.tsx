/**
 * Slide List Component - Add/remove/reorder slides with layout thumbnails.
 */

import React, { useState } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { addIcon, deleteIcon, chevronUpIcon, chevronDownIcon } from './icons/Icons';
import { getCellMeta } from '../utils/metadata';

const AddIcon = addIcon.react;
const DeleteIcon = deleteIcon.react;
const ChevronUpIcon = chevronUpIcon.react;
const ChevronDownIcon = chevronDownIcon.react;

const THUMB_SLOTS: Record<string, string[]> = {
  title:         ['title', 'subtitle'],
  default:       ['heading', 'sub-heading', 'content'],
  'two-col-h':   ['heading', 'sub-heading', 'left', 'right'],
  'two-col-v':   ['heading', 'sub-heading', 'top', 'bottom'],
  'three-row-v': ['heading', 'sub-heading', 'top', 'middle', 'bottom'],
  'three-row-h': ['heading', 'sub-heading', 'left', 'center', 'right'],
};

function getFilledSlots(notebook: INotebookModel | undefined, slideId: string): Set<string> {
  const filled = new Set<string>();
  if (!notebook) return filled;
  const count = notebook.cells.length;
  for (let i = 0; i < count; i++) {
    const cell = notebook.cells.get(i);
    if (!cell) continue;
    const meta = getCellMeta(cell as any);
    if (meta.slideId === slideId && meta.slot) filled.add(meta.slot);
  }
  return filled;
}

interface SlotBlockProps { filled: boolean; style?: React.CSSProperties }
const SlotBlock: React.FC<SlotBlockProps> = ({ filled, style }) => (
  <div className={filled ? 'jp-JupypressSlideThumb-filled' : 'jp-JupypressSlideThumb-empty'} style={style} />
);

interface LayoutThumbProps { layout: string; filledSlots: Set<string> }
const LayoutThumb: React.FC<LayoutThumbProps> = ({ layout, filledSlots }) => {
  const f = (slot: string) => filledSlots.has(slot);

  if (layout === 'title') {
    return (
      <div className="jp-JupypressLayoutCard-frame jp-JupypressLayoutCard-frame--centered">
        <SlotBlock filled={f('title')} style={{ width: '62%', height: '8px' }} />
        <SlotBlock filled={f('subtitle')} style={{ width: '42%', height: '5px' }} />
      </div>
    );
  }
  if (layout === 'two-col-h' || layout === 'three-row-h') {
    const contentSlots = layout === 'two-col-h'
      ? [['left', 'right']]
      : [['left', 'center', 'right']];
    return (
      <div className="jp-JupypressLayoutCard-frame">
        <SlotBlock filled={f('heading')} style={{ height: '6px', flexShrink: 0 }} />
        <div className="jp-JupypressLayoutCard-columns" style={{ flex: 1 }}>
          {contentSlots[0].map(slot => <SlotBlock key={slot} filled={f(slot)} />)}
        </div>
      </div>
    );
  }
  if (layout === 'two-col-v') {
    return (
      <div className="jp-JupypressLayoutCard-frame">
        <SlotBlock filled={f('heading')} style={{ height: '6px', flexShrink: 0 }} />
        <SlotBlock filled={f('top')} />
        <SlotBlock filled={f('bottom')} />
      </div>
    );
  }
  if (layout === 'three-row-v') {
    return (
      <div className="jp-JupypressLayoutCard-frame">
        <SlotBlock filled={f('heading')} style={{ height: '6px', flexShrink: 0 }} />
        <SlotBlock filled={f('top')} />
        <SlotBlock filled={f('middle')} />
        <SlotBlock filled={f('bottom')} />
      </div>
    );
  }
  // default: header + content
  return (
    <div className="jp-JupypressLayoutCard-frame">
      <SlotBlock filled={f('heading')} style={{ height: '6px', flexShrink: 0 }} />
      <SlotBlock filled={f('content')} />
    </div>
  );
};


export interface SlideListProps {
  slides: any[];
  selectedSlide: string | null;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: () => void;
  onRemoveSlide: (slideId: string) => void;
  onMoveSlide: (slideId: string, direction: 'up' | 'down') => void;
  notebookName?: string;
  notebookPath?: string;
  notebook?: INotebookModel;
}


export const SlideList: React.FC<SlideListProps> = ({
  slides,
  selectedSlide,
  onSelectSlide,
  onAddSlide,
  onRemoveSlide,
  onMoveSlide,
  notebookName,
  notebookPath,
  notebook,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onRemoveSlide(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="jp-JupypressEditor-slideList">
      {pendingDeleteId && (
        <div
          className="jp-JupypressModal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setPendingDeleteId(null); }}
        >
          <div className="jp-JupypressModal-dialog">
            <p className="jp-JupypressConfirm-msg">
              Delete this slide? All cell assignments for it will be cleared. This cannot be undone.
            </p>
            <div className="jp-JupypressConfirm-actions">
              <button className="jp-JupypressConfirm-cancel" onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button className="jp-JupypressConfirm-ok" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Notebook identity */}
      <div className="jp-JupypressEditor-slideList-identity">
        <div className="jp-JupypressEditor-notebookName">{notebookName ?? 'Notebook'}</div>
        {notebookPath && (
          <div className="jp-JupypressEditor-notebookPath">{notebookPath}</div>
        )}
      </div>
      <div className="jp-JupypressEditor-slideList-items">
        {slides.length === 0 && (
          <div className="jp-JupypressEditor-slideList-empty">
            <p>No slides yet.</p>
            <button onClick={onAddSlide}>+ Add first slide</button>
          </div>
        )}
        {slides.map((slide: any, idx: number) => {
          const isSelected = selectedSlide === slide.id;
          const filledSlots = getFilledSlots(notebook, slide.id);
          const allSlots = THUMB_SLOTS[slide.layout] ?? THUMB_SLOTS['default'];
          const totalContent = allSlots.filter(s => s !== 'heading' && s !== 'sub-heading').length;
          const filledContent = allSlots.filter(s => s !== 'heading' && s !== 'sub-heading' && filledSlots.has(s)).length;
          const hasUnfilled = filledContent < totalContent;
          return (
            <div
              key={slide.id}
              className={`jp-JupypressEditor-slideList-item${isSelected ? ' jp-mod-selected' : ''}`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <div className="jp-JupypressSlideList-itemHeader">
                <span className="jp-JupypressEditor-slideList-name">
                  {idx + 1}. {slide.name}
                </span>
                {hasUnfilled && (
                  <span className="jp-JupypressSlideList-unfilledBadge" title="Some slots have no cells assigned">!</span>
                )}
              </div>
              <div className="jp-JupypressSlideList-thumbnail">
                <LayoutThumb layout={slide.layout || 'default'} filledSlots={filledSlots} />
              </div>
              <div className="jp-JupypressEditor-slideList-itemActions">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveSlide(slide.id, 'up'); }}
                  title="Move up"
                >
                  <ChevronUpIcon tag="span" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveSlide(slide.id, 'down'); }}
                  title="Move down"
                >
                  <ChevronDownIcon tag="span" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDeleteId(slide.id); }}
                  title="Delete slide"
                >
                  <DeleteIcon tag="span" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="jp-JupypressEditor-slideList-footer">
        <button className="jp-JupypressEditor-slideList-addSlideBtn" onClick={onAddSlide}>
          <AddIcon tag="span" />
          Add Slide
        </button>
      </div>
    </div>
  );
};
