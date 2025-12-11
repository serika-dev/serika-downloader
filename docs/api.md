# API Documentation

Serika Downloader exposes a REST API for video downloads.

## Endpoints

### `POST /api/info`

Get video information before downloading.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "proxy": "http://proxy:8080"  // optional
}
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 3600,
  "uploader": "Channel Name",
  "formats": [...],
  "isPlaylist": false,
  "playlistCount": null
}
```

---

### `POST /api/download`

Start a download.

**Request:**
```json
{
  "url": "https://...",
  "quality": "1080p",
  "format": "mp4",
  "audioOnly": false,
  "audioFormat": "mp3-320",
  "videoCodec": "h264",
  "audioCodec": "aac",
  "embedThumbnail": true,
  "embedMetadata": true,
  "subtitles": false,
  "subtitleLangs": "en",
  "cookieFile": null,
  "proxy": null,
  "customArgs": "",
  "noPlaylist": true,
  "playlistItems": null,
  "liveChatOnly": false,
  "commentsOnly": false
}
```

**Response:**
```json
{
  "downloadId": "uuid",
  "status": "started"
}
```

---

### `GET /api/status?id={downloadId}`

Check download progress.

**Response (downloading):**
```json
{
  "status": "downloading",
  "progress": 45,
  "speed": "5.2 MB/s",
  "eta": "30s"
}
```

**Response (completed):**
```json
{
  "status": "completed",
  "progress": 100,
  "filename": "Video Title.mp4",
  "downloadable": true
}
```

**Status values:**
- `pending` - Waiting to start
- `downloading` - In progress
- `completed` - Ready to download
- `error` - Failed

---

### `GET /api/file?id={downloadId}`

Download the completed file.

**Response:** Binary file stream with `Content-Disposition` header.

---

## Download Flow

```
1. User submits URL
   └─ POST /api/info → Get video metadata

2. User clicks Download
   └─ POST /api/download → Get downloadId
   └─ Client polls /api/status every 1s

3. Download completes
   └─ GET /api/file → Stream file to browser
```

---

## File Retention

- Files are kept for **1 hour** after completion
- Temp files are automatically cleaned up
- Each download gets a unique UUID

---

## Error Handling

**Error response:**
```json
{
  "error": "Error message",
  "status": "error"
}
```

Common errors:
- `Invalid URL` - URL not supported
- `Download not found` - File expired or invalid ID
- `yt-dlp error` - Download failed (check logs)
