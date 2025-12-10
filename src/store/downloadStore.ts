import { DownloadProgress } from '@/types/download';
import { create } from 'zustand';

interface DownloadStore {
  downloads: DownloadProgress[];
  addDownload: (download: DownloadProgress) => void;
  updateDownload: (id: string, update: Partial<DownloadProgress>) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: [],
  addDownload: (download) =>
    set((state) => ({
      downloads: [download, ...state.downloads],
    })),
  updateDownload: (id, update) =>
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...update } : d
      ),
    })),
  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.status !== 'completed'),
    })),
}));
