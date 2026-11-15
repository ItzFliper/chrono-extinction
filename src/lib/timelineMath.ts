import type { Species, SpeciesStatus } from '@/types/species';

export const PRESENT_YEAR_CE = 2026;
export const MAX_YEARS_AGO = 550_000_000;
export const MIN_LOG = 0;
export const MAX_LOG = Math.log10(MAX_YEARS_AGO + 1); // ~8.74036

export const MIN_ZOOM_SPAN_LOG = 0.35;
export const MAX_ZOOM_SPAN_LOG = 9.4;

export const DEFAULT_CENTER_LOG = 4.35;
export const DEFAULT_ZOOM_SPAN_LOG = 9.1;

export type SemanticZoomLevel = 'macro' | 'meso' | 'micro';

export interface TimelineTick {
  id: string;
  label: string;
  yearsAgo: number;
  logVal: number;
  major: boolean;
}

/**
 * Converts a species extinctionYear + status into exact Years Ago relative to PRESENT_YEAR_CE (2026).
 */
export function getYearsAgo(extinctionYear: number, status: SpeciesStatus): number {
  if (status === 'endangered' || status === 'recovered') {
    return 0;
  }
  if (extinctionYear <= -50_000) {
    return Math.abs(extinctionYear);
  }
  if (extinctionYear < 0) {
    return PRESENT_YEAR_CE + Math.abs(extinctionYear);
  }
  return Math.max(1, PRESENT_YEAR_CE - extinctionYear);
}

/**
 * Inverted logarithmic coordinate: L = log10(YearsAgo + 1)
 * Present = 0, 100 yrs ago ≈ 2.0, 10,000 BCE ≈ 4.08, 66 Ma ≈ 7.82, 450 Ma ≈ 8.65.
 */
export function yearsAgoToLog(yearsAgo: number): number {
  return Math.log10(Math.max(0, yearsAgo) + 1);
}

export function logToYearsAgo(logVal: number): number {
  return Math.max(0, Math.pow(10, Math.max(0, logVal)) - 1);
}

/**
 * Inverted screen-X projection: deep geological time (higher logVal) is on the LEFT,
 * while The Present (logVal = 0) sits on the RIGHT.
 */
export function logToScreenX(
  logVal: number,
  centerLog: number,
  zoomSpanLog: number,
  viewportWidth: number
): number {
  if (viewportWidth <= 0 || zoomSpanLog <= 0) return 0;
  return viewportWidth / 2 + ((centerLog - logVal) / zoomSpanLog) * viewportWidth;
}

export function screenXToLog(
  screenX: number,
  centerLog: number,
  zoomSpanLog: number,
  viewportWidth: number
): number {
  if (viewportWidth <= 0 || zoomSpanLog <= 0) return centerLog;
  return centerLog - ((screenX - viewportWidth / 2) / viewportWidth) * zoomSpanLog;
}

export function clampCenterLog(centerLog: number): number {
  return Math.min(MAX_LOG + 0.35, Math.max(-0.8, centerLog));
}

export function clampZoomSpanLog(zoomSpanLog: number): number {
  return Math.min(MAX_ZOOM_SPAN_LOG, Math.max(MIN_ZOOM_SPAN_LOG, zoomSpanLog));
}

export function getSemanticZoomLevel(zoomSpanLog: number): SemanticZoomLevel {
  if (zoomSpanLog > 4.6) return 'macro';
  if (zoomSpanLog > 1.85) return 'meso';
  return 'micro';
}

export function formatYearsAgo(yearsAgo: number): string {
  if (yearsAgo < 1.5) return 'The Present (2026 CE)';
  if (yearsAgo >= 1_000_000) {
    const ma = yearsAgo / 1_000_000;
    return `${ma >= 100 ? Math.round(ma) : ma >= 10 ? ma.toFixed(1) : ma.toFixed(2)} Ma`;
  }
  if (yearsAgo >= 50_000) {
    const ka = yearsAgo / 1_000;
    return `${Math.round(ka).toLocaleString('en-US')} ka`;
  }
  const calendarYear = Math.round(PRESENT_YEAR_CE - yearsAgo);
  if (calendarYear <= 0) {
    const bce = Math.abs(calendarYear) + 1;
    return `${bce.toLocaleString('en-US')} BCE`;
  }
  return `${calendarYear} CE`;
}

