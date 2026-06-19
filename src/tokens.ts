/**
 * Service tokens for the jupypress extension.
 *
 * Allows other extensions to depend on and extend jupypress services.
 */

import { Token } from '@lumino/coreutils';


/**
 * The IJupypressService interface.
 *
 * Provides access to the presentation editor and exporter.
 */
export interface IJupypressService {
  /**
   * Export the current notebook to HTML.
   */
  exportNotebook(path: string, options?: ExportOptions): Promise<string>;

  /**
   * Get list of available themes.
   */
  getThemes(): Promise<ThemeInfo[]>;

  /**
   * Save a custom theme.
   */
  saveTheme(name: string, css: string): Promise<void>;
}

export interface ExportOptions {
  executeNotebook?: boolean;
  theme?: string;
  customCss?: string;
}

export interface ThemeInfo {
  name: string;
  css: string;
  builtin?: boolean;
}


/**
 * The token for the IJupypressService.
 */
export const IJupypressService = new Token<IJupypressService>(
  'jupypress:IJupypressService'
);
