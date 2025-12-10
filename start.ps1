#!/usr/bin/env pwsh

# Serika Downloader Quick Start Script for PowerShell
param(
    [switch]$Dev,
    [switch]$Docker,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Rebuild,
    [switch]$Help
)

$Logo = @"

    ███████╗███████╗██████╗ ██╗██╗  ██╗ █████╗ 
    ██╔════╝██╔════╝██╔══██╗██║██║ ██╔╝██╔══██╗
    ███████╗█████╗  ██████╔╝██║█████╔╝ ███████║
    ╚════██║██╔══╝  ██╔══██╗██║██╔═██╗ ██╔══██║
    ███████║███████╗██║  ██║██║██║  ██╗██║  ██║
    ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
                    Video Downloader

"@

Write-Host $Logo -ForegroundColor Magenta

if ($Help) {
    Write-Host "Usage: .\start.ps1 [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Dev       Run in development mode (requires Node.js/Bun)" -ForegroundColor White
    Write-Host "  -Docker    Run with Docker (default if no option specified)" -ForegroundColor White
    Write-Host "  -Stop      Stop running containers" -ForegroundColor White
    Write-Host "  -Logs      Show container logs" -ForegroundColor White
    Write-Host "  -Rebuild   Rebuild Docker image from scratch" -ForegroundColor White
    Write-Host "  -Help      Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1              # Start with Docker" -ForegroundColor Gray
    Write-Host "  .\start.ps1 -Dev         # Start in dev mode" -ForegroundColor Gray
    Write-Host "  .\start.ps1 -Stop        # Stop containers" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

if ($Stop) {
    Write-Host "Stopping Serika Downloader..." -ForegroundColor Yellow
    & docker-compose down
    Write-Host "[✓] Stopped" -ForegroundColor Green
    exit 0
}

if ($Logs) {
    Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    & docker-compose logs -f
    exit 0
}

# Development mode
if ($Dev) {
    Write-Host "Starting in Development Mode..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check for yt-dlp
    try {
        $ytdlpVersion = & yt-dlp --version 2>$null
        Write-Host "[✓] yt-dlp found: $ytdlpVersion" -ForegroundColor Green
    } catch {
        Write-Host "[✗] yt-dlp not found" -ForegroundColor Red
        Write-Host "  Run: .\install-ytdlp.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    # Check for ffmpeg
    try {
        & ffmpeg -version 2>$null | Out-Null
        Write-Host "[✓] FFmpeg found" -ForegroundColor Green
    } catch {
        Write-Host "[⚠] FFmpeg not found (some features may not work)" -ForegroundColor Yellow
    }
    
    # Check for aria2c (optional)
    try {
        & aria2c --version 2>$null | Out-Null
        Write-Host "[✓] aria2c found (fast downloads enabled)" -ForegroundColor Green
    } catch {
        Write-Host "[⚠] aria2c not found (downloads will be slower)" -ForegroundColor Yellow
    }
    
    # Check for package manager
    $packageManager = $null
    try {
        & bun --version 2>$null | Out-Null
        $packageManager = "bun"
        Write-Host "[✓] Bun found" -ForegroundColor Green
    } catch {
        try {
            & npm --version 2>$null | Out-Null
            $packageManager = "npm"
            Write-Host "[✓] npm found" -ForegroundColor Green
        } catch {
            Write-Host "[✗] No package manager found (install Node.js or Bun)" -ForegroundColor Red
            exit 1
        }
    }
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host ""
        Write-Host "Installing dependencies..." -ForegroundColor Cyan
        if ($packageManager -eq "bun") {
            & bun install
        } else {
            & npm install
        }
    }
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "[✓] Starting dev server..." -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open your browser:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    if ($packageManager -eq "bun") {
        & bun dev
    } else {
        & npm run dev
    }
    exit 0
}

# Docker mode (default)
Write-Host "Starting with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = & docker --version 2>$null
    Write-Host "[✓] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "  2. Run in dev mode: .\start.ps1 -Dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if Docker daemon is running
try {
    & docker info 2>$null | Out-Null
    Write-Host "[✓] Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "[✗] Docker daemon is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Create downloads folder if it doesn't exist
if (-not (Test-Path "downloads")) {
    New-Item -ItemType Directory -Force -Path "downloads" | Out-Null
    Write-Host "[✓] Created downloads folder" -ForegroundColor Green
}

Write-Host ""

# Start docker compose
if ($Rebuild) {
    Write-Host "Rebuilding and starting Serika Downloader..." -ForegroundColor Cyan
    & docker-compose up -d --build --force-recreate
} else {
    Write-Host "Building and starting Serika Downloader..." -ForegroundColor Cyan
    & docker-compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[✗] Failed to start Docker container" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running with -Rebuild flag: .\start.ps1 -Rebuild" -ForegroundColor Yellow
    exit 1
}

# Wait for container to be healthy
Write-Host ""
Write-Host "Waiting for server to be ready..." -ForegroundColor Gray
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            break
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}
Write-Host ""

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "[✓] Serika Downloader is ready!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  .\start.ps1 -Stop    Stop the server" -ForegroundColor Gray
Write-Host "  .\start.ps1 -Logs    View logs" -ForegroundColor Gray
Write-Host "  .\start.ps1 -Rebuild Rebuild from scratch" -ForegroundColor Gray
Write-Host ""
