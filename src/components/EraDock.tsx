'use client';

import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import type { EraJumpTarget } from '@/types/species';
import {
  DEFAULT_CENTER_LOG,
  DEFAULT_ZOOM_SPAN_LOG,
  MAX_ZOOM_SPAN_LOG,
  MIN_ZOOM_SPAN_LOG,
  formatLogCursorDate,
  getSemanticZoomLevel,
} from '@/lib/timelineMath';

export const ERA_JUMP_TARGETS: EraJumpTarget[] = [
  {
    id: 'overview',
    label: 'All Time',
    sublabel: '505 Ma–Now',
    targetCenterLog: DEFAULT_CENTER_LOG,
    targetZoomSpanLog: DEFAULT_ZOOM_SPAN_LOG,
  },
  {
    id: 'ordovician',
    label: 'Ordovician',
    sublabel: '444 Ma',
    targetCenterLog: 8.65,
    targetZoomSpanLog: 0.72,
  },
  {
    id: 'permian',
    label: 'Permian',
    sublabel: '252 Ma',
    targetCenterLog: 8.42,
    targetZoomSpanLog: 0.65,
  },
  {
    id: 'triassic',
    label: 'Triassic',
    sublabel: '201 Ma',
    targetCenterLog: 8.32,
    targetZoomSpanLog: 0.55,
  },
  {
    id: 'cretaceous',
    label: 'Cretaceous',
    sublabel: '66 Ma',
    targetCenterLog: 7.85,
    targetZoomSpanLog: 0.78,
  },
  {
    id: 'pleistocene',
    label: 'Pleistocene',
    sublabel: '10,000 BCE',
    targetCenterLog: 4.08,
    targetZoomSpanLog: 1.2,
  },
  {
    id: 'early-modern',
    label: '1500 CE',
    sublabel: '1500–1850',
    targetCenterLog: 2.55,
    targetZoomSpanLog: 0.9,
  },
  {
    id: 'industrial',
    label: '1900 CE',
    sublabel: 'Modern Era',
    targetCenterLog: 1.9,
    targetZoomSpanLog: 0.95,
  },
  {
    id: 'present',
    label: 'The Present',
    sublabel: 'Endangered & Saved',
    targetCenterLog: -0.35,
    targetZoomSpanLog: 1.6,
  },
];

export interface EraDockHandle {
  syncFrameTelemetry: (centerLog: number, zoomSpanLog: number) => void;
}

interface EraDockProps {
  ref?: React.Ref<EraDockHandle>;
  centerLog: number;
  zoomSpanLog: number;
  onJumpToEra: (target: EraJumpTarget) => void;
  onZoomChange: (nextZoomSpanLog: number) => void;
}

function zoomSpanToSlider(zoomSpanLog: number): number {
  const ratio = (MAX_ZOOM_SPAN_LOG - zoomSpanLog) / (MAX_ZOOM_SPAN_LOG - MIN_ZOOM_SPAN_LOG);
  return Math.round(Math.min(100, Math.max(0, ratio * 100)));
}

