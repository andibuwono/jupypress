/**
 * Tests for htmlBuilder utility.
 */

import {
  buildPresentationHtml,
  buildStandalonePresentationHtml,
} from '../../src/utils/htmlBuilder';
import { SlideViewModel } from '../../src/utils/slideMapper';

function makeSlide(overrides: Partial<SlideViewModel> = {}): SlideViewModel {
  return {
    id: 'slide-1',
    name: 'Test Slide',
    layout: 'default',
    showHeader: false,
    slots: {},
    ...overrides,
  };
}

describe('buildPresentationHtml', () => {
  it('should return a valid HTML document string', () => {
    const html = buildPresentationHtml([makeSlide()]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
  });

  it('keeps buildPresentationHtml as the standalone export alias', () => {
    const slides = [makeSlide({ id: 'slide-alias', name: 'Alias Slide' })];
    expect(buildPresentationHtml(slides)).toBe(buildStandalonePresentationHtml(slides));
  });

  it('should include a slide element for each slide', () => {
    const slides = [makeSlide({ id: 'slide-1', name: 'slide-1' }), makeSlide({ id: 'slide-2', name: 'slide-2' })];
    const html = buildPresentationHtml(slides);
    expect(html).toContain('id="slide-1"');
    expect(html).toContain('id="slide-2"');
    expect(html).toContain('data-name="slide-1"');
    expect(html).toContain('data-name="slide-2"');
  });

  it('should apply layout class to slide', () => {
    const html = buildPresentationHtml([makeSlide({ layout: 'title' })]);
    expect(html).toContain('slide--title');
  });

  it('should include slide name in data-name attribute', () => {
    const html = buildPresentationHtml([makeSlide({ name: 'My Slide' })]);
    expect(html).toContain('data-name="My Slide"');
  });

  it('should escape HTML in slide name', () => {
    const html = buildPresentationHtml([
      makeSlide({ name: '<script>alert("xss")</script>', showHeader: true }),
    ]);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should render slot divs for each slot', () => {
    const slide = makeSlide({
      layout: 'title',
      slots: {
        title: [{ cellIndex: 0, cellType: 'markdown', include: 'full', order: 0 }],
        subtitle: [{ cellIndex: 1, cellType: 'code', include: 'full', order: 0 }],
      },
    });
    const html = buildPresentationHtml([slide]);
    expect(html).toContain('class="slot-title"');
    expect(html).toContain('class="slot-subtitle"');
  });

  it('should render a cell placeholder for each assigned cell', () => {
    const slide = makeSlide({
      slots: {
        content: [
          { cellIndex: 0, cellType: 'markdown', include: 'full', order: 0 },
          { cellIndex: 1, cellType: 'markdown', include: 'full', order: 1 },
        ],
      },
    });
    const html = buildPresentationHtml([slide]);
    const cellCount = (html.match(/class="cell"/g) || []).length;
    expect(cellCount).toBe(2);
  });

  it('should inject custom CSS when provided', () => {
    const customCss = '.my-custom-rule { color: red; }';
    const html = buildPresentationHtml([makeSlide()], null, { customCss });
    expect(html).toContain(customCss);
  });

  it('should inject theme CSS when provided', () => {
    const themeCss = ':root { --color-primary: blue; }';
    const html = buildPresentationHtml([makeSlide()], null, { themeCss });
    expect(html).toContain(themeCss);
  });

  it('should include navigation script', () => {
    const html = buildPresentationHtml([makeSlide()]);
    expect(html).toContain('<script>');
    expect(html).toContain('showSlide');
    expect(html).toContain('ArrowRight');
  });

  it('should handle empty slides array', () => {
    const html = buildPresentationHtml([]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).not.toContain('<section class="slide');
  });
});

// ---------------------------------------------------------------------------
// Helpers for notebook-backed rendering tests
// ---------------------------------------------------------------------------

function makeMockCell(source: string, outputs: any[] = []): any {
  return { sharedModel: { source, outputs } };
}

function makeMockNotebook(cells: any[]): any {
  return { cells: { get: (i: number) => cells[i] ?? null } };
}

function slideWithCell(
  cellType: string,
  include: 'full' | 'input-only' | 'output-only',
  cellIndex = 0
): SlideViewModel {
  return makeSlide({
    slots: { content: [{ cellIndex, cellType, include, order: 0 }] },
  });
}

// ---------------------------------------------------------------------------
// Cell rendering tests (lines 106-208)
// ---------------------------------------------------------------------------

describe('buildPresentationHtml – cell rendering', () => {
  it('renders markdown cell with heading and bold', () => {
    const notebook = makeMockNotebook([makeMockCell('# Title\n\n**bold** text')]);
    const html = buildPresentationHtml([slideWithCell('markdown', 'full')], notebook);
    expect(html).toContain('cell-markdown');
    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>');
  });

  it('renders markdown with italic and inline code', () => {
    const notebook = makeMockNotebook([makeMockCell('*italic* and `code`')]);
    const html = buildPresentationHtml([slideWithCell('markdown', 'full')], notebook);
    expect(html).toContain('<em>');
    expect(html).toContain('<code>');
  });

  it('renders markdown with paragraph breaks', () => {
    const notebook = makeMockNotebook([makeMockCell('para one\n\npara two')]);
    const html = buildPresentationHtml([slideWithCell('markdown', 'full')], notebook);
    expect(html).toContain('<p>para one</p>');
    expect(html).toContain('<p>para two</p>');
  });

  it('renders markdown with all heading levels', () => {
    const src = '## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const notebook = makeMockNotebook([makeMockCell(src)]);
    const html = buildPresentationHtml([slideWithCell('markdown', 'full')], notebook);
    expect(html).toContain('<h2>');
    expect(html).toContain('<h3>');
    expect(html).toContain('<h4>');
    expect(html).toContain('<h5>');
    expect(html).toContain('<h6>');
  });

  it('renders code cell input-only', () => {
    const notebook = makeMockNotebook([makeMockCell('print("hello")')]);
    const html = buildPresentationHtml([slideWithCell('code', 'input-only')], notebook);
    expect(html).toContain('cell-code-input');
    expect(html).toContain('print(');
    expect(html).not.toContain('<div class="cell-code-output">');
  });

  it('renders code cell full (input + empty outputs)', () => {
    const notebook = makeMockNotebook([makeMockCell('x = 1', [])]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook);
    expect(html).toContain('cell-code-input');
  });

  it('places live editor controls after the code input and before output', () => {
    const cell = makeMockCell('x = 1', [
      { output_type: 'execute_result', data: { 'text/plain': '1' } },
    ]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook, {
      enableLiveCoding: true,
    });
    const wrapperStart = html.indexOf('<div class="cell-code-wrapper" data-cell-index="0">');
    const wrapperEnd = html.indexOf('</section>', wrapperStart);
    const wrapperHtml = html.slice(wrapperStart, wrapperEnd);
    expect(wrapperHtml.indexOf('cell-code-input')).toBeLessThan(wrapperHtml.indexOf('cell-code-editor'));
    expect(wrapperHtml.indexOf('cell-code-editor')).toBeLessThan(wrapperHtml.indexOf('cell-code-output'));
  });

  it('renders stream output', () => {
    const cell = makeMockCell('', [{ output_type: 'stream', text: ['hello\n', 'world'] }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'output-only')], notebook);
    expect(html).toContain('cell-output-stream');
    expect(html).toContain('hello');
  });

  it('renders stream output (string text)', () => {
    const cell = makeMockCell('', [{ output_type: 'stream', text: 'simple' }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'output-only')], notebook);
    expect(html).toContain('simple');
  });

  it('renders error output', () => {
    const cell = makeMockCell('', [{
      output_type: 'error',
      ename: 'ValueError',
      evalue: 'bad input',
      traceback: ['  File "x.py", line 1'],
    }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'output-only')], notebook);
    expect(html).toContain('cell-output-error');
    expect(html).toContain('ValueError');
    expect(html).toContain('bad input');
  });

  it('renders image/png output', () => {
    const cell = makeMockCell('', [{ output_type: 'display_data', data: { 'image/png': 'abc123' } }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook);
    expect(html).toContain('data:image/png;base64,abc123');
  });

  it('renders image/jpeg output', () => {
    const cell = makeMockCell('', [{ output_type: 'display_data', data: { 'image/jpeg': 'xyz789' } }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook);
    expect(html).toContain('data:image/jpeg;base64,xyz789');
  });

  it('renders text/html output', () => {
    const cell = makeMockCell('', [{
      output_type: 'execute_result',
      data: { 'text/html': ['<table>', '<tr><td>1</td></tr>', '</table>'] },
    }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook);
    expect(html).toContain('cell-output-html');
    expect(html).toContain('<table>');
  });

  it('renders text/plain output', () => {
    const cell = makeMockCell('', [{ output_type: 'execute_result', data: { 'text/plain': '42' } }]);
    const notebook = makeMockNotebook([cell]);
    const html = buildPresentationHtml([slideWithCell('code', 'full')], notebook);
    expect(html).toContain('cell-output-text');
    expect(html).toContain('42');
  });

  it('handles missing cell index gracefully', () => {
    const notebook = makeMockNotebook([]);
    const slide = makeSlide({
      slots: { content: [{ cellIndex: 99, cellType: 'markdown', include: 'full', order: 0 }] },
    });
    expect(() => buildPresentationHtml([slide], notebook)).not.toThrow();
  });

  it('renders unknown cell type as pre', () => {
    const notebook = makeMockNotebook([makeMockCell('raw content')]);
    const slide = makeSlide({
      slots: { content: [{ cellIndex: 0, cellType: 'raw', include: 'full', order: 0 }] },
    });
    const html = buildPresentationHtml([slide], notebook);
    expect(html).toContain('<pre>');
    expect(html).toContain('raw content');
  });
});
