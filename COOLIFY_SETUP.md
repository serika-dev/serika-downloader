# Coolify Deployment Guide

Deploy Serika Downloader on [Coolify](https://coolify.io) with a custom domain.

## Prerequisites

- Coolify instance running (self-hosted or cloud)
- Domain pointed to your Coolify server (e.g., `serika.lol`)
- Cloudflare DNS configured (if using Cloudflare)

## Cloudflare Configuration

If using Cloudflare with a flexible SSL setup:

1. **DNS Settings:**
   - Add an `A` record pointing to your Coolify server IP
   - Or `CNAME` to your server hostname
   - Enable the proxy (orange cloud) for DDoS protection

2. **SSL/TLS Settings:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to **Full** (recommended) or **Flexible**
   - If using **Flexible**, Coolify will handle HTTP internally

3. **Page Rules (Optional):**
   - Always Use HTTPS: `serika.lol/*`

## Coolify Deployment Options

### Option 1: Docker Compose (Recommended)

1. In Coolify, create a new **Docker Compose** resource
2. Connect your Git repository or paste the compose file
3. Use `docker-compose.coolify.yml` or the default `docker-compose.yml`
4. Configure in Coolify UI:
   - **Domains:** `serika.lol` (or your domain)
   - **Port:** `3000`
   - **HTTPS:** Enable (Coolify auto-provisions SSL via Let's Encrypt)

### Option 2: Dockerfile Deployment

1. Create a new **Dockerfile** resource in Coolify
2. Point to your repository
3. Coolify will auto-detect the `Dockerfile`
4. Configure:
   - **Domains:** `serika.lol`
   - **Exposed Port:** `3000`
   - **Build Path:** `/` (root)

### Option 3: Docker Image

If you've built and pushed to a registry:

```bash
# Build and push
docker build -t ghcr.io/yourusername/serika-downloader:latest .
docker push ghcr.io/yourusername/serika-downloader:latest
```

Then in Coolify, create a **Docker Image** resource with your image URL.

## Environment Variables

Set these in Coolify's environment configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Internal port (don't change) |
| `HOSTNAME` | `0.0.0.0` | Bind address (don't change) |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Max parallel downloads |
| `FILE_RETENTION_MS` | `3600000` | File cleanup interval (1 hour) |
| `YTDLP_CONCURRENT_FRAGMENTS` | `16` | yt-dlp fragment concurrency |
| `TZ` | `UTC` | Timezone |

## Storage Configuration

### Persistent Volume

In Coolify, configure a persistent volume for downloads:

- **Container Path:** `/app/downloads`
- **Host Path:** Choose a location on your server (e.g., `/data/serika-downloads`)

Or use a Docker volume:
```yaml
volumes:
  - serika-downloads:/app/downloads
```

## Troubleshooting

### 502 Bad Gateway

1. Check if the container is running: Coolify → Your App → Logs
2. Verify the health check is passing
3. Ensure port `3000` is exposed (not published to host)
4. Check Traefik logs in Coolify

### SSL Certificate Issues

1. Ensure your domain DNS is correctly pointed
2. If using Cloudflare Flexible SSL, Coolify doesn't need to provision a cert
3. For Cloudflare Full SSL, let Coolify provision via Let's Encrypt
4. Disable Cloudflare proxy temporarily to debug

### Downloads Not Working

1. Check if the volume is mounted correctly
2. Verify yt-dlp is installed: Check container logs for errors
3. Ensure the container has internet access

### Cloudflare Flexible + Coolify

If using Cloudflare **Flexible** SSL mode:

1. In Coolify, you can disable HTTPS/SSL for the resource
2. Cloudflare handles HTTPS → HTTP to your server
3. This avoids certificate provisioning issues

**Note:** Full SSL is more secure. Configure Coolify to provision a Let's Encrypt cert, then set Cloudflare to **Full (Strict)**.

## Coolify Settings Checklist

- [ ] Domain configured: `serika.lol`
- [ ] Port exposed: `3000`
- [ ] Health check: Enabled (auto-detected)
- [ ] Persistent storage: `/app/downloads` mounted
- [ ] Environment variables: Set as needed
- [ ] SSL: Enabled (or disabled if using Cloudflare Flexible)

## Quick Start Commands

```bash
# Clone and deploy manually
git clone https://github.com/serika-dev/serika-downloader.git
cd serika-downloader

# Build
docker build -t serika-downloader .

# Run (for testing)
docker run -p 3000:3000 -v ./downloads:/app/downloads serika-downloader
```

Then configure Coolify to point to your Git repo for automated deployments.
