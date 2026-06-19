/**
 * Slide view model builder from notebook.
 *
 * Converts notebook metadata + cells into reactive SlideViewModel.
 */

import { INotebookModel } from '@jupyterlab/notebook';
import { getNotebookMeta, getCellMeta } from './metadata';


export interface CellSlot {
  cellIndex: number;
  cellType: string;
  include: 'full' | 'input-only' | 'output-only';
  order: number;
}

export interface SlideViewModel {
  id: string;
  name: string;
  layout: string;
  showHeader: boolean;
  slots: Record<string, CellSlot[]>;
}


/**
 * Build slide view model from notebook model.
 */
export function buildSlideViewModel(notebook: INotebookModel): SlideViewModel[] {
  const meta = getNotebookMeta(notebook);
  const slides: SlideViewModel[] = [];

  for (const slideMeta of meta.slides) {
    const slide: SlideViewModel = {
      id: slideMeta.id,
      name: slideMeta.name,
      layout: slideMeta.layout,
      showHeader: slideMeta.showHeader,
      slots: {},
    };

    // Match cells assigned to this slide
    for (let cellIdx = 0; cellIdx < notebook.cells.length; cellIdx++) {
      const cell = notebook.cells.get(cellIdx)!;
      const cellMeta = getCellMeta(cell as any);

      if (cellMeta.slideId === slide.id) {
        const slotName = cellMeta.slot || 'content';
        const cellSlot: CellSlot = {
          cellIndex: cellIdx,
          cellType: cell.type,
          include: cellMeta.include || 'full',
          order: cellMeta.order || 0,
        };

        if (!slide.slots[slotName]) {
          slide.slots[slotName] = [];
        }
        slide.slots[slotName].push(cellSlot);
      }
    }

    // Sort cells within each slot
    for (const slotCells of Object.values(slide.slots)) {
      slotCells.sort((a, b) => a.order - b.order);
    }

    slides.push(slide);
  }

  return slides;
}
