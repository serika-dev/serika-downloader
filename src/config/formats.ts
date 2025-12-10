import { AudioFormat, VideoQuality } from '@/types/download';

export const AUDIO_FORMATS: AudioFormat[] = [
  { id: 'flac', name: 'FLAC (Lossless)', ext: 'flac', quality: 'lossless' },
  { id: 'wav', name: 'WAV (Lossless)', ext: 'wav', quality: 'lossless' },
  { id: 'alac', name: 'ALAC (Lossless)', ext: 'm4a', quality: 'lossless' },
  { id: 'mp3-320', name: 'MP3 320kbps', ext: 'mp3', quality: '320' },
  { id: 'mp3-256', name: 'MP3 256kbps', ext: 'mp3', quality: '256' },
  { id: 'mp3-192', name: 'MP3 192kbps', ext: 'mp3', quality: '192' },
  { id: 'mp3-128', name: 'MP3 128kbps', ext: 'mp3', quality: '128' },
  { id: 'aac', name: 'AAC', ext: 'm4a', quality: 'high' },
  { id: 'opus', name: 'Opus', ext: 'opus', quality: 'high' },
  { id: 'vorbis', name: 'Vorbis', ext: 'ogg', quality: 'high' },
];

export const VIDEO_QUALITIES: VideoQuality[] = [
  { id: '2160p', label: '4K (2160p)', resolution: '2160' },
  { id: '1440p', label: '2K (1440p)', resolution: '1440' },
  { id: '1080p', label: 'Full HD (1080p)', resolution: '1080' },
  { id: '720p', label: 'HD (720p)', resolution: '720' },
  { id: '480p', label: 'SD (480p)', resolution: '480' },
  { id: '360p', label: '360p', resolution: '360' },
  { id: '240p', label: '240p', resolution: '240' },
  { id: '144p', label: '144p', resolution: '144' },
];

export const VIDEO_CODECS = [
  { id: 'h264', name: 'H.264/AVC', ext: 'mp4' },
  { id: 'h265', name: 'H.265/HEVC', ext: 'mp4' },
  { id: 'vp9', name: 'VP9', ext: 'webm' },
  { id: 'av1', name: 'AV1', ext: 'webm' },
];

export const AUDIO_CODECS = [
  { id: 'aac', name: 'AAC' },
  { id: 'opus', name: 'Opus' },
  { id: 'vorbis', name: 'Vorbis' },
  { id: 'mp3', name: 'MP3' },
];

export const CONTAINER_FORMATS = [
  { id: 'mp4', name: 'MP4' },
  { id: 'webm', name: 'WebM' },
  { id: 'mkv', name: 'MKV' },
  { id: 'avi', name: 'AVI' },
  { id: 'mov', name: 'MOV' },
];

export const FPS_OPTIONS = [
  { id: 'source', name: 'Source FPS' },
  { id: '144', name: '144 FPS' },
  { id: '120', name: '120 FPS' },
  { id: '60', name: '60 FPS' },
  { id: '30', name: '30 FPS' },
  { id: '24', name: '24 FPS' },
];

export const YTDLP_OPTIONS = {
  concurrent_fragments: 16,
  retries: 10,
  fragment_retries: 10,
  buffer_size: '16K',
  http_chunk_size: '10M',
  throttled_rate: '100K',
  ratelimit: null,
  external_downloader: 'aria2c',
  external_downloader_args: [
    '-x', '16',
    '-s', '16',
    '-k', '1M',
    '--max-connection-per-server=16',
    '--min-split-size=1M',
    '--split=16',
  ],
};
