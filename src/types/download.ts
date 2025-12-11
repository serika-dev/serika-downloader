export interface DownloadOptions {
  url: string;
  format: string;
  quality: string;
  audioFormat?: string;
  videoCodec?: string;
  audioCodec?: string;
  fps?: string;
  downloadThumbnail: boolean;
  audioOnly: boolean;
  videoOnly: boolean;
  thumbnailOnly?: boolean;
  thumbnailFormat?: string;
  thumbnailQuality?: string;
  subtitlesOnly?: boolean;
  subtitleFormat?: string;
  subtitleLangs?: string;
  autoSubs?: boolean;
  liveChatOnly?: boolean;
  commentsOnly?: boolean;
  subtitles: boolean;
  embedMetadata: boolean;
  embedThumbnail: boolean;
  embedSubtitles?: boolean;
  splitChapters?: boolean;
  sponsorBlock: boolean;
  customArgs?: string;
  cookies?: string;
  proxy?: string;
  userAgent?: string;
  noPlaylist?: boolean;
  playlistItems?: string; // e.g., "1", "1,3,5", "1-5", "23,45,21"
}

export interface DownloadProgress {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'error';
  progress: number;
  speed?: string;
  eta?: string;
  size?: string;
  error?: string;
  filename?: string;
  downloadPath?: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  description: string;
  uploader: string;
  formats: VideoFormat[];
  thumbnails: Thumbnail[];
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
  fps?: number;
  resolution?: string;
  format_note?: string;
  tbr?: number;
  abr?: number;
  vbr?: number;
}

export interface Thumbnail {
  url: string;
  id: string;
  resolution?: string;
}

export interface AudioFormat {
  id: string;
  name: string;
  ext: string;
  quality: string;
}

export interface VideoQuality {
  id: string;
  label: string;
  resolution: string;
}
