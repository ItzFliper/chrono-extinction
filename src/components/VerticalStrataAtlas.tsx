'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Flame,
  Layers,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import type { AtlasStratum } from '@/data/eras';
import type { Species, StratumId } from '@/types/species';
import { AtlasSpeciesCard } from '@/components/AtlasSpeciesCard';

interface VerticalStrataAtlasProps {
  strataGroups: Array<{ stratum: AtlasStratum; species: Species[] }>;
  isSearchActive: boolean;
  selectedSpeciesId: string | null;
  onSelectSpecies: (species: Species) => void;
  onResetFilters: () => void;
}

const DEFAULT_STRATUM_LIMIT = 40;
const DEFAULT_PRESENT_TRACK_LIMIT = 30;

export function VerticalStrataAtlas({
  strataGroups,
  isSearchActive,
  selectedSpeciesId,
  onSelectSpecies,
  onResetFilters,
}: VerticalStrataAtlasProps) {
  const [stratumLimits, setStratumLimits] = useState<Partial<Record<StratumId, number>>>({});
  const [endangeredLimit, setEndangeredLimit] = useState(DEFAULT_PRESENT_TRACK_LIMIT);
  const [recoveredLimit, setRecoveredLimit] = useState(DEFAULT_PRESENT_TRACK_LIMIT);

  const expandStratum = (id: StratumId, amount: number, total: number) => {
    setStratumLimits((prev) => ({
      ...prev,
      [id]: Math.min(total, (prev[id] ?? DEFAULT_STRATUM_LIMIT) + amount),
    }));
  };

  if (strataGroups.length === 0) {
    return (
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:pr-60 py-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">No Matching Species Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-5">
            No species match your current search query and status/taxonomic filter combination.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 xl:pr-60 pt-5 pb-24 xl:pb-16 space-y-12">
      {strataGroups.map(({ stratum, species }) => {
        const isPresentStratum = stratum.id === 'present';
        const endangeredList = isPresentStratum
          ? species.filter((s) => s.status === 'endangered')
          : [];
        const recoveredList = isPresentStratum
          ? species.filter((s) => s.status === 'recovered')
          : [];

        const effectiveStratumLimit = isSearchActive
          ? species.length
          : stratumLimits[stratum.id] ?? DEFAULT_STRATUM_LIMIT;
        const visibleStratumSpecies = species.slice(0, effectiveStratumLimit);
        const remainingInStratum = Math.max(0, species.length - visibleStratumSpecies.length);

        const effectiveEndangeredLimit = isSearchActive
          ? endangeredList.length
          : endangeredLimit;
        const visibleEndangered = endangeredList.slice(0, effectiveEndangeredLimit);
        const remainingEndangered = Math.max(0, endangeredList.length - visibleEndangered.length);

        const effectiveRecoveredLimit = isSearchActive
          ? recoveredList.length
          : recoveredLimit;
        const visibleRecovered = recoveredList.slice(0, effectiveRecoveredLimit);
        const remainingRecovered = Math.max(0, recoveredList.length - visibleRecovered.length);

        return (
          <section
            key={stratum.id}
            id={`stratum-${stratum.id}`}
            data-stratum-id={stratum.id}
            aria-labelledby={`heading-${stratum.id}`}
            className="scroll-mt-48 sm:scroll-mt-36 space-y-6"
          >
            {/* Atmospheric Geological Stratum Header Banner */}
            <div
              className={`rounded-3xl border ${stratum.borderClass} bg-gradient-to-br ${stratum.bannerGradient} p-5 sm:p-6 shadow-[0_16px_48px_rgba(2,6,23,0.55)]`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono font-semibold ${stratum.badgeClass}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stratum.accentHex }}
                    />
                    <span>{stratum.depthLabel}</span>
                  </span>
                  <span className="rounded-full bg-slate-950/75 border border-white/10 px-3 py-1 text-[11px] font-mono text-slate-300">
                    {stratum.timespan}
                  </span>
                </div>

                <span className="rounded-full bg-slate-950/85 border border-white/15 px-3 py-1 text-[11px] font-mono font-semibold text-white">
                  {species.length.toLocaleString('en-US')} documented species
                </span>
              </div>

              <h2
                id={`heading-${stratum.id}`}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
              >
                {stratum.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                {stratum.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-4xl mt-2.5">
                {stratum.description}
              </p>

              {/* Big Five & Megafauna Mass Extinction Callouts */}
              {stratum.extinctionCallouts.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stratum.extinctionCallouts.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-2xl border border-rose-500/35 bg-rose-950/25 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold">
                          <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {ev.isBigFive ? 'Big Five Mass Extinction' : 'Megafauna Transition'}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-rose-200">
                          {ev.displayDate}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white">{ev.name}</h3>
                      <p className="text-[11px] font-semibold text-rose-200/90 mt-0.5">
                        {ev.speciesLossPct}
                      </p>
                      <p className="text-[11px] text-slate-300/85 leading-relaxed mt-1">
                        {ev.primaryDriver}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special Two-Part Conservation Showcase for The Present Stratum */}
            {isPresentStratum ? (
              <div className="space-y-8">
                {/* Track A: On the Brink (En Peligro) */}
                {endangeredList.length > 0 && (
                  <div
                    data-testid="present-track-endangered"
                    className="rounded-3xl border border-amber-500/35 bg-gradient-to-b from-amber-950/20 via-slate-950/40 to-transparent p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-amber-100">
                            Track A · On the Brink (En Peligro de Extinción)
                          </h3>
                          <p className="text-xs text-amber-200/80">
                            IUCN Critically Endangered &amp; Endangered species fighting for survival today
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-500/15 border border-amber-400/35 px-3 py-1 text-xs font-mono font-semibold text-amber-200">
                        {endangeredList.length} species
                      </span>
                    </div>

                    <div className="stratum-grid-contain grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {visibleEndangered.map((sp) => (
                        <AtlasSpeciesCard
                          key={sp.id}
                          species={sp}
                          isSelected={selectedSpeciesId === sp.id}
                          onSelect={onSelectSpecies}
                        />
                      ))}
                    </div>

                    {remainingEndangered > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEndangeredLimit((n) => n + 40)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/45 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>
                            Show More On the Brink (+{Math.min(40, remainingEndangered)} of{' '}
                            {remainingEndangered} remaining)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndangeredLimit(endangeredList.length)}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                        >
                          Show All ({endangeredList.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Track B: Brought Back (Salvados de la Extinción) */}
                {recoveredList.length > 0 && (
                  <div
                    data-testid="present-track-recovered"
                    className="rounded-3xl border border-emerald-500/35 bg-gradient-to-b from-emerald-950/20 via-slate-950/40 to-transparent p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-emerald-100">
                            Track B · Brought Back (Salvados de la Extinción)
                          </h3>
                          <p className="text-xs text-emerald-200/80">
                            Conservation triumph stories &amp; IUCN downlistings restored through science and policy
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-400/35 px-3 py-1 text-xs font-mono font-semibold text-emerald-200">
                        {recoveredList.length} species
                      </span>
                    </div>

                    <div className="stratum-grid-contain grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {visibleRecovered.map((sp) => (
                        <AtlasSpeciesCard
                          key={sp.id}
                          species={sp}
                          isSelected={selectedSpeciesId === sp.id}
                          onSelect={onSelectSpecies}
                        />
                      ))}
                    </div>

                    {remainingRecovered > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRecoveredLimit((n) => n + 40)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/45 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>
                            Show More Brought Back (+{Math.min(40, remainingRecovered)} of{' '}
                            {remainingRecovered} remaining)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecoveredLimit(recoveredList.length)}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                        >
                          Show All ({recoveredList.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Deep-Time & Historical Extinct Stratum Responsive Specimen Grid */
              <div className="space-y-4">
                <div className="stratum-grid-contain grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {visibleStratumSpecies.map((sp) => (
                    <AtlasSpeciesCard
                      key={sp.id}
                      species={sp}
                      isSelected={selectedSpeciesId === sp.id}
                      onSelect={onSelectSpecies}
                    />
                  ))}
                </div>

                {remainingInStratum > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => expandStratum(stratum.id, 60, species.length)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/45 px-4 py-2 text-xs font-semibold text-sky-100 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>
                        Load More {stratum.shortTitle} Species (+
                        {Math.min(60, remainingInStratum)} of {remainingInStratum} remaining)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => expandStratum(stratum.id, species.length, species.length)}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                    >
                      Show All ({species.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
