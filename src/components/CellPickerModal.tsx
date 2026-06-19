/**
 * Cell Picker Modal - Multi-select cell assignment dialog.
 * Matches the cell_selection.html reference design using JupyterLab CSS variables.
 */

import React, { useState, useMemo } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { getCellMeta, CellJupypressMeta } from '../utils/metadata';

export type IncludeValue = NonNullable<CellJupypressMeta['include']>;

export interface AssignedCell {
  cellIdx: number;
  include: IncludeValue;
}

export interface CellPickerModalProps {
  slot: string;
  slideId: string;
  notebook: INotebookModel;
  onAssign: (cells: AssignedCell[]) => void;
  onClose: () => void;
}

type FilterType = 'all' | 'markdown' | 'code';

export const CellPickerModal: React.FC<CellPickerModalProps> = ({
  slot,
  slideId,
  notebook,
  onAssign,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selections, setSelections] = useState<Map<number, IncludeValue>>(new Map());

  const getSource = (idx: number): string => {
    const cell = notebook?.cells?.get(idx);
    if (!cell) return '';
    try {
      const src = (cell as any).sharedModel?.source ?? (cell as any).source ?? '';
      return typeof src === 'string' ? src : '';
    } catch { return ''; }
  };

  const getCellType = (idx: number): string =>
    (notebook?.cells?.get(idx) as any)?.type ?? 'markdown';

  /** Cells not yet assigned to any slide */
  const availableCells = useMemo(() => {
    const count = notebook?.cells?.length ?? 0;
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const meta = getCellMeta(notebook.cells.get(i) as any);
      if (!meta.slideId) result.push(i);
    }
    return result;
  }, [notebook, slideId]);

  const filteredCells = useMemo(() => {
    const term = search.trim().toLowerCase();
    return availableCells.filter(idx => {
      const type = getCellType(idx);
      if (filter === 'markdown' && type !== 'markdown') return false;
      if (filter === 'code' && type !== 'code') return false;
      if (term) {
        if (!getSource(idx).toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [availableCells, filter, search]);

  const toggle = (idx: number) => {
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(idx)) next.delete(idx);
      else next.set(idx, 'full');
      return next;
    });
  };

  const setInclude = (idx: number, include: IncludeValue) => {
    setSelections(prev => {
      const next = new Map(prev);
      next.set(idx, include);
      return next;
    });
  };

  const handleAssign = () => {
    const cells: AssignedCell[] = Array.from(selections.entries()).map(
      ([cellIdx, include]) => ({ cellIdx, include })
    );
    onAssign(cells);
  };

  return (
    <div
      className="jp-JupypressCellPicker-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="jp-JupypressCellPicker">

        {/* Header */}
        <div className="jp-JupypressCellPicker-header">
          <h3 className="jp-JupypressCellPicker-title">
            Add cells to <em>{slot}</em>
          </h3>
          <input
            type="text"
            className="jp-JupypressCellPicker-search"
            placeholder="Filter by content…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <button className="jp-JupypressCellPicker-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Filter bar */}
        <div className="jp-JupypressCellPicker-filterBar">
          <div className="jp-JupypressCellPicker-bulk">
            <button onClick={() => {
              const next = new Map<number, IncludeValue>();
              filteredCells.forEach(i => next.set(i, 'full'));
              setSelections(next);
            }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{marginRight:'4px',verticalAlign:'middle'}}>
                <rect x="2" y="2" width="12" height="12" rx="2"/>
                <polyline points="4.5 8 6.5 10.5 11.5 5.5"/>
              </svg>
              Select All
            </button>
            <button onClick={() => setSelections(new Map())}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{marginRight:'4px',verticalAlign:'middle'}}>
                <line x1="4" y1="4" x2="12" y2="12"/>
                <line x1="12" y1="4" x2="4" y2="12"/>
              </svg>
              Clear
            </button>
          </div>
          <div className="jp-JupypressCellPicker-typeFilter">
            <span>Filter:</span>
            {(['all', 'markdown', 'code'] as FilterType[]).map(f => (
              <button
                key={f}
                className={filter === f ? 'jp-mod-active' : ''}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cell list */}
        <div className="jp-JupypressCellPicker-list">
          {filteredCells.length === 0 && (
            <div className="jp-JupypressCellPicker-empty">
              No unassigned cells match your filter.
            </div>
          )}
          {filteredCells.map(idx => {
            const type = getCellType(idx);
            const src = getSource(idx);
            const firstLine = src.split('\n')[0].substring(0, 80) || `Cell ${idx}`;
            const isSelected = selections.has(idx);
            const include = selections.get(idx) ?? 'full';

            return (
              <div
                key={idx}
                className={`jp-JupypressCellPicker-item${isSelected ? ' jp-mod-selected' : ''}`}
                onClick={() => toggle(idx)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(idx)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="jp-JupypressCellPicker-itemBody">
                  <div className="jp-JupypressCellPicker-itemMeta">
                    <span className={`jp-JupypressCellPicker-typeBadge jp-JupypressCellPicker-typeBadge--${type}`}>
                      {type}
                    </span>
                    <span className="jp-JupypressCellPicker-cellIndex">ln [{idx}]</span>
                    {type === 'code' && isSelected && (
                      <div
                        className="jp-JupypressCellPicker-includeToggle"
                        onClick={e => e.stopPropagation()}
                      >
                        {(['full', 'input-only', 'output-only'] as IncludeValue[]).map(v => (
                          <button
                            key={v}
                            className={include === v ? 'jp-mod-active' : ''}
                            onClick={() => setInclude(idx, v)}
                          >
                            {v === 'full' ? 'Both' : v === 'input-only' ? 'Input' : 'Output'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="jp-JupypressCellPicker-preview">{firstLine}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="jp-JupypressCellPicker-footer">
          <div className="jp-JupypressCellPicker-selectionCount">
            {selections.size > 0
              ? `${selections.size} cell${selections.size !== 1 ? 's' : ''} selected → "${slot}"`
              : 'No cells selected'}
          </div>
          <div className="jp-JupypressCellPicker-footerActions">
            <button className="jp-JupypressCellPicker-cancelBtn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="jp-JupypressCellPicker-assignBtn"
              onClick={handleAssign}
              disabled={selections.size === 0}
            >
              Assign to slot
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
