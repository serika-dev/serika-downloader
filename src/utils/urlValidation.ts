// Supported platforms and their URL patterns
type Platform = {
  name: string;
  patterns: RegExp[];
  playlistPatterns?: RegExp[];
  icon: string;
  warning?: string;
};

export const SUPPORTED_PLATFORMS: Platform[] = [
  {
    name: 'YouTube',
    patterns: [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
      /^(https?:\/\/)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^(https?:\/\/)?(music\.)?youtube\.com\/watch\?v=[\w-]+/,
    ],
    playlistPatterns: [
      /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
      /[&?]list=[\w-]+/,
      /^(https?:\/\/)?(music\.)?youtube\.com\/playlist\?list=[\w-]+/,
    ],
    icon: '🎬',
  },
  {
    name: 'SoundCloud',
    patterns: [
      /^(https?:\/\/)?(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?soundcloud\.com\/[\w-]+\/sets\/[\w-]+/,
      /^(https?:\/\/)?(on\.)?soundcloud\.com\/[\w-]+/,
      /^(https?:\/\/)?api(-v2)?\.soundcloud\.com\/tracks\/\d+/,
    ],
    playlistPatterns: [
      /^(https?:\/\/)?(www\.)?soundcloud\.com\/[\w-]+\/sets\/[\w-]+/,
    ],
    icon: '🎵',
  },
  {
    name: 'Twitter/X',
    patterns: [
      /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/[\w]+\/status\/\d+/,
      /^(https?:\/\/)?(mobile\.)?(twitter|x)\.com\/[\w]+\/status\/\d+/,
    ],
    icon: '🐦',
  },
  {
    name: 'Vimeo',
    patterns: [
      /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/,
      /^(https?:\/\/)?(www\.)?vimeo\.com\/[\w-]+\/[\w-]+/,
      /^(https?:\/\/)?player\.vimeo\.com\/video\/\d+/,
    ],
    icon: '🎥',
  },
  {
    name: 'TikTok',
    patterns: [
      /^(https?:\/\/)?(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
      /^(https?:\/\/)?(www\.)?tiktok\.com\/t\/[\w]+/,
      /^(https?:\/\/)?vm\.tiktok\.com\/[\w]+/,
    ],
    icon: '📱',
  },
  {
    name: 'Instagram',
    patterns: [
      /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?instagram\.com\/stories\/[\w.-]+\/\d+/,
    ],
    icon: '📸',
  },
  {
    name: 'Facebook',
    patterns: [
      /^(https?:\/\/)?(www\.|m\.)?facebook\.com\/.*\/videos\/\d+/,
      /^(https?:\/\/)?(www\.|m\.)?facebook\.com\/watch\/?\?v=\d+/,
      /^(https?:\/\/)?(www\.|m\.)?facebook\.com\/reel\/\d+/,
      /^(https?:\/\/)?fb\.watch\/[\w]+/,
    ],
    icon: '👤',
  },
  {
    name: 'Twitch',
    patterns: [
      /^(https?:\/\/)?(www\.)?twitch\.tv\/videos\/\d+/,
      /^(https?:\/\/)?(www\.)?twitch\.tv\/[\w]+\/clip\/[\w-]+/,
      /^(https?:\/\/)?clips\.twitch\.tv\/[\w-]+/,
    ],
    icon: '🎮',
  },
  {
    name: 'Dailymotion',
    patterns: [
      /^(https?:\/\/)?(www\.)?dailymotion\.com\/video\/[\w]+/,
      /^(https?:\/\/)?dai\.ly\/[\w]+/,
    ],
    icon: '📺',
  },
  {
    name: 'Bilibili',
    patterns: [
      /^(https?:\/\/)?(www\.)?bilibili\.com\/video\/[\w]+/,
      /^(https?:\/\/)?(www\.)?b23\.tv\/[\w]+/,
    ],
    playlistPatterns: [
      /^(https?:\/\/)?(www\.)?bilibili\.com\/medialist\/play\//,
      /^(https?:\/\/)?(www\.)?bilibili\.com\/bangumi\/play\//,
    ],
    icon: '🎬',
    warning: '⚠️ Bilibili requires cookies for best results. Upload your cookies file in the Advanced tab to avoid errors.',
  },
  {
    name: 'Reddit',
    patterns: [
      /^(https?:\/\/)?(www\.|old\.)?reddit\.com\/r\/[\w]+\/comments\/[\w]+/,
      /^(https?:\/\/)?v\.redd\.it\/[\w]+/,
    ],
    icon: '🤖',
  },
  {
    name: 'Spotify',
    patterns: [
      /^(https?:\/\/)?(open\.)?spotify\.com\/track\/[\w]+/,
      /^(https?:\/\/)?(open\.)?spotify\.com\/album\/[\w]+/,
      /^(https?:\/\/)?(open\.)?spotify\.com\/playlist\/[\w]+/,
    ],
    playlistPatterns: [
      /^(https?:\/\/)?(open\.)?spotify\.com\/album\/[\w]+/,
      /^(https?:\/\/)?(open\.)?spotify\.com\/playlist\/[\w]+/,
    ],
    icon: '🎧',
  },
  {
    name: 'Niconico',
    patterns: [
      /^(https?:\/\/)?(www\.)?nicovideo\.jp\/watch\/(sm|nm|so)?\d+/,
      /^(https?:\/\/)?nico\.ms\/(sm|nm|so)?\d+/,
      /^(https?:\/\/)?(www\.)?nicovideo\.jp\/user\/\d+\/mylist\/\d+/,
      /^(https?:\/\/)?(www\.)?nicovideo\.jp\/mylist\/\d+/,
      /^(https?:\/\/)?(live\.)?nicovideo\.jp\/watch\/lv\d+/,
    ],
    playlistPatterns: [
      /^(https?:\/\/)?(www\.)?nicovideo\.jp\/user\/\d+\/mylist\/\d+/,
      /^(https?:\/\/)?(www\.)?nicovideo\.jp\/mylist\/\d+/,
    ],
    icon: '📺',
  },
  {
    name: 'Odysee',
    patterns: [
      /^(https?:\/\/)?(www\.)?odysee\.com\/@[\w-:]+\/[\w-:]+/,
      /^(https?:\/\/)?(www\.)?odysee\.com\/\$\/[\w]+\/[\w-:]+/,
    ],
    icon: '🌊',
  },
  {
    name: 'Direct Media',
    patterns: [
      // Video formats
      /^https?:\/\/.+\.(mp4|webm|mkv|avi|mov|wmv|flv|m4v|3gp|ogv)(\?.*)?$/i,
      // Audio formats
      /^https?:\/\/.+\.(mp3|m4a|wav|flac|ogg|opus|aac|wma|aiff)(\?.*)?$/i,
      // Playlist formats
      /^https?:\/\/.+\.(m3u8|m3u|pls)(\?.*)?$/i,
    ],
    icon: '📁',
  },
];

export type UrlValidationResult = {
  isValid: boolean;
  platform?: string;
  icon?: string;
  error?: string;
  warning?: string;
  isPlaylist?: boolean;
};

export function validateUrl(url: string): UrlValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false };
  }

  const trimmedUrl = url.trim();

  // Check if it's a valid URL format
  try {
    // Add protocol if missing for URL parsing
    const urlWithProtocol = trimmedUrl.match(/^https?:\/\//) 
      ? trimmedUrl 
      : `https://${trimmedUrl}`;
    new URL(urlWithProtocol);
  } catch {
    return { 
      isValid: false, 
      error: 'Invalid URL format' 
    };
  }

  // Check against supported platforms
  for (const platform of SUPPORTED_PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(trimmedUrl)) {
        // Check if it's a playlist
        let isPlaylist = false;
        if (platform.playlistPatterns) {
          for (const playlistPattern of platform.playlistPatterns) {
            if (playlistPattern.test(trimmedUrl)) {
              isPlaylist = true;
              break;
            }
          }
        }
        
        return {
          isValid: true,
          platform: platform.name,
          icon: platform.icon,
          warning: platform.warning,
          isPlaylist,
        };
      }
    }
  }

  // URL format is valid but platform is not supported
  return {
    isValid: false,
    error: 'Unsupported platform',
  };
}

export function getPlatformFromUrl(url: string): string | null {
  const result = validateUrl(url);
  return result.isValid ? result.platform || null : null;
}
