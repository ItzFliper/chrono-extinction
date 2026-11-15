import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { EraId, Species, SpeciesStatus, TaxonGroup } from '../src/types/species.ts';

const ROOT_DIR = process.cwd();
const SPECIES_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'species.json');
const SHARDS_DIR = path.join(ROOT_DIR, 'scripts', 'shards');

const VALID_STATUSES = new Set<SpeciesStatus>(['extinct', 'endangered', 'recovered']);
const VALID_ERA_IDS = new Set<EraId>([
  'ordovician',
  'devonian',
  'permian',
  'triassic',
  'jurassic',
  'cretaceous',
  'paleogene-neogene',
  'pleistocene',
  'holocene-historical',
  'present',
]);
const VALID_TAXON_GROUPS = new Set<TaxonGroup>([
  'arthropod',
  'fish',
  'amphibian-reptile',
  'synapsid',
  'dinosaur-theropod',
  'dinosaur-herbivore',
  'pterosaur-marine',
  'mammal-megafauna',
  'mammal-carnivore',
  'mammal-ungulate',
  'cetacean',
  'bird',
]);

const WIKI_USER_AGENT =
  'ChronoExtinctionValidator/1.0 (https://github.com/ItzFliper/chrono-extinction)';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSlug(slug: string): string {
  return decodeURIComponent(slug.trim())
    .replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//i, '')
    .replace(/ /g, '_');
}

function isValidEntry(raw: unknown): raw is Species {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as Record<string, unknown>;

  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.commonName !== 'string' || !item.commonName.trim()) return false;
  if (typeof item.scientificName !== 'string' || !item.scientificName.trim()) return false;
  if (!VALID_STATUSES.has(item.status as SpeciesStatus)) return false;
  if (typeof item.extinctionYear !== 'number' || !Number.isFinite(item.extinctionYear)) return false;
  if (typeof item.displayDate !== 'string' || !item.displayDate.trim()) return false;
  if (typeof item.era !== 'string' || !item.era.trim()) return false;
  if (!VALID_ERA_IDS.has(item.eraId as EraId)) return false;
  if (typeof item.cause !== 'string' || item.cause.trim().length < 12) return false;
  if (typeof item.wikipediaSlug !== 'string' || !item.wikipediaSlug.trim()) return false;
  if (!VALID_TAXON_GROUPS.has(item.taxonGroup as TaxonGroup)) return false;

  if (item.status === 'endangered' || item.status === 'recovered') {
    if (item.eraId !== 'present' || item.extinctionYear !== 2026) return false;
  } else {
    if (item.eraId === 'present' || item.extinctionYear >= 2026) return false;
  }

  return true;
}

interface MediaWikiQueryResponse {
  query?: {
    normalized?: Array<{ from: string; to: string }>;
    redirects?: Array<{ from: string; to: string }>;
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        missing?: string;
        thumbnail?: { source?: string };
      }
    >;
  };
}

interface MediaWikiSearchResponse {
  query?: {
    search?: Array<{ title?: string }>;
  };
}

async function fetchJsonWithRetry<T>(url: string): Promise<T> {
  let attempt = 0;
  while (attempt < 4) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': WIKI_USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (res.status === 429 || res.status >= 500) {
      attempt++;
      await sleep(500 * attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`Failed after retries: ${url}`);
}

