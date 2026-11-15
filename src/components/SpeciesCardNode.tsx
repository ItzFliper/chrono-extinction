'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Species } from '@/types/species';
import type { SemanticZoomLevel } from '@/lib/timelineMath';
import { useWikipediaSummary } from '@/lib/useWikipediaSummary';
import { TaxonSilhouette } from '@/components/TaxonSilhouette';

interface SpeciesCardNodeProps {
  species: Species;
  screenX: number;
  lane: number;
  renderMode: 'card' | 'compact' | 'pip';
  semanticZoom: SemanticZoomLevel;
  isSelected: boolean;
  isHighlighted: boolean;
  axisY: number;
  onSelect: (species: Species) => void;
}

// Alternate lanes above and below the central axis with clear vertical clearance:
// Lanes 0..3 hold full cards (92px height), lanes 4..5 hold outer compact pills (40px height).
const LANE_OFFSETS = [-86, 86, -196, 196, -274, 274];

export const SpeciesCardNode = React.memo(function SpeciesCardNode({
  species,
  screenX,
  lane,
  renderMode,
  semanticZoom,
  isSelected,
  isHighlighted,
  axisY,
  onSelect,
}: SpeciesCardNodeProps) {
  const { summary: wiki } = useWikipediaSummary(
    species.wikipediaSlug,
    renderMode !== 'pip'
  );
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const offsetY = LANE_OFFSETS[lane % LANE_OFFSETS.length];
  const isAbove = offsetY < 0;
  const stemHeight =
    Math.abs(offsetY) -
    (renderMode === 'card' ? (semanticZoom === 'micro' ? 46 : 34) : renderMode === 'compact' ? 18 : 6);

  const rawThumbUrl = wiki?.thumbnailUrl;
  const thumbUrl = rawThumbUrl && failedUrl !== rawThumbUrl ? rawThumbUrl : undefined;
  const px = Math.round(screenX);
  const py = Math.round(axisY);

  if (renderMode === 'pip') {
    return (
      <div
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          transform: `translate3d(${px}px, ${py}px, 0px)`,
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(species)}
          title={`${species.commonName} (${species.displayDate})`}
          aria-label={`${species.commonName}, ${species.displayDate}`}
          className={`group -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border transition-transform duration-150 hover:scale-150 focus-visible:scale-150 focus-visible:outline-none ${
            isSelected || isHighlighted
              ? 'bg-amber-400 border-amber-200 ring-4 ring-amber-400/30 scale-125'
              : 'bg-slate-400/80 border-slate-200/70 hover:bg-amber-300'
          }`}
        />
      </div>
    );
  }

  if (renderMode === 'compact') {
    return (
      <div
        className={`absolute top-0 left-0 pointer-events-none ${
          isSelected || isHighlighted ? 'z-40' : 'z-[12]'
        }`}
        style={{
          transform: `translate3d(${px}px, ${py}px, 0px)`,
        }}
      >
        {/* Axis dot */}
        <span
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
            isSelected || isHighlighted ? 'bg-amber-400 ring-4 ring-amber-400/30' : 'bg-slate-400/80'
          }`}
        />
        {/* Connector stem */}
        <span
          className="absolute left-0 -translate-x-1/2 w-px bg-gradient-to-b from-slate-500/40 via-slate-400/25 to-slate-500/40"
          style={{
            top: isAbove ? `${-stemHeight}px` : '0px',
            height: `${stemHeight}px`,
          }}
        />
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelect(species)}
          style={{
            top: `${offsetY}px`,
          }}
          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full px-2.5 py-1.5 backdrop-blur-md border text-left transition-all duration-150 hover:scale-105 cursor-pointer ${
            isSelected || isHighlighted
              ? 'bg-amber-950/85 border-amber-400/80 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
              : 'bg-slate-900/85 border-white/15 text-slate-100 hover:border-sky-400/50 hover:bg-slate-800/90'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center border border-white/10">
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
        </motion.button>
      </div>
    );
  }

  return (
    <div
      className={`absolute top-0 left-0 pointer-events-none ${
        isSelected || isHighlighted ? 'z-[45]' : 'z-20'
      }`}
      style={{
        transform: `translate3d(${px}px, ${py}px, 0px)`,
      }}
    >
      {/* Axis anchor marker */}
      <span
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border transition-colors ${
          isSelected || isHighlighted
            ? 'bg-amber-400 border-amber-100 ring-4 ring-amber-400/35'
            : 'bg-sky-400/90 border-slate-950 ring-2 ring-sky-400/20'
        }`}
      />
      {/* Stem */}
      <span
        className={`absolute left-0 -translate-x-1/2 w-px ${
          isSelected || isHighlighted
            ? 'bg-amber-400/80'
            : 'bg-gradient-to-b from-sky-400/50 via-slate-500/30 to-sky-400/50'
        }`}
        style={{
          top: isAbove ? `${-stemHeight}px` : '0px',
          height: `${stemHeight}px`,
        }}
      />
      {/* Full Specimen Card */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        onClick={() => onSelect(species)}
        style={{
          top: `${offsetY}px`,
        }}
        className={`pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 w-[188px] rounded-xl overflow-hidden border backdrop-blur-xl text-left transition-all duration-150 cursor-pointer hover:scale-[1.03] ${
          isSelected || isHighlighted
            ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.32)] ring-1 ring-amber-300/60'
            : 'bg-slate-900/88 border-white/15 hover:border-sky-400/60 shadow-[0_12px_32px_rgba(2,6,23,0.65)]'
        }`}
      >
        <div className="flex items-center gap-2 p-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-950/90 shrink-0 border border-white/10 flex items-center justify-center">
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
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
          <div className="px-2 pb-1.5 pt-1 border-t border-white/5">
            <p className="text-[10px] text-slate-300/85 line-clamp-2 leading-tight">
              {species.cause}
            </p>
          </div>
        )}
      </motion.button>
    </div>
  );
});
