'use client';

import { useState, useRef, useEffect } from 'react';
import { useDownloadStore } from '@/store/downloadStore';
import { motion, AnimatePresence } from 'framer-motion';

// Track which downloads are currently being fetched
const downloadingFiles = new Set<string>();

export function QueuePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { downloads, removeDownload, clearCompleted } = useDownloadStore();

  const completed = downloads.filter((d) => d.status === 'completed').length;
  const inProgress = downloads.filter((d) => d.status === 'downloading' || d.status === 'processing').length;
  const hasErrors = downloads.some((d) => d.status === 'error');

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-open when new download starts
  useEffect(() => {
    if (inProgress > 0) {
      setIsOpen(true);
    }
  }, [downloads.length]);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Queue Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 group backdrop-blur-sm"
      >
        {/* Download Icon */}
        <svg 
          className={`w-6 h-6 transition-colors ${inProgress > 0 ? 'text-purple-400' : 'text-zinc-400 group-hover:text-white'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
          />
        </svg>

        {/* Badge */}
        {downloads.length > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full border-2 border-zinc-950 ${
            hasErrors ? 'bg-red-500 text-white' :
            inProgress > 0 ? 'bg-purple-500 text-white animate-pulse' : 
            'bg-emerald-500 text-white'
          }`}>
            {downloads.length}
          </span>
        )}

        {/* Loading ring animation */}
        {inProgress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              className="text-purple-500/20"
              strokeWidth="2"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
            />
            <motion.circle
              className="text-purple-500"
              strokeWidth="2"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: downloads.find(d => d.status === 'downloading')?.progress 
                  ? downloads.find(d => d.status === 'downloading')!.progress / 100 
                  : 0 
              }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] overflow-hidden bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Processing Queue</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                  BETA
                </span>
              </div>
              {completed > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕ clear
                </button>
              )}
            </div>

            {/* Queue Items */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {downloads.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No downloads in queue
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {downloads.map((download) => (
                    <QueueItem
                      key={download.id}
                      download={download}
                      onRemove={() => removeDownload(download.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QueueItem({ 
  download, 
  onRemove 
}: { 
  download: any; 
  onRemove: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isActive = download.status === 'downloading' || download.status === 'processing';
  const isCompleted = download.status === 'completed';
  const isError = download.status === 'error';

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent double-clicks
    if (isDownloading || downloadingFiles.has(download.id)) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    downloadingFiles.add(download.id);
    
    try {
      await downloadFileWithProgress(
        download.id, 
        download.filename || download.title,
        (progress) => setDownloadProgress(progress)
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      downloadingFiles.delete(download.id);
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-zinc-800/30 transition-colors group">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {download.thumbnail ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
            <img
              src={download.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
            <span className="text-sm">🎬</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate leading-tight">
            {download.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-1">
            {isActive && (
              <>
                <span className="text-xs text-zinc-400">
                  {download.status === 'processing' ? 'processing' : 'downloading'}:
                </span>
                <span className="text-xs text-purple-400 font-medium">
                  {download.progress?.toFixed(0) || 0}%
                </span>
                {download.speed && (
                  <span className="text-xs text-zinc-500">{download.speed}</span>
                )}
              </>
            )}
            {isCompleted && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {download.size || 'Ready'}
              </span>
            )}
            {isError && (
              <span className="text-xs text-red-400">Failed</span>
            )}
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${download.progress || 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCompleted && (
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className={`relative p-2 rounded-lg transition-colors ${
                isDownloading 
                  ? 'cursor-not-allowed' 
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title={isDownloading ? `Downloading ${downloadProgress}%` : 'Download'}
            >
              {isDownloading ? (
                <div className="relative w-5 h-5">
                  {/* Background circle */}
                  <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-zinc-700"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-emerald-400 transition-all duration-300"
                      strokeDasharray={`${2 * Math.PI * 10}`}
                      strokeDashoffset={`${2 * Math.PI * 10 * (1 - downloadProgress / 100)}`}
                    />
                  </svg>
                  {/* Percentage text */}
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-emerald-400">
                    {downloadProgress > 0 ? downloadProgress : ''}
                  </span>
                </div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

async function downloadFileWithProgress(
  downloadId: string, 
  filename: string,
  onProgress: (progress: number) => void
) {
  console.log('[downloadFile] Starting download:', { downloadId, filename });
  
  try {
    // First, do a HEAD request to check if file exists and get info
    const checkResponse = await fetch(`/api/file?id=${downloadId}`, { method: 'HEAD' });
    
    if (!checkResponse.ok) {
      // If HEAD fails, try GET to get error message
      const errorResponse = await fetch(`/api/file?id=${downloadId}`);
      const errorData = await errorResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'File not found or download expired');
    }

    // File exists - use direct browser download (handles large files properly)
    // This streams directly to disk without loading into memory
    onProgress(50); // Show some progress
    
    const downloadUrl = `/api/file?id=${downloadId}`;
    
    // Create a hidden iframe for download (better for large files than anchor click)
    // This prevents the page from potentially hanging on very large files
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    // Also create anchor as backup (some browsers prefer this)
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'download';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup after a delay
    setTimeout(() => {
      document.body.removeChild(a);
      document.body.removeChild(iframe);
    }, 5000);
    
    onProgress(100);
    console.log('[downloadFile] Download triggered successfully');
  } catch (error: any) {
    console.error('[downloadFile] Download error:', error);
    alert(error.message || 'Failed to download file');
  }
}
