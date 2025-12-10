#!/usr/bin/env pwsh

# Install yt-dlp, FFmpeg, and aria2c on Windows

$Logo = @"

    ███████╗███████╗██████╗ ██╗██╗  ██╗ █████╗ 
    ██╔════╝██╔════╝██╔══██╗██║██║ ██╔╝██╔══██╗
    ███████╗█████╗  ██████╔╝██║█████╔╝ ███████║
    ╚════██║██╔══╝  ██╔══██╗██║██╔═██╗ ██╔══██║
    ███████║███████╗██║  ██║██║██║  ██╗██║  ██║
    ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
              Dependencies Installer

"@

Write-Host $Logo -ForegroundColor Magenta

# Check current status
Write-Host "Checking current installation status..." -ForegroundColor Cyan
Write-Host ""

$needsYtdlp = $true
$needsFfmpeg = $true
$needsAria2c = $true

try {
    $ytdlpVersion = & yt-dlp --version 2>$null
    Write-Host "[✓] yt-dlp: $ytdlpVersion" -ForegroundColor Green
    $needsYtdlp = $false
} catch {
    Write-Host "[✗] yt-dlp: Not installed" -ForegroundColor Red
}

try {
    & ffmpeg -version 2>$null | Out-Null
    Write-Host "[✓] FFmpeg: Installed" -ForegroundColor Green
    $needsFfmpeg = $false
} catch {
    Write-Host "[✗] FFmpeg: Not installed" -ForegroundColor Red
}

try {
    & aria2c --version 2>$null | Out-Null
    Write-Host "[✓] aria2c: Installed (16x faster downloads!)" -ForegroundColor Green
    $needsAria2c = $false
} catch {
    Write-Host "[✗] aria2c: Not installed (optional, but recommended)" -ForegroundColor Yellow
}

if (-not $needsYtdlp -and -not $needsFfmpeg -and -not $needsAria2c) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "[✓] All dependencies already installed!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run: .\start.ps1 -Dev" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host ""

# Check if running as admin for chocolatey
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Detect available package managers
$hasChoco = Test-Path "C:\ProgramData\chocolatey\bin\choco.exe"
$hasScoop = (Get-Command scoop -ErrorAction SilentlyContinue) -ne $null
$hasPip = $false
try { & python -m pip --version 2>$null | Out-Null; $hasPip = $true } catch {}
$hasWinget = (Get-Command winget -ErrorAction SilentlyContinue) -ne $null

Write-Host "Available package managers:" -ForegroundColor Yellow
if ($hasWinget) { Write-Host "  [✓] winget (Windows Package Manager)" -ForegroundColor Green }
if ($hasChoco) { Write-Host "  [✓] Chocolatey" -ForegroundColor Green }
if ($hasScoop) { Write-Host "  [✓] Scoop" -ForegroundColor Green }
if ($hasPip) { Write-Host "  [✓] pip (Python)" -ForegroundColor Green }
Write-Host ""

# Choose installation method
$options = @()
$optionNum = 1

if ($hasWinget) {
    $options += @{ Num = $optionNum; Name = "winget"; Label = "winget (Recommended - no admin needed)" }
    $optionNum++
}
if ($hasChoco) {
    $options += @{ Num = $optionNum; Name = "choco"; Label = "Chocolatey" + $(if (-not $isAdmin) { " (requires admin)" } else { "" }) }
    $optionNum++
}
if ($hasScoop) {
    $options += @{ Num = $optionNum; Name = "scoop"; Label = "Scoop (no admin needed)" }
    $optionNum++
}
if ($hasPip) {
    $options += @{ Num = $optionNum; Name = "pip"; Label = "pip (yt-dlp only, FFmpeg separate)" }
    $optionNum++
}
$options += @{ Num = $optionNum; Name = "manual"; Label = "Manual installation instructions" }

Write-Host "Choose installation method:" -ForegroundColor Cyan
foreach ($opt in $options) {
    Write-Host "  $($opt.Num). $($opt.Label)" -ForegroundColor White
}
Write-Host ""
$choice = Read-Host "Enter choice (1-$($options.Count))"

$selectedOption = $options | Where-Object { $_.Num -eq [int]$choice }
if (-not $selectedOption) {
    Write-Host "[✗] Invalid choice" -ForegroundColor Red
    exit 1
}

$method = $selectedOption.Name

