'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, ShieldCheck, Skull, MapPin } from 'lucide-react';
import type { Species } from '@/types/species';
import { useWikipediaSummary } from '@/lib/useWikipediaSummary';
import { TaxonSilhouette } from '@/components/TaxonSilhouette';

interface AtlasSpeciesCardProps {
  species: Species;
  isSelected: boolean;
  onSelect: (species: Species) => void;
}

export const AtlasSpeciesCard = React.memo(function AtlasSpeciesCard({
  species,
  isSelected,
  onSelect,
}: AtlasSpeciesCardProps) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const hasPresetThumb = Boolean(species.thumbnailUrl);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Lazy-fetch Wikipedia summary thumbnail ONLY for the ~5% of species lacking a pre-cached thumbnail
  useEffect(() => {
    if (hasPresetThumb || isNearViewport) return;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPresetThumb, isNearViewport]);

  const { summary: wiki } = useWikipediaSummary(
    species.wikipediaSlug,
    !hasPresetThumb && isNearViewport
  );

  const rawThumbUrl = species.thumbnailUrl || wiki?.thumbnailUrl;
  const thumbUrl = rawThumbUrl && failedUrl !== rawThumbUrl ? rawThumbUrl : undefined;

  const isEndangered = species.status === 'endangered';
  const isRecovered = species.status === 'recovered';

  const cardAccentClasses = isSelected
    ? isRecovered
      ? 'border-emerald-400 ring-2 ring-emerald-400/35 bg-emerald-950/35'
      : isEndangered
        ? 'border-amber-400 ring-2 ring-amber-400/35 bg-amber-950/35'
        : 'border-sky-400 ring-2 ring-sky-400/35 bg-slate-900'
    : isRecovered
      ? 'border-emerald-500/25 bg-slate-900/90 hover:border-emerald-400/65 hover:bg-emerald-950/20'
      : isEndangered
        ? 'border-amber-500/25 bg-slate-900/90 hover:border-amber-400/65 hover:bg-amber-950/20'
        : 'border-white/10 bg-slate-900/90 hover:border-sky-400/55 hover:bg-slate-800/80';

  const statusBadge = isRecovered ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/90 border border-emerald-400/50 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-200">
      <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
      <span>{species.iucnBadge?.split('·')[0]?.trim() || 'Saved'}</span>
    </span>
  ) : isEndangered ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/90 border border-amber-400/50 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-200">
      <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
      <span>{species.iucnBadge?.split('·')[0]?.trim() || 'CR'}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/90 border border-rose-400/35 px-2 py-0.5 text-[10px] font-mono font-semibold text-rose-200">
      <Skull className="w-3 h-3 text-rose-300 shrink-0" />
      <span>Extinct</span>
    </span>
  );

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(species)}
      data-testid={`species-card-${species.id}`}
      className={`group flex flex-col rounded-2xl border overflow-hidden text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${cardAccentClasses}`}
    >
      {/* Fixed aspect-ratio media header (zero layout shift) */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-950 border-b border-white/10">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={species.commonName}
            width={360}
            height={160}
            unoptimized
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(thumbUrl)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            <TaxonSilhouette
              group={species.taxonGroup}
              className={`w-14 h-14 ${
                isRecovered
                  ? 'text-emerald-300/45'
                  : isEndangered
                    ? 'text-amber-300/45'
                    : 'text-sky-300/45'
              }`}
            />
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent"
        />

        {/* Top overlay pills */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-950/90 border border-white/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-slate-200 truncate">
            {species.displayDate}
          </span>
          {statusBadge}
        </div>

        {/* Bottom era chip */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300/95 truncate">
            {species.era}
          </span>
        </div>
      </div>

      {/* Museum placard body */}
      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 leading-snug truncate">
            {species.commonName}
          </h3>
          <p className="text-xs italic text-slate-400 truncate mt-0.5">
            {species.scientificName}
          </p>
        </div>

        <p className="text-xs text-slate-300/85 line-clamp-2 leading-relaxed">
          {species.cause}
        </p>

        {species.region && (
          <div className="flex items-center gap-1 pt-1 border-t border-white/5 text-[10px] text-slate-400 truncate">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{species.region}</span>
          </div>
        )}
      </div>
    </button>
  );
});
