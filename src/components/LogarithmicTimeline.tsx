'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Sparkles, Compass } from 'lucide-react';
import type { Species } from '@/types/species';
import { GEOLOGICAL_ERAS, MASS_EXTINCTION_EVENTS } from '@/data/eras';
import {
  ALL_TIMELINE_TICKS,
  clampCenterLog,
  clampZoomSpanLog,
  formatLogCursorDate,
  getSemanticZoomLevel,
  layoutVisibleTimelineNodes,
  logToScreenX,
  screenXToLog,
  yearsAgoToLog,
} from '@/lib/timelineMath';
import { SpeciesCardNode } from '@/components/SpeciesCardNode';
import { PresentZone } from '@/components/PresentZone';

export interface CameraTarget {
  centerLog: number;
  zoomSpanLog: number;
  version: number;
}

interface LogarithmicTimelineProps {
  species: Species[];
  allSpecies: Species[];
  statusFilter: 'all' | 'extinct' | 'endangered' | 'recovered';
  cameraTarget: CameraTarget;
  selectedSpeciesId: string | null;
  highlightedSpeciesId: string | null;
  onSelectSpecies: (species: Species) => void;
  onCameraTelemetry: (centerLog: number, zoomSpanLog: number) => void;
  onFocusPresent: () => void;
  onJumpToCoordinates: (centerLog: number, zoomSpanLog: number) => void;
}

