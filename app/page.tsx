'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DownloadForm } from '@/components/DownloadForm';
import { QueuePopover } from '@/components/QueuePopover';
import { BackgroundShapes } from '@/components/BackgroundShapes';
import { useDownloadStore } from '@/store/downloadStore';
import { DownloadOptions } from '@/types/download';
import { v4 as uuidv4 } from 'uuid';

interface PlaylistPromptData {
  options: DownloadOptions;
  videoInfo: any;
  platform: string;
  playlistCount: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [playlistPrompt, setPlaylistPrompt] = useState<PlaylistPromptData | null>(null);
  const [customSelection, setCustomSelection] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const { addDownload, updateDownload } = useDownloadStore();

  const handleDownload = async (options: DownloadOptions) => {
    setLoading(true);
    const tempId = uuidv4(); // Temporary ID until server responds

    try {
      // First, get video info (pass cookies for platforms that need them)
      const infoResponse = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: options.url, cookies: options.cookies }),
      });

      if (!infoResponse.ok) {
        throw new Error('Failed to fetch video information');
      }

      const videoInfo = await infoResponse.json();
      
      console.log('[Frontend] Video info received:', {
        isPlaylist: videoInfo.isPlaylist,
        playlistCount: videoInfo.playlistCount,
        playlistTitle: videoInfo.playlistTitle,
        noPlaylist: options.noPlaylist,
      });

      // Check if API detected a playlist and user hasn't already made a choice
      if (videoInfo.isPlaylist && videoInfo.playlistCount > 1 && options.noPlaylist === undefined) {
        console.log('[Frontend] Showing playlist prompt');
        // Show playlist prompt
        setLoading(false);
        setPlaylistPrompt({
          options,
          videoInfo,
          platform: getPlatformFromUrl(options.url),
          playlistCount: videoInfo.playlistCount,
        });
        return;
      }

      // Continue with download
      await startDownload(options, videoInfo, tempId);
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
      setLoading(false);
    }
  };

  const startDownload = async (options: DownloadOptions, videoInfo: any, tempId: string) => {
    try {
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

  const handlePlaylistChoice = async (choice: 'all' | 'first' | 'custom') => {
    if (!playlistPrompt) return;
    
    setLoading(true);
    const tempId = uuidv4();
    
    // Update options based on choice
    let updatedOptions = { ...playlistPrompt.options };
    
    if (choice === 'all') {
      // Download all - no special flags needed
      updatedOptions.noPlaylist = false;
      updatedOptions.playlistItems = undefined;
    } else if (choice === 'first') {
      // Download only first
      updatedOptions.noPlaylist = true;
      updatedOptions.playlistItems = undefined;
    } else if (choice === 'custom' && customSelection.trim()) {
      // Custom selection - use playlist-items
      updatedOptions.noPlaylist = false;
      updatedOptions.playlistItems = customSelection.trim();
    }
    
    setPlaylistPrompt(null);
    setCustomSelection('');
    setShowCustomInput(false);
    await startDownload(updatedOptions, playlistPrompt.videoInfo, tempId);
  };

  const getPlatformFromUrl = (url: string): string => {
    if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'Bilibili';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('soundcloud.com')) return 'SoundCloud';
    if (url.includes('spotify.com')) return 'Spotify';
    if (url.includes('nicovideo.jp') || url.includes('nico.ms')) return 'Niconico';
    return 'this platform';
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
      
      {/* Fixed Top Right Queue Icon */}
      <div className="fixed top-4 right-4 z-50">
        <QueuePopover />
      </div>
      
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
        </main>
      </div>

      {/* Playlist Prompt Modal */}
      {playlistPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setPlaylistPrompt(null);
              setShowCustomInput(false);
              setCustomSelection('');
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in duration-300">
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-sm -z-10" />
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/25">
                📋
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">
                  Playlist Detected
                </h3>
                <p className="text-zinc-400 text-sm">
                  {playlistPrompt.platform} • {playlistPrompt.playlistCount} videos
                </p>
              </div>
            </div>
            
            {/* Playlist title */}
            {playlistPrompt.videoInfo.playlistTitle && (
              <div className="bg-zinc-800/50 rounded-xl px-4 py-3 mb-6 border border-zinc-700/50">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Playlist</p>
                <p className="text-white text-sm font-medium truncate">
                  {playlistPrompt.videoInfo.playlistTitle}
                </p>
              </div>
            )}
            
            {/* Description */}
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              This link contains <span className="text-purple-400 font-semibold">{playlistPrompt.playlistCount} videos</span>. 
              Choose how you'd like to download them.
            </p>
            
            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Download All */}
              <button
                onClick={() => handlePlaylistChoice('all')}
                disabled={loading}
                className="group relative px-4 py-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-purple-600/50 disabled:to-purple-700/50 text-white rounded-2xl font-medium text-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl">📥</span>
                    <span>Download All</span>
                    <span className="text-purple-200 text-xs">{playlistPrompt.playlistCount} videos</span>
                  </>
                )}
              </button>
              
              {/* First Only */}
              <button
                onClick={() => handlePlaylistChoice('first')}
                disabled={loading}
                className="group px-4 py-4 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 text-white rounded-2xl font-medium text-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-600 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl">1️⃣</span>
                    <span>First Only</span>
                    <span className="text-zinc-400 text-xs">Single video</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Custom Selection */}
            <div className="mt-4">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-700/50 hover:border-zinc-600"
                >
                  <span>🎯</span>
                  <span>Select Specific Videos</span>
                </button>
              ) : (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative">
                    <input
                      type="text"
                      value={customSelection}
                      onChange={(e) => setCustomSelection(e.target.value)}
                      placeholder="e.g., 23 or 1,5,10 or 1-5"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-purple-500 rounded-xl text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                      1-{playlistPrompt.playlistCount}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlaylistChoice('custom')}
                      disabled={loading || !customSelection.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-600/50 disabled:to-teal-600/50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Download Selected</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomSelection('');
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors"
                    >
                      Back
                    </button>
                  </div>
                  <p className="text-zinc-500 text-xs text-center">
                    💡 Use commas for multiple (1,3,5) or dash for range (1-10)
                  </p>
                </div>
              )}
            </div>
            
            {/* Cancel */}
            <button
              onClick={() => {
                setPlaylistPrompt(null);
                setShowCustomInput(false);
                setCustomSelection('');
              }}
              className="w-full mt-4 px-4 py-2.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors rounded-xl hover:bg-zinc-800/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
