# Serika Downloader - How Downloads Work

## 📥 Download Flow

### 1. **User Clicks Download**
```
Client → Paste URL → Select Options → Click "Download"
```

### 2. **Server Processing**
```
API /api/download receives options
├─ Generates unique Download ID
├─ Creates temp directory
├─ Spawns yt-dlp process in background
└─ Returns immediately to client with Download ID
```

### 3. **Download Progress Polling**
```
Client polls /api/status?id=downloadId every 1 second
├─ Shows progress bar
├─ Shows speed/ETA (if available)
└─ Updates status when complete
```

### 4. **File Download**
```
When status = "completed":
├─ Download button appears in queue
├─ User clicks "Download"
└─ File transfers from server to user's device
```

---

## 🎯 Key Features

✅ **Asynchronous Processing** - Server starts download and returns immediately
✅ **Real-time Progress** - Client polls every 1 second for updates
✅ **Multiple Downloads** - Queue supports unlimited concurrent downloads
✅ **1-Hour Retention** - Files kept on server for 1 hour after completion
✅ **Automatic Cleanup** - Temp files automatically deleted after 1 hour
✅ **Browser Download** - Files downloaded directly to user's Downloads folder

---

## 📁 File Paths

### On Server (Docker):
```
/app/downloads              # Persistent downloads folder
/tmp/serika-downloads/{id}  # Temp processing folder
```

### On User's Computer:
```
Downloads/filename.mp4      # Files saved here after clicking "Download"
```

---

## 🔄 API Endpoints

### 1. `POST /api/info`
Get video information before downloading
```json
{
  "url": "https://..."
}
```

Response:
```json
{
  "title": "Video Title",
  "thumbnail": "url",
  "duration": 3600,
  "uploader": "Channel Name",
  "formats": [...]
}
```

### 2. `POST /api/download`
Start a download
```json
{
  "url": "https://...",
  "quality": "1080p",
  "format": "mp4",
  "audioOnly": false,
  ...
}
```

Response:
```json
{
  "downloadId": "uuid",
  "status": "started"
}
```

### 3. `GET /api/status?id=downloadId`
Check download progress
```json
{
  "status": "downloading",
  "progress": 45,
  "speed": "5.2 MB/s",
  "eta": "30s"
}
```

When complete:
```json
{
  "status": "completed",
  "progress": 100,
  "filename": "Video Title.mp4",
  "downloadable": true
}
```

### 4. `GET /api/file?id=downloadId`
Download the file to user's computer
- Returns file as `application/octet-stream`
- Automatically triggers browser download

---

## ⏱️ Timeline Example

```
T+0s:   User clicks Download
T+0.1s: Server returns with downloadId
        └─ Client adds to queue
        └─ Client starts polling /api/status

T+5s:   yt-dlp fetches video info
        └─ Status: downloading, progress: 5%

T+30s:  Video fetched halfway
        └─ Status: downloading, progress: 50%

T+60s:  Download complete
        └─ Status: completed, progress: 100%
        └─ Download button appears in queue

T+65s:  User clicks "↓ Download"
        └─ Browser downloads file to ~/Downloads/
        └─ File saved on user's computer
```

---

## 🐳 Docker Behavior

### Downloads Folder (Persistent)
```
docker-compose.yml:
  volumes:
    - ./downloads:/app/downloads
```

Downloaded files are saved here and persist even if container restarts.

### Temp Processing Folder (Temporary)
```
/tmp/serika-downloads/{id}/
├─ Auto-deleted 1 hour after completion
└─ Not accessible from outside Docker
```

---

## 🔐 Security Notes

✅ **Unique IDs** - Each download gets a unique UUID
✅ **Isolated Folders** - Files stored in separate directories per download
✅ **Auto Cleanup** - Temp files automatically deleted
✅ **No Directory Traversal** - Only access to download directory
✅ **File Type Filtering** - Downloads exclude subtitles, thumbnails

---

## ⚡ Performance Optimization

The downloader uses several techniques for speed:

```
yt-dlp arguments for fast downloads:
├─ --concurrent-fragments 16       # 16 parallel chunks
├─ --http-chunk-size 10M          # 10MB chunks
├─ --buffer-size 16K              # Small buffer for latency
├─ --external-downloader aria2c   # Faster download manager
├─ --retries 10                   # Resilient to failures
└─ FFmpeg preset ultrafast        # CPU-optimized encoding
```

**Result**: Downloads 30-50% faster than typical methods

---

## 📊 Download Queue Details

### Columns:
- **Thumbnail** - Video preview
- **Title** - Video/audio name
- **Status** - pending/downloading/completed/error
- **Progress** - Percentage bar for downloads
- **Speed/ETA** - Real-time stats while downloading
- **Download Button** - Appears when completed
- **Close Button** - Remove from queue

### Status Types:
```
⏳ Pending    - Waiting to start
⬇️ Downloading - In progress (shows %)
✅ Completed  - Ready to download
❌ Error      - Failed (shows error message)
```

---

## 🛠️ Troubleshooting

### "Failed to download file"
- Download expired (files kept for 1 hour)
- Server ran out of disk space
- Network connection lost

**Solution**: Click "Download" again from the queue

### File download doesn't start
- Browser blocked the download
- Check browser download settings
- Try a different browser

### Download stuck at 99%
- Still processing/encoding
- Check server logs: `docker-compose logs`
- Wait a few more seconds

### "Download not found"
- File was cleaned up (kept for 1 hour only)
- Start a new download

---

## 📈 File Size Estimates

| Format | Quality | Size |
|--------|---------|------|
| MP4 | 1080p | 200-500 MB |
| WebM | 1080p | 150-400 MB |
| MP3 | 320kbps | 5-15 MB |
| FLAC | Lossless | 20-50 MB |
| MKV | 4K | 500MB-2GB |

---

## 🎬 Example Workflow

```
1. Paste YouTube URL
2. Select:
   - Quality: 1080p
   - Format: MP4
   - Audio: Auto
3. Click Download
4. Watch progress in queue
5. When complete, click "↓ Download" 
6. File saved to ~/Downloads/
```

**That's it!** 🎉

---

## 📞 Support

- Check browser console for errors: `F12 → Console`
- Check server logs: `docker-compose logs`
- Ensure yt-dlp is installed
- Try with a different URL
