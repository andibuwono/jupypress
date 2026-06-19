/**
 * Shared renderer for notebook output JSON.
 *
 * This is intentionally dependency-light so the same MIME priority can be used
 * by presentation HTML generation and live execution fallbacks.
 */

export interface JupyterOutput {
  output_type: string;
  name?: string;
  text?: string | string[];
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  execution_count?: number | null;
  ename?: string;
  evalue?: string;
  traceback?: string[];
  transient?: Record<string, any>;
}

export function renderOutputs(outputs: JupyterOutput[] | undefined | null): string {
  if (!outputs?.length) return '';
  return outputs.map(output => renderOutput(output)).join('\n');
}

export function renderOutput(output: JupyterOutput): string {
  const type = output.output_type ?? '';

  if (type === 'stream') {
    return `<pre class="cell-output-stream">${escapeHtml(joinMimeLines(output.text))}</pre>`;
  }

  if (type === 'error') {
    const traceback = Array.isArray(output.traceback)
      ? stripAnsi(output.traceback.join('\n'))
      : '';
    const fallback = `${output.ename ?? 'Error'}: ${output.evalue ?? ''}`;
    const message = traceback ? `${traceback}\n${fallback}` : fallback;
    return `<pre class="cell-output-error">${escapeHtml(message)}</pre>`;
  }

  return renderMimeBundle(output.data ?? {});
}

export function renderMimeBundle(data: Record<string, any>): string {
  if (data['application/vnd.jupyter.widget-view+json']) {
    const widget = data['application/vnd.jupyter.widget-view+json'];
    const modelId = escapeAttribute(String(widget?.model_id ?? ''));
    const fallback = joinMimeLines(data['text/plain']);
    return `<div class="cell-output-html jupyter-widgets">` +
      `<div class="widget-subarea widget-subarea-output">` +
      `<div class="jupyter-widgets widget-output" data-model-id="${modelId}"></div>` +
      `</div>` +
      `<pre class="cell-output-text widget-fallback">${escapeHtml(fallback)}</pre>` +
      `</div>`;
  }

  if (data['application/vnd.plotly.v1+json']) {
    const payload = escapeAttribute(JSON.stringify(data['application/vnd.plotly.v1+json']));
    const fallback = joinMimeLines(data['text/plain']) || 'Plotly output';
    return `<div class="cell-output-plotly" data-plotly="${payload}">` +
      `<pre class="cell-output-text">${escapeHtml(fallback)}</pre>` +
      `</div>`;
  }

  if (data['image/svg+xml']) {
    return `<div class="cell-output-svg">${joinMimeLines(data['image/svg+xml'])}</div>`;
  }

  if (data['image/png']) {
    return `<img class="cell-output-image" src="data:image/png;base64,${joinMimeLines(data['image/png'])}" alt="output">`;
  }

  if (data['image/jpeg']) {
    return `<img class="cell-output-image" src="data:image/jpeg;base64,${joinMimeLines(data['image/jpeg'])}" alt="output">`;
  }

  if (data['text/html']) {
    return `<div class="cell-output-html">${joinMimeLines(data['text/html'])}</div>`;
  }

  if (data['text/markdown']) {
    return `<pre class="cell-output-markdown">${escapeHtml(joinMimeLines(data['text/markdown']))}</pre>`;
  }

  if (data['text/latex']) {
    return `<pre class="cell-output-latex">${escapeHtml(joinMimeLines(data['text/latex']))}</pre>`;
  }

  if (data['text/plain']) {
    return `<pre class="cell-output-text">${escapeHtml(joinMimeLines(data['text/plain']))}</pre>`;
  }

  return '';
}

export function joinMimeLines(value: any): string {
  if (Array.isArray(value)) return value.join('');
  if (value == null) return '';
  return String(value);
}

export function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, '&#96;');
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
