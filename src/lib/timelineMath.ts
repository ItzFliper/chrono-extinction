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

const LANE_COUNT = 6;
const CARD_LANE_COUNT = 4; // Lanes 0..3 have generous vertical clearance for full specimen cards

/**
 * Computes collision-free vertical lanes & semantic render modes for visible deep-time/historical species.
 * Present-day species (endangered/recovered) live in the dedicated Present Split-Track Zone.
 */
export function layoutVisibleTimelineNodes(
  speciesList: Species[],
  centerLog: number,
  zoomSpanLog: number,
  viewportWidth: number
): PositionedSpeciesNode[] {
  const semanticZoom = getSemanticZoomLevel(zoomSpanLog);
  const bufferPx = 240;

  // Filter non-present timeline nodes inside the visible viewport bounds
  const candidates = speciesList
    .filter((s) => s.status === 'extinct')
    .map((s) => {
      const yearsAgo = getYearsAgo(s.extinctionYear, s.status);
      const logVal = yearsAgoToLog(yearsAgo);
      const screenX = Math.round(logToScreenX(logVal, centerLog, zoomSpanLog, viewportWidth));
      return { species: s, yearsAgo, logVal, screenX };
    })
    .filter((item) => item.screenX >= -bufferPx && item.screenX <= viewportWidth + bufferPx)
    .sort((a, b) => {
      // Prioritize landmark priority 1 first so important nodes win prominent card slots
      const pa = a.species.landmarkPriority ?? 3;
      const pb = b.species.landmarkPriority ?? 3;
      if (pa !== pb) return pa - pb;
      return b.logVal - a.logVal;
    });

  // Track last occupied X coordinate on each lane for full cards and compact pills
  const cardMinGap = semanticZoom === 'micro' ? 204 : semanticZoom === 'meso' ? 176 : 162;
  const compactMinGap = 132;

  const occupiedCardX: number[][] = Array.from({ length: LANE_COUNT }, () => []);
  const occupiedCompactX: number[][] = Array.from({ length: LANE_COUNT }, () => []);

  const placed: PositionedSpeciesNode[] = [];

  for (let idx = 0; idx < candidates.length; idx++) {
    const item = candidates[idx];
    const priority = item.species.landmarkPriority ?? 3;

    // Deterministic preferred lane from species id so cards do not jump lanes during panning
    let idHash = 0;
    for (let i = 0; i < item.species.id.length; i++) {
      idHash = (idHash * 31 + item.species.id.charCodeAt(i)) | 0;
    }
    const preferredCardLane = Math.abs(idHash) % CARD_LANE_COUNT;
    const preferredCompactLane = Math.abs(idHash) % LANE_COUNT;

    // In macro zoom, allow priority 1 as cards, priority 2 as compact/pip, priority 3 as pips
    const desiredMode: 'card' | 'compact' | 'pip' =
      semanticZoom === 'micro'
        ? 'card'
        : semanticZoom === 'meso'
          ? priority <= 2
            ? 'card'
            : 'compact'
          : priority === 1
            ? 'card'
            : priority === 2
              ? 'compact'
              : 'pip';

    let assignedLane = -1;
    let finalMode: 'card' | 'compact' | 'pip' = desiredMode;

    if (desiredMode === 'card') {
      for (let offset = 0; offset < CARD_LANE_COUNT; offset++) {
        const lane = (preferredCardLane + offset) % CARD_LANE_COUNT;
        const collision =
          occupiedCardX[lane].some((x) => Math.abs(x - item.screenX) < cardMinGap) ||
          occupiedCompactX[lane].some((x) => Math.abs(x - item.screenX) < cardMinGap * 0.85);
        if (!collision) {
          assignedLane = lane;
          occupiedCardX[lane].push(item.screenX);
          occupiedCompactX[lane].push(item.screenX);
          break;
        }
      }
      if (assignedLane === -1) {
        finalMode = 'compact';
      }
    }

    if (finalMode === 'compact') {
      // Prefer outer compact lanes 4..5 first so compact pills sit cleanly outside full cards
      const laneOrder = [4, 5, ...Array.from({ length: LANE_COUNT }, (_, i) => (preferredCompactLane + i) % LANE_COUNT)];
      for (const lane of laneOrder) {
        const collision =
          occupiedCardX[lane].some((x) => Math.abs(x - item.screenX) < cardMinGap * 0.85) ||
          occupiedCompactX[lane].some((x) => Math.abs(x - item.screenX) < compactMinGap);
        if (!collision) {
          assignedLane = lane;
          occupiedCompactX[lane].push(item.screenX);
          break;
        }
      }
      if (assignedLane === -1) {
        finalMode = 'pip';
      }
    }

    if (finalMode === 'pip') {
      assignedLane = preferredCompactLane;
    }

    placed.push({
      species: item.species,
      yearsAgo: item.yearsAgo,
      logVal: item.logVal,
      screenX: item.screenX,
      lane: assignedLane,
      renderMode: finalMode,
    });
  }

  return placed;
}