export function formatLogCursorDate(logVal: number): string {
  if (logVal <= 0.12) return 'The Present';
  return formatYearsAgo(logToYearsAgo(logVal));
}

/**
 * Parses flexible user queries ("450 Ma", "66M", "10000 BCE", "1500 CE", "1936", "present")
 * into Years Ago for instant timeline navigation.
 */
export function parseYearQueryToYearsAgo(raw: string): number | null {
  const input = raw.trim().toLowerCase();
  if (!input) return null;
  if (input === 'present' || input === 'now' || input === 'today' || input === '2026') {
    return 0;
  }

  const maMatch = input.match(/^(\d+(?:\.\d+)?)\s*(?:ma|mya|million(?:\s+years)?(?:\s+ago)?)$/);
  if (maMatch) {
    return parseFloat(maMatch[1]) * 1_000_000;
  }

  const kaMatch = input.match(/^(\d+(?:\.\d+)?)\s*(?:ka|kya|bp)$/);
  if (kaMatch) {
    return parseFloat(kaMatch[1]) * 1_000;
  }

  const bceMatch = input.match(/^([\d,]+)\s*(?:bce|bc)$/);
  if (bceMatch) {
    const bce = parseInt(bceMatch[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(bce)) return PRESENT_YEAR_CE + bce;
  }

  const ceMatch = input.match(/^([\d,]+)\s*(?:ce|ad)?$/);
  if (ceMatch) {
    const yr = parseInt(ceMatch[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(yr)) {
      if (yr >= 2026) return 0;
      if (yr >= 100 && yr < 2026) return PRESENT_YEAR_CE - yr;
      if (yr > 0 && yr < 100) return PRESENT_YEAR_CE - yr;
    }
  }

  return null;
}

const RAW_TIMELINE_TICKS: Array<{ label: string; yearsAgo: number; major: boolean }> = [
  { label: '500 Ma', yearsAgo: 500_000_000, major: true },
  { label: '450 Ma', yearsAgo: 450_000_000, major: true },
  { label: '400 Ma', yearsAgo: 400_000_000, major: false },
  { label: '350 Ma', yearsAgo: 350_000_000, major: false },
  { label: '300 Ma', yearsAgo: 300_000_000, major: true },
  { label: '252 Ma', yearsAgo: 251_900_000, major: true },
  { label: '201 Ma', yearsAgo: 201_300_000, major: true },
  { label: '150 Ma', yearsAgo: 150_000_000, major: false },
  { label: '100 Ma', yearsAgo: 100_000_000, major: true },
  { label: '66 Ma', yearsAgo: 66_000_000, major: true },
  { label: '50 Ma', yearsAgo: 50_000_000, major: false },
  { label: '25 Ma', yearsAgo: 25_000_000, major: false },
  { label: '10 Ma', yearsAgo: 10_000_000, major: true },
  { label: '5 Ma', yearsAgo: 5_000_000, major: false },
  { label: '1 Ma', yearsAgo: 1_000_000, major: true },
  { label: '500 ka', yearsAgo: 500_000, major: false },
  { label: '100 ka', yearsAgo: 100_000, major: true },
  { label: '50 ka', yearsAgo: 50_000, major: false },
  { label: '10,000 BCE', yearsAgo: PRESENT_YEAR_CE + 10_000, major: true },
  { label: '5,000 BCE', yearsAgo: PRESENT_YEAR_CE + 5_000, major: false },
  { label: '1,000 BCE', yearsAgo: PRESENT_YEAR_CE + 1_000, major: false },
  { label: '1 CE', yearsAgo: PRESENT_YEAR_CE - 1, major: true },
  { label: '1000 CE', yearsAgo: PRESENT_YEAR_CE - 1000, major: false },
  { label: '1500 CE', yearsAgo: PRESENT_YEAR_CE - 1500, major: true },
  { label: '1700 CE', yearsAgo: PRESENT_YEAR_CE - 1700, major: false },
  { label: '1800 CE', yearsAgo: PRESENT_YEAR_CE - 1800, major: false },
  { label: '1900 CE', yearsAgo: PRESENT_YEAR_CE - 1900, major: true },
  { label: '1950 CE', yearsAgo: PRESENT_YEAR_CE - 1950, major: false },
  { label: '1980 CE', yearsAgo: PRESENT_YEAR_CE - 1980, major: false },
  { label: '2000 CE', yearsAgo: PRESENT_YEAR_CE - 2000, major: true },
  { label: '2015 CE', yearsAgo: PRESENT_YEAR_CE - 2015, major: false },
  { label: '2020 CE', yearsAgo: PRESENT_YEAR_CE - 2020, major: false },
  { label: 'Present', yearsAgo: 0, major: true },
];

export const ALL_TIMELINE_TICKS: TimelineTick[] = RAW_TIMELINE_TICKS.map((t) => ({
  id: t.label,
  label: t.label,
  yearsAgo: t.yearsAgo,
  logVal: yearsAgoToLog(t.yearsAgo),
  major: t.major,
}));

export interface PositionedSpeciesNode {
  species: Species;
  yearsAgo: number;
  logVal: number;
  screenX: number;
  lane: number;
  renderMode: 'card' | 'compact' | 'pip';
}

export interface TimelineCluster {
  id: string;
  label: string;
  eraId: string;
  eraName: string;
  count: number;
  logVal: number;
  minLog: number;
  maxLog: number;
  screenX: number;
  lane: number;
  sampleNames: string[];
  leadSpecies: Species;
}

export interface TimelinePip {
  id: string;
  logVal: number;
  screenX: number;
  isHighlighted: boolean;
}

export interface SpatialTimelineLayout {
  cards: PositionedSpeciesNode[];
  clusters: TimelineCluster[];
  pips: TimelinePip[];
}

export const MAX_VISIBLE_DOM_NODES = 35;
const CARD_WIDTH_PX = 188;
const MIN_HORIZONTAL_CLEARANCE_PX = 24;
const CARD_MIN_CENTER_SPACING_PX = CARD_WIDTH_PX + MIN_HORIZONTAL_CLEARANCE_PX; // 212px
const CARD_LANE_COUNT = 4; // 4 alternating vertical lanes above/below the axis
const SPATIAL_BIN_WIDTH_PX = 220;

const SPECIES_LOG_CACHE = new WeakMap<Species, { yearsAgo: number; logVal: number; idHash: number }>();

export function getCachedSpeciesCoords(species: Species): {
  yearsAgo: number;
  logVal: number;
  idHash: number;
} {
  let cached = SPECIES_LOG_CACHE.get(species);
  if (cached) return cached;

  const yearsAgo = getYearsAgo(species.extinctionYear, species.status);
  const logVal = yearsAgoToLog(yearsAgo);
  let idHash = 0;
  for (let i = 0; i < species.id.length; i++) {
    idHash = (idHash * 31 + species.id.charCodeAt(i)) | 0;
  }
  cached = { yearsAgo, logVal, idHash: Math.abs(idHash) };
  SPECIES_LOG_CACHE.set(species, cached);
  return cached;
}

const ERA_SHORT_NAMES: Record<string, string> = {
  ordovician: 'Ordovician',
  devonian: 'Devonian',
  permian: 'Permian',
  triassic: 'Triassic',
  jurassic: 'Jurassic',
  cretaceous: 'Cretaceous',
  'paleogene-neogene': 'Cenozoic',
  pleistocene: 'Pleistocene',
  'holocene-historical': 'Holocene',
  present: 'Present',
};

function formatClusterLabel(eraId: string, count: number): string {
  if (eraId === 'holocene-historical') {
    return `+${count} Holocene Extinctions`;
  }
  const shortEra = ERA_SHORT_NAMES[eraId] || 'Deep-Time';
  return `+${count} ${shortEra} Species`;
}

/**
 * Spatial Grid / Binning Clustering & Strict <= 35 Node Virtualization:
 * - Draws all visible species as zero-cost 2D canvas pips.
 * - Groups dense regions into interactive Cluster Badges ("+42 Cretaceous Species") when zoomed out
 *   or when adjacent cards would have < 24px horizontal clearance.
 * - Enforces a strict cap of <= 35 visible DOM nodes (cards + cluster badges combined).
 */
export function computeSpatialTimelineLayout(
  speciesList: Species[],
  centerLog: number,
  zoomSpanLog: number,
  viewportWidth: number,
  selectedSpeciesId: string | null = null,
  highlightedSpeciesId: string | null = null
): SpatialTimelineLayout {
  const bufferPx = 220;
  const pips: TimelinePip[] = [];

  interface CandidateItem {
    species: Species;
    yearsAgo: number;
    logVal: number;
    screenX: number;
    idHash: number;
    priorityRank: number;
  }

  const visibleItems: CandidateItem[] = [];

  for (let i = 0; i < speciesList.length; i++) {
    const s = speciesList[i];
    if (s.status !== 'extinct') continue;

    const coords = getCachedSpeciesCoords(s);
    const screenX = Math.round(logToScreenX(coords.logVal, centerLog, zoomSpanLog, viewportWidth));
    if (screenX < -bufferPx || screenX > viewportWidth + bufferPx) continue;

    const isHighlighted = s.id === selectedSpeciesId || s.id === highlightedSpeciesId;
    pips.push({
      id: s.id,
      logVal: coords.logVal,
      screenX,
      isHighlighted,
    });

    const basePriority = s.landmarkPriority ?? 3;
    visibleItems.push({
      species: s,
      yearsAgo: coords.yearsAgo,
      logVal: coords.logVal,
      screenX,
      idHash: coords.idHash,
      priorityRank: isHighlighted ? 0 : basePriority,
    });
  }

  if (visibleItems.length === 0) {
    return { cards: [], clusters: [], pips };
  }

  // Group visible extinct species into screen-space spatial bins (partitioned by era when zoomed out)
  const binsMap = new Map<string, { eraId: string; binX: number; items: CandidateItem[] }>();
  const partitionByEra = zoomSpanLog > 2.0;

  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];
    const binX = Math.floor(item.screenX / SPATIAL_BIN_WIDTH_PX);
    const key = partitionByEra ? `${item.species.eraId}:${binX}` : `bin:${binX}`;
    let bucket = binsMap.get(key);
    if (!bucket) {
      bucket = { eraId: item.species.eraId, binX, items: [] };
      binsMap.set(key, bucket);
    }
    bucket.items.push(item);
  }

  const occupiedLaneX: number[][] = Array.from({ length: CARD_LANE_COUNT }, () => []);

  const findFreeLane = (screenX: number, preferredLane: number, minGapPx: number): number => {
    for (let offset = 0; offset < CARD_LANE_COUNT; offset++) {
      const lane = (preferredLane + offset) % CARD_LANE_COUNT;
      const laneXs = occupiedLaneX[lane];
      let blocked = false;
      for (let j = 0; j < laneXs.length; j++) {
        if (Math.abs(laneXs[j] - screenX) < minGapPx) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return lane;
    }
    return -1;
  };

  // Sort bins left-to-right on screen for balanced spatial distribution, prioritizing bins with highlighted species
  const bins = Array.from(binsMap.values()).sort((a, b) => a.binX - b.binX);

  const cards: PositionedSpeciesNode[] = [];
  const clusters: TimelineCluster[] = [];

  // Pre-reserve slots for selected/highlighted species first
  const highlightedIds = new Set<string>();
  for (const item of visibleItems) {
    if (item.priorityRank === 0) {
      highlightedIds.add(item.species.id);
      const lane = findFreeLane(item.screenX, item.idHash % CARD_LANE_COUNT, CARD_MIN_CENTER_SPACING_PX);
      const finalLane = lane !== -1 ? lane : item.idHash % CARD_LANE_COUNT;
      occupiedLaneX[finalLane].push(item.screenX);
      cards.push({
        species: item.species,
        yearsAgo: item.yearsAgo,
        logVal: item.logVal,
        screenX: item.screenX,
        lane: finalLane,
        renderMode: 'card',
      });
    }
  }

  const makeClusterFromItems = (
    binKey: string,
    eraId: string,
    items: CandidateItem[],
    preferredLane: number
  ): TimelineCluster | null => {
    if (items.length === 0) return null;
    let sumLog = 0;
    let minLog = Infinity;
    let maxLog = -Infinity;
    for (let i = 0; i < items.length; i++) {
      const lv = items[i].logVal;
      sumLog += lv;
      if (lv < minLog) minLog = lv;
      if (lv > maxLog) maxLog = lv;
    }
    const centroidLog = sumLog / items.length;
    const cx = Math.round(logToScreenX(centroidLog, centerLog, zoomSpanLog, viewportWidth));

    // Clamp cluster center into visible viewport neighborhood so offscreen wings stay reachable
    const freeLane = findFreeLane(cx, preferredLane, CARD_MIN_CENTER_SPACING_PX * 0.92);
    const lane = freeLane !== -1 ? freeLane : (preferredLane + 1) % CARD_LANE_COUNT;
    occupiedLaneX[lane].push(cx);

    const dominantEraName = items[0].species.era;
    return {
      id: `cluster:${binKey}`,
      label: formatClusterLabel(eraId, items.length),
      eraId,
      eraName: dominantEraName,
      count: items.length,
      logVal: centroidLog,
      minLog,
      maxLog,
      screenX: cx,
      lane,
      sampleNames: items.slice(0, 3).map((it) => it.species.commonName),
      leadSpecies: items[0].species,
    };
  };

  for (const bin of bins) {
    const remainingPool = bin.items
      .filter((it) => !highlightedIds.has(it.species.id))
      .sort((a, b) => {
        if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
        return a.idHash - b.idHash;
      });

    if (remainingPool.length === 0) continue;

    // Determine dominant era inside this spatial bin
    const binKey = `${bin.eraId}:${bin.binX}`;
    const isDenseMacroOrMeso = zoomSpanLog > 2.2 && remainingPool.length >= 3;

    if (isDenseMacroOrMeso) {
      // Promote at most 1 priority landmark card if there is room, and cluster the rest
      const topItem = remainingPool[0];
      const canShowLeadCard =
        topItem.priorityRank <= 1 && cards.length + clusters.length + 1 < MAX_VISIBLE_DOM_NODES - 4;
      let clusteredItems = remainingPool;

      if (canShowLeadCard) {
        const cardLane = findFreeLane(
          topItem.screenX,
          topItem.idHash % CARD_LANE_COUNT,
          CARD_MIN_CENTER_SPACING_PX
        );
        if (cardLane !== -1) {
          occupiedLaneX[cardLane].push(topItem.screenX);
          cards.push({
            species: topItem.species,
            yearsAgo: topItem.yearsAgo,
            logVal: topItem.logVal,
            screenX: topItem.screenX,
            lane: cardLane,
            renderMode: 'card',
          });
          clusteredItems = remainingPool.slice(1);
        }
      }

      if (clusteredItems.length >= 2) {
        const cl = makeClusterFromItems(
          binKey,
          bin.eraId,
          clusteredItems,
          (topItem.idHash + 1) % CARD_LANE_COUNT
        );
        if (cl) clusters.push(cl);
      } else if (clusteredItems.length === 1 && cards.length + clusters.length < MAX_VISIBLE_DOM_NODES) {
        const lone = clusteredItems[0];
        const lane = findFreeLane(lone.screenX, lone.idHash % CARD_LANE_COUNT, CARD_MIN_CENTER_SPACING_PX);
        if (lane !== -1) {
          occupiedLaneX[lane].push(lone.screenX);
          cards.push({
            species: lone.species,
            yearsAgo: lone.yearsAgo,
            logVal: lone.logVal,
            screenX: lone.screenX,
            lane,
            renderMode: 'card',
          });
        }
      }
      continue;
    }

    // Micro / unpacked zoom: attempt to place individual cards with >= 24px clearance (212px center spacing).
    // Anything that fails horizontal clearance gets grouped into a bin cluster.
    const overflowForCluster: CandidateItem[] = [];

    for (let k = 0; k < remainingPool.length; k++) {
      const candidate = remainingPool[k];
      // Leave capacity if overflow exists so a cluster badge can still mount within <= 35 cap
      const projectedTotal = cards.length + clusters.length;
      if (projectedTotal >= MAX_VISIBLE_DOM_NODES - (overflowForCluster.length > 0 ? 2 : 1)) {
        overflowForCluster.push(candidate);
        continue;
      }

      const freeLane = findFreeLane(
        candidate.screenX,
        candidate.idHash % CARD_LANE_COUNT,
        CARD_MIN_CENTER_SPACING_PX
      );
      if (freeLane !== -1) {
        occupiedLaneX[freeLane].push(candidate.screenX);
        cards.push({
          species: candidate.species,
          yearsAgo: candidate.yearsAgo,
          logVal: candidate.logVal,
          screenX: candidate.screenX,
          lane: freeLane,
          renderMode: 'card',
        });
      } else {
        overflowForCluster.push(candidate);
      }
    }

    if (overflowForCluster.length >= 2) {
      const cl = makeClusterFromItems(
        binKey,
        bin.eraId,
        overflowForCluster,
        (overflowForCluster[0].idHash + 2) % CARD_LANE_COUNT
      );
      if (cl) clusters.push(cl);
    } else if (overflowForCluster.length === 1) {
      // Single non-fitting card either gets a relaxed lane if space allows or stays as a canvas pip
      const solo = overflowForCluster[0];
      const relaxedLane = findFreeLane(solo.screenX, solo.idHash % CARD_LANE_COUNT, CARD_MIN_CENTER_SPACING_PX * 0.85);
      if (relaxedLane !== -1 && cards.length + clusters.length < MAX_VISIBLE_DOM_NODES) {
        occupiedLaneX[relaxedLane].push(solo.screenX);
        cards.push({
          species: solo.species,
          yearsAgo: solo.yearsAgo,
          logVal: solo.logVal,
          screenX: solo.screenX,
          lane: relaxedLane,
          renderMode: 'card',
        });
      }
    }
  }

  // Hard cap guarantee: <= MAX_VISIBLE_DOM_NODES (35) total DOM cards + clusters.
  // Trim lowest-priority cards first (preserving clusters and highlighted cards).
  if (cards.length + clusters.length > MAX_VISIBLE_DOM_NODES) {
    // Keep clusters first so dense eras stay represented, unless exceeding cap alone
    if (clusters.length > MAX_VISIBLE_DOM_NODES) {
      clusters.sort((a, b) => b.count - a.count);
      clusters.length = MAX_VISIBLE_DOM_NODES;
      cards.length = 0;
    } else {
      const allowedCards = MAX_VISIBLE_DOM_NODES - clusters.length;
      cards.sort((a, b) => {
        const aHi = a.species.id === selectedSpeciesId || a.species.id === highlightedSpeciesId ? 0 : 1;
        const bHi = b.species.id === selectedSpeciesId || b.species.id === highlightedSpeciesId ? 0 : 1;
        if (aHi !== bHi) return aHi - bHi;
        return (a.species.landmarkPriority ?? 3) - (b.species.landmarkPriority ?? 3);
      });
      cards.length = allowedCards;
    }
  }

  return { cards, clusters, pips };
}

/**
 * Legacy helper kept only if needed by callers; delegates to spatial layout.
 */
export function layoutVisibleTimelineNodes(
  speciesList: Species[],
  centerLog: number,
  zoomSpanLog: number,
  viewportWidth: number
): PositionedSpeciesNode[] {
  return computeSpatialTimelineLayout(speciesList, centerLog, zoomSpanLog, viewportWidth).cards;
}
