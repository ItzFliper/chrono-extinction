'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';
import type { AtlasStratum } from '@/data/eras';
import type { StratumId } from '@/types/species';

interface StrataElevatorRailProps {
  strataGroups: Array<{ stratum: AtlasStratum; count: number }>;
  activeStratumId: StratumId;
  onJumpToStratum: (id: StratumId) => void;
}

export function StrataElevatorRail({
  strataGroups,
  activeStratumId,
  onJumpToStratum,
}: StrataElevatorRailProps) {
  if (strataGroups.length === 0) return null;

  return (
    <>
      {/* Desktop Floating Vertical Geological Depth Rail */}
      <aside
        aria-label="Geological Depth Elevator Rail"
        data-testid="strata-elevator-rail"
        className="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 w-52 flex-col rounded-2xl border border-white/15 bg-slate-950/90 backdrop-blur-xl p-3 shadow-[0_16px_48px_rgba(2,6,23,0.85)]"
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-sky-300 font-semibold">
            Depth / Era Rail
          </span>
          <ArrowDown className="w-3 h-3 text-slate-400" />
        </div>

        <nav className="relative flex flex-col gap-1">
          {/* Vertical geological spine indicator */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-emerald-400/60 via-amber-400/45 to-sky-400/60"
          />

          {strataGroups.map(({ stratum, count }) => {
            const isActive = activeStratumId === stratum.id;
            return (
              <button
                key={stratum.id}
                type="button"
                onClick={() => onJumpToStratum(stratum.id)}
                aria-current={isActive ? 'location' : undefined}
                data-testid={`elevator-btn-${stratum.id}`}
                className={`relative flex items-center gap-2.5 rounded-xl pl-2 pr-2.5 py-1.5 text-left border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/95 border-white/25 text-white'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/75'
                }`}
              >
                <span
                  className={`relative z-10 w-2 h-2 rounded-full shrink-0 transition-transform ${
                    isActive ? 'scale-125 ring-4 ring-white/15' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: stratum.accentHex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-semibold truncate">
                      {stratum.shortTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {count}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate">
                    {stratum.depthLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile & Tablet Floating Bottom Stratum Dock */}
      <nav
        aria-label="Geological strata quick jump"
        className="xl:hidden fixed bottom-3 left-3 right-3 z-30 rounded-2xl border border-white/15 bg-slate-950/92 backdrop-blur-xl px-2.5 py-2 shadow-[0_12px_36px_rgba(2,6,23,0.85)]"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {strataGroups.map(({ stratum, count }) => {
            const isActive = activeStratumId === stratum.id;
            return (
              <button
                key={stratum.id}
                type="button"
                onClick={() => onJumpToStratum(stratum.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 border-white/30 text-white'
                    : 'bg-slate-900/75 border-white/10 text-slate-300'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: stratum.accentHex }}
                />
                <span>{stratum.shortTitle}</span>
                <span className="text-[10px] font-mono opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