export function LogarithmicTimeline({
  species,
  allSpecies,
  statusFilter,
  cameraTarget,
  selectedSpeciesId,
  highlightedSpeciesId,
  onSelectSpecies,
  onCameraTelemetry,
  onFocusPresent,
  onJumpToCoordinates,
}: LogarithmicTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 760 });

  // Live animated camera state vs target camera state
  const currentCamRef = useRef({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });
  const targetCamRef = useRef({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });

  const [renderCam, setRenderCam] = useState({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });

  const [cursorX, setCursorX] = useState<number | null>(null);
  const [hoveredExtinctionId, setHoveredExtinctionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pointer & pinch tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startCenterLog: number;
    moved: boolean;
  }>({ active: false, startX: 0, startCenterLog: 0, moved: false });
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialZoomSpan: number;
    anchorLog: number;
  } | null>(null);

  const telemetryCallbackRef = useRef(onCameraTelemetry);
  telemetryCallbackRef.current = onCameraTelemetry;

  // Sync external camera jumps (Era dock, search selection, slider)
  useEffect(() => {
    targetCamRef.current = {
      centerLog: clampCenterLog(cameraTarget.centerLog),
      zoomSpanLog: clampZoomSpanLog(cameraTarget.zoomSpanLog),
    };
  }, [cameraTarget]);

  // Observe container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 60fps requestAnimationFrame spring loop
  useEffect(() => {
    let rafId = 0;
    let lastTelemetryTime = 0;

    const tick = (now: number) => {
      const cur = currentCamRef.current;
      const tgt = targetCamRef.current;

      const dCenter = tgt.centerLog - cur.centerLog;
      const dZoom = tgt.zoomSpanLog - cur.zoomSpanLog;

      if (Math.abs(dCenter) > 0.00015 || Math.abs(dZoom) > 0.00015) {
        const damping = 0.22;
        const nextCenter = cur.centerLog + dCenter * damping;
        const nextZoom = cur.zoomSpanLog + dZoom * damping;
        currentCamRef.current = { centerLog: nextCenter, zoomSpanLog: nextZoom };
        setRenderCam({ centerLog: nextCenter, zoomSpanLog: nextZoom });

        if (now - lastTelemetryTime > 80) {
          lastTelemetryTime = now;
          telemetryCallbackRef.current(nextCenter, nextZoom);
        }
      } else if (cur.centerLog !== tgt.centerLog || cur.zoomSpanLog !== tgt.zoomSpanLog) {
        currentCamRef.current = { ...tgt };
        setRenderCam({ ...tgt });
        telemetryCallbackRef.current(tgt.centerLog, tgt.zoomSpanLog);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  // Non-passive wheel listener for cursor-anchored logarithmic zooming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const targetEl = e.target as HTMLElement | null;
      const scrollablePresent = targetEl?.closest('[data-present-scroll]') as HTMLElement | null;
      if (scrollablePresent && scrollablePresent.scrollHeight > scrollablePresent.clientHeight + 4) {
        // Allow native scroll inside overflowing PresentZone list unless Ctrl/Meta pinch-zooming
        if (!e.ctrlKey && !e.metaKey) return;
      }

      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;

      const curTarget = targetCamRef.current;
      const isHorizontalPan = Math.abs(e.deltaX) > Math.abs(e.deltaY) && !e.ctrlKey;

      if (isHorizontalPan) {
        const deltaLog = (e.deltaX / Math.max(1, rect.width)) * curTarget.zoomSpanLog;
        targetCamRef.current = {
          ...curTarget,
          centerLog: clampCenterLog(curTarget.centerLog + deltaLog),
        };
        return;
      }

      const anchorLog = screenXToLog(
        pointerX,
        curTarget.centerLog,
        curTarget.zoomSpanLog,
        rect.width
      );

      const zoomFactor = Math.exp(e.deltaY * 0.0014);
      const nextZoomSpan = clampZoomSpanLog(curTarget.zoomSpanLog * zoomFactor);
      const relX = pointerX / Math.max(1, rect.width) - 0.5;
      const nextCenter = clampCenterLog(anchorLog + relX * nextZoomSpan);

      targetCamRef.current = {
        centerLog: nextCenter,
        zoomSpanLog: nextZoomSpan,
      };
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not start drag if clicking on an interactive button/input/link
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) {
      return;
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const rect = e.currentTarget.getBoundingClientRect();
      pinchStateRef.current = {
        initialDistance: Math.max(10, dist),
        initialZoomSpan: targetCamRef.current.zoomSpanLog,
        anchorLog: screenXToLog(
          midX - rect.left,
          targetCamRef.current.centerLog,
          targetCamRef.current.zoomSpanLog,
          rect.width
        ),
      };
      dragStateRef.current.active = false;
      setIsDragging(false);
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startCenterLog: targetCamRef.current.centerLog,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorX(e.clientX - rect.left);

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size === 2 && pinchStateRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const scale = pinchStateRef.current.initialDistance / Math.max(10, dist);
      const nextZoomSpan = clampZoomSpanLog(pinchStateRef.current.initialZoomSpan * scale);
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const relX = midX / Math.max(1, rect.width) - 0.5;
      targetCamRef.current = {
        centerLog: clampCenterLog(pinchStateRef.current.anchorLog + relX * nextZoomSpan),
        zoomSpanLog: nextZoomSpan,
      };
      return;
    }

    if (!dragStateRef.current.active) return;

    const dx = e.clientX - dragStateRef.current.startX;
    if (Math.abs(dx) > 4) {
      dragStateRef.current.moved = true;
    }

    // Dragging right moves camera toward deep time (higher logVal) because left is deep time
    const deltaLog = (dx / Math.max(1, rect.width)) * targetCamRef.current.zoomSpanLog;
    targetCamRef.current = {
      ...targetCamRef.current,
      centerLog: clampCenterLog(dragStateRef.current.startCenterLog + deltaLog),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      dragStateRef.current.active = false;
      setIsDragging(false);
    }
  };

  const semanticZoom = getSemanticZoomLevel(renderCam.zoomSpanLog);
  const axisY = Math.round(viewport.height * 0.52);

  // Virtualized geological era bands
  const visibleEras = useMemo(() => {
    return GEOLOGICAL_ERAS.map((era) => {
      const startLog = yearsAgoToLog(era.startYearsAgo);
      const endLog = yearsAgoToLog(era.endYearsAgo);
      const leftX = logToScreenX(startLog, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width);
      const rightX = logToScreenX(endLog, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width);
      return { era, leftX, rightX, width: Math.max(0, rightX - leftX) };
    }).filter((item) => item.rightX >= -100 && item.leftX <= viewport.width + 100);
  }, [renderCam.centerLog, renderCam.zoomSpanLog, viewport.width]);

  // Dynamic non-overlapping ruler ticks
  const visibleTicks = useMemo(() => {
    const minSpacing = 74;
    const raw = ALL_TIMELINE_TICKS.map((t) => ({
      ...t,
      screenX: logToScreenX(t.logVal, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width),
    })).filter((t) => t.screenX >= -40 && t.screenX <= viewport.width + 40);

    // Prioritize major ticks first, then fill intermediate gaps
    const accepted: typeof raw = [];
    const sorted = [...raw].sort((a, b) => Number(b.major) - Number(a.major));
    for (const tick of sorted) {
      const collides = accepted.some((other) => Math.abs(other.screenX - tick.screenX) < minSpacing);
      if (!collides) {
        accepted.push(tick);
      }
    }
    return accepted;
  }, [renderCam.centerLog, renderCam.zoomSpanLog, viewport.width]);

  // Virtualized Mass Extinction Beacons
  const visibleMassExtinctions = useMemo(() => {
    return MASS_EXTINCTION_EVENTS.map((ev) => {
      const logVal = yearsAgoToLog(ev.yearsAgo);
      const screenX = logToScreenX(logVal, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width);
      return { ev, logVal, screenX };
    }).filter((item) => item.screenX >= -120 && item.screenX <= viewport.width + 120);
  }, [renderCam.centerLog, renderCam.zoomSpanLog, viewport.width]);

  // Virtualized + collision-resolved species nodes (excluding Present species rendered in PresentZone)
  const visibleSpeciesNodes = useMemo(() => {
    return layoutVisibleTimelineNodes(
      species,
      renderCam.centerLog,
      renderCam.zoomSpanLog,
      viewport.width
    );
  }, [species, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width]);

  const endangeredSpecies = useMemo(() => {
    const filteredSet = new Set(species.map((s) => s.id));
    return allSpecies.filter((s) => s.status === 'endangered' && filteredSet.has(s.id));
  }, [species, allSpecies]);

  const recoveredSpecies = useMemo(() => {
    const filteredSet = new Set(species.map((s) => s.id));
    return allSpecies.filter((s) => s.status === 'recovered' && filteredSet.has(s.id));
  }, [species, allSpecies]);

  const presentX = logToScreenX(0, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width);
  const cursorDateLabel =
    cursorX !== null
      ? formatLogCursorDate(
          screenXToLog(cursorX, renderCam.centerLog, renderCam.zoomSpanLog, viewport.width)
        )
      : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        setCursorX(null);
      }}
      data-testid="timeline-viewport"
      className={`relative w-full h-full overflow-hidden select-none touch-none bg-[#040711] ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Subtle deep-time radial nebula backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(14,165,233,0.12),transparent_55%),radial-gradient(ellipse_at_80%_75%,rgba(16,185,129,0.10),transparent_50%)]"
      />

      {/* Geological Era Background Bands */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {visibleEras.map(({ era, leftX, width }) => (
          <div
            key={era.id}
            style={{
              transform: `translate3d(${leftX}px, 0, 0)`,
              width: `${Math.max(1, width)}px`,
              background: `linear-gradient(180deg, ${era.color} 0%, rgba(4,7,17,0.02) 55%, ${era.color} 100%)`,
            }}
            className="absolute top-0 bottom-0 left-0 border-l border-white/10"
          >
            {width > 64 && (
              <div className="sticky top-20 px-2.5 pt-20">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-full bg-slate-950/65 border border-white/10 backdrop-blur-sm"
                  style={{ color: era.accentHex }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: era.accentHex }}
                  />
                  {width > 150 ? era.name : era.shortName}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Central Logarithmic Axis Line */}
      <div
        aria-hidden="true"
        style={{ top: `${axisY}px` }}
        className="pointer-events-none absolute left-0 right-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-sky-400/50 via-indigo-300/60 to-emerald-400/80 shadow-[0_0_14px_rgba(56,189,248,0.35)]"
      />

      {/* Dynamic Logarithmic Ruler Ticks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {visibleTicks.map((tick) => (
          <div
            key={tick.id}
            style={{ transform: `translate3d(${tick.screenX}px, ${axisY}px, 0)` }}
            className="absolute top-0 left-0"
          >
            <div
              className={`w-px -translate-x-1/2 ${
                tick.major ? 'h-4 -mt-2 bg-slate-200/70' : 'h-2.5 -mt-[5px] bg-slate-400/45'
              }`}
            />
            <span
              className={`block -translate-x-1/2 mt-2 font-mono whitespace-nowrap ${
                tick.major ? 'text-[11px] font-semibold text-slate-200/90' : 'text-[10px] text-slate-400/80'
              }`}
            >
              {tick.label}
            </span>
          </div>
        ))}
      </div>

      {/* Big Five Mass Extinction Milestones */}
      <div className="pointer-events-none absolute inset-0 z-15">
        {visibleMassExtinctions.map(({ ev, logVal, screenX }) => {
          const isHovered = hoveredExtinctionId === ev.id;
          return (
            <div
              key={ev.id}
              style={{ transform: `translate3d(${screenX}px, 0, 0)` }}
              className="absolute top-0 bottom-0 left-0"
            >
              {/* Vertical crimson shockline */}
              <div
                className={`absolute top-20 bottom-20 w-px -translate-x-1/2 ${
                  ev.isBigFive
                    ? 'bg-gradient-to-b from-rose-500/0 via-rose-500/55 to-rose-500/0'
                    : 'bg-gradient-to-b from-amber-500/0 via-amber-400/40 to-amber-500/0'
                }`}
              />
              {/* Interactive Milestone Marker */}
              <button
                type="button"
                onMouseEnter={() => setHoveredExtinctionId(ev.id)}
                onMouseLeave={() => setHoveredExtinctionId(null)}
                onFocus={() => setHoveredExtinctionId(ev.id)}
                onBlur={() => setHoveredExtinctionId(null)}
                onClick={() => onJumpToCoordinates(logVal, 1.4)}
                aria-label={`${ev.name} (${ev.displayDate})`}
                style={{ top: `${axisY - 46}px` }}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold border backdrop-blur-md transition-all cursor-pointer ${
                  ev.isBigFive
                    ? 'bg-rose-950/85 border-rose-400/50 text-rose-200 hover:bg-rose-900 hover:border-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.28)]'
                    : 'bg-amber-950/85 border-amber-400/45 text-amber-200 hover:bg-amber-900'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                <span>{ev.displayDate}</span>
              </button>

              {isHovered && (
                <div
                  style={{ top: `${axisY - 96}px` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full w-64 rounded-xl bg-slate-950/95 border border-rose-400/40 p-3 shadow-2xl backdrop-blur-xl z-50"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold">
                      {ev.isBigFive ? 'Big Five Mass Extinction' : 'Megafauna Transition'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{ev.displayDate}</span>
                  </div>
                  <p className="text-xs font-semibold text-white mb-1">{ev.name}</p>
                  <p className="text-[11px] font-medium text-rose-200/90 mb-1">{ev.speciesLossPct}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{ev.primaryDriver}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Virtualized Species Nodes */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {visibleSpeciesNodes.map((node) => (
          <SpeciesCardNode
            key={node.species.id}
            species={node.species}
            screenX={node.screenX}
            lane={node.lane}
            renderMode={node.renderMode}
            semanticZoom={semanticZoom}
            isSelected={selectedSpeciesId === node.species.id}
            isHighlighted={highlightedSpeciesId === node.species.id}
            axisY={axisY}
            onSelect={onSelectSpecies}
          />
        ))}
      </div>

      {/* The Present Split-Track Zone */}
      <PresentZone
        presentX={presentX}
        viewportWidth={viewport.width}
        endangeredSpecies={endangeredSpecies}
        recoveredSpecies={recoveredSpecies}
        selectedSpeciesId={selectedSpeciesId}
        statusFilter={statusFilter}
        onSelectSpecies={onSelectSpecies}
        onFocusPresent={onFocusPresent}
      />

      {/* Real-Time Logarithmic Crosshair Cursor */}
      {cursorX !== null && !isDragging && (
        <div
          aria-hidden="true"
          style={{ transform: `translate3d(${cursorX}px, 0, 0)` }}
          className="pointer-events-none absolute top-0 bottom-0 left-0 z-10"
        >
          <div className="w-px h-full bg-white/10" />
          {cursorDateLabel && (
            <div
              style={{ top: `${axisY + 28}px` }}
              className="absolute -translate-x-1/2 rounded-md bg-slate-950/90 border border-white/15 px-2 py-0.5 text-[10px] font-mono text-sky-200 whitespace-nowrap shadow-lg"
            >
              {cursorDateLabel}
            </div>
          )}
        </div>
      )}

      {/* Subtle Onboarding Hint when in Macro Overview */}
      {semanticZoom === 'macro' && (
        <div className="pointer-events-none absolute left-4 bottom-24 z-20 hidden sm:flex items-center gap-2 rounded-full bg-slate-950/70 border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Scroll or pinch to zoom across 450M years · Drag to pan · Click any species</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>
      )}
    </div>
  );
}
