import { NextRequest, NextResponse } from 'next/server';
import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 3600; // 1 hour timeout

// Store download progress in memory (use Redis in production)
export const downloadProgress = new Map<string, { 
  progress: number; 
  status?: string; 
  speed?: string; 
  eta?: string; 
  filename?: string;
  mode?: 'video' | 'audio' | 'thumbnail' | 'subtitles';
  error?: string;
}>();

// Spotify URL patterns
const SPOTIFY_TRACK_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/;
const SPOTIFY_ALBUM_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/album\/([a-zA-Z0-9]+)/;
const SPOTIFY_PLAYLIST_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/playlist\/([a-zA-Z0-9]+)/;

// Bilibili URL patterns (need custom headers to avoid 412)
const BILIBILI_REGEX = /^(https?:\/\/)?(www\.)?(bilibili\.com|b23\.tv)\//;

interface SpotifyTrackInfo {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  artwork?: string;
  releaseDate?: string;
  trackNumber?: number;
}

// Extract Spotify track info using yt-dlp's Spotify extractor (metadata only)
async function getSpotifyTrackInfo(spotifyUrl: string): Promise<SpotifyTrackInfo | null> {
  try {
    const result = execSync(
      `yt-dlp --dump-json --skip-download "${spotifyUrl}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    const info = JSON.parse(result);
    return {
      title: info.track || info.title,
      artist: info.artist || info.uploader || info.creator,
      album: info.album,
      duration: info.duration,
      artwork: info.thumbnail,
      releaseDate: info.release_date || info.upload_date,
      trackNumber: info.track_number,
    };
  } catch (error) {
    console.error('Failed to get Spotify track info:', error);
    return null;
  }
}

// Build YouTube Music search URL from Spotify track info
function buildYTMusicSearchUrl(trackInfo: SpotifyTrackInfo): string {
  const searchQuery = `${trackInfo.artist} - ${trackInfo.title}`;
  return `ytsearch1:${searchQuery}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      format = 'bestvideo+bestaudio',
      quality = 'best',
      audioFormat,
      videoCodec,
      audioCodec,
      downloadThumbnail = false,
      audioOnly = false,
      videoOnly = false,
      // Mode-specific options
      thumbnailOnly = false,
      thumbnailFormat,
      thumbnailQuality,
      subtitlesOnly = false,
      subtitleFormat,
      subtitleLangs,
      autoSubs = true,
      // Embed/metadata options
      subtitles = false,
      embedMetadata = true,
      embedThumbnail = true,
      embedSubtitles = false,
      sponsorBlock = false,
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const downloadId = uuidv4();
    const outputDir = path.join(os.tmpdir(), 'serika-downloads', downloadId);
    await fs.mkdir(outputDir, { recursive: true });

    // Determine download mode for tracking
    const downloadMode = thumbnailOnly ? 'thumbnail' : 
                         subtitlesOnly ? 'subtitles' : 
                         audioOnly ? 'audio' : 'video';

    // Check if this is a Spotify URL - handle specially
    const isSpotifyTrack = SPOTIFY_TRACK_REGEX.test(url);
    let spotifyMetadata: SpotifyTrackInfo | null = null;
    let actualUrl = url;

    if (isSpotifyTrack) {
      console.log(`[${downloadId}] Detected Spotify track URL, fetching metadata...`);
      downloadProgress.set(downloadId, { progress: 0, mode: downloadMode, status: 'fetching metadata' });
      
      spotifyMetadata = await getSpotifyTrackInfo(url);
      
      if (spotifyMetadata) {
        console.log(`[${downloadId}] Spotify track: ${spotifyMetadata.artist} - ${spotifyMetadata.title}`);
        actualUrl = buildYTMusicSearchUrl(spotifyMetadata);
        console.log(`[${downloadId}] Searching YouTube Music: ${actualUrl}`);
      } else {
        console.log(`[${downloadId}] Failed to get Spotify metadata, falling back to direct URL`);
      }
    }

    // Build yt-dlp arguments for maximum performance
    const args = buildYtdlpArgs({
      url: actualUrl,
      format,
      quality,
      audioFormat,
      videoCodec,
      audioCodec,
      downloadThumbnail,
      audioOnly: isSpotifyTrack ? true : audioOnly, // Spotify tracks are always audio-only
      videoOnly,
      // Mode-specific options
      thumbnailOnly,
      thumbnailFormat,
      thumbnailQuality,
      subtitlesOnly,
      subtitleFormat,
      subtitleLangs,
      autoSubs,
      // Embed/metadata options
      subtitles,
      embedMetadata,
      embedThumbnail,
      embedSubtitles,
      sponsorBlock,
      outputDir,
      // Spotify metadata for override
      spotifyMetadata,
    });

    // Log the yt-dlp command for debugging
    console.log(`[${downloadId}] Mode: ${downloadMode}`);
    console.log(`[${downloadId}] yt-dlp args:`, args.join(' '));

    // Return download ID immediately and process in background
    // In production, use a job queue system
    processDownload(downloadId, args, outputDir, downloadMode, spotifyMetadata);

    return NextResponse.json({ 
      downloadId, 
      status: 'started',
      message: 'Download started successfully'
    });
  } catch (error: any) {
    console.error('Error starting download:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start download' },
      { status: 500 }
    );
  }
}

