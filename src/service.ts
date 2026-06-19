/**
 * Service implementation for jupypress.
 */

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import {
  IJupypressService,
  ExportOptions,
  ThemeInfo,
} from './tokens';


export class JupypressService implements IJupypressService {
  private _serverSettings: ServerConnection.ISettings;

  constructor(options: JupypressService.IOptions = {}) {
    this._serverSettings =
      options.serverSettings ?? ServerConnection.makeSettings();
  }

  /**
   * Export a notebook to HTML.
   */
  async exportNotebook(
    path: string,
    options: ExportOptions = {}
  ): Promise<string> {
    const url = URLExt.join(this._serverSettings.baseUrl, 'jupypress/export');

    const response = await ServerConnection.makeRequest(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          executeNotebook: options.executeNotebook ?? false,
          theme: options.theme ?? 'default',
          customCss: options.customCss ?? '',
        }),
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ServerConnection.ResponseError(
        response,
        error.error ?? 'Export failed'
      );
    }

    const data = await response.json();
    return data.html;
  }

  /**
   * Get list of available themes.
   */
  async getThemes(): Promise<ThemeInfo[]> {
    const url = URLExt.join(this._serverSettings.baseUrl, 'jupypress/themes');

    const response = await ServerConnection.makeRequest(
      url,
      { method: 'GET' },
      this._serverSettings
    );

    if (!response.ok) {
      throw new ServerConnection.ResponseError(
        response,
        'Failed to fetch themes'
      );
    }

    const data = await response.json();
    return data.themes ?? [];
  }

  /**
   * Save a custom theme.
   */
  async saveTheme(name: string, css: string): Promise<void> {
    const url = URLExt.join(this._serverSettings.baseUrl, 'jupypress/themes');

    const response = await ServerConnection.makeRequest(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, css }),
      },
      this._serverSettings
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ServerConnection.ResponseError(
        response,
        error.error ?? 'Failed to save theme'
      );
    }
  }
}

export namespace JupypressService {
  export interface IOptions {
    serverSettings?: ServerConnection.ISettings;
  }
}
