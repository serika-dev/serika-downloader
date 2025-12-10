@echo off
setlocal enabledelayedexpansion

REM Serika Downloader Quick Start Script
REM Usage: start.bat [dev|stop|logs|rebuild|help]

echo.
echo     ███████╗███████╗██████╗ ██╗██╗  ██╗ █████╗ 
echo     ██╔════╝██╔════╝██╔══██╗██║██║ ██╔╝██╔══██╗
echo     ███████╗█████╗  ██████╔╝██║█████╔╝ ███████║
echo     ╚════██║██╔══╝  ██╔══██╗██║██╔═██╗ ██╔══██║
echo     ███████║███████╗██║  ██║██║██║  ██╗██║  ██║
echo     ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
echo                     Video Downloader
echo.

REM Parse arguments
if "%1"=="help" goto :help
if "%1"=="-help" goto :help
if "%1"=="--help" goto :help
if "%1"=="/?" goto :help
if "%1"=="stop" goto :stop
if "%1"=="logs" goto :logs
if "%1"=="dev" goto :dev
if "%1"=="rebuild" goto :rebuild
goto :docker

:help
echo Usage: start.bat [command]
echo.
echo Commands:
echo   (none)    Start with Docker (default)
echo   dev       Run in development mode (requires Node.js/Bun)
echo   stop      Stop running containers
echo   logs      Show container logs
echo   rebuild   Rebuild Docker image from scratch
echo   help      Show this help message
echo.
echo Examples:
echo   start.bat              Start with Docker
echo   start.bat dev          Start in dev mode
echo   start.bat stop         Stop containers
echo.
goto :end

:stop
echo Stopping Serika Downloader...
docker-compose down
echo [OK] Stopped
goto :end

:logs
echo Showing logs (Ctrl+C to exit)...
docker-compose logs -f
goto :end

:dev
echo Starting in Development Mode...
echo.

REM Check for yt-dlp
yt-dlp --version >nul 2>&1
if errorlevel 1 (
    echo [X] yt-dlp not found
    echo     Run: powershell -ExecutionPolicy Bypass -File install-ytdlp.ps1
    pause
    exit /b 1
)
echo [OK] yt-dlp found

REM Check for ffmpeg
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo [!] FFmpeg not found (some features may not work)
) else (
    echo [OK] FFmpeg found
)

REM Check for aria2c
aria2c --version >nul 2>&1
if errorlevel 1 (
    echo [!] aria2c not found (downloads will be slower)
) else (
    echo [OK] aria2c found (fast downloads enabled)
)

REM Check for package manager
set "PM="
bun --version >nul 2>&1
if not errorlevel 1 (
    set "PM=bun"
    echo [OK] Bun found
    goto :pm_found
)
npm --version >nul 2>&1
if not errorlevel 1 (
    set "PM=npm"
    echo [OK] npm found
    goto :pm_found
)
echo [X] No package manager found (install Node.js or Bun)
pause
exit /b 1

:pm_found
REM Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    if "%PM%"=="bun" (
        bun install
    ) else (
        npm install
    )
)

echo.
echo =====================================
echo [OK] Starting dev server...
echo =====================================
echo.
echo Open your browser:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

if "%PM%"=="bun" (
    bun dev
) else (
    npm run dev
)
goto :end

:rebuild
echo Rebuilding Serika Downloader...
set "REBUILD=1"
goto :docker_start

:docker
echo Starting with Docker...
echo.

:docker_start
REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker is not installed or not in PATH
    echo.
    echo Options:
    echo   1. Install Docker Desktop: https://docker.com/products/docker-desktop
    echo   2. Run in dev mode: start.bat dev
    echo.
    pause
    exit /b 1
)
echo [OK] Docker found

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [X] Docker daemon is not running
    echo.
    echo Please start Docker Desktop and try again
    echo.
    pause
    exit /b 1
)
echo [OK] Docker daemon is running

REM Create downloads folder if it doesn't exist
if not exist "downloads" (
    mkdir downloads
    echo [OK] Created downloads folder
)

echo.

REM Start docker compose
if defined REBUILD (
    echo Rebuilding and starting Serika Downloader...
    docker-compose up -d --build --force-recreate
) else (
    echo Building and starting Serika Downloader...
    docker-compose up -d
)

if errorlevel 1 (
    echo.
    echo [X] Failed to start Docker container
    echo.
    echo Try running: start.bat rebuild
    pause
    exit /b 1
)

REM Wait for server to be ready
echo.
echo Waiting for server to be ready...
set /a attempts=0
:wait_loop
if !attempts! geq 30 goto :ready
curl -s -o nul -w "" http://localhost:3000 2>nul
if not errorlevel 1 goto :ready
set /a attempts+=1
timeout /t 1 /nobreak >nul
echo|set /p="."
goto :wait_loop

:ready
echo.
echo.
echo =====================================
echo [OK] Serika Downloader is ready!
echo =====================================
echo.
echo Open your browser:
echo   http://localhost:3000
echo.
echo Commands:
echo   start.bat stop     Stop the server
echo   start.bat logs     View logs
echo   start.bat rebuild  Rebuild from scratch
echo.
pause

:end
endlocal
