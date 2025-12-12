import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';
import archiver from 'archiver';

// File extension categories
const THUMBNAIL_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const SUBTITLE_EXTENSIONS = ['.vtt', '.srt', '.ass', '.ssa', '.sub', '.sbv'];
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv'];
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.flac', '.wav', '.opus', '.ogg', '.aac'];
const PARTIAL_EXTENSIONS = ['.part', '.ytdl', '.temp'];

function getFileCategory(filename: string): 'video' | 'audio' | 'thumbnail' | 'subtitle' | 'partial' | 'other' {
  const ext = path.extname(filename).toLowerCase();
  // Check for partial files first (e.g., .mp4.part)
  if (PARTIAL_EXTENSIONS.some(pe => filename.toLowerCase().endsWith(pe))) return 'partial';
  if (THUMBNAIL_EXTENSIONS.includes(ext)) return 'thumbnail';
  if (SUBTITLE_EXTENSIONS.includes(ext)) return 'subtitle';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  return 'other';
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.opus': 'audio/opus',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.vtt': 'text/vtt',
    '.srt': 'text/plain',
    '.ass': 'text/plain',
    '.zip': 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('id');

    if (!downloadId) {
      return NextResponse.json({ error: 'Download ID required' }, { status: 400 });
    }

    const downloadDir = path.join(os.tmpdir(), 'serika-downloads', downloadId);

    // Check if download directory exists
    try {
      await stat(downloadDir);
    } catch {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 });
    }

    // Read all files in the download directory
    const allFiles = await readdir(downloadDir);
    
    // Filter out partial/temp files
    const files = allFiles.filter(f => {
      const category = getFileCategory(f);
      return category !== 'partial';
    });

    if (files.length === 0) {
      return NextResponse.json({ error: 'No completed files found. Download may still be in progress.' }, { status: 404 });
    }

    // Categorize files
    const videoFiles = files.filter(f => getFileCategory(f) === 'video');
    const audioFiles = files.filter(f => getFileCategory(f) === 'audio');
    const thumbnailFiles = files.filter(f => getFileCategory(f) === 'thumbnail');
    const subtitleFiles = files.filter(f => getFileCategory(f) === 'subtitle');

    // Determine what to return based on what files exist
    let filesToServe: string[] = [];
    let baseFilename = 'download';

    // Case 1: Only thumbnails (thumbnail-only mode)
    if (thumbnailFiles.length > 0 && videoFiles.length === 0 && audioFiles.length === 0) {
      filesToServe = thumbnailFiles;
      baseFilename = path.basename(thumbnailFiles[0], path.extname(thumbnailFiles[0]));
    }
    // Case 2: Only subtitles (subtitles-only mode)
    else if (subtitleFiles.length > 0 && videoFiles.length === 0 && audioFiles.length === 0) {
      filesToServe = subtitleFiles;
      baseFilename = path.basename(subtitleFiles[0], path.extname(subtitleFiles[0]));
    }
    // Case 3: Video/Audio with extra files (thumbnails downloaded separately)
    else if ((videoFiles.length > 0 || audioFiles.length > 0) && 
             (thumbnailFiles.length > 0 || subtitleFiles.length > 0)) {
      // Include main file + extras = ZIP
      const mainFiles = [...videoFiles, ...audioFiles];
      filesToServe = [...mainFiles, ...thumbnailFiles, ...subtitleFiles];
      baseFilename = path.basename(mainFiles[0], path.extname(mainFiles[0]));
    }
    // Case 4: Just video or audio (normal download)
    else if (videoFiles.length > 0) {
      filesToServe = videoFiles;
      baseFilename = path.basename(videoFiles[0], path.extname(videoFiles[0]));
    }
    else if (audioFiles.length > 0) {
      filesToServe = audioFiles;
      baseFilename = path.basename(audioFiles[0], path.extname(audioFiles[0]));
    }
    // Fallback: just return whatever we have
    else {
      filesToServe = files;
      baseFilename = path.basename(files[0], path.extname(files[0]));
    }

    // If single file, serve it directly with range request support
    if (filesToServe.length === 1) {
      const singleFile = filesToServe[0];
      const filePath = path.join(downloadDir, singleFile);
      const fileStats = await stat(filePath);
      const fileSize = fileStats.size;
      const mimeType = getMimeType(singleFile);

      // Check for range request (important for large file resumable downloads)
      const rangeHeader = request.headers.get('range');
      
      if (rangeHeader) {
        // Parse range header
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        const stream = fs.createReadStream(filePath, { start, end });
        
        return new NextResponse(stream as any, {
          status: 206, // Partial Content
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(singleFile)}"`,
            'Content-Length': chunkSize.toString(),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
          },
        });
      }

      // Full file download
      const stream = fs.createReadStream(filePath);
      
      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(singleFile)}"`,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Multiple files: create a ZIP archive
    const zipFilename = `${baseFilename}.zip`;
    
    // Create a pass-through stream for the ZIP
    const { PassThrough } = await import('stream');
    const passthrough = new PassThrough();
    
    const archive = archiver('zip', {
      zlib: { level: 5 } // Balanced compression
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      passthrough.destroy(err);
    });

    // Pipe archive to passthrough
    archive.pipe(passthrough);

    // Add all files to archive
    for (const file of filesToServe) {
      const filePath = path.join(downloadDir, file);
      archive.file(filePath, { name: file });
    }

    // Finalize the archive
    archive.finalize();

    return new NextResponse(passthrough as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}

// HEAD request to check if file exists (used by client before download)
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('id');

    if (!downloadId) {
      return new NextResponse(null, { status: 400 });
    }

    const downloadDir = path.join(os.tmpdir(), 'serika-downloads', downloadId);

    try {
      await stat(downloadDir);
    } catch {
      return new NextResponse(null, { status: 404 });
    }

    const allFiles = await readdir(downloadDir);
    const files = allFiles.filter(f => {
      const category = getFileCategory(f);
      return category !== 'partial';
    });

    if (files.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
      }
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
