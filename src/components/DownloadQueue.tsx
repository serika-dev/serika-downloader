'use client';

import { useDownloadStore } from '@/store/downloadStore';
import { motion, AnimatePresence } from 'framer-motion';

export function DownloadQueue() {
  const { downloads, removeDownload, clearCompleted } = useDownloadStore();

  if (downloads.length === 0) {
    return null;
  }

  const completed = downloads.filter((d) => d.status === 'completed').length;
  const inProgress = downloads.filter((d) => d.status === 'downloading' || d.status === 'processing').length;

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-white flex items-center gap-3">
          Queue
          {inProgress > 0 && (
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-xs border border-purple-500/20">
              {inProgress} active
            </span>
          )}
        </h2>
        {completed > 0 && (
          <button
            onClick={clearCompleted}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {downloads.map((download) => (
            <motion.div
              key={download.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition-colors"
            >
              {/* Progress bar background */}
              {download.status === 'downloading' && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${download.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-4">
                {/* Thumbnail */}
                {download.thumbnail ? (
                  <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                    <img
                      src={download.thumbnail}
                      alt={download.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl">🎬</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate mb-1">
                    {download.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <StatusBadge status={download.status} />
                    {download.status === 'downloading' && (
                      <>
                        <span className="text-zinc-400">{download.progress.toFixed(0)}%</span>
                        {download.speed && <span>{download.speed}</span>}
                        {download.eta && <span>{download.eta}</span>}
                      </>
                    )}
                    {download.size && <span>{download.size}</span>}
                  </div>

                  {download.error && (
                    <p className="text-red-400 text-xs mt-1">{download.error}</p>
                  )}
                </div>

                {/* Actions - Download button and dismiss */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {download.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(download.id, download.filename || download.title);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
                    >
                      ↓ Download
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDownload(download.id);
                    }}
                    className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

async function downloadFile(downloadId: string, filename: string) {
  try {
    const response = await fetch(`/api/file?id=${downloadId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to download file');
    }

    // Get the actual filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let actualFilename = filename || 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        actualFilename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = actualFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error: any) {
    console.error('Download error:', error);
    alert(error.message || 'Failed to download file');
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'text-zinc-500',
    downloading: 'text-purple-400',
    processing: 'text-blue-400',
    completed: 'text-emerald-400',
    error: 'text-red-400',
  };

  const labels = {
    pending: 'Pending',
    downloading: 'Downloading',
    processing: 'Processing',
    completed: 'Completed',
    error: 'Failed',
  };

  return (
    <span className={`${styles[status as keyof typeof styles]} font-medium`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}
