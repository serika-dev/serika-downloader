'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadOptions } from '@/types/download';
import { 
  AUDIO_FORMATS, 
  VIDEO_QUALITIES, 
  VIDEO_CODECS, 
  AUDIO_CODECS, 
  CONTAINER_FORMATS,
  FPS_OPTIONS 
} from '@/config/formats';
import { validateUrl, UrlValidationResult } from '@/utils/urlValidation';

interface DownloadFormProps {
  onSubmit: (options: DownloadOptions) => void;
  loading: boolean;
}

type Tab = 'general' | 'advanced' | 'metadata';

export function DownloadForm({ onSubmit, loading }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'video' | 'audio' | 'thumbnail' | 'subtitles'>('video');
  
  // URL validation
  const urlValidation: UrlValidationResult = useMemo(() => {
    return validateUrl(url);
  }, [url]);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  
  // General
  const [quality, setQuality] = useState('1080p');
  const [container, setContainer] = useState('mp4');
  const [audioFormat, setAudioFormat] = useState('mp3-320');
  const [thumbnailFormat, setThumbnailFormat] = useState('jpg');
  const [thumbnailQuality, setThumbnailQuality] = useState('best');
  const [subtitleFormat, setSubtitleFormat] = useState('srt');
  const [subtitleLangs, setSubtitleLangs] = useState('all');
  const [autoSubs, setAutoSubs] = useState(true);
  
  // Advanced
  const [videoCodec, setVideoCodec] = useState('h264');
  const [audioCodec, setAudioCodec] = useState('aac');
  const [fps, setFps] = useState('source');
  const [customArgs, setCustomArgs] = useState('');
  const [cookiesFile, setCookiesFile] = useState<File | null>(null);
  
  // Metadata
  const [downloadThumbnail, setDownloadThumbnail] = useState(true);
  const [embedThumbnail, setEmbedThumbnail] = useState(true);
  const [subtitles, setSubtitles] = useState(false);
  const [embedSubtitles, setEmbedSubtitles] = useState(false);
  const [embedMetadata, setEmbedMetadata] = useState(true);
  const [splitChapters, setSplitChapters] = useState(false);
  const [sponsorBlock, setSponsorBlock] = useState(false);

  // Playlist handling
  const [playlistChoice, setPlaylistChoice] = useState<'all' | 'first' | null>(null);
  const [showPlaylistPrompt, setShowPlaylistPrompt] = useState(false);

  // Show playlist prompt when a playlist URL is detected
  const isPlaylistUrl = urlValidation.isValid && urlValidation.isPlaylist;
  
  // Reset playlist choice when URL changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setPlaylistChoice(null);
    setShowPlaylistPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !urlValidation.isValid) return;

    // Convert cookies file to base64 if provided
    let cookiesData: string | undefined;
    if (cookiesFile) {
      const reader = new FileReader();
      cookiesData = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(cookiesFile);
      });
    }

    const options: DownloadOptions = {
      url: url.trim(),
      format: container,
      quality,
      audioOnly: mode === 'audio',
      videoOnly: false,
      thumbnailOnly: mode === 'thumbnail',
      thumbnailFormat: mode === 'thumbnail' ? thumbnailFormat : undefined,
      thumbnailQuality: mode === 'thumbnail' ? thumbnailQuality : undefined,
      subtitlesOnly: mode === 'subtitles',
      subtitleFormat: mode === 'subtitles' ? subtitleFormat : undefined,
      subtitleLangs: mode === 'subtitles' ? subtitleLangs : undefined,
      autoSubs: mode === 'subtitles' ? autoSubs : undefined,
      audioFormat: mode === 'audio' ? audioFormat : undefined,
      videoCodec: mode === 'video' ? videoCodec : undefined,
      audioCodec: mode === 'video' ? audioCodec : undefined,
      fps,
      downloadThumbnail: mode === 'video' || mode === 'audio' ? downloadThumbnail : false,
      embedThumbnail,
      subtitles,
      embedSubtitles,
      embedMetadata,
      splitChapters,
      sponsorBlock,
      customArgs,
      cookies: cookiesData,
      // Playlist handling: only set noPlaylist if user made a choice from URL-based detection
      // Leave undefined for API-based detection (Bilibili anthologies) so page.tsx can show its modal
      noPlaylist: isPlaylistUrl ? (playlistChoice === 'first') : undefined,
    };

    onSubmit(options);
    setUrl('');
    setCookiesFile(null); // Reset cookies file after submit
    setPlaylistChoice(null); // Reset playlist choice after submit
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* URL Input */}
        <div className="relative group">
          <div className={`absolute -inset-1 rounded-2xl blur transition duration-1000 group-hover:duration-200 ${
            url && !urlValidation.isValid
              ? 'bg-gradient-to-r from-red-600 to-red-500 opacity-50'
              : url && urlValidation.isValid
              ? 'bg-gradient-to-r from-green-600 to-emerald-500 opacity-50'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 opacity-25 group-hover:opacity-50'
          }`} />
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste video URL here..."
              disabled={loading}
              className={`relative w-full px-8 py-5 pr-14 bg-black rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all text-lg shadow-2xl ${
                url && !urlValidation.isValid
                  ? 'border-2 border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                  : url && urlValidation.isValid
                  ? 'border-2 border-green-500 focus:border-green-400 focus:ring-1 focus:ring-green-400'
                  : 'border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
              }`}
            />
            {/* Validation Icon */}
            <AnimatePresence>
              {url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {urlValidation.isValid ? (
                    <div className="flex items-center gap-2">
                      {urlValidation.icon && (
                        <span className="text-lg" title={urlValidation.platform}>
                          {urlValidation.icon}
                        </span>
                      )}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                      title={urlValidation.error || 'Unsupported URL'}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Validation Message */}
          <AnimatePresence>
            {url && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm space-y-1"
              >
                {urlValidation.isValid ? (
                  <>
                    <span className="text-green-400 block">
                      ✓ {urlValidation.platform} URL detected
                    </span>
                    {urlValidation.warning && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-xs">
                        {urlValidation.warning}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-red-400">
                    ✗ {urlValidation.error || 'URL not supported'}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlist Prompt */}
          <AnimatePresence>
            {isPlaylistUrl && playlistChoice === null && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-3"
              >
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📋</span>
                    <div className="flex-1">
                      <p className="text-purple-300 font-medium mb-3">
                        We noticed you're trying to download from a {urlValidation.platform} playlist. Would you like to download all items, or just the first one?
                      </p>
                      <div className="flex gap-2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPlaylistChoice('all')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          📥 Download All
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPlaylistChoice('first')}
                          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          1️⃣ First Only
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlist Choice Indicator */}
          <AnimatePresence>
            {isPlaylistUrl && playlistChoice !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-2"
              >
                <button
                  type="button"
                  onClick={() => setPlaylistChoice(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                >
                  {playlistChoice === 'all' ? '📥 Downloading all items' : '1️⃣ Downloading first item only'}
                  <span className="text-purple-400 hover:text-purple-200">✕</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm">
          <motion.button
            type="button"
            onClick={() => setMode('video')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'video'
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <motion.span animate={{ rotate: mode === 'video' ? [0, -10, 10, 0] : 0 }} transition={{ duration: 0.5 }}>🎬</motion.span> Video
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setMode('audio')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'audio'
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <motion.span animate={{ rotate: mode === 'audio' ? [0, -10, 10, 0] : 0 }} transition={{ duration: 0.5 }}>🎵</motion.span> Audio
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setMode('thumbnail')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'thumbnail'
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <motion.span animate={{ scale: mode === 'thumbnail' ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.5 }}>🖼️</motion.span> Thumb
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setMode('subtitles')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'subtitles'
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <motion.span animate={{ y: mode === 'subtitles' ? [0, -5, 0] : 0 }} transition={{ duration: 0.5 }}>💬</motion.span> Subs
          </motion.button>
        </div>

        {/* Settings Tabs */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex border-b border-zinc-800">
            {(['general', 'advanced', 'metadata'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-white bg-zinc-800/50 border-b-2 border-purple-500'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {mode === 'video' ? (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Quality</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {VIDEO_QUALITIES.map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setQuality(q.id)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                quality === q.id
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Format</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {CONTAINER_FORMATS.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setContainer(f.id)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                container === f.id
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : mode === 'audio' ? (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-400">Audio Format</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {AUDIO_FORMATS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setAudioFormat(f.id)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                              audioFormat === f.id
                                ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="font-medium">{f.name}</div>
                            <div className="text-xs opacity-60">{f.quality}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : mode === 'thumbnail' ? (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Thumbnail Format</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setThumbnailFormat(f)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all uppercase ${
                                thumbnailFormat === f
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Quality</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['best', 'high', 'medium'].map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setThumbnailQuality(q)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all capitalize ${
                                thumbnailQuality === q
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Subtitle Format</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {['srt', 'vtt', 'ass', 'ssa', 'lrc', 'json3', 'srv1', 'srv2', 'srv3', 'ttml', 'dfxp', 'sbv'].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setSubtitleFormat(f)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all uppercase ${
                                subtitleFormat === f
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Languages</label>
                        <div className="grid grid-cols-4 gap-3">
                          {[{id: 'all', name: 'All'}, {id: 'en', name: 'English'}, {id: 'es', name: 'Spanish'}, {id: 'fr', name: 'French'}, {id: 'de', name: 'German'}, {id: 'ja', name: 'Japanese'}, {id: 'ko', name: 'Korean'}, {id: 'zh', name: 'Chinese'}].map((lang) => (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => setSubtitleLangs(lang.id)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                subtitleLangs === lang.id
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {lang.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-400">Include Auto-Generated Subtitles</label>
                        <button
                          type="button"
                          onClick={() => setAutoSubs(!autoSubs)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoSubs ? 'bg-purple-600' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoSubs ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {mode === 'video' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Video Codec</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {VIDEO_CODECS.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setVideoCodec(c.id)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                videoCodec === c.id
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400">Frame Rate</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {FPS_OPTIONS.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setFps(f.id)}
                              className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                fps === f.id
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">Cookies File (Optional)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={(e) => setCookiesFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cookies-upload"
                      />
                      <label
                        htmlFor="cookies-upload"
                        className="flex items-center justify-between w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white cursor-pointer hover:border-zinc-600 transition-colors"
                      >
                        <span className={cookiesFile ? 'text-white' : 'text-zinc-500'}>
                          {cookiesFile ? cookiesFile.name : 'Upload cookies.txt file'}
                        </span>
                        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </label>
                      {cookiesFile && (
                        <button
                          type="button"
                          onClick={() => setCookiesFile(null)}
                          className="absolute right-12 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Required for some platforms like Bilibili. Export cookies from your browser using an extension like "Get cookies.txt".
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400">Custom Arguments</label>
                    <input
                      type="text"
                      value={customArgs}
                      onChange={(e) => setCustomArgs(e.target.value)}
                      placeholder="--geo-bypass --user-agent '...'"
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <p className="text-xs text-zinc-500">
                      Add any extra yt-dlp arguments here.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'metadata' && (
                <motion.div
                  key="metadata"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <Toggle label="Download Thumbnail" checked={downloadThumbnail} onChange={setDownloadThumbnail} />
                  <Toggle label="Embed Thumbnail" checked={embedThumbnail} onChange={setEmbedThumbnail} />
                  <Toggle label="Download Subtitles" checked={subtitles} onChange={setSubtitles} />
                  <Toggle label="Embed Subtitles" checked={embedSubtitles} onChange={setEmbedSubtitles} />
                  <Toggle label="Embed Metadata" checked={embedMetadata} onChange={setEmbedMetadata} />
                  <Toggle label="Split Chapters" checked={splitChapters} onChange={setSplitChapters} />
                  <Toggle label="SponsorBlock" checked={sponsorBlock} onChange={setSponsorBlock} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url || !urlValidation.isValid}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] ${
            loading || !url || !urlValidation.isValid
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/10'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            'Download'
          )}
        </button>
      </form>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        checked
          ? 'bg-purple-500/10 border-purple-500/50'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <span className={`text-sm font-medium ${checked ? 'text-purple-200' : 'text-zinc-400'}`}>
        {label}
      </span>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-purple-500' : 'bg-zinc-700'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
