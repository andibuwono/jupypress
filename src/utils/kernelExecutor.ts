/**
 * Shared kernel execution helper for live-coding presentations.
 */

import { INotebookModel } from '@jupyterlab/notebook';
import { ISessionContext } from '@jupyterlab/apputils';
import { JupyterOutput, renderOutputs } from './outputRenderer';

export interface CellOutputPayload {
  type: 'jupypress:cellOutput';
  cellIndex: number;
  source?: string;
  executionCount?: number | null;
  outputs?: JupyterOutput[];
  outputEvents?: JupyterOutput[];
  html?: string;
  error?: string;
}

export async function executeCellRequest(
  sessionContext: ISessionContext | undefined,
  notebook: INotebookModel,
  cellIndex: number,
  source: string
): Promise<CellOutputPayload> {
  const kernel = sessionContext?.session?.kernel as any;
  if (!kernel) {
    return {
      type: 'jupypress:cellOutput',
      cellIndex,
      error: 'No kernel available. Make sure the notebook kernel is running.',
    };
  }

  const outputEvents: JupyterOutput[] = [];
  const finalOutputs: JupyterOutput[] = [];
  const displayIdIndexes = new Map<string, number>();
  let lastMessageAt = Date.now();

  try {
    const future = kernel.requestExecute({ code: source }) as any;
    future.onIOPub = (msg: any) => {
      lastMessageAt = Date.now();
      const t = msg.header.msg_type;
      if (t === 'stream') {
        appendOutput({
          output_type: 'stream',
          name: msg.content.name,
          text: msg.content.text,
        });
      } else if (
        t === 'execute_result' ||
        t === 'display_data' ||
        t === 'update_display_data'
      ) {
        const transient = msg.content.transient || {};
        const displayId = transient.display_id;
        const output: JupyterOutput = {
          output_type: t,
          data: msg.content.data || {},
          metadata: msg.content.metadata || {},
          transient,
        };
        if (t === 'execute_result') {
          output.execution_count = msg.content.execution_count;
        }
        outputEvents.push(output);

        const notebookOutput = {
          ...output,
          output_type: t === 'update_display_data' ? 'display_data' : t,
        };
        if (displayId && displayIdIndexes.has(displayId)) {
          finalOutputs[displayIdIndexes.get(displayId)!] = notebookOutput;
        } else {
          if (displayId) displayIdIndexes.set(displayId, finalOutputs.length);
          finalOutputs.push(notebookOutput);
        }
      } else if (t === 'error') {
        appendOutput({
          output_type: 'error',
          ename: msg.content.ename,
          evalue: msg.content.evalue,
          traceback: msg.content.traceback,
        });
      }
    };

    const EXEC_TIMEOUT = 120000;
    const quietWait = waitForQuietOutputs(
      () => lastMessageAt,
      () => finalOutputs.length,
      1500,
      EXEC_TIMEOUT
    );
    let reply: any;
    try {
      reply = await Promise.race([
        future.done,
        quietWait.promise,
      ]);
    } finally {
      quietWait.cancel();
    }
    future.onIOPub = undefined;
    const executionCount = reply?.content?.execution_count ?? null;

    // Update original notebook cell with edited source & outputs
    const cell = notebook.cells.get(cellIndex);
    if (cell && (cell as any).sharedModel) {
      const shared = (cell as any).sharedModel;
      if (typeof shared.setSource === 'function') {
        shared.setSource(source);
      }
      if (cell.type === 'code') {
        const codeCell = cell as any;
        // Prefer OutputAreaModel.fromJSON for proper widget / UI sync
        if (codeCell.outputs && typeof codeCell.outputs.fromJSON === 'function') {
          codeCell.outputs.fromJSON(finalOutputs);
        } else if (shared && typeof shared.setOutputs === 'function') {
          shared.setOutputs(finalOutputs);
        }
        if (executionCount != null) {
          codeCell.executionCount = executionCount;
        }
      }
    }

    return {
      type: 'jupypress:cellOutput',
      cellIndex,
      source,
      executionCount,
      outputs: finalOutputs,
      outputEvents,
      html: renderOutputs(finalOutputs),
    };
  } catch (err) {
    return {
      type: 'jupypress:cellOutput',
      cellIndex,
      error: String(err),
    };
  }

  function appendOutput(output: JupyterOutput): void {
    outputEvents.push(output);
    finalOutputs.push(output);
  }
}

function waitForQuietOutputs(
  getLastMessageAt: () => number,
  getOutputCount: () => number,
  idleMs: number,
  timeoutMs: number
): { promise: Promise<any>; cancel: () => void } {
  const startedAt = Date.now();
  let interval: ReturnType<typeof setInterval> | undefined;
  const cancel = () => {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };
  const promise = new Promise(resolve => {
    interval = setInterval(() => {
      const now = Date.now();
      if (getOutputCount() > 0 && now - getLastMessageAt() >= idleMs) {
        cancel();
        resolve({ content: { execution_count: null } });
        return;
      }
      if (now - startedAt >= timeoutMs) {
        cancel();
        resolve({ content: { execution_count: null } });
      }
    }, 250);
  });
  return { promise, cancel };
}
