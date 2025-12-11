# Coolify Deployment

Deploy Serika Downloader on [Coolify](https://coolify.io) with a custom domain.

## Prerequisites

- Coolify instance running (self-hosted or cloud)
- Domain pointed to your Coolify server
- Cloudflare DNS configured (if using Cloudflare)

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. In Coolify, create a new **Docker Compose** resource
2. Connect your Git repository or paste the compose file
3. Configure in Coolify UI:
   - **Domains:** `yourdomain.com`
   - **Port:** `3000`
   - **HTTPS:** Enable (auto SSL via Let's Encrypt)

### Option 2: Dockerfile

1. Create a new **Dockerfile** resource in Coolify
2. Point to your repository
3. Configure:
   - **Domains:** `yourdomain.com`
   - **Exposed Port:** `3000`
   - **Build Path:** `/` (root)

### Option 3: Docker Image

If you've built and pushed to a registry:

```bash
docker build -t ghcr.io/yourusername/serika-downloader:latest .
docker push ghcr.io/yourusername/serika-downloader:latest
```

Then create a **Docker Image** resource with your image URL.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Internal port |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Max parallel downloads |
| `FILE_RETENTION_MS` | `3600000` | File cleanup (1 hour) |
| `TZ` | `UTC` | Timezone |

---

## Storage

Configure a persistent volume for downloads:

- **Container Path:** `/app/downloads`
- **Host Path:** Choose a location (e.g., `/data/serika-downloads`)

Or use a Docker volume:
```yaml
volumes:
  - serika-downloads:/app/downloads
```

---

## Cloudflare Configuration

If using Cloudflare:

### DNS Settings
- Add an `A` record pointing to your Coolify server IP
- Enable the proxy (orange cloud) for DDoS protection

### SSL/TLS Settings
- Set encryption mode to **Full** (recommended)
- For **Flexible** mode, disable HTTPS in Coolify

---

## Troubleshooting

### 502 Bad Gateway
1. Check if the container is running in Coolify logs
2. Verify health check is passing
3. Ensure port `3000` is exposed

### SSL Certificate Issues
1. Ensure DNS is correctly pointed
2. If using Cloudflare Flexible, disable SSL in Coolify
3. For Full SSL, let Coolify provision via Let's Encrypt

### Downloads Not Working
1. Check if the volume is mounted correctly
2. Verify yt-dlp is installed (check container logs)
3. Ensure the container has internet access

---

## Checklist

- [ ] Domain configured
- [ ] Port exposed: `3000`
- [ ] Health check enabled
- [ ] Persistent storage mounted
- [ ] Environment variables set
- [ ] SSL configured