function isBilibiliUrl(url: string): boolean {
  return BILIBILI_REGEX.test(url);
}

function buildYtdlpArgs(options: any): string[] {
  const args: string[] = [];

  // Output template - use Spotify metadata for filename if available
  if (options.spotifyMetadata) {
    const safeTitle = options.spotifyMetadata.title.replace(/[<>:"/\\|?*]/g, '_');
    const safeArtist = options.spotifyMetadata.artist.replace(/[<>:"/\\|?*]/g, '_');
    args.push('-o', path.join(options.outputDir, `${safeArtist} - ${safeTitle}.%(ext)s`));
  } else {
    args.push('-o', path.join(options.outputDir, '%(title)s.%(ext)s'));
  }

  // Thumbnail-only mode - handle early and return
  if (options.thumbnailOnly) {
    args.push('--skip-download');
    args.push('--write-thumbnail');
    if (options.thumbnailFormat) {
      args.push('--convert-thumbnails', options.thumbnailFormat);
    }
    args.push(options.url);
    return args;
  }

  // Subtitle-only mode - handle early and return
  if (options.subtitlesOnly) {
    args.push('--skip-download');
    args.push('--write-subs');
    if (options.autoSubs !== false) {
      args.push('--write-auto-subs');
    }
    // Handle subtitle language selection
    // If user specified 'all', limit to common languages to avoid rate limiting
    let subLangs = options.subtitleLangs || 'en';
    if (subLangs === 'all') {
      // Common languages instead of literally all to avoid 429 errors
      subLangs = 'en,en-orig,en.*,es,es.*,fr,de,pt,pt-BR,ja,ko,zh-Hans,zh-Hant,ru,ar,hi,it,nl,pl,tr,vi,-live_chat';
    }
    args.push('--sub-langs', subLangs);
    if (options.subtitleFormat) {
      args.push('--convert-subs', options.subtitleFormat);
    }
    // Don't fail if some subtitles fail to download
    args.push('--ignore-errors');
    args.push(options.url);
    return args;
  }

  // Performance optimizations (only for actual downloads)
  args.push('--concurrent-fragments', '16');
  args.push('--retries', '10');
  args.push('--fragment-retries', '10');
  args.push('--buffer-size', '16K');
  args.push('--http-chunk-size', '10M');
  args.push('--throttled-rate', '100K');

  // Site-specific headers/workarounds
  if (isBilibiliUrl(options.url)) {
    // Bilibili requires cookies to avoid 412 errors
    // In server environments, we'll skip this but inform the user
    console.warn('[Bilibili] Note: Bilibili may require cookies to work. Consider using --cookies-from-browser or providing a cookies file.');
    args.push('--referer', 'https://www.bilibili.com/');
    
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    args.push('--user-agent', ua);
    
    // Try without authentication first, may work for public videos
    args.push('--no-check-certificates');
  }

  // Use aria2c for faster downloads if available
  args.push('--external-downloader', 'aria2c');
  args.push('--external-downloader-args', 
    'aria2c:-x 16 -s 16 -k 1M --max-connection-per-server=16 --min-split-size=1M');

  // Format selection
  if (options.audioOnly) {
    if (options.audioFormat === 'flac' || options.audioFormat === 'wav' || options.audioFormat === 'alac') {
      args.push('-f', 'bestaudio');
      args.push('--extract-audio');
      args.push('--audio-format', options.audioFormat === 'alac' ? 'm4a' : options.audioFormat);
      if (options.audioFormat !== 'wav') {
        args.push('--audio-quality', '0'); // Best quality
      }
      args.push('--postprocessor-args', 'ffmpeg:-c:a flac -compression_level 12');
    } else if (options.audioFormat?.startsWith('mp3')) {
      const bitrate = options.audioFormat.split('-')[1] || '320';
      args.push('-f', 'bestaudio');
      args.push('--extract-audio');
      args.push('--audio-format', 'mp3');
      args.push('--audio-quality', bitrate + 'K');
    } else {
      args.push('-f', 'bestaudio');
      args.push('--extract-audio');
      if (options.audioFormat) {
        args.push('--audio-format', options.audioFormat);
      }
    }
  } else if (options.videoOnly) {
    // Remove 'p' from quality (e.g., '1080p' -> '1080')
    const qualityNum = options.quality?.replace('p', '') || '1080';
    args.push('-f', `bestvideo[height<=${qualityNum}]/bestvideo/best`);
  } else {
    // Video + Audio
    // Remove 'p' from quality (e.g., '1080p' -> '1080')
    const qualityNum = options.quality?.replace('p', '') || '1080';
    
    // Build format string with fallbacks for better compatibility
    // Primary: specific codec + quality, Fallback: any codec at quality, Final: best available
    let formatParts: string[] = [];
    
    // Try with specific codecs first if requested
    if (options.videoCodec && options.audioCodec) {
      formatParts.push(`bestvideo[height<=${qualityNum}][vcodec^=${options.videoCodec}]+bestaudio[acodec^=${options.audioCodec}]`);
    }
    if (options.videoCodec) {
      formatParts.push(`bestvideo[height<=${qualityNum}][vcodec^=${options.videoCodec}]+bestaudio`);
    }
    if (options.audioCodec) {
      formatParts.push(`bestvideo[height<=${qualityNum}]+bestaudio[acodec^=${options.audioCodec}]`);
    }
    
    // Fallback without codec restrictions
    formatParts.push(`bestvideo[height<=${qualityNum}]+bestaudio`);
    formatParts.push('bestvideo+bestaudio');
    formatParts.push('best');
    
    args.push('-f', formatParts.join('/'));

    // Merge to specified format
    args.push('--merge-output-format', 'mp4');
  }

  // Thumbnail options (for video/audio downloads)
  if (options.downloadThumbnail) {
    args.push('--write-thumbnail');
  }
  
  if (options.embedThumbnail && !options.audioOnly && !options.thumbnailOnly) {
    args.push('--embed-thumbnail');
  }

  // Metadata
  if (options.embedMetadata) {
    args.push('--embed-metadata');
    args.push('--parse-metadata', 'description:(?s)(?P<meta_comment>.+)');
  }

  // Spotify metadata overrides - apply Spotify metadata to the downloaded file
  if (options.spotifyMetadata) {
    const meta = options.spotifyMetadata;
    // Override metadata with Spotify track info
    args.push('--parse-metadata', `:(?P<meta_title>${meta.title.replace(/"/g, '\\"')})`);
    args.push('--parse-metadata', `:(?P<meta_artist>${meta.artist.replace(/"/g, '\\"')})`);
    if (meta.album) {
      args.push('--parse-metadata', `:(?P<meta_album>${meta.album.replace(/"/g, '\\"')})`);
    }
    if (meta.trackNumber) {
      args.push('--parse-metadata', `:(?P<meta_track>${meta.trackNumber})`);
    }
    if (meta.releaseDate) {
      args.push('--parse-metadata', `:(?P<meta_date>${meta.releaseDate})`);
    }
  }

  // Subtitles - limit to common languages to avoid rate limiting
  if (options.subtitles) {
    args.push('--write-subs');
    args.push('--write-auto-subs');
    args.push('--embed-subs');
    // Only download English subtitles by default to avoid YouTube rate limiting
    // Use 'en.*' to match en, en-US, en-GB, etc.
    args.push('--sub-langs', 'en,en-orig,en.*,-live_chat');
    // Don't fail the entire download if subtitles fail
    args.push('--ignore-errors');
  }

  // SponsorBlock
  if (options.sponsorBlock) {
    args.push('--sponsorblock-remove', 'all');
  }

  // FFmpeg optimizations for CPU-only transcoding
  args.push('--postprocessor-args',
    'ffmpeg:-threads 0 -preset ultrafast -tune fastdecode -movflags +faststart');

  args.push(options.url);

  return args;
}

// Download Spotify artwork and embed it into the audio file
async function embedSpotifyArtwork(outputDir: string, spotifyMetadata: SpotifyTrackInfo): Promise<void> {
  if (!spotifyMetadata.artwork) return;
  
  try {
    // Find the downloaded audio file
    const files = await fs.readdir(outputDir);
    const audioFile = files.find(f => 
      f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus') || 
      f.endsWith('.flac') || f.endsWith('.ogg') || f.endsWith('.wav')
    );
    
    if (!audioFile) return;
    
    const audioPath = path.join(outputDir, audioFile);
    const artworkPath = path.join(outputDir, 'spotify_artwork.jpg');
    
    // Download the artwork
    const response = await fetch(spotifyMetadata.artwork);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      await fs.writeFile(artworkPath, Buffer.from(buffer));
      
      // Use ffmpeg to embed the artwork
      const tempPath = path.join(outputDir, `temp_${audioFile}`);
      
      try {
        execSync(
          `ffmpeg -i "${audioPath}" -i "${artworkPath}" -map 0:a -map 1:0 -c copy -disposition:1 attached_pic "${tempPath}" -y`,
          { stdio: 'pipe', timeout: 60000 }
        );
        
        // Replace original with the one containing artwork
        await fs.unlink(audioPath);
        await fs.rename(tempPath, audioPath);
        await fs.unlink(artworkPath).catch(() => {});
        
        console.log(`[Spotify] Embedded artwork into ${audioFile}`);
      } catch (ffmpegError) {
        console.error('[Spotify] Failed to embed artwork:', ffmpegError);
        // Clean up temp files
        await fs.unlink(tempPath).catch(() => {});
        await fs.unlink(artworkPath).catch(() => {});
      }
    }
  } catch (error) {
    console.error('[Spotify] Failed to download/embed artwork:', error);
  }
}

function processDownload(
  downloadId: string, 
  args: string[], 
  outputDir: string, 
  mode: 'video' | 'audio' | 'thumbnail' | 'subtitles',
  spotifyMetadata?: SpotifyTrackInfo | null
) {
  const ytdlp = spawn('yt-dlp', args);
  let fullOutput = '';

  // Initialize progress tracking with mode
  downloadProgress.set(downloadId, { progress: 0, mode, status: 'downloading' });

  ytdlp.stdout.on('data', (data) => {
    const output = data.toString();
    fullOutput += output;
    console.log(`[${downloadId}]`, output);

    const currentData = downloadProgress.get(downloadId) || { progress: 0, mode };

    // Parse yt-dlp progress output - multiple formats
    
    // Format 1: [download]  45.2% of ~123.45MiB at 5.67MiB/s ETA 00:30
    const percentMatch = output.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+[KMG]iB)(?:.*?at\s+([\d.]+\s*[KMG]iB\/s))?(?:.*?ETA\s+(\d+:\d+))?/);
    if (percentMatch) {
      const progress = parseFloat(percentMatch[1]);
      currentData.progress = Math.min(progress, 95); // Cap at 95% until fully complete
      if (percentMatch[3]) currentData.speed = percentMatch[3].replace(/\s+/g, '');
      if (percentMatch[4]) currentData.eta = percentMatch[4];
      currentData.status = 'downloading';
      downloadProgress.set(downloadId, currentData);
    }
    
    // Format 2: [download]   24.34MiB at    1.05MiB/s (00:00:28) (frag 66)
    // Fragment-based download (no percentage, estimate from time remaining)
    const fragMatch = output.match(/\[download\]\s+([\d.]+)([KMG]iB)\s+at\s+([\d.]+\s*[KMG]iB\/s)\s+\((\d+:\d+:\d+|\d+:\d+)\)(?:\s+\(frag\s+(\d+)(?:\/(\d+))?\))?/);
    if (fragMatch && !percentMatch) {
      const speed = fragMatch[3].replace(/\s+/g, '');
      const timeRemaining = fragMatch[4];
      const currentFrag = fragMatch[5] ? parseInt(fragMatch[5]) : null;
      const totalFrag = fragMatch[6] ? parseInt(fragMatch[6]) : null;
      
      currentData.speed = speed;
      currentData.eta = timeRemaining;
      currentData.status = 'downloading';
      
      // If we have fragment info, estimate progress
      if (currentFrag && totalFrag) {
        currentData.progress = Math.min(Math.round((currentFrag / totalFrag) * 95), 95);
      } else if (currentFrag) {
        // Without total, just show we're making progress (keep incrementing slightly)
        currentData.progress = Math.min(Math.max(currentData.progress, 10) + 0.1, 90);
      }
      
      downloadProgress.set(downloadId, currentData);
    }
    
    // Format 3: [download] 100% of    7.60MiB in 00:00:30 at 255.22KiB/s
    const completeMatch = output.match(/\[download\]\s+100%\s+of\s+([\d.]+[KMG]iB)\s+in\s+(\d+:\d+:\d+|\d+:\d+)\s+at\s+([\d.]+\s*[KMG]iB\/s)/);
    if (completeMatch) {
      currentData.progress = 96; // Download done, post-processing may follow
      currentData.speed = completeMatch[3].replace(/\s+/g, '');
      currentData.eta = undefined;
      currentData.status = 'processing';
      downloadProgress.set(downloadId, currentData);
    }

    // Detect post-processing phases
    if (output.includes('[Merger]') || output.includes('[ffmpeg]') || output.includes('[ExtractAudio]')) {
      currentData.progress = Math.max(currentData.progress, 96);
      currentData.status = 'processing';
      currentData.speed = undefined;
      currentData.eta = undefined;
      downloadProgress.set(downloadId, currentData);
    }
    
    // Detect embedding operations
    if (output.includes('[EmbedThumbnail]') || output.includes('[Metadata]') || output.includes('[EmbedSubtitle]')) {
      currentData.progress = Math.max(currentData.progress, 98);
      currentData.status = 'processing';
      downloadProgress.set(downloadId, currentData);
    }

    // Detect thumbnail/subtitle writing
    if (output.includes('[info] Writing video thumbnail') || output.includes('Writing thumbnail')) {
      if (mode === 'thumbnail') {
        currentData.progress = 90;
        currentData.status = 'downloading';
      }
      downloadProgress.set(downloadId, currentData);
    }

    if (output.includes('[info] Writing video subtitles') || output.includes('Writing video description') || output.includes('[info] Writing')) {
      if (mode === 'subtitles') {
        currentData.progress = 90;
        currentData.status = 'downloading';
      }
      downloadProgress.set(downloadId, currentData);
    }

    // Parse destination filename from output
    // Format: [download] Destination: /path/to/file.mp4
    const destMatch = output.match(/\[download\] Destination:\s*(.+)$/m);
    if (destMatch) {
      currentData.filename = path.basename(destMatch[1].trim());
      downloadProgress.set(downloadId, currentData);
    }

    // Also try: [Merger] Merging formats into "/path/to/file.mp4"
    const mergerMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
    if (mergerMatch) {
      currentData.filename = path.basename(mergerMatch[1]);
      downloadProgress.set(downloadId, currentData);
    }
    
    // Extract audio destination
    const extractAudioMatch = output.match(/\[ExtractAudio\] Destination:\s*(.+)$/m);
    if (extractAudioMatch) {
      currentData.filename = path.basename(extractAudioMatch[1].trim());
      downloadProgress.set(downloadId, currentData);
    }
  });

  ytdlp.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[${downloadId}]`, output);

    const currentData = downloadProgress.get(downloadId) || { progress: 0, mode };

    // Also try to parse progress from stderr (some formats output there)
    // Same formats as stdout
    const percentMatch = output.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+[KMG]iB)(?:.*?at\s+([\d.]+\s*[KMG]iB\/s))?/);
    if (percentMatch) {
      const progress = parseFloat(percentMatch[1]);
      currentData.progress = Math.min(progress, 95);
      if (percentMatch[3]) currentData.speed = percentMatch[3].replace(/\s+/g, '');
      currentData.status = 'downloading';
      downloadProgress.set(downloadId, currentData);
    }
    
    // Fragment format in stderr
    const fragMatch = output.match(/\[download\]\s+([\d.]+)([KMG]iB)\s+at\s+([\d.]+\s*[KMG]iB\/s)\s+\((\d+:\d+:\d+|\d+:\d+)\)/);
    if (fragMatch && !percentMatch) {
      currentData.speed = fragMatch[3].replace(/\s+/g, '');
      currentData.eta = fragMatch[4];
      currentData.status = 'downloading';
      downloadProgress.set(downloadId, currentData);
    }
    
    // Detect errors
    if (output.includes('ERROR:') || output.includes('error:')) {
      const errorMatch = output.match(/(?:ERROR:|error:)\s*(.+)/);
      if (errorMatch) {
        currentData.error = errorMatch[1].substring(0, 200); // Truncate long errors
      }
    }
  });

  ytdlp.on('close', async (code) => {
    if (code === 0) {
      console.log(`[${downloadId}] Download completed`);
      
      // Wait a moment for filesystem to finish writing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If this was a Spotify download, embed the artwork
      if (spotifyMetadata) {
        console.log(`[${downloadId}] Embedding Spotify artwork...`);
        const currentData = downloadProgress.get(downloadId) || { progress: 98, mode };
        currentData.progress = 98;
        currentData.status = 'processing';
        downloadProgress.set(downloadId, currentData);
        
        await embedSpotifyArtwork(outputDir, spotifyMetadata);
      }
      
      // Mark as completed
      const currentData = downloadProgress.get(downloadId) || { progress: 100, mode };
      currentData.progress = 100;
      currentData.status = 'completed';
      currentData.speed = undefined;
      currentData.eta = undefined;
      downloadProgress.set(downloadId, currentData);

      // Clean up after 1 hour
      setTimeout(async () => {
        try {
          await fs.rm(outputDir, { recursive: true, force: true });
          downloadProgress.delete(downloadId);
        } catch (error) {
          console.error('Failed to clean up:', error);
        }
      }, 3600000); // 1 hour
    } else {
      console.error(`[${downloadId}] Download failed with code ${code}`);
      console.error(`[${downloadId}] Full output:`, fullOutput);
      
      // Store error state instead of deleting
      const currentData = downloadProgress.get(downloadId) || { progress: 0, mode };
      currentData.status = 'error';
      currentData.error = `Download failed with exit code ${code}`;
      downloadProgress.set(downloadId, currentData);
      
      // Clean up failed downloads after 10 minutes
      setTimeout(async () => {
        try {
          await fs.rm(outputDir, { recursive: true, force: true });
          downloadProgress.delete(downloadId);
        } catch (error) {
          console.error('Failed to clean up:', error);
        }
      }, 600000); // 10 minutes
    }
  });

  ytdlp.on('error', (error) => {
    console.error(`[${downloadId}] Process error:`, error);
    
    // Store error state instead of deleting
    const currentData = downloadProgress.get(downloadId) || { progress: 0, mode };
    currentData.status = 'error';
    currentData.error = error.message || 'Process failed to start';
    downloadProgress.set(downloadId, currentData);
  });
}
