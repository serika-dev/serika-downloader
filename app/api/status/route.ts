import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { readdir, stat } from 'fs/promises';
import { downloadProgress } from '../download/route';

// File extension categories
const THUMBNAIL_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const SUBTITLE_EXTENSIONS = ['.vtt', '.srt', '.ass', '.ssa', '.sub', '.sbv'];
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv'];
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.flac', '.wav', '.opus', '.ogg', '.aac'];
const PARTIAL_EXTENSIONS = ['.part', '.ytdl', '.temp'];

function isPartialFile(filename: string): boolean {
  return PARTIAL_EXTENSIONS.some(pe => filename.toLowerCase().endsWith(pe));
}

function getFileCategory(filename: string): 'video' | 'audio' | 'thumbnail' | 'subtitle' | 'partial' | 'other' {
  if (isPartialFile(filename)) return 'partial';
  const ext = path.extname(filename).toLowerCase();
  if (THUMBNAIL_EXTENSIONS.includes(ext)) return 'thumbnail';
  if (SUBTITLE_EXTENSIONS.includes(ext)) return 'subtitle';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  return 'other';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('id');

    if (!downloadId) {
      return NextResponse.json({ error: 'Download ID required' }, { status: 400 });
    }

    // Get progress from in-memory store
    const progressData = downloadProgress.get(downloadId);
    const mode = progressData?.mode || 'video';

    // Check for error state
    if (progressData?.status === 'error') {
      return NextResponse.json({
        id: downloadId,
        status: 'error',
        progress: progressData.progress,
        error: progressData.error || 'Download failed',
        downloadable: false,
      });
    }

    // Check if files exist in the download directory
    const downloadDir = path.join(os.tmpdir(), 'serika-downloads', downloadId);

    try {
      const allFiles = await readdir(downloadDir);
      
      // Filter out partial files
      const files = allFiles.filter(f => !isPartialFile(f));
      
      if (files.length > 0) {
        // Find the appropriate file based on download mode
        let mainFile: string | undefined;
        
        if (mode === 'thumbnail') {
          // Look for thumbnail files
          mainFile = files.find(f => getFileCategory(f) === 'thumbnail');
        } else if (mode === 'subtitles') {
          // Look for subtitle files
          mainFile = files.find(f => getFileCategory(f) === 'subtitle');
        } else if (mode === 'audio') {
          // Look for audio files
          mainFile = files.find(f => getFileCategory(f) === 'audio');
        } else {
          // Look for video files first, then audio
          mainFile = files.find(f => getFileCategory(f) === 'video') ||
                     files.find(f => getFileCategory(f) === 'audio');
        }
        
        // Fallback: any non-partial file
        if (!mainFile) {
          mainFile = files[0];
        }

        if (mainFile) {
          const filePath = path.join(downloadDir, mainFile);
          const fileStats = await stat(filePath);
          
          // Determine if download is complete
          const isComplete = progressData?.progress === 100 || progressData?.status === 'completed';

          const status = {
            id: downloadId,
            status: isComplete ? 'completed' : (progressData?.status || 'downloading'),
            progress: progressData?.progress || (isComplete ? 100 : 0),
            filename: mainFile,
            filesize: fileStats.size,
            speed: progressData?.speed,
            eta: progressData?.eta,
            mode: mode,
            downloadable: isComplete,
            fileCount: files.length,
          };

          return NextResponse.json(status);
        }
      }
    } catch {
      // Directory doesn't exist yet or is being written
    }

    // Return in-progress status with tracked progress
    return NextResponse.json({
      id: downloadId,
      status: progressData?.status || 'downloading',
      progress: progressData?.progress ?? 0,
      speed: progressData?.speed,
      eta: progressData?.eta,
      mode: mode,
      downloadable: false,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { downloadId, status, progress } = await request.json();

    if (!downloadId) {
      return NextResponse.json({ error: 'Download ID required' }, { status: 400 });
    }

    const currentData = downloadProgress.get(downloadId) || { progress: 0 };
    if (status) currentData.status = status;
    if (progress !== undefined) currentData.progress = progress;

    downloadProgress.set(downloadId, currentData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
