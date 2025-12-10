# syntax=docker/dockerfile:1

# Serika Downloader - Optimized Multi-stage Dockerfile
# Build: docker build -t serika-downloader .
# Run:   docker run -p 3000:3000 serika-downloader

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on available lockfile
RUN --mount=type=cache,target=/root/.npm \
  if [ -f bun.lockb ]; then \
    corepack enable && corepack prepare bun@latest --activate && bun install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci --prefer-offline; \
  elif [ -f yarn.lock ]; then \
    corepack enable && yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable && pnpm i --frozen-lockfile; \
  else \
    echo "No lockfile found." && npm install; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install yt-dlp, ffmpeg, aria2c for optimal performance
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
      python3 \
      py3-pip \
      ffmpeg \
      aria2 \
      curl \
      ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && yt-dlp --version \
    && ffmpeg -version | head -1 \
    && aria2c --version | head -1

# Create downloads directory with proper permissions
RUN mkdir -p /app/downloads /tmp/serika-downloads && \
    chown -R nextjs:nodejs /app/downloads /tmp/serika-downloads

# Copy built application
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add labels for better container management
LABEL org.opencontainers.image.title="Serika Downloader" \
      org.opencontainers.image.description="Fast video downloader powered by yt-dlp" \
      org.opencontainers.image.source="https://github.com/serika-downloader" \
      org.opencontainers.image.licenses="MIT"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Configure server
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check using curl (installed in this image)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl --fail --silent --head http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server.js"]