switch ($method) {
    "winget" {
        Write-Host ""
        Write-Host "Installing with winget..." -ForegroundColor Cyan
        
        if ($needsYtdlp) {
            Write-Host "" 
            Write-Host "Installing yt-dlp..." -ForegroundColor Yellow
            & winget install yt-dlp.yt-dlp --silent --accept-package-agreements --accept-source-agreements
        }
        
        if ($needsFfmpeg) {
            Write-Host ""
            Write-Host "Installing FFmpeg..." -ForegroundColor Yellow
            & winget install Gyan.FFmpeg --silent --accept-package-agreements --accept-source-agreements
        }
        
        if ($needsAria2c) {
            Write-Host ""
            Write-Host "Installing aria2c (for 16x faster downloads)..." -ForegroundColor Yellow
            & winget install aria2.aria2 --silent --accept-package-agreements --accept-source-agreements
        }
    }
    "choco" {
        if (-not $isAdmin) {
            Write-Host "[✗] Chocolatey requires Administrator privileges" -ForegroundColor Red
            Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host ""
        Write-Host "Installing with Chocolatey..." -ForegroundColor Cyan
        
        if ($needsYtdlp) {
            Write-Host ""
            Write-Host "Installing yt-dlp..." -ForegroundColor Yellow
            & choco install yt-dlp -y
        }
        
        if ($needsFfmpeg) {
            Write-Host ""
            Write-Host "Installing FFmpeg..." -ForegroundColor Yellow
            & choco install ffmpeg -y
        }
        
        if ($needsAria2c) {
            Write-Host ""
            Write-Host "Installing aria2c (for 16x faster downloads)..." -ForegroundColor Yellow
            & choco install aria2 -y
        }
    }
    "scoop" {
        Write-Host ""
        Write-Host "Installing with Scoop..." -ForegroundColor Cyan
        
        if ($needsYtdlp) {
            Write-Host ""
            Write-Host "Installing yt-dlp..." -ForegroundColor Yellow
            & scoop install yt-dlp
        }
        
        if ($needsFfmpeg) {
            Write-Host ""
            Write-Host "Installing FFmpeg..." -ForegroundColor Yellow
            & scoop install ffmpeg
        }
        
        if ($needsAria2c) {
            Write-Host ""
            Write-Host "Installing aria2c (for 16x faster downloads)..." -ForegroundColor Yellow
            & scoop install aria2
        }
    }
    "pip" {
        Write-Host ""
        Write-Host "Installing with pip..." -ForegroundColor Cyan
        
        if ($needsYtdlp) {
            Write-Host ""
            Write-Host "Installing yt-dlp..." -ForegroundColor Yellow
            & python -m pip install -U yt-dlp
        }
        
        Write-Host ""
        Write-Host "[!] FFmpeg and aria2c need to be installed separately:" -ForegroundColor Yellow
        Write-Host "    FFmpeg: https://ffmpeg.org/download.html" -ForegroundColor Gray
        Write-Host "    aria2c: https://aria2.github.io/" -ForegroundColor Gray
    }
    "manual" {
        Write-Host ""
        Write-Host "Manual Installation Instructions" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "yt-dlp:" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://github.com/yt-dlp/yt-dlp/releases" -ForegroundColor White
        Write-Host "  2. Get yt-dlp.exe and place in a folder (e.g., C:\Tools)" -ForegroundColor White
        Write-Host "  3. Add folder to PATH environment variable" -ForegroundColor White
        Write-Host ""
        Write-Host "FFmpeg:" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://ffmpeg.org/download.html" -ForegroundColor White
        Write-Host "  2. Extract to a folder (e.g., C:\Tools\ffmpeg)" -ForegroundColor White
        Write-Host "  3. Add bin folder to PATH (e.g., C:\Tools\ffmpeg\bin)" -ForegroundColor White
        Write-Host ""
        Write-Host "aria2c (optional, for faster downloads):" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://aria2.github.io/" -ForegroundColor White
        Write-Host "  2. Extract and add to PATH" -ForegroundColor White
        Write-Host ""
        Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Gray
        exit 0
    }
}

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Verifying installation..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

try {
    $ytdlpVersion = & yt-dlp --version 2>$null
    Write-Host "[✓] yt-dlp: $ytdlpVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] yt-dlp: Not found (restart PowerShell)" -ForegroundColor Red
    $allGood = $false
}

try {
    & ffmpeg -version 2>$null | Out-Null
    Write-Host "[✓] FFmpeg: Installed" -ForegroundColor Green
} catch {
    Write-Host "[✗] FFmpeg: Not found" -ForegroundColor Red
    $allGood = $false
}

try {
    & aria2c --version 2>$null | Out-Null
    Write-Host "[✓] aria2c: Installed (16x faster downloads!)" -ForegroundColor Green
} catch {
    Write-Host "[⚠] aria2c: Not found (downloads will work but slower)" -ForegroundColor Yellow
}

Write-Host ""
if ($allGood) {
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "[✓] Installation complete!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You may need to restart PowerShell for PATH changes." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 -Dev     Start in development mode" -ForegroundColor Cyan
    Write-Host "  .\start.ps1          Start with Docker" -ForegroundColor Cyan
} else {
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host "[!] Some components may need attention" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try restarting PowerShell and running this script again." -ForegroundColor Gray
}
Write-Host ""
