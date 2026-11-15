'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Compass,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Skull,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import type {
  SortOrder,
  Species,
  SpeciesStatus,
  TaxonMacroFilter,
} from '@/types/species';

export type StatusFilter = 'all' | SpeciesStatus;

interface ControlBarProps {
  allSpecies: Species[];
  filteredCount: number;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  taxonFilter: TaxonMacroFilter;
  onTaxonFilterChange: (filter: TaxonMacroFilter) => void;
  sortOrder: SortOrder;
  onToggleSortOrder: () => void;
  onResetAll: () => void;
}

const TAXON_FILTER_PILLS: Array<{ id: TaxonMacroFilter; label: string }> = [
  { id: 'all', label: 'All Animals' },
  { id: 'mammals', label: 'Mammals' },
  { id: 'birds', label: 'Birds' },
  { id: 'reptiles-dinosaurs', label: 'Reptiles & Dinosaurs' },
  { id: 'marine-fish', label: 'Marine & Fish' },
  { id: 'amphibians-invertebrates', label: 'Amphibians & Invertebrates' },
];

export function ControlBar({
  allSpecies,
  filteredCount,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  taxonFilter,
  onTaxonFilterChange,
  sortOrder,
  onToggleSortOrder,
  onResetAll,
}: ControlBarProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(() => {
    let extinct = 0;
    let endangered = 0;
    let recovered = 0;
    for (let i = 0; i < allSpecies.length; i++) {
      const s = allSpecies[i].status;
      if (s === 'extinct') extinct++;
      else if (s === 'endangered') endangered++;
      else if (s === 'recovered') recovered++;
    }
    return {
      all: allSpecies.length,
      extinct,
      endangered,
      recovered,
    };
  }, [allSpecies]);

  // Keyboard shortcuts: '/' focuses search, Escape clears search or blurs input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const statusTabs: Array<{
    id: StatusFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      id: 'all',
      label: 'All',
      count: counts.all,
      icon: <Sparkles className="w-3.5 h-3.5" />,
      activeClass: 'bg-sky-500/20 border-sky-400/60 text-sky-100',
    },
    {
      id: 'endangered',
      label: 'Endangered (Present)',
      count: counts.endangered,
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />,
      activeClass: 'bg-amber-500/20 border-amber-400/60 text-amber-100',
    },
    {
      id: 'recovered',
      label: 'Saved (Present)',
      count: counts.recovered,
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />,
      activeClass: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-100',
    },
    {
      id: 'extinct',
      label: 'Extinct',
      count: counts.extinct,
      icon: <Skull className="w-3.5 h-3.5 text-rose-300" />,
      activeClass: 'bg-rose-500/20 border-rose-400/60 text-rose-100',
    },
  ];

  const handleBrandClick = () => {
    onResetAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-[0_12px_36px_rgba(2,6,23,0.75)]">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-2.5 flex flex-col gap-2.5">
        {/* Top Row: Brand, Search Input, Sort Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
            title="Scroll to surface & reset filters"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/25 via-indigo-500/25 to-emerald-500/25 border border-white/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-sky-300 group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-none">
                  ChronoExtinction
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-900 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                  <Layers className="w-2.5 h-2.5" />
                  <span>
                    {filteredCount.toLocaleString('en-US')} / {counts.all.toLocaleString('en-US')}
                  </span>
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Vertical Geological Strata Museum · 540 Ma – Present
              </p>
            </div>
          </button>

          {/* Instant Filter Search */}
          <div className="relative flex-1 min-w-[210px] max-w-lg order-3 sm:order-2 w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder='Filter 1,198 species by name, taxonomy, or cause (e.g. "asteroid", "vaquita")...'
              aria-label="Filter species by common name, scientific name, taxonomy, or cause"
              className="w-full rounded-xl bg-slate-900/95 border border-white/15 pl-8 pr-12 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchQueryChange('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-white/10 rounded">
                /
              </kbd>
            )}
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            data-testid="sort-order-toggle"
            onClick={onToggleSortOrder}
            className="order-2 sm:order-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 hover:border-sky-400/50 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer shrink-0"
            title="Toggle chronological strata direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="hidden md:inline">
              {sortOrder === 'newest-first'
                ? 'Newest → Oldest (Present → Cambrian)'
                : 'Oldest → Newest (Cambrian → Present)'}
            </span>
            <span className="md:hidden">
              {sortOrder === 'newest-first' ? 'Present → 540 Ma' : '540 Ma → Present'}
            </span>
          </button>
        </div>

        {/* Second Row: Status Filter Tabs & Taxon Group Filter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          {/* Status Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter by conservation status"
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0"
          >
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? tab.activeClass
                      : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/25'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Taxon Group Filter Pills */}
          <div
            role="group"
            aria-label="Filter by taxonomic animal group"
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0"
          >
            {TAXON_FILTER_PILLS.map((pill) => {
              const isActive = taxonFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onTaxonFilterChange(pill.id)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-100'
                      : 'bg-slate-900/65 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
