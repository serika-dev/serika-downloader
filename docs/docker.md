# Docker Setup

Deploy Serika Downloader with Docker Compose.

## Quick Start

### Using Startup Scripts (Easiest)

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

### Manual Docker Compose

```bash
# Create downloads folder
mkdir downloads

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

---

## What's Included

The Docker image automatically includes:
- Node.js 20
- yt-dlp (latest)
- FFmpeg
- Python
- aria2c (fast downloads)
- All dependencies

---

## Docker Commands

```bash
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
```

---

## File Structure

```
serika-downloader/
├── downloads/          # Downloaded files (persistent)
├── docker-compose.yml  # Docker configuration
└── Dockerfile          # Docker image definition
```

---

## Troubleshooting

### Docker doesn't start
- Make sure Docker Desktop is running
- Restart Docker Desktop if it's stuck
- Check: `docker ps`

### Port 3000 already in use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Downloads folder not persisting
- Make sure it's in the same directory as docker-compose.yml
- Check permissions

### Can't find downloaded files
- They're in the `downloads` folder
- Inside Docker: `/app/downloads`
- On your computer: `./downloads`

---

## Pro Tips

### Fastest downloads
1. Use "Best Quality" (auto-selects optimal format)
2. Don't use high-quality conversions (H.265 codec is slower)
3. Disable unnecessary features (subtitles, metadata)

### Best audio quality
- FLAC: Lossless, largest file
- WAV: Uncompressed lossless
- MP3: High quality (320kbps), universal

---

## More Info

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
