export interface WikipediaSummary {
  slug: string;
  title: string;
  description?: string;
  extract: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  pageUrl: string;
  status: 'ok' | 'fallback';
}

const MEMORY_CACHE = new Map<string, WikipediaSummary>();
const INFLIGHT_CACHE = new Map<string, Promise<WikipediaSummary>>();
const STORAGE_PREFIX = 'chrono_wiki_v1:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

interface StoredWikipediaEntry {
  cachedAt: number;
  data: WikipediaSummary;
}

// Gentle concurrency-limited queue to prevent Wikipedia REST API 429 rate-limiting
const MAX_CONCURRENT = 3;
const REQUEST_SPACING_MS = 65;
let activeRequests = 0;
let lastDispatchTime = 0;
const waitQueue: Array<() => void> = [];

function scheduleSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryRun = () => {
      const now = Date.now();
      const elapsed = now - lastDispatchTime;
      if (activeRequests < MAX_CONCURRENT && elapsed >= REQUEST_SPACING_MS) {
        activeRequests++;
        lastDispatchTime = now;
        resolve();
        return;
      }
      if (activeRequests < MAX_CONCURRENT) {
        const waitMs = Math.max(10, REQUEST_SPACING_MS - elapsed);
        setTimeout(() => {
          if (activeRequests < MAX_CONCURRENT) {
            activeRequests++;
            lastDispatchTime = Date.now();
            resolve();
          } else {
            waitQueue.push(tryRun);
          }
        }, waitMs);
        return;
      }
      waitQueue.push(tryRun);
    };
    tryRun();
  });
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) {
    setTimeout(next, REQUEST_SPACING_MS);
  }
}

function readStorageCache(slug: string): WikipediaSummary | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWikipediaEntry;
    if (
      parsed &&
      parsed.data &&
      parsed.data.slug === slug &&
      parsed.data.status === 'ok' &&
      Date.now() - parsed.cachedAt < CACHE_TTL_MS
    ) {
      return parsed.data;
    }
  } catch {
    // Ignore storage quota or JSON parse issues
  }
  return null;
}

function writeStorageCache(slug: string, summary: WikipediaSummary): void {
  if (typeof window === 'undefined' || summary.status !== 'ok') return;
  try {
    const payload: StoredWikipediaEntry = {
      cachedAt: Date.now(),
      data: summary,
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota issues
  }
}

export function getWikipediaFallbackUrl(slug: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
}

async function fetchWithRetry(endpoint: string): Promise<Response> {
  let attempt = 0;
  while (attempt < 3) {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.status !== 429) {
      return response;
    }
    attempt++;
    await new Promise((r) => setTimeout(r, 600 * attempt));
  }
  return fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });
}

export async function fetchWikipediaSummary(slug: string): Promise<WikipediaSummary> {
  const memHit = MEMORY_CACHE.get(slug);
  if (memHit) return memHit;

  const storageHit = readStorageCache(slug);
  if (storageHit) {
    MEMORY_CACHE.set(slug, storageHit);
    return storageHit;
  }

  const inflight = INFLIGHT_CACHE.get(slug);
  if (inflight) return inflight;

  const promise = (async (): Promise<WikipediaSummary> => {
    const fallbackUrl = getWikipediaFallbackUrl(slug);
    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;

    await scheduleSlot();
    try {
      const response = await fetchWithRetry(endpoint);

      if (!response.ok) {
        throw new Error(`Wikipedia API responded with ${response.status}`);
      }

      const data = (await response.json()) as {
        title?: string;
        description?: string;
        extract?: string;
        thumbnail?: { source?: string };
        originalimage?: { source?: string };
        content_urls?: { desktop?: { page?: string } };
      };

      const result: WikipediaSummary = {
        slug,
        title: data.title || slug.replace(/_/g, ' '),
        description: data.description,
        extract: data.extract || '',
        thumbnailUrl: data.thumbnail?.source,
        originalImageUrl: data.originalimage?.source || data.thumbnail?.source,
        pageUrl: data.content_urls?.desktop?.page || fallbackUrl,
        status: 'ok',
      };

      MEMORY_CACHE.set(slug, result);
      writeStorageCache(slug, result);
      return result;
    } catch {
      const fallback: WikipediaSummary = {
        slug,
        title: slug.replace(/_/g, ' '),
        extract: '',
        pageUrl: fallbackUrl,
        status: 'fallback',
      };
      return fallback;
    } finally {
      releaseSlot();
      INFLIGHT_CACHE.delete(slug);
    }
  })();

  INFLIGHT_CACHE.set(slug, promise);
  return promise;
}

export function getCachedWikipediaSummary(slug: string): WikipediaSummary | null {
  const mem = MEMORY_CACHE.get(slug);
  if (mem) return mem;
  const stored = readStorageCache(slug);
  if (stored) {
    MEMORY_CACHE.set(slug, stored);
    return stored;
  }
  return null;
}