async function batchValidateSlugs(
  entries: Species[]
): Promise<{
  validated: Species[];
  repairedRedirects: number;
  searchRepaired: number;
  dropped: Array<{ id: string; commonName: string; scientificName: string; slug: string }>;
}> {
  const BATCH_SIZE = 45;
  const resolvedMap = new Map<
    string,
    { canonicalTitle: string; thumbnailUrl?: string; missing: boolean }
  >();

  const uniqueSlugs = Array.from(new Set(entries.map((e) => normalizeSlug(e.wikipediaSlug))));
  console.log(`Validating ${uniqueSlugs.length} unique Wikipedia titles in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < uniqueSlugs.length; i += BATCH_SIZE) {
    const batch = uniqueSlugs.slice(i, i + BATCH_SIZE);
    const titlesParam = batch.map((s) => encodeURIComponent(s)).join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages|info&pithumbsize=330&format=json&titles=${titlesParam}`;

    const data = await fetchJsonWithRetry<MediaWikiQueryResponse>(url);
    const query = data.query;

    const normMap = new Map<string, string>();
    for (const n of query?.normalized ?? []) {
      normMap.set(n.from, n.to);
    }

    const redirectMap = new Map<string, string>();
    for (const r of query?.redirects ?? []) {
      redirectMap.set(r.from, r.to);
    }

    const pagesByTitle = new Map<
      string,
      { title: string; missing: boolean; thumbnailUrl?: string }
    >();
    for (const page of Object.values(query?.pages ?? {})) {
      if (!page.title) continue;
      pagesByTitle.set(page.title, {
        title: page.title,
        missing: typeof page.missing === 'string' || !page.pageid,
        thumbnailUrl: page.thumbnail?.source,
      });
    }

    for (const origSlug of batch) {
      const displayInput = origSlug.replace(/_/g, ' ');
      let curTitle = normMap.get(displayInput) ?? normMap.get(origSlug) ?? displayInput;
      // Follow redirect chain (up to 4 hops just in case)
      for (let hop = 0; hop < 4; hop++) {
        const nextTitle = redirectMap.get(curTitle);
        if (!nextTitle || nextTitle === curTitle) break;
        curTitle = nextTitle;
      }
      const page = pagesByTitle.get(curTitle);
      if (page && !page.missing) {
        resolvedMap.set(origSlug, {
          canonicalTitle: page.title,
          thumbnailUrl: page.thumbnailUrl,
          missing: false,
        });
      } else {
        resolvedMap.set(origSlug, {
          canonicalTitle: origSlug.replace(/_/g, ' '),
          missing: true,
        });
      }
    }

    await sleep(160);
  }

  // Attempt search fallback for any missing Wikipedia title using scientificName or commonName
  const missingEntries = entries.filter((sp) => {
    const res = resolvedMap.get(normalizeSlug(sp.wikipediaSlug));
    return !res || res.missing;
  });

  let searchRepaired = 0;
  const repairedTitleById = new Map<string, string>();
  const repairedThumbByTitle = new Map<string, string | undefined>();

  if (missingEntries.length > 0) {
    console.log(
      `Attempting MediaWiki search repair for ${missingEntries.length} unverified slugs...`
    );
    for (const sp of missingEntries) {
      const candidatesToTry = [sp.scientificName, sp.commonName];
      let matchedTitle: string | null = null;
      for (const q of candidatesToTry) {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          q
        )}&srlimit=1&format=json`;
        try {
          const searchData = await fetchJsonWithRetry<MediaWikiSearchResponse>(searchUrl);
          const first = searchData.query?.search?.[0]?.title;
          if (first) {
            matchedTitle = first;
            break;
          }
        } catch {
          // Ignore single search failure
        }
        await sleep(120);
      }
      if (matchedTitle) {
        repairedTitleById.set(sp.id, matchedTitle);
        searchRepaired++;
      }
    }

    // Fetch thumbnails for repaired titles
    const repairedUnique = Array.from(new Set(repairedTitleById.values()));
    for (let i = 0; i < repairedUnique.length; i += BATCH_SIZE) {
      const batch = repairedUnique.slice(i, i + BATCH_SIZE);
      const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages|info&pithumbsize=330&format=json&titles=${batch
        .map((s) => encodeURIComponent(s))
        .join('|')}`;
      try {
        const data = await fetchJsonWithRetry<MediaWikiQueryResponse>(url);
        for (const p of Object.values(data.query?.pages ?? {})) {
          if (p.title && typeof p.missing !== 'string') {
            repairedThumbByTitle.set(p.title, p.thumbnail?.source);
          }
        }
      } catch {
        // Ignore thumbnail failure on repaired batch
      }
      await sleep(140);
    }
  }

  let repairedRedirects = 0;
  const dropped: Array<{ id: string; commonName: string; scientificName: string; slug: string }> = [];
  const validated: Species[] = [];

  for (const sp of entries) {
    const origSlug = normalizeSlug(sp.wikipediaSlug);
    const resolved = resolvedMap.get(origSlug);
    if (resolved && !resolved.missing) {
      const canonicalSlug = resolved.canonicalTitle.replace(/ /g, '_');
      if (canonicalSlug !== sp.wikipediaSlug) {
        repairedRedirects++;
      }
      validated.push({
        ...sp,
        wikipediaSlug: canonicalSlug,
        ...(resolved.thumbnailUrl ? { thumbnailUrl: resolved.thumbnailUrl } : {}),
      });
    } else {
      const repairedTitle = repairedTitleById.get(sp.id);
      if (repairedTitle) {
        const canonicalSlug = repairedTitle.replace(/ /g, '_');
        const thumb = repairedThumbByTitle.get(repairedTitle);
        validated.push({
          ...sp,
          wikipediaSlug: canonicalSlug,
          ...(thumb ? { thumbnailUrl: thumb } : {}),
        });
      } else {
        dropped.push({
          id: sp.id,
          commonName: sp.commonName,
          scientificName: sp.scientificName,
          slug: sp.wikipediaSlug,
        });
      }
    }
  }

  return { validated, repairedRedirects, searchRepaired, dropped };
}

