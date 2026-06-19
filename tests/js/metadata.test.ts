/**
 * Tests for metadata utility functions.
 */

import { getNotebookMeta, setNotebookMeta, getCellMeta, setCellMeta } from '../../src/utils/metadata';

/** Create a mock model (notebook or cell) backed by a Map */
function makeMockModel(initial: Record<string, any> = {}): any {
  const store = new Map<string, any>(Object.entries(initial));
  return {
    getMetadata: (key: string) => store.get(key),
    setMetadata: (key: string, value: any) => { store.set(key, value); },
    _store: store,
  };
}

describe('metadata utilities', () => {
  it('should get notebook meta', () => {
    const mockNotebook = makeMockModel({ jupypress: { version: '1', slides: [] } });

    const meta = getNotebookMeta(mockNotebook);
    expect(meta.version).toBe('1');
    expect(meta.slides).toEqual([]);
  });

  it('should return default notebook meta when missing', () => {
    const mockNotebook = makeMockModel();

    const meta = getNotebookMeta(mockNotebook);
    expect(meta.version).toBe('1');
    expect(meta.slides).toEqual([]);
  });

  it('should set notebook meta', () => {
    const mockNotebook = makeMockModel();

    setNotebookMeta(mockNotebook, { version: '1', slides: [] });
    const meta = getNotebookMeta(mockNotebook);
    expect(meta.version).toBe('1');
  });

  it('should merge notebook meta on set', () => {
    const mockNotebook = makeMockModel({
      jupypress: { version: '1', slides: [], globalTheme: 'dark' },
    });

    setNotebookMeta(mockNotebook, { globalTheme: 'light' });
    const meta = getNotebookMeta(mockNotebook);
    expect(meta.globalTheme).toBe('light');
    expect(meta.version).toBe('1');
  });

  it('should get cell meta', () => {
    const mockCell = makeMockModel({
      jupypress: { slideId: 'slide-1', slot: 'title', order: 2 },
    });

    const meta = getCellMeta(mockCell);
    expect(meta.slideId).toBe('slide-1');
    expect(meta.slot).toBe('title');
    expect(meta.order).toBe(2);
  });

  it('should return empty object when cell meta missing', () => {
    const mockCell = makeMockModel();

    const meta = getCellMeta(mockCell);
    expect(meta).toEqual({});
  });

  it('should set cell meta', () => {
    const mockCell = makeMockModel();

    setCellMeta(mockCell, { slideId: 'slide-1', slot: 'content', order: 0 });
    const meta = getCellMeta(mockCell);
    expect(meta.slideId).toBe('slide-1');
    expect(meta.slot).toBe('content');
    expect(meta.order).toBe(0);
  });

  it('should merge cell meta on set', () => {
    const mockCell = makeMockModel({
      jupypress: { slideId: 'slide-1', slot: 'content', order: 0 },
    });

    setCellMeta(mockCell, { order: 5 });
    const meta = getCellMeta(mockCell);
    expect(meta.slideId).toBe('slide-1');
    expect(meta.order).toBe(5);
  });
});
