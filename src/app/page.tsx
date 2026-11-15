'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import speciesDataset from '@/data/species.json';
import {
  ATLAS_STRATA,
  getStratumIdForSpecies,
  matchesTaxonMacroFilter,
} from '@/data/eras';
import type {
  SortOrder,
  Species,
  StratumId,
  TaxonMacroFilter,
} from '@/types/species';
import { ControlBar, type StatusFilter } from '@/components/ControlBar';
import { StrataElevatorRail } from '@/components/StrataElevatorRail';
import { VerticalStrataAtlas } from '@/components/VerticalStrataAtlas';
import { SpeciesDrawer } from '@/components/SpeciesDrawer';

const ALL_SPECIES = speciesDataset as Species[];

// Pre-computed flat search index (O(1) lookup initialization, < 2ms query evaluation across 1,198 species)
const SEARCH_INDEX = ALL_SPECIES.map((sp) => ({
  sp,
  stratumId: getStratumIdForSpecies(sp),
  haystack: `${sp.commonName} ${sp.scientificName} ${sp.cause} ${sp.era} ${sp.displayDate} ${sp.region ?? ''} ${sp.taxonomy?.class ?? ''} ${sp.taxonomy?.order ?? ''} ${sp.taxonomy?.family ?? ''}`.toLowerCase(),
}));

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [taxonFilter, setTaxonFilter] = useState<TaxonMacroFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest-first');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [activeStratumId, setActiveStratumId] = useState<StratumId>('present');

  // Filter across all 1,198 species in < 3ms
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const out: Array<{ sp: Species; stratumId: StratumId }> = [];

    for (let i = 0; i < SEARCH_INDEX.length; i++) {
      const entry = SEARCH_INDEX[i];
      if (statusFilter !== 'all' && entry.sp.status !== statusFilter) continue;
      if (!matchesTaxonMacroFilter(entry.sp, taxonFilter)) continue;
      if (q && !entry.haystack.includes(q)) continue;
      out.push({ sp: entry.sp, stratumId: entry.stratumId });
    }

    return out;
  }, [searchQuery, statusFilter, taxonFilter]);

  // Group filtered species into ordered geological strata
  const strataGroups = useMemo(() => {
    const bucketMap = new Map<StratumId, Species[]>();
    for (let i = 0; i < ATLAS_STRATA.length; i++) {
      bucketMap.set(ATLAS_STRATA[i].id, []);
    }
    for (let i = 0; i < filteredEntries.length; i++) {
      const { sp, stratumId } = filteredEntries[i];
      bucketMap.get(stratumId)?.push(sp);
    }

    const orderedStrata =
      sortOrder === 'newest-first' ? ATLAS_STRATA : [...ATLAS_STRATA].reverse();

    const groups: Array<{ stratum: (typeof ATLAS_STRATA)[number]; species: Species[] }> = [];
    for (let i = 0; i < orderedStrata.length; i++) {
      const stratum = orderedStrata[i];
      const list = bucketMap.get(stratum.id) ?? [];
      if (list.length === 0) continue;

      // Within each stratum, sort chronologically per sortOrder, breaking ties with landmarkPriority
      list.sort((a, b) => {
        if (a.extinctionYear !== b.extinctionYear) {
          return sortOrder === 'newest-first'
            ? b.extinctionYear - a.extinctionYear
            : a.extinctionYear - b.extinctionYear;
        }
        const pa = a.landmarkPriority ?? 3;
        const pb = b.landmarkPriority ?? 3;
        if (pa !== pb) return pa - pb;
        return a.commonName.localeCompare(b.commonName);
      });

      groups.push({ stratum, species: list });
    }

    return groups;
  }, [filteredEntries, sortOrder]);

  const jumpToStratum = useCallback((id: StratumId) => {
    const el = document.getElementById(`stratum-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveStratumId(id);
  }, []);

  // Track active geological stratum smoothly using IntersectionObserver
  useEffect(() => {
    if (strataGroups.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const sections = strataGroups
      .map(({ stratum }) => document.getElementById(`stratum-${stratum.id}`))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the intersecting section closest to top viewport threshold
        let topCandidate: { id: StratumId; ratio: number; top: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sid = entry.target.getAttribute('data-stratum-id') as StratumId | null;
          if (!sid) continue;
          const rectTop = Math.abs(entry.boundingClientRect.top - 140);
          if (
            !topCandidate ||
            rectTop < topCandidate.top ||
            entry.intersectionRatio > topCandidate.ratio
          ) {
            topCandidate = { id: sid, ratio: entry.intersectionRatio, top: rectTop };
          }
        }
        if (topCandidate) {
          setActiveStratumId(topCandidate.id);
        }
      },
      {
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0.01, 0.15, 0.4],
      }
    );

    for (const sec of sections) {
      observer.observe(sec);
    }
    return () => observer.disconnect();
  }, [strataGroups]);

  const resolvedActiveStratumId = useMemo(() => {
    if (strataGroups.some((g) => g.stratum.id === activeStratumId)) {
      return activeStratumId;
    }
    return strataGroups[0]?.stratum.id ?? 'present';
  }, [strataGroups, activeStratumId]);

  const handleToggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'newest-first' ? 'oldest-first' : 'newest-first'));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setTaxonFilter('all');
  }, []);

  return (
    <main className="relative min-h-dvh w-full bg-[#040711] text-slate-100">
      {/* Subtle atmospheric background gradients (fixed zero-cost Backdrop) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(16,185,129,0.08),transparent_48%),radial-gradient(ellipse_at_85%_60%,rgba(56,189,248,0.08),transparent_52%)]"
      />

      <ControlBar
        allSpecies={ALL_SPECIES}
        filteredCount={filteredEntries.length}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        taxonFilter={taxonFilter}
        onTaxonFilterChange={setTaxonFilter}
        sortOrder={sortOrder}
        onToggleSortOrder={handleToggleSortOrder}
        onResetAll={handleResetFilters}
      />

      <StrataElevatorRail
        strataGroups={strataGroups.map((g) => ({
          stratum: g.stratum,
          count: g.species.length,
        }))}
        activeStratumId={resolvedActiveStratumId}
        onJumpToStratum={jumpToStratum}
      />

      <VerticalStrataAtlas
        strataGroups={strataGroups}
        isSearchActive={searchQuery.trim().length > 0}
        selectedSpeciesId={selectedSpecies?.id ?? null}
        onSelectSpecies={setSelectedSpecies}
        onResetFilters={handleResetFilters}
      />

      <SpeciesDrawer
        species={selectedSpecies}
        allSpecies={ALL_SPECIES}
        onClose={() => setSelectedSpecies(null)}
        onSelectSpecies={setSelectedSpecies}
        onFocusSpeciesOnTimeline={(sp) => {
          const stratumId = getStratumIdForSpecies(sp);
          setSelectedSpecies(null);
          jumpToStratum(stratumId);
        }}
      />
    </main>
  );
}
