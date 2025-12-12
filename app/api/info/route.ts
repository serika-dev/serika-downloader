import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getYtDlpPath } from '@/utils/ytdlp';
import { getDefaultCookiesPath, isBilibiliUrl } from '@/utils/defaultCookies';

export const maxDuration = 300; // 5 minutes timeout for serverless

// Note: Bilibili/Instagram URL detection + default cookie fetching lives in src/utils/defaultCookies.ts

// Get playlist info using --flat-playlist (much faster than full extraction)
function getPlaylistInfo(url: string, cookiesPath?: string, proxy?: string): Promise<{isPlaylist: boolean; playlistCount: number; playlistTitle?: string}> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--flat-playlist',  // Only get playlist metadata, not full video info
      '--skip-download',
    ];

    // Apply proxy if provided
    if (proxy) {
      args.push('--proxy', proxy);
    }

    // Apply cookies if provided
    if (cookiesPath) {
      args.push('--cookies', cookiesPath);
    }

    // Site-specific headers for Bilibili
    if (isBilibiliUrl(url)) {
      args.push('--referer', 'https://www.bilibili.com/');
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
      args.push('--user-agent', ua);
      args.push('--add-header', 'Origin:https://www.bilibili.com');
      args.push('--add-header', 'Accept-Language:zh-CN,zh;q=0.9,en;q=0.8');
      args.push('--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
      args.push('--add-header', 'Sec-Ch-Ua:"Chromium";v="131", "Not_A Brand";v="24"');
      args.push('--add-header', 'Sec-Ch-Ua-Mobile:?0');
      args.push('--add-header', 'Sec-Ch-Ua-Platform:"Windows"');
      args.push('--retries', '3');
      args.push('--retry-sleep', '3');
    }

    args.push(url);

    const ytdlpPath = getYtDlpPath();
    const ytdlp = spawn(ytdlpPath, args);
    let stdout = '';
    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytdlp.on('close', (code) => {
      console.log('[getPlaylistInfo] yt-dlp closed with code:', code);
      console.log('[getPlaylistInfo] stderr:', stderr);
      console.log('[getPlaylistInfo] stdout length:', stdout.length);
      
      if (code !== 0) {
        reject(new Error(stderr || `yt-dlp failed with code ${code}`));
        return;
      }

      try {
        // --flat-playlist outputs one JSON object per line for each entry
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        console.log('[getPlaylistInfo] lines count:', lines.length);
        
        if (lines.length > 1) {
          // Multiple entries = playlist
          // Try to get playlist title from first entry
          let playlistTitle: string | undefined;
          try {
            const firstEntry = JSON.parse(lines[0]);
            playlistTitle = firstEntry.playlist_title || firstEntry.playlist;
          } catch {}
          
          resolve({
            isPlaylist: true,
            playlistCount: lines.length,
            playlistTitle,
          });
        } else if (lines.length === 1) {
          // Single entry - check if it has playlist metadata
          const info = JSON.parse(lines[0]);
          const isPlaylist = info._type === 'playlist' || (info.n_entries && info.n_entries > 1);
          resolve({
            isPlaylist,
            playlistCount: info.n_entries || 1,
            playlistTitle: info.playlist_title || info.title,
          });
        } else {
          resolve({ isPlaylist: false, playlistCount: 1 });
        }
      } catch (error) {
        reject(new Error('Failed to parse playlist info'));
      }
    });

    ytdlp.on('error', (err) => {
      reject(err);
    });
  });
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;
  
  try {
    const body = await request.json();
    const { url, cookies, proxy } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Save cookies to temp file if provided
    let cookiesPath: string | undefined;
    if (cookies) {
      tempDir = path.join(os.tmpdir(), 'serika-info', uuidv4());
      await fs.mkdir(tempDir, { recursive: true });
      cookiesPath = path.join(tempDir, 'cookies.txt');
      await fs.writeFile(cookiesPath, cookies, 'utf-8');
      console.log('[Info] Cookies file saved for this request');
    } else {
      // Server-configured default cookies (only applied when user does NOT upload cookies)
      const { isInstagramUrl } = await import('@/utils/defaultCookies');
      if (isInstagramUrl(url)) {
        cookiesPath = await getDefaultCookiesPath('instagram');
      } else if (isBilibiliUrl(url)) {
        cookiesPath = await getDefaultCookiesPath('bilibili');
      }
    }

    // Get video information using yt-dlp
    const info = await getVideoInfo(url, cookiesPath, proxy);
    
    console.log('[Info] isBilibiliUrl:', isBilibiliUrl(url), 'url:', url);
    console.log('[Info] info.isPlaylist before check:', info.isPlaylist);
    
    // For Bilibili, also check if it's a multi-part video (anthology)
    // This requires a separate call without --no-playlist
    if (isBilibiliUrl(url)) {
      console.log('[Info] Checking for Bilibili playlist/anthology...');
      try {
        const playlistInfo = await getPlaylistInfo(url, cookiesPath, proxy);
        console.log('[Info] Playlist check result:', JSON.stringify(playlistInfo));
        if (playlistInfo.isPlaylist) {
          info.isPlaylist = true;
          info.playlistCount = playlistInfo.playlistCount;
          info.playlistTitle = playlistInfo.playlistTitle;
          console.log('[Info] Updated info with playlist data:', info.isPlaylist, info.playlistCount);
        }
      } catch (e) {
        // Ignore errors - just means it's not a playlist
        console.log('[Info] Playlist check failed:', e);
      }
    }
    
    // Cleanup temp dir
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    
    // Cleanup temp dir on error
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    
    // Provide better error messages for specific cases
    let errorMessage = error.message || 'Failed to fetch video information';
    
    // Instagram-specific error handling
    if (errorMessage.includes('Instagram') && 
        (errorMessage.includes('login required') || errorMessage.includes('rate-limit') || errorMessage.includes('csrf token'))) {
      errorMessage = '⚠️ Instagram download failed - this may be due to rate limiting or authentication requirements.\n\n' +
        'You can try:\n' +
        '1. Wait a few minutes and try again\n' +
        '2. Or upload cookies: Export your Instagram cookies using "Get cookies.txt LOCALLY" browser extension, then upload in the Advanced tab\n\n' +
        'Note: Make sure you\'re logged into Instagram before exporting cookies.';
    }
    // Twitter/X-specific error handling
    else if ((errorMessage.includes('Twitter') || errorMessage.includes('twitter.com') || errorMessage.includes('x.com')) && 
             (errorMessage.includes('login') || errorMessage.includes('rate') || errorMessage.includes('protected'))) {
      errorMessage = '⚠️ Twitter/X download failed - this may be due to rate limiting or authentication requirements.\n\n' +
        'You can try:\n' +
        '1. Wait a few minutes and try again\n' +
        '2. Or upload cookies: Export your Twitter/X cookies using "Get cookies.txt LOCALLY" browser extension, then upload in the Advanced tab';
    }
    // Bilibili-specific error handling
    else if (errorMessage.includes('412') && errorMessage.includes('BiliBili')) {
      errorMessage = '⚠️ Bilibili blocked the request (HTTP 412) - likely due to rate limiting.\n\n' +
        'You can try:\n' +
        '1. Wait a few minutes and try again\n' +
        '2. Use a proxy (add in Advanced tab)\n' +
        '3. Upload fresh cookies from bilibili.com\n\n' +
        'Tip: Export cookies using "Get cookies.txt LOCALLY" browser extension.';
    }
    // Age-restricted content
    else if (errorMessage.includes('age') || errorMessage.includes('Sign in to confirm your age')) {
      errorMessage = '🔞 This content is age-restricted and requires authentication.\n\n' +
        'To download:\n' +
        '1. Log into the website in your browser\n' +
        '2. Export cookies using "Get cookies.txt LOCALLY" extension\n' +
        '3. Upload the cookies file in the Advanced tab';
    }
    // Private/unavailable content
    else if (errorMessage.includes('Private video') || errorMessage.includes('not available')) {
      errorMessage = '🔒 This content is private or unavailable.\n\n' +
        'If you have access, try uploading cookies from your logged-in browser session.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function getVideoInfo(url: string, cookiesPath?: string, proxy?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Try local yt-dlp first
    const tryLocalYtdlp = () => {
      const args = [
        '--dump-json',
        '--no-playlist',
        '--skip-download',
      ];

      // Apply proxy if provided
      if (proxy) {
        args.push('--proxy', proxy);
        console.log('[Info] Using proxy:', proxy);
      }

      // Apply cookies if provided
      if (cookiesPath) {
        args.push('--cookies', cookiesPath);
      }

      // Site-specific headers/workarounds
      if (isBilibiliUrl(url)) {
        // Bilibili REQUIRES cookies with buvid3 to avoid 412 errors
        if (!cookiesPath) {
          console.warn('[Bilibili] WARNING: Bilibili requires cookies (especially buvid3) to avoid 412 errors!');
        }
        
        // CRITICAL: Referer header is mandatory
        args.push('--referer', 'https://www.bilibili.com/');
        
        // Modern Chrome User-Agent - must look like a real browser
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
        args.push('--user-agent', ua);
        
        // Additional headers to look more like a real browser request
        args.push('--add-header', 'Origin:https://www.bilibili.com');
        args.push('--add-header', 'Accept-Language:zh-CN,zh;q=0.9,en;q=0.8');
        args.push('--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
        args.push('--add-header', 'Cache-Control:no-cache');
        args.push('--add-header', 'Pragma:no-cache');
        args.push('--add-header', 'Sec-Ch-Ua:"Chromium";v="131", "Not_A Brand";v="24"');
        args.push('--add-header', 'Sec-Ch-Ua-Mobile:?0');
        args.push('--add-header', 'Sec-Ch-Ua-Platform:"Windows"');
        args.push('--add-header', 'Sec-Fetch-Dest:document');
        args.push('--add-header', 'Sec-Fetch-Mode:navigate');
        args.push('--add-header', 'Sec-Fetch-Site:same-origin');
        args.push('--add-header', 'Upgrade-Insecure-Requests:1');
        
        // Add delay to avoid rate limiting
        args.push('--sleep-requests', '1');
        
        // Retry on errors
        args.push('--retries', '3');
        args.push('--retry-sleep', '3');
      }

      args.push(url);

      const ytdlpPath = getYtDlpPath();
      const ytdlp = spawn(ytdlpPath, args);
      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `yt-dlp failed with code ${code}`));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          
          // Check for playlist indicators in the response
          // Bilibili multi-part videos have n_entries or entries in the response
          // Also check _type === 'playlist' or playlist_count
          const isPlaylist = 
            info._type === 'playlist' ||
            (info.n_entries && info.n_entries > 1) ||
            (info.entries && info.entries.length > 1) ||
            (info.playlist_count && info.playlist_count > 1);
          
          const playlistCount = 
            info.n_entries || 
            info.playlist_count || 
            (info.entries?.length) || 
            1;
          
          resolve({
            id: info.id,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            description: info.description,
            uploader: info.uploader,
            // Playlist info
            isPlaylist,
            playlistCount,
            playlistTitle: info.playlist_title || info.playlist,
            formats: info.formats?.map((f: any) => ({
              format_id: f.format_id,
              ext: f.ext,
              quality: f.format_note || f.quality,
              filesize: f.filesize,
              vcodec: f.vcodec,
              acodec: f.acodec,
              fps: f.fps,
              resolution: f.resolution,
              tbr: f.tbr,
              abr: f.abr,
              vbr: f.vbr,
            })) || [],
            thumbnails: info.thumbnails || [],
          });
        } catch (error) {
          reject(new Error('Failed to parse video info'));
        }
      });

      ytdlp.on('error', (err) => {
        console.error('yt-dlp error:', err.message);
        reject(new Error(`yt-dlp not found. Please install yt-dlp: https://github.com/yt-dlp/yt-dlp/wiki/Installation`));
      });
    };

    tryLocalYtdlp();
  });
}
