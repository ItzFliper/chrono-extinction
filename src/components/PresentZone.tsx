'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import type { Species } from '@/types/species';
import { useWikipediaSummary } from '@/lib/useWikipediaSummary';
import { TaxonSilhouette } from '@/components/TaxonSilhouette';

interface PresentSpeciesCardProps {
  species: Species;
  variant: 'endangered' | 'recovered';
  isSelected: boolean;
  onSelect: (species: Species) => void;
}

const PresentSpeciesCard = React.memo(function PresentSpeciesCard({
  species,
  variant,
  isSelected,
  onSelect,
}: PresentSpeciesCardProps) {
  const { summary: wiki } = useWikipediaSummary(species.wikipediaSlug, true);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const rawThumbUrl = wiki?.thumbnailUrl;
  const thumbUrl = rawThumbUrl && failedUrl !== rawThumbUrl ? rawThumbUrl : undefined;
  const isEndangered = variant === 'endangered';

  return (
    <button
      type="button"
      onClick={() => onSelect(species)}
      className={`group flex items-center gap-2.5 w-full rounded-xl p-2 text-left border backdrop-blur-md transition-all duration-150 cursor-pointer ${
        isSelected
          ? isEndangered
            ? 'bg-rose-950/85 border-rose-400 ring-1 ring-rose-300/60 shadow-[0_0_24px_rgba(244,63,94,0.3)]'
            : 'bg-emerald-950/85 border-emerald-400 ring-1 ring-emerald-300/60 shadow-[0_0_24px_rgba(16,185,129,0.3)]'
          : isEndangered
            ? 'bg-slate-950/70 border-rose-500/20 hover:border-rose-400/60 hover:bg-rose-950/35'
            : 'bg-slate-950/70 border-emerald-500/20 hover:border-emerald-400/60 hover:bg-emerald-950/35'
      }`}
    >
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 flex items-center justify-center">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={species.commonName}
            width={44}
            height={44}
            unoptimized
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(thumbUrl)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <TaxonSilhouette
            group={species.taxonGroup}
            className={`w-6 h-6 ${isEndangered ? 'text-rose-300/70' : 'text-emerald-300/70'}`}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-semibold text-slate-100 truncate">
            {species.commonName}
          </span>
          <span
            className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
              isEndangered
                ? 'bg-rose-500/15 text-rose-200 border-rose-400/30'
                : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
            }`}
          >
            {species.iucnBadge?.split('·')[0]?.trim() || (isEndangered ? 'CR' : 'REC')}
          </span>
        </div>
        <p className="text-[10px] italic text-slate-400 truncate">{species.scientificName}</p>
        <p className="text-[10px] text-slate-300/80 line-clamp-1 mt-0.5">{species.cause}</p>
      </div>
    </button>
  );
});

interface PresentZoneProps {
  presentX: number;
  viewportWidth: number;
  endangeredSpecies: Species[];
  recoveredSpecies: Species[];
  selectedSpeciesId: string | null;
  statusFilter: 'all' | 'extinct' | 'endangered' | 'recovered';
  onSelectSpecies: (species: Species) => void;
  onFocusPresent: () => void;
}

export function PresentZone({
  presentX,
  viewportWidth,
  endangeredSpecies,
  recoveredSpecies,
  selectedSpeciesId,
  statusFilter,
  onSelectSpecies,
  onFocusPresent,
}: PresentZoneProps) {
  const showEndangered =
    (statusFilter === 'all' || statusFilter === 'endangered') && endangeredSpecies.length > 0;
  const showRecovered =
    (statusFilter === 'all' || statusFilter === 'recovered') && recoveredSpecies.length > 0;

  if (!showEndangered && !showRecovered) return null;

  // How much horizontal room exists to the right of the Present line (L = 0)
  const availableRightWidth = viewportWidth - presentX;
  if (availableRightWidth < 36) {
    // Present is off-screen to the right; show an edge beacon pill to jump straight to Present
    return (
      <button
        type="button"
        onClick={onFocusPresent}
        className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 rounded-full bg-emerald-950/85 border border-emerald-400/40 px-3 py-2 text-xs font-medium text-emerald-100 backdrop-blur-xl shadow-[0_0_24px_rgba(16,185,129,0.25)] hover:border-emerald-300 hover:bg-emerald-900/85 transition-all cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>The Present</span>
        <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
      </button>
    );
  }

  const isCompactEdgeMode = availableRightWidth < 330;

  return (
    <section
      aria-label="The Present Conservation Crossroads"
      className="pointer-events-none absolute top-0 bottom-0 right-0 z-25"
      style={{
        left: `${Math.max(0, presentX)}px`,
      }}
    >
      {/* Present Meridian Line */}
      <div className="absolute left-0 top-14 bottom-16 w-px bg-gradient-to-b from-rose-400/60 via-white/80 to-emerald-400/70 shadow-[0_0_16px_rgba(52,211,153,0.5)]" />

      {isCompactEdgeMode ? (
        <div className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 w-[180px] rounded-2xl border border-white/15 bg-slate-950/85 backdrop-blur-xl p-3 shadow-2xl">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-300 mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>The Present · 2026</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 leading-snug mb-2.5">
            Conservation Crossroads
          </p>
          <div className="space-y-1.5 mb-3">
            {showEndangered && (
              <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-400/25 text-rose-200">
                <span>Endangered</span>
                <span className="font-mono font-semibold">{endangeredSpecies.length}</span>
              </div>
            )}
            {showRecovered && (
              <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
                <span>Saved / Rec.</span>
                <span className="font-mono font-semibold">{recoveredSpecies.length}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onFocusPresent}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 transition-colors cursor-pointer"
          >
            <span>Explore Split-Track</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto h-full flex flex-col justify-center pl-7 pr-5 pt-20 pb-24 max-w-[920px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-sky-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>The Present · L = 0.00 · Anthropocene Crossroads</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Split-Track Conservation Outcomes
              </h2>
            </div>
          </div>

          <div
            data-present-scroll="true"
            className={`grid gap-3 overflow-y-auto pr-1 max-h-[calc(100vh-210px)] ${
              showEndangered && showRecovered ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Track 1: Endangered */}
            {showEndangered && (
              <div className="present-track-contain rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/45 via-slate-950/80 to-amber-950/25 p-3.5 backdrop-blur-xl shadow-[0_12px_36px_rgba(244,63,94,0.12)]">
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-rose-400/15">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-300">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                        Track 1 · Endangered
                      </h3>
                      <p className="text-[10px] text-rose-300/75">
                        En peligro de extinción ({endangeredSpecies.length} species)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  {endangeredSpecies.map((sp) => (
                    <PresentSpeciesCard
                      key={sp.id}
                      species={sp}
                      variant="endangered"
                      isSelected={selectedSpeciesId === sp.id}
                      onSelect={onSelectSpecies}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Track 2: Saved / Recovered */}
            {showRecovered && (
              <div className="present-track-contain rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/45 via-slate-950/80 to-teal-950/25 p-3.5 backdrop-blur-xl shadow-[0_12px_36px_rgba(16,185,129,0.12)]">
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-emerald-400/15">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                        Track 2 · Saved / Recovered
                      </h3>
                      <p className="text-[10px] text-emerald-300/75">
                        Salvados de la extinción ({recoveredSpecies.length} species)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  {recoveredSpecies.map((sp) => (
                    <PresentSpeciesCard
                      key={sp.id}
                      species={sp}
                      variant="recovered"
                      isSelected={selectedSpeciesId === sp.id}
                      onSelect={onSelectSpecies}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
