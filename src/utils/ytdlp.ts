import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Cache the yt-dlp path
let cachedYtDlpPath: string | null = null;

/**
 * Find the yt-dlp executable path.
 * Uses multiple strategies to locate the executable.
 */
export function getYtDlpPath(): string {
  // Return cached path if available
  if (cachedYtDlpPath) {
    return cachedYtDlpPath;
  }

  const isWindows = process.platform === 'win32';
  const executableName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';

  // Strategy 1: Try to find it in PATH using where/which
  try {
    const cmd = isWindows ? 'where.exe yt-dlp' : 'which yt-dlp';
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (result) {
      const firstPath = result.split('\n')[0].trim();
      if (firstPath && fs.existsSync(firstPath)) {
        console.log(`[yt-dlp] Found in PATH: ${firstPath}`);
        cachedYtDlpPath = firstPath;
        return firstPath;
      }
    }
  } catch {
    // where/which command failed, not in PATH
  }

  // Strategy 2: Search common installation directories dynamically
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const searchDirs: string[] = [];

  if (isWindows && userProfile) {
    // Search winget packages directory
    const wingetPackagesDir = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetPackagesDir)) {
      searchDirs.push(wingetPackagesDir);
    }

    // Scoop apps directory
    const scoopDir = path.join(userProfile, 'scoop', 'apps');
    if (fs.existsSync(scoopDir)) {
      searchDirs.push(scoopDir);
    }

    // Local Programs
    const localPrograms = path.join(userProfile, 'AppData', 'Local', 'Programs');
    if (fs.existsSync(localPrograms)) {
      searchDirs.push(localPrograms);
    }
  }

  // Search for yt-dlp in these directories
  for (const searchDir of searchDirs) {
    const foundPath = findYtDlpInDir(searchDir, executableName);
    if (foundPath) {
      console.log(`[yt-dlp] Found in ${searchDir}: ${foundPath}`);
      cachedYtDlpPath = foundPath;
      return foundPath;
    }
  }

  // Strategy 3: Check common system-wide locations
  const systemPaths = isWindows
    ? [
        'C:\\Program Files\\yt-dlp\\yt-dlp.exe',
        'C:\\Program Files (x86)\\yt-dlp\\yt-dlp.exe',
      ]
    : [
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        '/opt/homebrew/bin/yt-dlp',
      ];

  for (const sysPath of systemPaths) {
    if (fs.existsSync(sysPath)) {
      console.log(`[yt-dlp] Found at system path: ${sysPath}`);
      cachedYtDlpPath = sysPath;
      return sysPath;
    }
  }

  // Fall back to just 'yt-dlp' and hope it's in PATH
  console.log('[yt-dlp] Not found in known locations, falling back to PATH');
  cachedYtDlpPath = 'yt-dlp';
  return 'yt-dlp';
}

/**
 * Recursively search for yt-dlp executable in a directory (max 2 levels deep)
 */
function findYtDlpInDir(dir: string, executableName: string, depth = 0): string | null {
  if (depth > 2) return null;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isFile() && entry.name.toLowerCase() === executableName.toLowerCase()) {
        return fullPath;
      }
      
      if (entry.isDirectory() && entry.name.toLowerCase().includes('yt-dlp')) {
        // Check directly in this directory
        const directPath = path.join(fullPath, executableName);
        if (fs.existsSync(directPath)) {
          return directPath;
        }
        // Search recursively
        const found = findYtDlpInDir(fullPath, executableName, depth + 1);
        if (found) return found;
      }
    }
  } catch {
    // Permission denied or other error
  }
  
  return null;
}

/**
 * Clear the cached path (useful for testing or after installation)
 */
export function clearYtDlpPathCache(): void {
  cachedYtDlpPath = null;
}
