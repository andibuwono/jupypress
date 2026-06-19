/**
 * Metadata utilities for managing jupypress cell and notebook metadata.
 */

import { INotebookModel } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';


export interface NotebookJupypressMeta {
  version: string;
  slides: SlideMetadata[];
  globalTheme?: string;
  customCss?: string;
  liveCodingEnabled?: boolean;
}

export interface SlideMetadata {
  id: string;
  name: string;
  layout: string;
  showHeader: boolean;
  showSubHeader?: boolean;
}

export interface CellJupypressMeta {
  slideId?: string;
  slot?: string;
  order?: number;
  include?: 'full' | 'input-only' | 'output-only';
}


/**
 * Get jupypress metadata from notebook.
 */
export function getNotebookMeta(notebook: INotebookModel): NotebookJupypressMeta {
  const jupypressData = notebook.getMetadata('jupypress');
  return (jupypressData as NotebookJupypressMeta) || {
    version: '1',
    slides: [],
  };
}


/**
 * Set jupypress metadata on notebook.
 */
export function setNotebookMeta(
  notebook: INotebookModel,
  data: Partial<NotebookJupypressMeta>
): void {
  const current = getNotebookMeta(notebook);
  const updated = { ...current, ...data };
  notebook.setMetadata('jupypress', updated);
}


/**
 * Get jupypress metadata from cell.
 */
export function getCellMeta(cell: ICellModel): CellJupypressMeta {
  const jupypressData = cell.getMetadata('jupypress');
  return (jupypressData as CellJupypressMeta) || {};
}


/**
 * Set jupypress metadata on cell.
 */
export function setCellMeta(
  cell: ICellModel,
  data: Partial<CellJupypressMeta>
): void {
  const current = getCellMeta(cell);
  const updated = { ...current, ...data };
  cell.setMetadata('jupypress', updated);
}
