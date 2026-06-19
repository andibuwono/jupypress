/**
 * Hook for notebook model binding.
 *
 * Syncs React component state with notebook metadata and cell metadata changes.
 */

import { useCallback, useEffect, useState } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import { getNotebookMeta, setNotebookMeta } from '../utils/metadata';
import { buildSlideViewModel, SlideViewModel } from '../utils/slideMapper';


export interface NotebookJupypressMeta {
  version: string;
  slides: any[];
  globalTheme?: string;
  customCss?: string;
  liveCodingEnabled?: boolean;
}


/**
 * Hook to sync state with notebook metadata.
 */
export function useNotebookMetadata(
  notebook: INotebookModel | null
): [NotebookJupypressMeta | null, (meta: Partial<NotebookJupypressMeta>) => void] {
  const [meta, setMeta] = useState<NotebookJupypressMeta | null>(null);

  // Initialize from notebook
  useEffect(() => {
    if (!notebook) {
      setMeta(null);
      return;
    }

    const currentMeta = getNotebookMeta(notebook);
    setMeta(currentMeta);
  }, [notebook]);

  // Listen for external changes
  useEffect(() => {
    if (!notebook) return;

    const handleMetadataChanged = () => {
      const updatedMeta = getNotebookMeta(notebook);
      setMeta(updatedMeta);
    };

    notebook.metadataChanged.connect(handleMetadataChanged);

    return () => {
      notebook.metadataChanged.disconnect(handleMetadataChanged);
    };
  }, [notebook]);

  // Update metadata in notebook
  const updateMeta = (updates: Partial<NotebookJupypressMeta>) => {
    if (!notebook) return;

    const newMeta = {
      ...(meta || { version: '1', slides: [] }),
      ...updates,
    };

    setNotebookMeta(notebook, newMeta);
    setMeta(newMeta as NotebookJupypressMeta);
  };

  return [meta, updateMeta];
}


/**
 * Hook for watching slides array.
 */
export function useSlides(notebook: INotebookModel | null) {
  const [meta, updateMeta] = useNotebookMetadata(notebook);

  const slides = meta?.slides || [];

  const addSlide = (slide: any) => {
    updateMeta({
      slides: [...slides, { ...slide, id: generateId() }],
    });
  };

  const updateSlide = (slideId: string, updates: any) => {
    const updated = slides.map((s: any) =>
      s.id === slideId ? { ...s, ...updates } : s
    );
    updateMeta({ slides: updated });
  };

  const removeSlide = (slideId: string) => {
    updateMeta({ slides: slides.filter((s: any) => s.id !== slideId) });
  };

  const moveSlide = (slideId: string, direction: 'up' | 'down') => {
    const idx = slides.findIndex((s: any) => s.id === slideId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === slides.length - 1)) {
      return;
    }
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    updateMeta({ slides: newSlides });
  };

  return { slides, addSlide, updateSlide, removeSlide, moveSlide };
}


function generateId(): string {
  return `slide-${Math.random().toString(36).substr(2, 9)}`;
}


/**
 * Hook that builds the full SlideViewModel[], reactive to notebook metadata
 * AND individual cell metadata changes.
 */
export function useSlideViewModel(
  notebook: INotebookModel | null
): [SlideViewModel[], () => void] {
  const rebuild = useCallback(() => {
    if (!notebook) return [];
    return buildSlideViewModel(notebook);
  }, [notebook]);

  const [viewModel, setViewModel] = useState<SlideViewModel[]>(() =>
    notebook ? buildSlideViewModel(notebook) : []
  );

  const refresh = useCallback(() => {
    setViewModel(notebook ? buildSlideViewModel(notebook) : []);
  }, [notebook, rebuild]);

  // Rebuild on notebook metadata changes (slide list, global theme, etc.)
  useEffect(() => {
    if (!notebook) return;
    notebook.metadataChanged.connect(refresh);
    return () => { notebook.metadataChanged.disconnect(refresh); };
  }, [notebook, refresh]);

  // Rebuild on cell list changes (add, remove, move)
  useEffect(() => {
    if (!notebook) return;
    const handler = () => refresh();
    notebook.cells.changed.connect(handler);
    return () => { notebook.cells.changed.disconnect(handler); };
  }, [notebook, refresh]);

  // Initial build when notebook changes
  useEffect(() => {
    refresh();
  }, [notebook, refresh]);

  return [viewModel, refresh];
}
