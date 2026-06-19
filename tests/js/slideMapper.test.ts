/**
 * Tests for slideMapper utility.
 */

import { buildSlideViewModel } from '../../src/utils/slideMapper';

/** Create a mock cell with getMetadata/setMetadata */
function makeMockCell(type: string, jupypressMeta: any): any {
  const store = new Map<string, any>([['jupypress', jupypressMeta]]);
  return {
    type,
    getMetadata: (key: string) => store.get(key),
    setMetadata: (key: string, value: any) => { store.set(key, value); },
  };
}

/** Create a mock notebook with getMetadata/setMetadata and cells array */
function makeMockNotebook(jupypressMeta: any, cells: any[]): any {
  const store = new Map<string, any>(
    jupypressMeta ? [['jupypress', jupypressMeta]] : []
  );
  return {
    getMetadata: (key: string) => store.get(key),
    setMetadata: (key: string, value: any) => { store.set(key, value); },
    cells: {
      length: cells.length,
      get: (idx: number) => cells[idx],
    },
  };
}

describe('slideMapper', () => {
  it('should build slide view model from notebook', () => {
    const mockNotebook = makeMockNotebook(
      {
        version: '1',
        slides: [
          { id: 'slide-1', name: 'Title', layout: 'title', showHeader: false },
          { id: 'slide-2', name: 'Content', layout: 'default', showHeader: true },
        ],
      },
      [
        makeMockCell('markdown', { slideId: 'slide-1', slot: 'title', order: 0 }),
        makeMockCell('markdown', { slideId: 'slide-2', slot: 'heading', order: 0 }),
        makeMockCell('code', { slideId: 'slide-2', slot: 'content', order: 0 }),
      ]
    );

    const slides = buildSlideViewModel(mockNotebook);

    expect(slides).toHaveLength(2);
    expect(slides[0].name).toBe('Title');
    expect(slides[0].layout).toBe('title');
    expect(slides[1].name).toBe('Content');
    expect(slides[1].layout).toBe('default');
  });

  it('should handle missing metadata', () => {
    const mockNotebook = makeMockNotebook(null, []);

    const slides = buildSlideViewModel(mockNotebook);
    expect(slides).toHaveLength(0);
  });

  it('should sort cells by order within slots', () => {
    const mockNotebook = makeMockNotebook(
      {
        version: '1',
        slides: [
          { id: 'slide-1', name: 'Test', layout: 'default', showHeader: true },
        ],
      },
      [
        makeMockCell('markdown', { slideId: 'slide-1', slot: 'content', order: 2 }),
        makeMockCell('markdown', { slideId: 'slide-1', slot: 'content', order: 1 }),
        makeMockCell('markdown', { slideId: 'slide-1', slot: 'content', order: 0 }),
      ]
    );

    const slides = buildSlideViewModel(mockNotebook);
    const contentCells = slides[0].slots['content'];

    expect(contentCells[0].order).toBe(0);
    expect(contentCells[1].order).toBe(1);
    expect(contentCells[2].order).toBe(2);
  });
});
