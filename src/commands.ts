/**
 * Command definitions for the jupypress extension.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ISessionContext, MainAreaWidget, ReactWidget } from '@jupyterlab/apputils';
import { INotebookModel } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { IJupypressService } from './tokens';
import { SlideEditorPanel } from './components/SlideEditorPanel';
import { JupyterLabPresentation } from './components/JupyterLabPresentation';
import { getNotebookMeta } from './utils/metadata';


export namespace CommandIDs {
  export const openEditor = 'jupypress:open-editor';
  export const openPresentation = 'jupypress:open-presentation';
  export const exportHtml = 'jupypress:export-html';
}


export function registerCommands(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  service: IJupypressService
): void {
  // Track open editor panels by notebook path so each notebook gets its own panel
  const openPanels = new Map<string, MainAreaWidget>();

  // Command: Open slide editor panel
  app.commands.addCommand(CommandIDs.openEditor, {
    label: 'JupyPress: Open Slide Editor',
    isEnabled: () => notebookTracker.currentWidget !== null,
    execute: () => {
      const notebookPanel = notebookTracker.currentWidget;
      if (!notebookPanel || !notebookPanel.model) return;

      const notebookPath = notebookPanel.context.path;
      const panelId = `jupypress-editor-${btoa(notebookPath).replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Reuse existing panel if still open
      const existing = openPanels.get(notebookPath);
      if (existing && !existing.isDisposed) {
        app.shell.activateById(existing.id);
        return;
      }

      const notebook = notebookPanel.model;
      const rendermime = notebookPanel.content.rendermime;
      const notebookName =
        notebookPath.split('/').pop()?.replace(/\.ipynb$/i, '') ?? 'Notebook';

      const element = React.createElement(SlideEditorPanel, {
        notebook,
        service,
        notebookPath,
        sessionContext: notebookPanel.sessionContext,
        rendermime,
        onOpenPresentation: (themeCss?: string, initialSlideIndex = 0) => {
          const { liveCodingEnabled } = getNotebookMeta(notebook);
          openJupyterLabPresentation(
            notebook,
            notebookPanel.sessionContext,
            rendermime,
            themeCss,
            notebookName,
            liveCodingEnabled ?? true,
            initialSlideIndex
          );
        },
      });
      const content = ReactWidget.create(element);
      content.addClass('jp-JupypressEditor-content');

      const panel = new MainAreaWidget({ content });
      panel.id = panelId;
      panel.title.label = `${notebookName} — Jupypress`;
      panel.title.closable = true;

      // Clean up reference when panel is closed
      panel.disposed.connect(() => {
        openPanels.delete(notebookPath);
      });

      openPanels.set(notebookPath, panel);
      app.shell.add(panel, 'main');
      app.shell.activateById(panel.id);
    },
  });

  // Command: Open presentation view (new tab)
  app.commands.addCommand(CommandIDs.openPresentation, {
    label: 'JupyPress: Open Presentation',
    isEnabled: () => notebookTracker.currentWidget !== null,
    execute: async () => {
      const notebookPanel = notebookTracker.currentWidget;
      if (!notebookPanel || !notebookPanel.model) return;

      try {
        const notebook = notebookPanel.model;
        const sessionContext = notebookPanel.sessionContext;
        const { customCss, globalTheme, liveCodingEnabled } = getNotebookMeta(notebook);
        const themes = await service.getThemes();
        const selectedTheme = themes.find(t => t.name === (globalTheme || 'Jupypress'));
        openJupyterLabPresentation(
          notebook,
          sessionContext,
          notebookPanel.content.rendermime,
          customCss ?? selectedTheme?.css,
          notebookPanel.context.path.split('/').pop()?.replace(/\.ipynb$/i, '') ?? 'Presentation',
          liveCodingEnabled ?? true
        );
      } catch (err) {
        console.error('Failed to open presentation:', err);
      }
    },
  });

  // Command: Export to HTML file
  app.commands.addCommand(CommandIDs.exportHtml, {
    label: 'JupyPress: Export to HTML',
    isEnabled: () => notebookTracker.currentWidget !== null,
    execute: async () => {
      const notebookPanel = notebookTracker.currentWidget;
      if (!notebookPanel) return;

      try {
        const path = notebookPanel.context.path;
        const { customCss, globalTheme } = getNotebookMeta(notebookPanel.model!);
        const html = await service.exportNotebook(path, {
          theme: globalTheme || 'Jupypress',
          customCss,
        });
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presentation-${new Date().getTime()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Export failed:', err);
      }
    },
  });
}

function openJupyterLabPresentation(
  notebook: INotebookModel,
  sessionContext: ISessionContext | undefined,
  rendermime: IRenderMimeRegistry,
  themeCss: string | undefined,
  notebookName: string,
  enableLiveCoding = true,
  initialSlideIndex = 0
): void {
  const documentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notebookName)} — JupyPress</title>
  <style>
    html, body, #jupypress-present-root {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #16213e;
    }
  </style>
</head>
<body>
  <div id="jupypress-present-root"></div>
</body>
</html>`;
  const url = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }

  let mounted = false;
  const mount = () => {
    if (mounted) return;
    const host = win.document.getElementById('jupypress-present-root');
    if (!host) {
      return;
    }
    mounted = true;

    const element = React.createElement(JupyterLabPresentation, {
      notebook,
      sessionContext,
      rendermime,
      themeCss,
      enableLiveCoding,
      navigation: 'basic',
      selectedSlideIndex: initialSlideIndex,
    });
    const root = createRoot(host);
    root.render(element);
    win.addEventListener('beforeunload', () => {
      root.unmount();
      URL.revokeObjectURL(url);
    });
  };

  win.addEventListener('load', mount, { once: true });
  window.setTimeout(mount, 500);
}

function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}
