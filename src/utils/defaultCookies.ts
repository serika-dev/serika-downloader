import fs from 'fs/promises';
import os from 'os';
import path from 'path';

type CookieSite = 'instagram' | 'bilibili';

const DEFAULT_COOKIES_DIR = path.join(os.tmpdir(), 'serika-default-cookies');
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

type CacheEntry = {
  filePath: string;
  fetchedAt: number;
  source: string;
};

const cookieCache = new Map<CookieSite, CacheEntry>();

function envKey(site: CookieSite, suffix: 'PATH' | 'URL'): string {
  return `${site.toUpperCase()}_COOKIES_${suffix}`;
}

function resolveEnvPath(configuredPath: string): string {
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultDir(): Promise<void> {
  await fs.mkdir(DEFAULT_COOKIES_DIR, { recursive: true });
}

async function downloadTextFile(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        // Avoid accidental caching by intermediaries
        'Cache-Control': 'no-cache',
      },
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch cookies (${resp.status})`);
    }

    return await resp.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function writeAtomically(filePath: string, contents: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, contents, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

export async function getDefaultCookiesPath(site: CookieSite): Promise<string | undefined> {
  // 1) PATH env var (static file inside container)
  const configuredPath = process.env[envKey(site, 'PATH')];
  if (configuredPath) {
    const resolved = resolveEnvPath(configuredPath);
    if (await fileExists(resolved)) {
      return resolved;
    }
  }

  // 2) URL env var (download into /tmp cache)
  const configuredUrl = process.env[envKey(site, 'URL')];
  if (!configuredUrl) return undefined;

  const now = Date.now();
  const cached = cookieCache.get(site);
  if (cached && cached.source === configuredUrl && now - cached.fetchedAt < DEFAULT_TTL_MS && (await fileExists(cached.filePath))) {
    return cached.filePath;
  }

  await ensureDefaultDir();
  const destPath = path.join(DEFAULT_COOKIES_DIR, `${site}-cookies.txt`);

  const contents = await downloadTextFile(configuredUrl);
  await writeAtomically(destPath, contents);

  cookieCache.set(site, { filePath: destPath, fetchedAt: now, source: configuredUrl });
  return destPath;
}

export function isInstagramUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?instagram\.com\//.test(url);
}

export function isBilibiliUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(bilibili\.com|b23\.tv)\//.test(url);
}
