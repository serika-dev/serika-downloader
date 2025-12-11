<p align="center">
  <img src="public/logo.svg" alt="Serika Downloader" width="200" height="200">
</p>

<p align="center">
  <strong>A beautiful, modern video downloader powered by yt-dlp</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#supported-platforms">Platforms</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#documentation">Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/yt--dlp-latest-red?style=flat-square" alt="yt-dlp">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

---

## ✨ Features

- 🎬 **1000+ Sites** - YouTube, Twitter/X, TikTok, Instagram, Bilibili, Niconico, SoundCloud, Spotify, and more
- 🎵 **Audio Extraction** - MP3, FLAC, WAV, M4A, OGG with customizable bitrate
- 📺 **Video Quality** - From 360p to 8K, with codec selection (H.264, H.265, VP9, AV1)
- 📝 **Subtitles & Extras** - Download subtitles, live chat replays, and comments
- 🎨 **Beautiful UI** - Modern, responsive design with dark theme
- 📋 **Playlist Support** - Download entire playlists or select specific videos
- 🔒 **Cookie Support** - Access age-restricted or region-locked content
- 🌐 **Proxy Support** - Route through proxies for geo-restricted content
- 🎯 **Spotify Integration** - Convert Spotify links to YouTube Music downloads with metadata
- ⚡ **Fast Downloads** - Multi-threaded with aria2c acceleration
- 🐳 **Docker Ready** - One-click deployment with Docker Compose

---

## 🌍 Supported Platforms

| Platform | Video | Audio | Playlists | Notes |
|----------|:-----:|:-----:|:---------:|-------|
| YouTube | ✅ | ✅ | ✅ | Live chat & comments |
| YouTube Music | ✅ | ✅ | ✅ | |
| Twitter/X | ✅ | ✅ | ❌ | |
| TikTok | ✅ | ✅ | ❌ | |
| Instagram | ✅ | ✅ | ❌ | Reels, Stories, IGTV |
| SoundCloud | ✅ | ✅ | ✅ | |
| Spotify | ✅ | ✅ | ✅ | Via YouTube Music |
| Bilibili | ✅ | ✅ | ✅ | Requires cookies |
| Niconico | ✅ | ✅ | ✅ | |
| Vimeo | ✅ | ✅ | ❌ | |
| Dailymotion | ✅ | ✅ | ❌ | |
| Twitch | ✅ | ✅ | ❌ | Clips & VODs |
| Reddit | ✅ | ✅ | ❌ | |
| Facebook | ✅ | ✅ | ❌ | |
| Odysee | ✅ | ✅ | ❌ | |
| Direct Media | ✅ | ✅ | ❌ | MP4, MP3, M3U8, etc. |

> Plus 1000+ more sites supported by [yt-dlp](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/) or [Bun](https://bun.sh/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)
- [FFmpeg](https://ffmpeg.org/download.html)

### Local Development

```bash
# Clone the repository
git clone https://github.com/serika-dev/serika-downloader.git
cd serika-downloader

# Install dependencies
bun install  # or npm install

# Run development server
bun dev  # or npm run dev

# Open http://localhost:3000
```

### Windows Quick Install

```powershell
# Install yt-dlp via winget
winget install yt-dlp

# Or run the setup script
.\install-ytdlp.ps1
```

---

## 🐳 Docker Deployment

The easiest way to deploy Serika Downloader:

```bash
# Clone and start
git clone https://github.com/serika-dev/serika-downloader.git
cd serika-downloader
docker-compose up -d

# Open http://localhost:3000
```

Or use the startup scripts:

```powershell
# Windows PowerShell
.\start.ps1

# Windows Command Prompt
start.bat
```

📖 **Full Docker Guide:** [DOCKER_SETUP.md](DOCKER_SETUP.md)

---

## ☁️ Cloud Deployment

### Coolify (Self-Hosted)

Deploy to your own server with [Coolify](https://coolify.io):

1. Create a new Docker Compose resource
2. Connect your Git repository
3. Configure domain and SSL
4. Deploy!

📖 **Full Coolify Guide:** [COOLIFY_SETUP.md](COOLIFY_SETUP.md)

### Other Platforms

- **Railway** - Use the Dockerfile
- **Fly.io** - Use the Dockerfile with `fly launch`
- **DigitalOcean App Platform** - Docker deployment
- **AWS/GCP/Azure** - Container instances

> ⚠️ **Note:** Vercel/Netlify are not recommended due to serverless function limits and lack of persistent storage.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Docker Compose setup guide |
| [COOLIFY_SETUP.md](COOLIFY_SETUP.md) | Coolify deployment with custom domain |
| [README_SETUP.md](README_SETUP.md) | Technical architecture & API docs |

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Max parallel downloads |
| `FILE_RETENTION_MS` | `3600000` | File cleanup (1 hour) |

### Advanced Options

The web UI provides extensive options:

- **Video:** Quality, codec, FPS, container format
- **Audio:** Format, bitrate, codec
- **Metadata:** Thumbnails, subtitles, chapters
- **Extras:** Live chat, comments (YouTube)
- **Advanced:** Cookies, proxy, custom yt-dlp args

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This tool is for personal use only. Please respect copyright laws and the terms of service of the platforms you download from. The developers are not responsible for any misuse of this software.

---

<p align="center">
  Made with 💜 by <a href="https://github.com/serika-dev">Serika</a>
</p>
