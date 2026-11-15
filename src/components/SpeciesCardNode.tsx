'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Species } from '@/types/species';
import type { SemanticZoomLevel } from '@/lib/timelineMath';
import {
  fetchWikipediaSummary,
  getCachedWikipediaSummary,
  type WikipediaSummary,
} from '@/lib/wikipedia';
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

// Alternate lanes above and below the central axis:
// even lanes (0, 2, 4) sit above axis; odd lanes (1, 3, 5) sit below axis.
const LANE_OFFSETS = [-122, 114, -222, 212, -318, 304];

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
  const [wiki, setWiki] = useState<WikipediaSummary | null>(() =>
    getCachedWikipediaSummary(species.wikipediaSlug)
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (renderMode === 'pip') return;
    let active = true;
    const cached = getCachedWikipediaSummary(species.wikipediaSlug);
    if (cached) {
      setWiki(cached);
      return;
    }
    fetchWikipediaSummary(species.wikipediaSlug).then((data) => {
      if (active) setWiki(data);
    });
    return () => {
      active = false;
    };
  }, [species.wikipediaSlug, renderMode]);

  const offsetY = LANE_OFFSETS[lane % LANE_OFFSETS.length];
  const isAbove = offsetY < 0;
  const stemHeight = Math.abs(offsetY) - (renderMode === 'card' ? 38 : renderMode === 'compact' ? 16 : 6);

  const thumbUrl = !imgError ? wiki?.thumbnailUrl : undefined;

  if (renderMode === 'pip') {
    return (
      <div
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          transform: `translate3d(${screenX}px, ${axisY}px, 0)`,
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
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          transform: `translate3d(${screenX}px, ${axisY}px, 0)`,
          zIndex: isSelected || isHighlighted ? 40 : 12,
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
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelect(species)}
          style={{
            top: `${offsetY}px`,
          }}
          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full px-2.5 py-1.5 backdrop-blur-md border text-left transition-all duration-150 hover:scale-105 cursor-pointer ${
            isSelected || isHighlighted
              ? 'bg-amber-950/85 border-amber-400/80 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
              : 'bg-slate-900/80 border-white/15 text-slate-100 hover:border-sky-400/50 hover:bg-slate-800/90'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center border border-white/10">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={species.commonName}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
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
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        transform: `translate3d(${screenX}px, ${axisY}px, 0)`,
        zIndex: isSelected || isHighlighted ? 45 : 20,
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
        initial={{ opacity: 0, y: isAbove ? -8 : 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={() => onSelect(species)}
        style={{
          top: `${offsetY}px`,
        }}
        className={`pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 w-[188px] rounded-xl overflow-hidden border backdrop-blur-xl text-left transition-all duration-150 cursor-pointer hover:-translate-y-[calc(50%+3px)] ${
          isSelected || isHighlighted
            ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.32)] ring-1 ring-amber-300/60'
            : 'bg-slate-900/82 border-white/15 hover:border-sky-400/60 shadow-[0_12px_32px_rgba(2,6,23,0.65)]'
        }`}
      >
        <div className="flex items-center gap-2.5 p-2.5">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-950/90 shrink-0 border border-white/10 flex items-center justify-center">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={species.commonName}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <TaxonSilhouette group={species.taxonGroup} className="w-7 h-7 text-sky-300/65" />
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
          <div className="px-2.5 pb-2 pt-0 border-t border-white/5">
            <p className="mt-1.5 text-[10px] text-slate-300/85 line-clamp-2 leading-relaxed">
              {species.cause}
            </p>
          </div>
        )}
      </motion.button>
    </div>
  );
});