function deduplicateSpecies(items: Species[]): {
  deduped: Species[];
  duplicateCount: number;
} {
  const seenIds = new Set<string>();
  const seenScientific = new Set<string>();
  const seenSlugs = new Set<string>();
  const deduped: Species[] = [];
  let duplicateCount = 0;

  for (const rawItem of items) {
    const item: Species = {
      ...rawItem,
      id: rawItem.id.trim().toLowerCase(),
      commonName: rawItem.commonName.trim(),
      scientificName: rawItem.scientificName.trim().replace(/\s+/g, ' '),
      wikipediaSlug: normalizeSlug(rawItem.wikipediaSlug),
      cause: rawItem.cause.trim(),
    };

    const sciKey = item.scientificName.toLowerCase();
    const slugKey = item.wikipediaSlug.toLowerCase();
    const idKey = item.id;

    if (seenIds.has(idKey) || seenScientific.has(sciKey) || seenSlugs.has(slugKey)) {
      duplicateCount++;
      continue;
    }

    seenIds.add(idKey);
    seenScientific.add(sciKey);
    seenSlugs.add(slugKey);
    deduped.push(item);
  }

  return { deduped, duplicateCount };
}

async function main() {
  const noShards = process.argv.includes('--no-shards');
  const skipWiki = process.argv.includes('--skip-wiki');

  const rawExisting = JSON.parse(fs.readFileSync(SPECIES_JSON_PATH, 'utf8')) as unknown[];
  const combinedRaw: unknown[] = [...rawExisting];

  if (!noShards && fs.existsSync(SHARDS_DIR)) {
    const files = fs
      .readdirSync(SHARDS_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort();
    for (const file of files) {
      const fullPath = path.join(SHARDS_DIR, file);
      const shardData = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as unknown[];
      console.log(`Loaded shard ${file}: ${shardData.length} raw entries`);
      combinedRaw.push(...shardData);
    }
  }

  const validSchemaItems: Species[] = [];
  let invalidSchemaCount = 0;
  for (const entry of combinedRaw) {
    if (isValidEntry(entry)) {
      validSchemaItems.push(entry);
    } else {
      invalidSchemaCount++;
    }
  }

  const { deduped: preWikiDeduped, duplicateCount: initialDupes } =
    deduplicateSpecies(validSchemaItems);
  console.log(
    `Schema valid: ${validSchemaItems.length}, invalid skipped: ${invalidSchemaCount}, initial duplicates removed: ${initialDupes}, unique candidates: ${preWikiDeduped.length}`
  );

  let finalSpecies = preWikiDeduped;
  if (!skipWiki) {
    const wikiResult = await batchValidateSlugs(preWikiDeduped);
    console.log(
      `Wikipedia validation complete: ${wikiResult.validated.length} verified, ${wikiResult.repairedRedirects} redirects canonicalized, ${wikiResult.searchRepaired} search-repaired, ${wikiResult.dropped.length} unresolvable dropped.`
    );
    if (wikiResult.dropped.length > 0) {
      console.log(
        'Dropped unresolvable slugs:',
        wikiResult.dropped.map((d) => `${d.commonName} (${d.slug})`).join(', ')
      );
    }

    const postWiki = deduplicateSpecies(wikiResult.validated);
    if (postWiki.duplicateCount > 0) {
      console.log(
        `Removed ${postWiki.duplicateCount} post-redirect duplicate species entries.`
      );
    }
    finalSpecies = postWiki.deduped;
  }

  // Chronological sort (deepest geological time -> historical -> present)
  finalSpecies.sort((a, b) => {
    if (a.extinctionYear !== b.extinctionYear) {
      return a.extinctionYear - b.extinctionYear;
    }
    return a.commonName.localeCompare(b.commonName);
  });

  fs.writeFileSync(SPECIES_JSON_PATH, `${JSON.stringify(finalSpecies, null, 2)}\n`, 'utf8');

  const statusCounts: Record<string, number> = {};
  const eraCounts: Record<string, number> = {};
  let withThumbs = 0;
  for (const sp of finalSpecies) {
    statusCounts[sp.status] = (statusCounts[sp.status] ?? 0) + 1;
    eraCounts[sp.eraId] = (eraCounts[sp.eraId] ?? 0) + 1;
    if (sp.thumbnailUrl) withThumbs++;
  }

  console.log('\n=== ChronoExtinction Dataset Summary ===');
  console.log(`Total Species: ${finalSpecies.length}`);
  console.log(`With Pre-Cached Wikipedia Thumbnails: ${withThumbs} (${Math.round((withThumbs / finalSpecies.length) * 100)}%)`);
  console.log('By Status:', statusCounts);
  console.log('By Era:', eraCounts);
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
