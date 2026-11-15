'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import type { Species } from '@/types/species';
import type { SemanticZoomLevel } from '@/lib/timelineMath';
import { useWikipediaSummary } from '@/lib/useWikipediaSummary';
import { TaxonSilhouette } from '@/components/TaxonSilhouette';

export const TIMELINE_LANE_OFFSETS = [-88, 88, -198, 198, -274, 274];

interface SpeciesCardNodeProps {
  species: Species;
  logVal: number;
  screenX: number;
  lane: number;
  renderMode: 'card' | 'compact' | 'pip';
  semanticZoom: SemanticZoomLevel;
  isSelected: boolean;
  isHighlighted: boolean;
  axisY: number;
  onSelect: (species: Species) => void;
  onMountNode?: (id: string, el: HTMLDivElement | null, logVal: number) => void;
}

export const SpeciesCardNode = React.memo(function SpeciesCardNode({
  species,
  logVal,
  screenX,
  lane,
  renderMode,
  semanticZoom,
  isSelected,
  isHighlighted,
  axisY,
  onSelect,
  onMountNode,
}: SpeciesCardNodeProps) {
  const hasPresetThumb = Boolean(species.thumbnailUrl);
  const { summary: wiki } = useWikipediaSummary(
    species.wikipediaSlug,
    renderMode !== 'pip' && !hasPresetThumb
  );
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const setWrapperRef = useCallback(
    (el: HTMLDivElement | null) => {
      onMountNode?.(`card:${species.id}`, el, logVal);
    },
    [onMountNode, species.id, logVal]
  );

  const offsetY = TIMELINE_LANE_OFFSETS[lane % TIMELINE_LANE_OFFSETS.length];
  const isAbove = offsetY < 0;
  const stemHeight =
    Math.abs(offsetY) -
    (renderMode === 'card' ? (semanticZoom === 'micro' ? 46 : 34) : renderMode === 'compact' ? 18 : 6);

  const rawThumbUrl = species.thumbnailUrl || wiki?.thumbnailUrl;
  const thumbUrl = rawThumbUrl && failedUrl !== rawThumbUrl ? rawThumbUrl : undefined;
  const px = Math.round(screenX);
  const py = Math.round(axisY);

  if (renderMode === 'pip') {
    return (
      <div
        ref={setWrapperRef}
        className="absolute top-0 left-0 pointer-events-auto will-change-transform"
        style={{
          transform: `translate3d(${px}px, ${py}px, 0px)`,
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(species)}
          title={`${species.commonName} (${species.displayDate})`}
          aria-label={`${species.commonName}, ${species.displayDate}`}
          className={`group -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border cursor-pointer focus-visible:outline-none ${
            isSelected || isHighlighted
              ? 'bg-amber-400 border-amber-200 scale-125'
              : 'bg-slate-400/90 border-slate-200/70 hover:bg-amber-300'
          }`}
        />
      </div>
    );
  }

  if (renderMode === 'compact') {
    return (
      <div
        ref={setWrapperRef}
        data-timeline-node="species-compact"
        className={`absolute top-0 left-0 pointer-events-none will-change-transform ${
          isSelected || isHighlighted ? 'z-40' : 'z-[12]'
        }`}
        style={{
          transform: `translate3d(${px}px, ${py}px, 0px)`,
        }}
      >
        <span
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
            isSelected || isHighlighted ? 'bg-amber-400' : 'bg-slate-400/90'
          }`}
        />
        <span
          className="absolute left-0 -translate-x-1/2 w-px bg-slate-500/45"
          style={{
            top: isAbove ? `${-stemHeight}px` : '0px',
            height: `${stemHeight}px`,
          }}
        />
        <button
          type="button"
          onClick={() => onSelect(species)}
          style={{
            top: `${offsetY}px`,
          }}
          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full px-2.5 py-1.5 border text-left transition-colors duration-150 cursor-pointer ${
            isSelected || isHighlighted
              ? 'bg-amber-950/95 border-amber-400 text-amber-100'
              : 'bg-zinc-900/95 border-white/15 text-slate-100 hover:border-sky-400/60 hover:bg-zinc-800/95'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center border border-white/10">
            {thumbUrl ? (
              <Image
                src={thumbUrl}
                alt={species.commonName}
                width={24}
                height={24}
                unoptimized
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedUrl(thumbUrl)}
                className="w-full h-full object-cover"
              />
            ) : (
              <TaxonSilhouette group={species.taxonGroup} className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 pr-1">
            <div className="text-[11px] font-semibold leading-tight truncate max-w-[116px]">
              {species.commonName}
            </div>
            <div className="text-[10px] font-mono text-slate-400 leading-tight">
              {species.displayDate}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setWrapperRef}
      data-timeline-node="species-card"
      className={`absolute top-0 left-0 pointer-events-none will-change-transform ${
        isSelected || isHighlighted ? 'z-[45]' : 'z-20'
      }`}
      style={{
        transform: `translate3d(${px}px, ${py}px, 0px)`,
      }}
    >
      {/* Axis anchor marker */}
      <span
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border ${
          isSelected || isHighlighted
            ? 'bg-amber-400 border-amber-100'
            : 'bg-sky-400 border-slate-950'
        }`}
      />
      {/* Stem */}
      <span
        className={`absolute left-0 -translate-x-1/2 w-px ${
          isSelected || isHighlighted ? 'bg-amber-400/85' : 'bg-sky-400/45'
        }`}
        style={{
          top: isAbove ? `${-stemHeight}px` : '0px',
          height: `${stemHeight}px`,
        }}
      />
      {/* Lightweight Specimen Card (no backdrop-blur or heavy box-shadow on moving nodes) */}
      <button
        type="button"
        onClick={() => onSelect(species)}
        style={{
          top: `${offsetY}px`,
        }}
        className={`pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 w-[188px] rounded-xl overflow-hidden border text-left transition-colors duration-150 cursor-pointer ${
          isSelected || isHighlighted
            ? 'bg-zinc-900 border-amber-400 ring-1 ring-amber-300/60'
            : 'bg-zinc-900/95 border-white/15 hover:border-sky-400/70 hover:bg-zinc-800/95'
        }`}
      >
        <div className="flex items-center gap-2 p-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-white/10 flex items-center justify-center">
            {thumbUrl ? (
              <Image
                src={thumbUrl}
                alt={species.commonName}
                width={40}
                height={40}
                unoptimized
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedUrl(thumbUrl)}
                className="w-full h-full object-cover"
              />
            ) : (
              <TaxonSilhouette group={species.taxonGroup} className="w-6 h-6 text-sky-300/65" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/90 font-semibold">
                {species.displayDate}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-100 leading-snug line-clamp-1 group-hover:text-sky-200">
              {species.commonName}
            </h3>
            <p className="text-[10px] italic text-slate-400 truncate">
              {species.scientificName}
            </p>
          </div>
        </div>
        {semanticZoom === 'micro' && (
          <div className="px-2 pb-1.5 pt-1 border-t border-white/10">
            <p className="text-[10px] text-slate-300/85 line-clamp-2 leading-tight">
              {species.cause}
            </p>
          </div>
        )}
      </button>
    </div>
  );
});
