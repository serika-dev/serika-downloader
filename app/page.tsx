'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DownloadForm } from '@/components/DownloadForm';
import { DownloadQueue } from '@/components/DownloadQueue';
import { BackgroundShapes } from '@/components/BackgroundShapes';
import { useDownloadStore } from '@/store/downloadStore';
import { DownloadOptions } from '@/types/download';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const { addDownload, updateDownload } = useDownloadStore();

  const handleDownload = async (options: DownloadOptions) => {
    setLoading(true);
    const tempId = uuidv4(); // Temporary ID until server responds

    try {
      // First, get video info
      const infoResponse = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: options.url }),
      });

      if (!infoResponse.ok) {
        throw new Error('Failed to fetch video information');
      }

      const videoInfo = await infoResponse.json();

      // Start download first to get the server's downloadId
      const downloadResponse = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to start download');
      }

      const { downloadId: serverDownloadId } = await downloadResponse.json();

      // Add to queue with the SERVER's downloadId
      addDownload({
        id: serverDownloadId,
        url: options.url,
        title: videoInfo.title || 'Unknown Title',
        thumbnail: videoInfo.thumbnail,
        status: 'downloading',
        progress: 0,
      });

      // Poll for progress using the SERVER's downloadId
      pollProgress(serverDownloadId);
    } catch (error: any) {
      console.error('Download error:', error);
      // Add error item to queue
      addDownload({
        id: tempId,
        url: options.url,
        title: 'Download Failed',
        status: 'error',
        progress: 0,
        error: error.message || 'Failed to download',
      });
    } finally {
      setLoading(false);
    }
  };

  const pollProgress = (downloadId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/status?id=${downloadId}`);
        const status = await statusResponse.json();

        console.log(`[${downloadId}] Status:`, status); // Debug log

        if (status.status === 'error') {
          clearInterval(pollInterval);
          updateDownload(downloadId, {
            status: 'error',
            progress: status.progress || 0,
            error: status.error || 'Download failed',
          });
        } else if (status.status === 'completed' || status.progress === 100) {
          clearInterval(pollInterval);
          updateDownload(downloadId, {
            status: 'completed',
            progress: 100,
            filename: status.filename,
          });
        } else if (status.status === 'processing') {
          updateDownload(downloadId, {
            status: 'processing',
            progress: status.progress || 95,
          });
        } else {
          updateDownload(downloadId, {
            status: 'downloading',
            progress: status.progress || 0,
            speed: status.speed,
            eta: status.eta,
          });
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 1000); // Poll every second

    // Fallback: stop polling after 1 hour
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 3600000);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <BackgroundShapes />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="w-full max-w-5xl mb-3 flex flex-col items-center text-center">
          <div className="relative w-32 h-32 mb-2 flex items-center justify-center">
            <div className="absolute inset-0 bg-purple-500/35 blur-2xl rounded-full animate-pulse" />
            <Image
              src="/logo.svg"
              alt="Serika"
              width={256}
              height={256}
              className="object-contain drop-shadow-[0_15px_50px_rgba(168,85,247,0.7)] relative z-10 scale-150"
              priority
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-5xl flex flex-col items-center gap-4">
          <DownloadForm onSubmit={handleDownload} loading={loading} />
          <DownloadQueue />
        </main>
      </div>
    </div>
  );
}
