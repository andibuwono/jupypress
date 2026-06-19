/**
 * Toolbar button factory for jupypress extension.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ToolbarButton } from '@jupyterlab/apputils';
import { jupypressIcon } from './components/icons/Icons';
import { CommandIDs } from './commands';


/**
 * Create the toolbar button widget.
 */
export function createToolbarButton(
  app: JupyterFrontEnd,
  _notebookTracker: INotebookTracker
): ToolbarButton {
  return new ToolbarButton({
    icon: jupypressIcon,
    tooltip: 'Present in Jupypress',
    onClick: () => app.commands.execute(CommandIDs.openEditor),
  });
}
