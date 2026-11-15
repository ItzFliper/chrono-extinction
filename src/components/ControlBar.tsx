'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  Compass,
  Clock,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Skull,
} from 'lucide-react';
import type { Species, SpeciesStatus } from '@/types/species';
import { parseYearQueryToYearsAgo } from '@/lib/timelineMath';

export type StatusFilter = 'all' | SpeciesStatus;

interface ControlBarProps {
  allSpecies: Species[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSelectSearchSpecies: (species: Species) => void;
  onJumpToYearsAgo: (yearsAgo: number) => void;
  onResetView: () => void;
}

export function ControlBar({
  allSpecies,
  statusFilter,
  onStatusFilterChange,
  onSelectSearchSpecies,
  onJumpToYearsAgo,
  onResetView,
}: ControlBarProps) {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const [yearError, setYearError] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(() => {
    let extinct = 0;
    let endangered = 0;
    let recovered = 0;
    for (const sp of allSpecies) {
      if (sp.status === 'extinct') extinct++;
      else if (sp.status === 'endangered') endangered++;
      else if (sp.status === 'recovered') recovered++;
    }
    return {
      all: allSpecies.length,
      extinct,
      endangered,
      recovered,
    };
  }, [allSpecies]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSpecies
      .filter((sp) => {
        return (
          sp.commonName.toLowerCase().includes(q) ||
          sp.scientificName.toLowerCase().includes(q) ||
          sp.cause.toLowerCase().includes(q) ||
          sp.era.toLowerCase().includes(q) ||
          sp.displayDate.toLowerCase().includes(q) ||
          (sp.region && sp.region.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [allSpecies, query]);

  // Press '/' anywhere outside inputs to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
          setIsSearchOpen(true);
        }
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleYearJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearsAgo = parseYearQueryToYearsAgo(yearInput);
    if (yearsAgo === null) {
      setYearError(true);
      return;
    }
    setYearError(false);
    onJumpToYearsAgo(yearsAgo);
  };

  const filterPills: Array<{
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
      icon: <Sparkles className="w-3 h-3" />,
      activeClass: 'bg-sky-500/25 border-sky-400/60 text-sky-100',
    },
    {
      id: 'extinct',
      label: 'Extinct',
      count: counts.extinct,
      icon: <Skull className="w-3 h-3" />,
      activeClass: 'bg-slate-500/30 border-slate-300/50 text-white',
    },
    {
      id: 'endangered',
      label: 'Endangered',
      count: counts.endangered,
      icon: <AlertTriangle className="w-3 h-3" />,
      activeClass: 'bg-rose-500/25 border-rose-400/60 text-rose-100',
    },
    {
      id: 'recovered',
      label: 'Recovered',
      count: counts.recovered,
      icon: <ShieldCheck className="w-3 h-3" />,
      activeClass: 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100',
    },
  ];

  return (
    <header className="pointer-events-none fixed top-3 left-3 right-3 z-40 flex flex-col gap-2">
      <div className="pointer-events-auto mx-auto w-full max-w-[1380px] rounded-2xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl shadow-[0_16px_48px_rgba(2,6,23,0.7)] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onResetView}
          className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
          title="Reset to 450 Ma – Present Overview"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/30 via-indigo-500/25 to-emerald-500/30 border border-white/20 flex items-center justify-center shadow-inner">
            <Compass className="w-4 h-4 text-sky-300 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              ChronoExtinction
            </h1>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              505 Ma → Present · log₁₀ Deep-Time Atlas
            </p>
          </div>
        </button>

        {/* Instant Search */}
        <div ref={searchWrapperRef} className="relative flex-1 min-w-[230px] max-w-md">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder='Search species, taxonomy, or cause (e.g. "asteroid", "lynx")...'
              aria-label="Search species by common name, scientific name, or cause"
              className="w-full rounded-xl bg-slate-900/90 border border-white/15 pl-8 pr-14 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20 transition-all"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-white/10 rounded">
                /
              </kbd>
            )}
          </div>

          {/* Live Search Dropdown */}
          {isSearchOpen && query.trim().length > 0 && (
            <div
              role="listbox"
              aria-label="Matching species"
              className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 max-h-[380px] overflow-y-auto"
            >
              {searchResults.length === 0 ? (
                <div className="px-4 py-4 text-xs text-slate-400 text-center">
                  No species matched &ldquo;{query}&rdquo;. Try &ldquo;asteroid&rdquo;, &ldquo;hunting&rdquo;, &ldquo;lynx&rdquo;, or &ldquo;dodo&rdquo;.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {searchResults.map((sp) => (
                    <li key={sp.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSearchSpecies(sp);
                          setIsSearchOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {sp.commonName}
                            </span>
                            <span className="text-[10px] italic text-slate-400 truncate">
                              {sp.scientificName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300/85 line-clamp-1 mt-0.5">
                            {sp.cause}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border ${
                              sp.status === 'endangered'
                                ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                                : sp.status === 'recovered'
                                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                                  : 'bg-slate-700/60 border-white/15 text-slate-200'
                            }`}
                          >
                            {sp.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {sp.displayDate}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Status Filter Pills */}
        <div
          role="group"
          aria-label="Filter by conservation status"
          className="flex items-center gap-1.5 flex-wrap"
        >
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onStatusFilterChange(pill.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all cursor-pointer ${
                  isActive
                    ? pill.activeClass
                    : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
                <span className="text-[10px] font-mono opacity-75">{pill.count}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Year Jump */}
        <form onSubmit={handleYearJumpSubmit} className="hidden lg:flex items-center gap-1.5">
          <div className="relative flex items-center">
            <Clock className="w-3 h-3 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                if (yearError) setYearError(false);
              }}
              placeholder="Jump year (66 Ma, 1900)"
              aria-label="Jump to specific year or geological age"
              className={`w-36 xl:w-44 rounded-xl bg-slate-900/85 border pl-7 pr-2.5 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                yearError
                  ? 'border-rose-400/80 ring-2 ring-rose-500/20'
                  : 'border-white/15 focus:border-sky-400/60'
              }`}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 px-2.5 py-1.5 text-[11px] font-semibold text-sky-100 transition-colors cursor-pointer"
          >
            Go
          </button>
        </form>
      </div>
    </header>
  );
}
