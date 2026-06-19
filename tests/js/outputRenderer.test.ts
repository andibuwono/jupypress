import { renderOutputs } from '../../src/utils/outputRenderer';

describe('outputRenderer', () => {
  it('renders stream output', () => {
    const html = renderOutputs([{ output_type: 'stream', text: ['hello\n', 'world'] }]);
    expect(html).toContain('cell-output-stream');
    expect(html).toContain('hello');
    expect(html).toContain('world');
  });

  it('renders traceback for error output', () => {
    const html = renderOutputs([{
      output_type: 'error',
      ename: 'ValueError',
      evalue: 'bad',
      traceback: ['Traceback', 'ValueError: bad'],
    }]);
    expect(html).toContain('cell-output-error');
    expect(html).toContain('Traceback');
  });

  it('uses widget MIME before text/plain fallback', () => {
    const html = renderOutputs([{
      output_type: 'display_data',
      data: {
        'application/vnd.jupyter.widget-view+json': { model_id: 'abc123' },
        'text/plain': 'IntSlider(value=1)',
      },
    }]);
    expect(html).toContain('data-model-id="abc123"');
    expect(html).toContain('widget-fallback');
    expect(html).toContain('IntSlider');
  });

  it('renders images and html by MIME priority', () => {
    const html = renderOutputs([
      { output_type: 'display_data', data: { 'image/png': 'png-data', 'text/html': '<b>html</b>' } },
      { output_type: 'display_data', data: { 'text/html': '<table></table>' } },
    ]);
    expect(html).toContain('data:image/png;base64,png-data');
    expect(html).toContain('<table></table>');
  });

  it('renders Plotly MIME as a structured placeholder with fallback', () => {
    const html = renderOutputs([{
      output_type: 'display_data',
      data: {
        'application/vnd.plotly.v1+json': { data: [{ y: [1, 2, 3] }] },
        'text/plain': 'Plotly chart',
      },
    }]);
    expect(html).toContain('cell-output-plotly');
    expect(html).toContain('data-plotly=');
    expect(html).toContain('Plotly chart');
  });
});
