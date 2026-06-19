/**
 * Extension entry point.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { registerCommands, CommandIDs } from './commands';
import { createToolbarButton } from './toolbar';
import { JupypressService } from './service';
import { IJupypressService } from './tokens';


const plugin: JupyterFrontEndPlugin<IJupypressService> = {
  id: 'jupypress:plugin',
  description: 'A JupyterLab extension for creating slide presentations from notebooks.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ILayoutRestorer, ICommandPalette],
  provides: IJupypressService,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    _restorer?: ILayoutRestorer,
    palette?: ICommandPalette
  ): IJupypressService => {
    console.log('JupyPress extension loaded');

    // Create the service
    const service = new JupypressService();

    // Register commands
    registerCommands(app, notebookTracker, service);

    // Register commands in command palette
    if (palette) {
      const category = 'JupyPress';
      palette.addItem({ command: CommandIDs.openEditor, category });
      palette.addItem({ command: CommandIDs.openPresentation, category });
      palette.addItem({ command: CommandIDs.exportHtml, category });
    }

    // Add toolbar button to notebook — insert before the spacer so it stays in the left group
    notebookTracker.widgetAdded.connect((_sender, panel: NotebookPanel) => {
      panel.revealed.then(() => {
        const button = createToolbarButton(app, notebookTracker);
        const names = [...panel.toolbar.names()];
        const spacerIdx = names.indexOf('spacer');
        if (spacerIdx >= 0) {
          panel.toolbar.insertItem(spacerIdx, 'jupypress-button', button);
        } else {
          panel.toolbar.addItem('jupypress-button', button);
        }
      });
    });

    return service;
  },
};

export default plugin;
