# Architecture

Technical overview of Serika Downloader.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Animations:** Framer Motion
- **Backend:** Next.js API Routes
- **Downloader:** yt-dlp with aria2c

---

## Project Structure

```
serika-downloader/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── download/      # Start download
│   │   ├── file/          # Serve files
│   │   ├── info/          # Video metadata
│   │   └── status/        # Download progress
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── src/
│   ├── components/        # React components
│   │   ├── BackgroundShapes.tsx
│   │   ├── DownloadForm.tsx
│   │   ├── DownloadQueue.tsx
│   │   └── QueuePopover.tsx
│   ├── config/
│   │   └── formats.ts     # Format definitions
│   ├── store/
│   │   └── downloadStore.ts  # Zustand store
│   ├── types/
│   │   └── download.ts    # TypeScript types
│   └── utils/
│       ├── urlValidation.ts  # URL validation & platform detection
│       └── ytdlp.ts       # yt-dlp path finder
├── docs/                  # Documentation
├── public/                # Static assets
└── downloads/             # Downloaded files
```

---

## Download Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Client                             │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │   URL    │→ │DownloadForm │→ │   DownloadQueue   │   │
│  │  Input   │  │  (options)  │  │  (progress/files) │   │
│  └──────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │              │                    ▲
         │              │                    │ poll
         ▼              ▼                    │
┌─────────────────────────────────────────────────────────┐
│                      Server                             │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │/api/info │  │/api/download│  │   /api/status     │   │
│  │ metadata │  │ start job   │  │   progress        │   │
│  └──────────┘  └─────────────┘  └───────────────────┘   │
│                       │                                 │
│                       ▼                                 │
│              ┌─────────────────┐                        │
│              │    yt-dlp       │                        │
│              │  (background)   │                        │
│              └─────────────────┘                        │
│                       │                                 │
│                       ▼                                 │
│              ┌─────────────────┐                        │
│              │   /api/file     │                        │
│              │  serve file     │                        │
│              └─────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## State Management

Using Zustand for client-side state:

```typescript
interface DownloadStore {
  downloads: DownloadItem[];
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
}
```

---

## yt-dlp Integration

### Performance Optimizations

```bash
--concurrent-fragments 16    # Parallel chunks
--http-chunk-size 10M        # Large chunks
--external-downloader aria2c # Faster downloader
--retries 10                 # Resilient
```

### Supported Features

- Video quality selection
- Audio extraction with format conversion
- Subtitle download
- Live chat (YouTube)
- Comments (YouTube)
- Playlist handling
- Cookie authentication
- Proxy support

---

## File Management

- **Temp directory:** `/tmp/serika-downloads/{id}/`
- **Output:** `/app/downloads/`
- **Retention:** 1 hour after completion
- **Cleanup:** Automatic via scheduled job

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3000` | Server port |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Parallel limit |
| `FILE_RETENTION_MS` | `3600000` | Cleanup interval |
