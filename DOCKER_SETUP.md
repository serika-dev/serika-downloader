# Serika Downloader - Quick Start with Docker

You have Docker Desktop installed! The easiest way to run Serika Downloader is with Docker Compose.

## 🚀 Quick Start (Recommended)

### Option A: Using the startup script (Easiest)

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Windows Command Prompt:**
```batch
start.bat
```

This will:
- ✓ Check Docker is installed and running
- ✓ Create downloads folder
- ✓ Build and start the app
- ✓ Open http://localhost:3000

---

### Option B: Manual Docker Compose

```powershell
# Create downloads folder
New-Item -ItemType Directory -Force -Path "downloads"

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

---

## 📝 What's Included in Docker

The Docker image automatically includes:
- ✓ Node.js 20
- ✓ yt-dlp (latest)
- ✓ FFmpeg
- ✓ Python
- ✓ aria2c (fast downloads)
- ✓ All dependencies

---

## 🎯 How to Use

1. **Paste a video URL** from any of 1000+ supported sites
2. **Choose settings:**
   - Video quality (360p - 4K)
   - Format (MP4, WebM, MKV, etc.)
   - Audio codecs, metadata, subtitles, etc.
3. **Click Download** and watch the queue

---

## 🐳 Docker Commands

```powershell
# Start
docker-compose up -d

# View logs (real-time)
docker-compose logs -f

# Stop
docker-compose down

# Rebuild (if Dockerfile changed)
docker-compose up -d --build

# View container status
docker-compose ps

# Open shell in container
docker-compose exec serika-downloader sh

# View downloaded files
ls downloads
```

---

## 📂 File Structure

```
serika-downloader/
├── downloads/          # Your downloaded files go here
├── docker-compose.yml  # Docker configuration
├── Dockerfile          # Docker image definition
├── start.bat           # Windows batch starter
├── start.ps1           # PowerShell starter
└── ...
```

---

## 🔧 Troubleshooting

### Docker doesn't start
- Make sure Docker Desktop is running
- Restart Docker Desktop if it's stuck
- Check: `docker ps`

### Port 3000 already in use
- Change the port in `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:3000"  # Use 3001 instead
  ```
- Then access: http://localhost:3001

### Downloads folder not persisting
- Make sure it's in the same directory as docker-compose.yml
- Check permissions: `ls -la downloads`

### Can't find downloaded files
- They're in the `downloads` folder
- Inside Docker: `/app/downloads`
- On your computer: `./downloads`

---

## 🔗 Supported Sites

Serika supports downloading from 1000+ sites including:
- YouTube
- Vimeo
- TikTok
- Instagram
- Twitch
- SoundCloud
- Bandcamp
- And many more!

Full list: https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

---

## 💡 Pro Tips

### Fastest downloads
1. Use "Best Quality" (auto-selects optimal format)
2. Don't use high-quality conversions (H.265 codec is slower)
3. Disable unnecessary features (subtitles, metadata)

### Best audio quality
- FLAC: Lossless, largest file
- WAV: Uncompressed lossless
- MP3: High quality (320kbps), universal

### Custom arguments
Advanced users can add yt-dlp arguments:
```
--geo-bypass --sponsorblock-mark all --embed-chapters
```

---

## 📖 More Info

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [yt-dlp Wiki](https://github.com/yt-dlp/yt-dlp/wiki)
- [Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

---

## Alternative: Local Installation

If you prefer not to use Docker, see `YT_DLP_SETUP.md` for local installation instructions.

---

**Enjoy downloading! 🎉**
