import { executeCellRequest } from '../../src/utils/kernelExecutor';

function makeFuture() {
  let resolveDone!: (value: any) => void;
  const future: any = {
    onIOPub: undefined,
    done: new Promise(resolve => {
      resolveDone = resolve;
    }),
  };
  return { future, resolveDone };
}

function makeNotebook() {
  const sharedModel = {
    setSource: jest.fn(),
    setOutputs: jest.fn(),
  };
  const outputs = { fromJSON: jest.fn() };
  const cell = {
    type: 'code',
    sharedModel,
    outputs,
    executionCount: null,
  };
  const notebook: any = {
    cells: {
      get: jest.fn(() => cell),
    },
  };
  return { notebook, cell, sharedModel, outputs };
}

describe('kernelExecutor', () => {
  it('returns structured outputs and updates the notebook model', async () => {
    const { future, resolveDone } = makeFuture();
    const requestExecute = jest.fn(() => future);
    const sessionContext: any = { session: { kernel: { requestExecute } } };
    const { notebook, cell, sharedModel, outputs } = makeNotebook();

    const pending = executeCellRequest(sessionContext, notebook, 2, 'print("hi")');
    future.onIOPub({
      header: { msg_type: 'stream' },
      content: { name: 'stdout', text: 'hi\n' },
    });
    future.onIOPub({
      header: { msg_type: 'display_data' },
      content: {
        data: { 'text/html': '<b>done</b>' },
        metadata: { isolated: true },
        transient: { display_id: 'display-1' },
      },
    });
    resolveDone({ content: { execution_count: 4 } });

    const payload = await pending;

    expect(requestExecute).toHaveBeenCalledWith({ code: 'print("hi")' });
    expect(sharedModel.setSource).toHaveBeenCalledWith('print("hi")');
    expect(outputs.fromJSON).toHaveBeenCalledWith(payload.outputs);
    expect(cell.executionCount).toBe(4);
    expect(payload.outputs).toHaveLength(2);
    expect(payload.outputEvents).toHaveLength(2);
    expect(payload.executionCount).toBe(4);
    expect(payload.html).toContain('<b>done</b>');
  });

  it('tracks update_display_data as an event and writes final display output', async () => {
    const { future, resolveDone } = makeFuture();
    const sessionContext: any = {
      session: { kernel: { requestExecute: jest.fn(() => future) } },
    };
    const { notebook, outputs } = makeNotebook();

    const pending = executeCellRequest(sessionContext, notebook, 0, 'display(x)');
    future.onIOPub({
      header: { msg_type: 'display_data' },
      content: {
        data: { 'text/plain': 'old' },
        metadata: {},
        transient: { display_id: 'same' },
      },
    });
    future.onIOPub({
      header: { msg_type: 'update_display_data' },
      content: {
        data: { 'text/plain': 'new' },
        metadata: {},
        transient: { display_id: 'same' },
      },
    });
    resolveDone({ content: { execution_count: 5 } });

    const payload = await pending;

    expect(payload.outputEvents?.map(output => output.output_type)).toEqual([
      'display_data',
      'update_display_data',
    ]);
    expect(payload.outputs).toHaveLength(1);
    expect(payload.outputs?.[0].output_type).toBe('display_data');
    expect(payload.outputs?.[0].data?.['text/plain']).toBe('new');
    expect(outputs.fromJSON).toHaveBeenCalledWith(payload.outputs);
  });
});
