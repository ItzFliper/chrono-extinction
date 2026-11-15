'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  X,
  ExternalLink,
  Crosshair,
  MapPin,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Skull,
  BookOpen,
} from 'lucide-react';
import type { Species } from '@/types/species';
import { getWikipediaFallbackUrl } from '@/lib/wikipedia';
import { useWikipediaSummary } from '@/lib/useWikipediaSummary';
import { getYearsAgo, yearsAgoToLog } from '@/lib/timelineMath';
import { TaxonSilhouette } from '@/components/TaxonSilhouette';

interface SpeciesDrawerProps {
  species: Species | null;
  allSpecies: Species[];
  onClose: () => void;
  onSelectSpecies: (species: Species) => void;
  onFocusSpeciesOnTimeline: (species: Species) => void;
}

export function SpeciesDrawer({
  species,
  allSpecies,
  onClose,
  onSelectSpecies,
  onFocusSpeciesOnTimeline,
}: SpeciesDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const pressedOutsideRef = useRef(false);

  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { summary: wiki, isLoading: loadingWiki } = useWikipediaSummary(
    species?.wikipediaSlug ?? null,
    Boolean(species)
  );

  // Sync native <dialog> showModal() / close() with selected species
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (species) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = '';
      dialog.close();
    }
  }, [species]);

  // Related species in the same era
  const relatedSpecies = useMemo(() => {
    if (!species) return [];
    return allSpecies
      .filter((s) => s.id !== species.id && s.eraId === species.eraId)
      .slice(0, 4);
  }, [species, allSpecies]);

  const handleCloseAction = () => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      dialog.returnValue = '';
      dialog.close();
    }
    onClose();
  };

  // Light-dismiss outside the sheet (requiring both pointerdown and pointerup outside)
  const isOutsideSheet = (e: React.PointerEvent<HTMLDialogElement>) => {
    const sheet = sheetRef.current;
    if (!sheet) return false;
    const rect = sheet.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  const rawHeroUrl = wiki?.originalImageUrl || wiki?.thumbnailUrl;
  const heroImageUrl = rawHeroUrl && failedUrl !== rawHeroUrl ? rawHeroUrl : undefined;

  const logCoord = species
    ? yearsAgoToLog(getYearsAgo(species.extinctionYear, species.status)).toFixed(3)
    : '0.000';

  const statusConfig = !species
    ? null
    : species.status === 'endangered'
      ? {
          label: 'Endangered · En peligro de extinción',
          badgeClass: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />,
        }
      : species.status === 'recovered'
        ? {
            label: 'Saved / Recovered · Salvados de la extinción',
            badgeClass: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />,
          }
        : {
            label: 'Extinct Species',
            badgeClass: 'bg-slate-600/35 border-slate-400/40 text-slate-200',
            icon: <Skull className="w-3.5 h-3.5 text-slate-300" />,
          };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="drawer-species-title"
      onCancel={(e) => {
        e.preventDefault();
        handleCloseAction();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isOutsideSheet(e);
      }}
      onPointerUp={(e) => {
        if (pressedOutsideRef.current && isOutsideSheet(e)) {
          handleCloseAction();
        }
        pressedOutsideRef.current = false;
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-[460px] bg-transparent p-0 text-slate-100 open:flex open:justify-end"
    >
      {species && statusConfig && (
        <div
          ref={sheetRef}
          className="relative flex h-full w-full flex-col border-l border-white/15 bg-slate-950/95 backdrop-blur-2xl shadow-[-24px_0_64px_rgba(2,6,23,0.9)] overflow-hidden"
        >
          {/* Hero Media Banner */}
          <div className="relative h-60 shrink-0 bg-slate-900 overflow-hidden border-b border-white/10">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt={species.commonName}
                width={460}
                height={240}
                unoptimized
                priority
                referrerPolicy="no-referrer"
                onError={() => setFailedUrl(heroImageUrl)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40">
                <TaxonSilhouette
                  group={species.taxonGroup}
                  className="w-24 h-24 text-sky-300/45"
                />
                <span className="text-[11px] font-mono text-slate-400 mt-2">
                  {species.scientificName}
                </span>
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"
            />

            {/* Explicit Close Button with autofocus for modal accessibility */}
            <button
              type="button"
              autoFocus
              onClick={handleCloseAction}
              aria-label="Close species detail drawer"
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-white/20 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Status & Date Badges */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border backdrop-blur-md ${statusConfig.badgeClass}`}
              >
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </span>
              {species.iucnBadge && (
                <span className="rounded-full bg-slate-950/85 border border-white/15 px-2.5 py-1 text-[10px] font-mono text-slate-200">
                  {species.iucnBadge}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title & Binomial */}
            <div>
              <h2
                id="drawer-species-title"
                className="text-2xl font-bold tracking-tight text-white leading-tight"
              >
                {species.commonName}
              </h2>
              <p className="text-sm italic text-sky-300/90 mt-0.5">
                {species.scientificName}
              </p>
              {wiki?.description && (
                <p className="text-xs text-slate-400 mt-1">{wiki.description}</p>
              )}
            </div>

            {/* Chronological & Geographic Telemetry */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-900/80 border border-white/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Timeline Point</span>
                </div>
                <p className="text-sm font-semibold text-white mt-1">{species.displayDate}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  L = {logCoord} · {species.era}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-white/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Region / Habitat</span>
                </div>
                <p className="text-xs font-medium text-slate-100 mt-1 leading-snug">
                  {species.region || 'Global / Historical Range'}
                </p>
              </div>
            </div>

            {/* Scientific Taxonomy */}
            {species.taxonomy && (
              <div className="rounded-xl bg-slate-900/60 border border-white/10 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <span>Taxonomic Classification</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-500">Class</span>
                    <span className="font-medium text-slate-200">{species.taxonomy.class}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Order</span>
                    <span className="font-medium text-slate-200">{species.taxonomy.order}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Family</span>
                    <span className="font-medium text-slate-200">{species.taxonomy.family}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Curated Extinction / Conservation Cause */}
            <div
              className={`rounded-xl border p-3.5 ${
                species.status === 'recovered'
                  ? 'bg-emerald-950/30 border-emerald-500/25'
                  : species.status === 'endangered'
                    ? 'bg-rose-950/30 border-rose-500/25'
                    : 'bg-amber-950/20 border-amber-500/20'
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                {species.status === 'recovered'
                  ? 'How It Was Saved'
                  : species.status === 'endangered'
                    ? 'Primary Survival Threats'
                    : 'Extinction Driver'}
              </h3>
              <p className="text-xs text-slate-200/95 leading-relaxed">{species.cause}</p>
            </div>

            {/* Live Wikipedia Summary */}
            <div className="rounded-xl bg-slate-900/70 border border-white/10 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  <span>Wikipedia Monograph</span>
                </div>
                {loadingWiki && (
                  <span className="text-[10px] font-mono text-sky-300 animate-pulse">
                    Fetching...
                  </span>
                )}
              </div>
              {loadingWiki ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-11/12" />
                  <div className="h-3 bg-slate-800 rounded w-4/5" />
                </div>
              ) : wiki?.extract ? (
                <p className="text-xs text-slate-300 leading-relaxed">{wiki.extract}</p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Extended summary unavailable offline. Use the Wikipedia link below for the full article.
                </p>
              )}
            </div>

            {/* Related Species in Same Era */}
            {relatedSpecies.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Contemporaries in {species.era}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {relatedSpecies.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectSpecies(rel)}
                      className="rounded-xl border border-white/10 bg-slate-900/70 hover:bg-slate-800/90 hover:border-sky-400/40 px-2.5 py-2 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {rel.commonName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {rel.displayDate}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="shrink-0 border-t border-white/10 bg-slate-950/90 px-5 py-3.5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onFocusSpeciesOnTimeline(species)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              <span>Focus on Timeline</span>
            </button>
            <a
              href={wiki?.pageUrl || getWikipediaFallbackUrl(species.wikipediaSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 transition-colors"
            >
              <span>Read on Wikipedia</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}
