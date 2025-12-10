import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export const maxDuration = 300; // 5 minutes timeout for serverless

// Bilibili URL patterns (need custom headers to avoid 412)
const BILIBILI_REGEX = /^(https?:\/\/)?(www\.)?(bilibili\.com|b23\.tv)\//;

function isBilibiliUrl(url: string): boolean {
  return BILIBILI_REGEX.test(url);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Get video information using yt-dlp
    const info = await getVideoInfo(url);

    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video information' },
      { status: 500 }
    );
  }
}

function getVideoInfo(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Try local yt-dlp first
    const tryLocalYtdlp = () => {
      const args = [
        '--dump-json',
        '--no-playlist',
        '--skip-download',
      ];

      // Site-specific headers/workarounds
      if (isBilibiliUrl(url)) {
        // Bilibili often returns 412 without proper headers
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        args.push('--user-agent', ua);
        args.push('--add-header', 'Referer: https://www.bilibili.com');
        args.push('--add-header', 'Origin: https://www.bilibili.com');
        args.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
      }

      args.push(url);

      const ytdlp = spawn('yt-dlp', args);
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
          resolve({
            id: info.id,
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            description: info.description,
            uploader: info.uploader,
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
