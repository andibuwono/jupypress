/**
 * Cell Assigner Component - Assign notebook cells to slide slots.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { getCellMeta, setCellMeta, CellJupypressMeta } from '../utils/metadata';


export interface CellAssignerProps {
  slideId: string;
  layout: string;
  notebook: INotebookModel;
  onAssignmentChanged?: () => void;
  onOpenPicker: (slot: string) => void;
  externalVersion?: number;
}

/** Slots available for each layout */
const LAYOUT_SLOTS: Record<string, string[]> = {
  title:          ['title', 'subtitle'],
  default:        ['heading', 'sub-heading', 'content'],
  'two-col-h':    ['heading', 'sub-heading', 'left', 'right'],
  'two-col-v':    ['heading', 'sub-heading', 'top', 'bottom'],
  'three-row-v':  ['heading', 'sub-heading', 'top', 'middle', 'bottom'],
  'three-row-h':  ['heading', 'sub-heading', 'left', 'center', 'right'],
};

const INCLUDE_OPTIONS: { value: NonNullable<CellJupypressMeta['include']>; label: string }[] = [
  { value: 'full',        label: 'Both'   },
  { value: 'input-only',  label: 'Input'  },
  { value: 'output-only', label: 'Output' },
];

export const CellAssigner: React.FC<CellAssignerProps> = ({
  slideId,
  layout,
  notebook,
  onAssignmentChanged,
  onOpenPicker,
  externalVersion = 0,
}) => {
  const slots = LAYOUT_SLOTS[layout] ?? LAYOUT_SLOTS['default'];
  const [version, setVersion] = useState(0);

  const getCellLabel = useCallback((cellIdx: number): string => {
    const cell = notebook?.cells?.get(cellIdx);
    if (!cell) return `Cell ${cellIdx}`;
    try {
      const source = (cell as any).sharedModel?.source ?? (cell as any).source ?? '';
      const text = typeof source === 'string' ? source : '';
      return text.split('\n')[0].substring(0, 40) || `Cell ${cellIdx}`;
    } catch {
      return `Cell ${cellIdx}`;
    }
  }, [notebook]);

  const isCellCode = useCallback((cellIdx: number): boolean => {
    return (notebook?.cells?.get(cellIdx) as any)?.type === 'code';
  }, [notebook]);

  const handleIncludeChange = (cellIdx: number, include: CellJupypressMeta['include']) => {
    const cell = notebook.cells.get(cellIdx);
    if (!cell) return;
    setCellMeta(cell as any, { ...getCellMeta(cell as any), include });
    setVersion((v) => v + 1);
    onAssignmentChanged?.();
  };

  const slotAssignments = useMemo((): Record<string, number[]> => {
    const result: Record<string, number[]> = {};
    for (const slot of slots) result[slot] = [];

    const cellCount = notebook?.cells?.length ?? 0;
    for (let i = 0; i < cellCount; i++) {
      const cell = notebook.cells.get(i)!;
      const meta = getCellMeta(cell as any);
      if (meta.slideId === slideId && meta.slot && slots.includes(meta.slot)) {
        result[meta.slot].push(i);
      }
    }
    for (const slot of slots) {
      result[slot].sort((a, b) => {
        const oa = getCellMeta(notebook.cells.get(a) as any).order ?? 0;
        const ob = getCellMeta(notebook.cells.get(b) as any).order ?? 0;
        return oa - ob;
      });
    }
    return result;
  }, [notebook, slideId, slots, version, externalVersion]);

  const handleUnassign = (cellIdx: number) => {
    const cell = notebook.cells.get(cellIdx);
    if (!cell) return;
    setCellMeta(cell as any, { slideId: undefined, slot: undefined, order: undefined, include: undefined });
    setVersion((v) => v + 1);
    onAssignmentChanged?.();
  };

  return (
    <div className="jp-JupypressCellAssigner">
      <h4>Cell Assignments</h4>
      <div className="jp-JupypressCellAssigner-slots">
        {slots.map((slot) => (
          <div key={slot} className="jp-JupypressCellAssigner-slot">
            <div className="jp-JupypressCellAssigner-slotHeader">
              <span className="jp-JupypressCellAssigner-slotLabel">{slot}</span>
              <button
                className="jp-JupypressCellAssigner-addBtn"
                onClick={() => onOpenPicker(slot)}
                title={`Add cells to ${slot}`}
              >
                + Add cells
              </button>
            </div>
            {slotAssignments[slot].length === 0 && (
              <div className="jp-JupypressCellAssigner-slotEmpty">Empty — click &ldquo;Add cells&rdquo;</div>
            )}
            {slotAssignments[slot].map((cellIdx) => {
              const cellMeta = getCellMeta(notebook.cells.get(cellIdx) as any);
              const include = cellMeta.include ?? 'full';
              return (
                <div key={cellIdx} className="jp-JupypressCellAssigner-assigned">
                  <span className="jp-JupypressCellAssigner-cellPreview">
                    [{cellIdx}] {getCellLabel(cellIdx)}
                  </span>
                  {isCellCode(cellIdx) && (
                    <div className="jp-JupypressCellAssigner-includeToggle">
                      {INCLUDE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          className={include === opt.value ? 'jp-mod-active' : ''}
                          onClick={() => handleIncludeChange(cellIdx, opt.value)}
                          title={opt.label}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="jp-JupypressCellAssigner-unassign"
                    onClick={() => handleUnassign(cellIdx)}
                    title="Remove from slot"
                  >×</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