export function EraDock({
  ref,
  centerLog,
  zoomSpanLog,
  onJumpToEra,
  onZoomChange,
}: EraDockProps) {
  const semanticZoomTextRef = useRef<HTMLSpanElement | null>(null);
  const centerDateTextRef = useRef<HTMLSpanElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const liveZoomSpanRef = useRef(zoomSpanLog);

  useImperativeHandle(ref, () => ({
    syncFrameTelemetry(nextCenterLog: number, nextZoomSpanLog: number) {
      liveZoomSpanRef.current = nextZoomSpanLog;
      if (semanticZoomTextRef.current) {
        const nextLevel = getSemanticZoomLevel(nextZoomSpanLog);
        if (semanticZoomTextRef.current.textContent !== nextLevel) {
          semanticZoomTextRef.current.textContent = nextLevel;
        }
      }
      if (centerDateTextRef.current) {
        const nextDate = formatLogCursorDate(nextCenterLog);
        if (centerDateTextRef.current.textContent !== nextDate) {
          centerDateTextRef.current.textContent = nextDate;
        }
      }
      if (sliderRef.current && document.activeElement !== sliderRef.current) {
        const nextSlider = String(zoomSpanToSlider(nextZoomSpanLog));
        if (sliderRef.current.value !== nextSlider) {
          sliderRef.current.value = nextSlider;
        }
      }
    },
  }));

  const semanticZoom = getSemanticZoomLevel(zoomSpanLog);
  const centerDate = formatLogCursorDate(centerLog);
  const sliderValue = zoomSpanToSlider(zoomSpanLog);

  useEffect(() => {
    liveZoomSpanRef.current = zoomSpanLog;
    if (sliderRef.current && document.activeElement !== sliderRef.current) {
      sliderRef.current.value = String(zoomSpanToSlider(zoomSpanLog));
    }
  }, [zoomSpanLog]);

  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    const nextSpan = MAX_ZOOM_SPAN_LOG - val * (MAX_ZOOM_SPAN_LOG - MIN_ZOOM_SPAN_LOG);
    liveZoomSpanRef.current = nextSpan;
    onZoomChange(nextSpan);
  };

  // Highlight closest era dock button (updates cleanly when camera settles)
  const activeEraId = React.useMemo(() => {
    if (zoomSpanLog > 6.5) return 'overview';
    let bestId = 'overview';
    let bestDist = Infinity;
    for (const target of ERA_JUMP_TARGETS) {
      if (target.id === 'overview') continue;
      const dist = Math.abs(target.targetCenterLog - centerLog);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = target.id;
      }
    }
    return bestId;
  }, [centerLog, zoomSpanLog]);

  return (
    <nav
      aria-label="Jump to Geological Era and Zoom Controls"
      className="pointer-events-none fixed bottom-3 left-3 right-3 z-40"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[1380px] rounded-2xl border border-white/15 bg-slate-950/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(2,6,23,0.75)] px-3 py-2 flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Era Quick-Jump Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 lg:pb-0">
          {ERA_JUMP_TARGETS.map((target) => {
            const isActive = activeEraId === target.id;
            const isPresent = target.id === 'present';
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => onJumpToEra(target)}
                aria-current={isActive ? 'location' : undefined}
                className={`shrink-0 rounded-xl px-2.5 py-1.5 text-left border transition-colors cursor-pointer ${
                  isActive
                    ? isPresent
                      ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100'
                      : 'bg-sky-500/25 border-sky-400/60 text-sky-100'
                    : isPresent
                      ? 'bg-emerald-950/35 border-emerald-500/25 text-emerald-200/90 hover:bg-emerald-900/40 hover:border-emerald-400/50'
                      : 'bg-slate-900/70 border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-slate-800/80'
                }`}
              >
                <div className="text-[11px] font-semibold leading-none">{target.label}</div>
                <div className="text-[9px] font-mono opacity-75 mt-0.5 leading-none">
                  {target.sublabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scale Telemetry & Logarithmic Zoom Slider */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-white/10 px-2 py-1 text-sky-300 uppercase">
              <Layers className="w-3 h-3" />
              <span ref={semanticZoomTextRef}>{semanticZoom}</span>
            </span>
            <span
              ref={centerDateTextRef}
              className="text-slate-200 font-semibold min-w-[96px] text-right"
              title="Current viewport center date"
            >
              {centerDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onZoomChange(Math.min(MAX_ZOOM_SPAN_LOG, liveZoomSpanRef.current * 1.35))
              }
              aria-label="Zoom out"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              ref={sliderRef}
              type="range"
              min={0}
              max={100}
              defaultValue={sliderValue}
              onChange={handleSliderInput}
              aria-label="Logarithmic zoom scale"
              className="w-24 sm:w-28 accent-sky-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={() =>
                onZoomChange(Math.max(MIN_ZOOM_SPAN_LOG, liveZoomSpanRef.current / 1.35))
              }
              aria-label="Zoom in"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
