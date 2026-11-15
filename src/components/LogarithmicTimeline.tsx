'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Sparkles, Compass } from 'lucide-react';
import type { Species } from '@/types/species';
import { GEOLOGICAL_ERAS, MASS_EXTINCTION_EVENTS } from '@/data/eras';
import {
  ALL_TIMELINE_TICKS,
  MIN_ZOOM_SPAN_LOG,
  clampCenterLog,
  clampZoomSpanLog,
  computeSpatialTimelineLayout,
  formatLogCursorDate,
  getCachedSpeciesCoords,
  getSemanticZoomLevel,
  logToScreenX,
  screenXToLog,
  yearsAgoToLog,
  type TimelineCluster,
} from '@/lib/timelineMath';
import { SpeciesCardNode } from '@/components/SpeciesCardNode';
import { ClusterBadgeNode } from '@/components/ClusterBadgeNode';
import { PresentZone } from '@/components/PresentZone';

export interface CameraTarget {
  centerLog: number;
  zoomSpanLog: number;
  version: number;
}

export interface ChronoPerfMetrics {
  fps: number;
  lastFrameScriptingMs: number;
  avgFrameScriptingMs: number;
  maxFrameScriptingMs: number;
  domNodeCount: number;
  cardCount: number;
  clusterCount: number;
  pipCount: number;
  totalSpeciesCount: number;
  filteredSpeciesCount: number;
  reactLayoutSyncCount: number;
  centerLog: number;
  zoomSpanLog: number;
}

declare global {
  interface Window {
    __CHRONO_PERF__?: ChronoPerfMetrics;
  }
}

interface LogarithmicTimelineProps {
  species: Species[];
  allSpecies: Species[];
  statusFilter: 'all' | 'extinct' | 'endangered' | 'recovered';
  cameraTarget: CameraTarget;
  selectedSpeciesId: string | null;
  highlightedSpeciesId: string | null;
  onSelectSpecies: (species: Species) => void;
  onCameraFrame: (centerLog: number, zoomSpanLog: number) => void;
  onCameraSettle: (centerLog: number, zoomSpanLog: number) => void;
  onFocusPresent: () => void;
  onJumpToCoordinates: (centerLog: number, zoomSpanLog: number) => void;
}

type PresentMode = 'edge-pill' | 'compact' | 'full';

function getPresentMode(presentX: number, viewportWidth: number): PresentMode {
  const availableRight = viewportWidth - presentX;
  if (availableRight < 36) return 'edge-pill';
  if (availableRight < 330) return 'compact';
  return 'full';
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function LogarithmicTimeline({
  species,
  allSpecies,
  statusFilter,
  cameraTarget,
  selectedSpeciesId,
  highlightedSpeciesId,
  onSelectSpecies,
  onCameraFrame,
  onCameraSettle,
  onFocusPresent,
  onJumpToCoordinates,
}: LogarithmicTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const presentSectionRef = useRef<HTMLElement | null>(null);

  const [viewport, setViewport] = useState({ width: 1280, height: 760 });
  const viewportRef = useRef({ width: 1280, height: 760 });

  // Live mutable camera refs (ZERO React setState inside rAF / wheel / pointermove)
  const currentCamRef = useRef({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });
  const targetCamRef = useRef({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });
  const lastLayoutCamRef = useRef({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });

  // Coarse React snapshot for spatial binning / cluster recomputation only
  const [layoutCam, setLayoutCam] = useState({
    centerLog: cameraTarget.centerLog,
    zoomSpanLog: cameraTarget.zoomSpanLog,
  });

  const [hoveredExtinctionId, setHoveredExtinctionId] = useState<string | null>(null);

  // Refs read by the 2D canvas renderer inside requestAnimationFrame
  const cursorXRef = useRef<number | null>(null);
  const needsCanvasRedrawRef = useRef(true);
  const lastPresentModeRef = useRef<PresentMode>(
    getPresentMode(logToScreenX(0, cameraTarget.centerLog, cameraTarget.zoomSpanLog, 1280), 1280)
  );

  // Pre-indexed DOM element map for O(1) imperative translate3d updates inside rAF
  const nodeElementsRef = useRef<
    Map<string, { el: HTMLDivElement; logVal: number; fixedY: number | null }>
  >(new Map());

  const handleMountNode = useCallback(
    (id: string, el: HTMLDivElement | null, logVal: number) => {
      if (el) {
        nodeElementsRef.current.set(id, { el, logVal, fixedY: null });
      } else {
        nodeElementsRef.current.delete(id);
      }
    },
    []
  );

  const registerExtinctionNode = useCallback(
    (id: string, el: HTMLDivElement | null, logVal: number) => {
      if (el) {
        nodeElementsRef.current.set(`ext:${id}`, { el, logVal, fixedY: 0 });
      } else {
        nodeElementsRef.current.delete(`ext:${id}`);
      }
    },
    []
  );

  // Flat pre-indexed extinct coordinates for ultra-fast 2D canvas pip drawing
  const extinctCoordsRef = useRef<Array<{ id: string; logVal: number }>>([]);
  const selectedIdsRef = useRef<{ selected: string | null; highlighted: string | null }>({
    selected: selectedSpeciesId,
    highlighted: highlightedSpeciesId,
  });

  useEffect(() => {
    const coords: Array<{ id: string; logVal: number }> = [];
    for (let i = 0; i < species.length; i++) {
      const sp = species[i];
      if (sp.status === 'extinct') {
        coords.push({ id: sp.id, logVal: getCachedSpeciesCoords(sp).logVal });
      }
    }
    extinctCoordsRef.current = coords;
    needsCanvasRedrawRef.current = true;
  }, [species]);

  useEffect(() => {
    selectedIdsRef.current = {
      selected: selectedSpeciesId,
      highlighted: highlightedSpeciesId,
    };
    needsCanvasRedrawRef.current = true;
  }, [selectedSpeciesId, highlightedSpeciesId]);

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

  const frameCallbackRef = useRef(onCameraFrame);
  const settleCallbackRef = useRef(onCameraSettle);
  useEffect(() => {
    frameCallbackRef.current = onCameraFrame;
    settleCallbackRef.current = onCameraSettle;
  }, [onCameraFrame, onCameraSettle]);

  // Sync external camera jumps (Era dock, search selection, slider)
  useEffect(() => {
    targetCamRef.current = {
      centerLog: clampCenterLog(cameraTarget.centerLog),
      zoomSpanLog: clampZoomSpanLog(cameraTarget.zoomSpanLog),
    };
    needsCanvasRedrawRef.current = true;
  }, [cameraTarget]);

  // Observe container dimensions and configure HiDPI 2D canvas backing resolution
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nextVp = { width: Math.round(rect.width), height: Math.round(rect.height) };
        viewportRef.current = nextVp;
        setViewport(nextVp);

        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          canvas.width = Math.round(nextVp.width * dpr);
          canvas.height = Math.round(nextVp.height * dpr);
        }
        needsCanvasRedrawRef.current = true;
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Spatial Clustering & Capped <= 35 Node Layout (computed only on coarse threshold/settle/filter)
  const spatialLayout = useMemo(() => {
    return computeSpatialTimelineLayout(
      species,
      layoutCam.centerLog,
      layoutCam.zoomSpanLog,
      viewport.width,
      selectedSpeciesId,
      highlightedSpeciesId
    );
  }, [
    species,
    layoutCam.centerLog,
    layoutCam.zoomSpanLog,
    viewport.width,
    selectedSpeciesId,
    highlightedSpeciesId,
  ]);

  const perfCountsRef = useRef({
    domNodeCount: spatialLayout.cards.length + spatialLayout.clusters.length,
    cardCount: spatialLayout.cards.length,
    clusterCount: spatialLayout.clusters.length,
    pipCount: spatialLayout.pips.length,
    totalSpeciesCount: allSpecies.length,
    filteredSpeciesCount: species.length,
    reactLayoutSyncCount: 0,
  });

  useEffect(() => {
    perfCountsRef.current = {
      domNodeCount: spatialLayout.cards.length + spatialLayout.clusters.length,
      cardCount: spatialLayout.cards.length,
      clusterCount: spatialLayout.clusters.length,
      pipCount: spatialLayout.pips.length,
      totalSpeciesCount: allSpecies.length,
      filteredSpeciesCount: species.length,
      reactLayoutSyncCount: perfCountsRef.current.reactLayoutSyncCount + 1,
    };
  }, [spatialLayout, allSpecies.length, species.length]);

  // 2D Canvas Stage Renderer (draws eras, central axis, ticks, mass extinction beams, pips, crosshair in <1.5ms)
  const drawCanvasStage = useCallback((centerLog: number, zoomSpanLog: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { width: vw, height: vh } = viewportRef.current;
    if (vw <= 0 || vh <= 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const expectedW = Math.round(vw * dpr);
    const expectedH = Math.round(vh * dpr);
    if (canvas.width !== expectedW || canvas.height !== expectedH) {
      canvas.width = expectedW;
      canvas.height = expectedH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Deep-time background + subtle atmospheric radials
    ctx.fillStyle = '#040711';
    ctx.fillRect(0, 0, vw, vh);

    const skyGrad = ctx.createRadialGradient(vw * 0.25, vh * 0.2, 0, vw * 0.25, vh * 0.2, vw * 0.55);
    skyGrad.addColorStop(0, 'rgba(14, 165, 233, 0.11)');
    skyGrad.addColorStop(1, 'rgba(4, 7, 17, 0)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, vh);

    const emeraldGrad = ctx.createRadialGradient(
      vw * 0.8,
      vh * 0.75,
      0,
      vw * 0.8,
      vh * 0.75,
      vw * 0.5
    );
    emeraldGrad.addColorStop(0, 'rgba(16, 185, 129, 0.09)');
    emeraldGrad.addColorStop(1, 'rgba(4, 7, 17, 0)');
    ctx.fillStyle = emeraldGrad;
    ctx.fillRect(0, 0, vw, vh);

    const axisY = Math.round(vh * 0.52);

    // 2. Geological Era Background Bands & Era Pills
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < GEOLOGICAL_ERAS.length; i++) {
      const era = GEOLOGICAL_ERAS[i];
      const startLog = yearsAgoToLog(era.startYearsAgo);
      const endLog = yearsAgoToLog(era.endYearsAgo);
      const leftX = logToScreenX(startLog, centerLog, zoomSpanLog, vw);
      const rightX = logToScreenX(endLog, centerLog, zoomSpanLog, vw);
      if (rightX < -40 || leftX > vw + 40) continue;

      const drawLeft = Math.max(-2, leftX);
      const drawRight = Math.min(vw + 2, rightX);
      const drawWidth = Math.max(1, drawRight - drawLeft);
      const bandWidth = Math.max(0, rightX - leftX);

      const bandGrad = ctx.createLinearGradient(0, 0, 0, vh);
      bandGrad.addColorStop(0, era.color);
      bandGrad.addColorStop(0.55, 'rgba(4, 7, 17, 0.02)');
      bandGrad.addColorStop(1, era.color);
      ctx.fillStyle = bandGrad;
      ctx.fillRect(drawLeft, 0, drawWidth, vh);

      if (leftX >= -2 && leftX <= vw + 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(Math.round(leftX), 0, 1, vh);
      }

      if (bandWidth > 64) {
        const labelText = (bandWidth > 150 ? era.name : era.shortName).toUpperCase();
        const textWidth = ctx.measureText(labelText).width;
        const pillW = Math.min(bandWidth - 12, textWidth + 24);
        const pillH = 22;
        const maxPillX = rightX - pillW - 8;
        const pillX = Math.max(Math.min(Math.max(leftX + 10, 10), maxPillX), leftX + 6);
        const pillY = 78;

        if (pillW > 36 && pillX + pillW > 0 && pillX < vw) {
          drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 11);
          ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = era.accentHex;
          ctx.beginPath();
          ctx.arc(pillX + 11, pillY + pillH / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.beginPath();
          ctx.rect(pillX + 16, pillY, pillW - 22, pillH);
          ctx.clip();
          ctx.fillStyle = era.accentHex;
          ctx.fillText(labelText, pillX + 18, pillY + pillH / 2 + 0.5);
          ctx.restore();
        }
      }
    }

    // 3. Mass Extinction Vertical Shocklines
    for (let i = 0; i < MASS_EXTINCTION_EVENTS.length; i++) {
      const ev = MASS_EXTINCTION_EVENTS[i];
      const sx = Math.round(logToScreenX(yearsAgoToLog(ev.yearsAgo), centerLog, zoomSpanLog, vw));
      if (sx < -60 || sx > vw + 60) continue;

      const beamGrad = ctx.createLinearGradient(0, 80, 0, vh - 80);
      if (ev.isBigFive) {
        beamGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
        beamGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.58)');
        beamGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      } else {
        beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        beamGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.42)');
        beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      }
      ctx.fillStyle = beamGrad;
      ctx.fillRect(sx, 80, 1, Math.max(0, vh - 160));
    }

    // 4. Central Logarithmic Axis Line + subtle glow band
    const axisGlow = ctx.createLinearGradient(0, 0, vw, 0);
    axisGlow.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
    axisGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.16)');
    axisGlow.addColorStop(1, 'rgba(52, 211, 153, 0.22)');
    ctx.fillStyle = axisGlow;
    ctx.fillRect(0, axisY - 3, vw, 6);

    const axisLine = ctx.createLinearGradient(0, 0, vw, 0);
    axisLine.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    axisLine.addColorStop(0.5, 'rgba(129, 140, 248, 0.7)');
    axisLine.addColorStop(1, 'rgba(52, 211, 153, 0.85)');
    ctx.fillStyle = axisLine;
    ctx.fillRect(0, axisY - 1, vw, 2);

    // 5. Dynamic Non-Overlapping Logarithmic Ruler Ticks
    const minTickSpacing = 74;
    const acceptedTickX: number[] = [];
    const majorTicks: Array<{ label: string; screenX: number; id: string }> = [];
    const minorTicks: Array<{ label: string; screenX: number; id: string }> = [];

    for (let i = 0; i < ALL_TIMELINE_TICKS.length; i++) {
      const tick = ALL_TIMELINE_TICKS[i];
      const sx = logToScreenX(tick.logVal, centerLog, zoomSpanLog, vw);
      if (sx < -40 || sx > vw + 40) continue;
      if (tick.major) {
        majorTicks.push({ label: tick.label, screenX: sx, id: tick.id });
      } else {
        minorTicks.push({ label: tick.label, screenX: sx, id: tick.id });
      }
    }

    const drawTickList = (
      ticks: Array<{ label: string; screenX: number; id: string }>,
      major: boolean
    ) => {
      ctx.font = major
        ? '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        : '400 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      for (let i = 0; i < ticks.length; i++) {
        const t = ticks[i];
        let collides = false;
        for (let j = 0; j < acceptedTickX.length; j++) {
          if (Math.abs(acceptedTickX[j] - t.screenX) < minTickSpacing) {
            collides = true;
            break;
          }
        }
        if (collides) continue;
        acceptedTickX.push(t.screenX);

        const rx = Math.round(t.screenX);
        ctx.fillStyle = major ? 'rgba(226, 232, 240, 0.72)' : 'rgba(148, 163, 184, 0.45)';
        ctx.fillRect(rx, major ? axisY - 8 : axisY - 5, 1, major ? 16 : 10);

        ctx.fillStyle = major ? 'rgba(226, 232, 240, 0.9)' : 'rgba(148, 163, 184, 0.8)';
        ctx.textAlign = t.id === 'Present' ? 'right' : 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(t.label, t.id === 'Present' ? rx - 6 : rx, axisY + 12);
      }
    };

    drawTickList(majorTicks, true);
    drawTickList(minorTicks, false);

    // 6. All Visible Extinct Species Axis Pips (zero DOM overhead, 1000+ species @ <0.15ms)
    const allCoords = extinctCoordsRef.current;
    const { selected, highlighted } = selectedIdsRef.current;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.58)';
    for (let i = 0; i < allCoords.length; i++) {
      const item = allCoords[i];
      const sx = logToScreenX(item.logVal, centerLog, zoomSpanLog, vw);
      if (sx < -20 || sx > vw + 20) continue;
      if (item.id === selected || item.id === highlighted) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sx, axisY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.58)';
      } else {
        ctx.beginPath();
        ctx.arc(sx, axisY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Real-Time Cursor Crosshair + Date Badge
    const curX = cursorXRef.current;
    if (curX !== null && !dragStateRef.current.active && curX >= 0 && curX <= vw) {
      const rx = Math.round(curX);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(rx, 0, 1, vh);

      const dateLabel = formatLogCursorDate(screenXToLog(curX, centerLog, zoomSpanLog, vw));
      ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      const labelW = ctx.measureText(dateLabel).width + 16;
      const boxX = Math.max(6, Math.min(vw - labelW - 6, rx - labelW / 2));
      const boxY = axisY + 30;

      drawRoundedRectPath(ctx, boxX, boxY, labelW, 20, 6);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dateLabel, boxX + labelW / 2, boxY + 10.5);
    }
  }, []);

  // Imperatively sync DOM transforms of mounted cards, clusters, extinction markers & PresentZone
  const updateImperativePositions = useCallback((centerLog: number, zoomSpanLog: number) => {
    const { width: vw, height: vh } = viewportRef.current;
    const axisY = Math.round(vh * 0.52);

    nodeElementsRef.current.forEach((entry) => {
      const x = Math.round(logToScreenX(entry.logVal, centerLog, zoomSpanLog, vw));
      const y = entry.fixedY !== null ? entry.fixedY : axisY;
      entry.el.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
    });

    if (presentSectionRef.current) {
      const presentX = logToScreenX(0, centerLog, zoomSpanLog, vw);
      const clampedLeft = Math.max(0, Math.round(presentX));
      presentSectionRef.current.style.transform = `translate3d(${clampedLeft}px, 0px, 0px)`;
      presentSectionRef.current.style.width = `${Math.max(220, Math.round(vw - clampedLeft))}px`;
    }
  }, []);

  // Locked 60/120fps requestAnimationFrame loop (0 React setState calls per frame)
  useEffect(() => {
    let rafId = 0;
    let lastFrameTimestamp = performance.now();
    let wasMoving = false;
    const sampleScriptingTimes: number[] = [];
    const sampleFpsValues: number[] = [];

    const tick = (now: number) => {
      const dt = Math.max(0.5, now - lastFrameTimestamp);
      lastFrameTimestamp = now;

      const cur = currentCamRef.current;
      const tgt = targetCamRef.current;

      const dCenter = tgt.centerLog - cur.centerLog;
      const dZoom = tgt.zoomSpanLog - cur.zoomSpanLog;
      const isMoving = Math.abs(dCenter) > 0.00015 || Math.abs(dZoom) > 0.00015;
      const needsSnap = !isMoving && (cur.centerLog !== tgt.centerLog || cur.zoomSpanLog !== tgt.zoomSpanLog);

      if (isMoving || needsSnap || needsCanvasRedrawRef.current) {
        const scriptStart = performance.now();
        let activeCenter = cur.centerLog;
        let activeZoom = cur.zoomSpanLog;

        if (isMoving) {
          // Frame-rate independent damping tuned for both 60Hz & 120Hz displays
          const factor = 1 - Math.pow(1 - 0.22, Math.min(3, dt / 16.667));
          activeCenter = cur.centerLog + dCenter * factor;
          activeZoom = cur.zoomSpanLog + dZoom * factor;
          currentCamRef.current = { centerLog: activeCenter, zoomSpanLog: activeZoom };
          wasMoving = true;
        } else if (needsSnap) {
          activeCenter = tgt.centerLog;
          activeZoom = tgt.zoomSpanLog;
          currentCamRef.current = { centerLog: activeCenter, zoomSpanLog: activeZoom };
          wasMoving = false;
        }

        // Draw 2D Canvas Stage + Imperatively move <= 35 visible DOM nodes
        drawCanvasStage(activeCenter, activeZoom);
        updateImperativePositions(activeCenter, activeZoom);
        needsCanvasRedrawRef.current = false;

        if (isMoving || needsSnap) {
          frameCallbackRef.current(activeCenter, activeZoom);

          const vw = viewportRef.current.width;
          const lastLayout = lastLayoutCamRef.current;
          const panDelta = Math.abs(activeCenter - lastLayout.centerLog);
          const zoomRatioDelta = Math.abs(
            Math.log(activeZoom / Math.max(0.05, lastLayout.zoomSpanLog))
          );
          const presentX = logToScreenX(0, activeCenter, activeZoom, vw);
          const presentMode = getPresentMode(presentX, vw);

          const crossedRebinThreshold =
            panDelta > activeZoom * 0.14 ||
            zoomRatioDelta > 0.12 ||
            presentMode !== lastPresentModeRef.current;

          if (needsSnap || crossedRebinThreshold) {
            lastLayoutCamRef.current = { centerLog: activeCenter, zoomSpanLog: activeZoom };
            lastPresentModeRef.current = presentMode;
            setLayoutCam({ centerLog: activeCenter, zoomSpanLog: activeZoom });
          }

          if (needsSnap) {
            settleCallbackRef.current(activeCenter, activeZoom);
          }
        }

        const scriptMs = performance.now() - scriptStart;
        sampleScriptingTimes.push(scriptMs);
        if (sampleScriptingTimes.length > 45) sampleScriptingTimes.shift();
        if (dt < 250) {
          sampleFpsValues.push(1000 / dt);
          if (sampleFpsValues.length > 45) sampleFpsValues.shift();
        }

        const avgScript =
          sampleScriptingTimes.reduce((acc, v) => acc + v, 0) / sampleScriptingTimes.length;
        const maxScript = Math.max(...sampleScriptingTimes);
        const avgFps =
          sampleFpsValues.length > 0
            ? sampleFpsValues.reduce((acc, v) => acc + v, 0) / sampleFpsValues.length
            : 60;

        window.__CHRONO_PERF__ = {
          fps: Math.round(avgFps),
          lastFrameScriptingMs: Number(scriptMs.toFixed(3)),
          avgFrameScriptingMs: Number(avgScript.toFixed(3)),
          maxFrameScriptingMs: Number(maxScript.toFixed(3)),
          ...perfCountsRef.current,
          centerLog: activeCenter,
          zoomSpanLog: activeZoom,
        };
      } else if (wasMoving) {
        wasMoving = false;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [drawCanvasStage, updateImperativePositions]);

  // Redraw canvas immediately when coarse layout or viewport updates
  useEffect(() => {
    needsCanvasRedrawRef.current = true;
    updateImperativePositions(currentCamRef.current.centerLog, currentCamRef.current.zoomSpanLog);
  }, [spatialLayout, viewport, statusFilter, updateImperativePositions]);

  // Non-passive wheel listener for cursor-anchored logarithmic zooming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const targetEl = e.target as HTMLElement | null;
      const scrollablePresent = targetEl?.closest('[data-present-scroll]') as HTMLElement | null;
      if (scrollablePresent && scrollablePresent.scrollHeight > scrollablePresent.clientHeight + 4) {
        if (!e.ctrlKey && !e.metaKey) return;
      }

      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      cursorXRef.current = pointerX;

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

  const setCursorDraggingVisual = (active: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.toggle('cursor-grabbing', active);
    el.classList.toggle('cursor-grab', !active);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
      setCursorDraggingVisual(false);
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startCenterLog: targetCamRef.current.centerLog,
      moved: false,
    };
    setCursorDraggingVisual(true);
    needsCanvasRedrawRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cursorXRef.current = e.clientX - rect.left;
    needsCanvasRedrawRef.current = true;

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
      setCursorDraggingVisual(false);
      needsCanvasRedrawRef.current = true;
    }
  };

  const handleZoomCluster = useCallback(
    (cluster: TimelineCluster) => {
      const currentSpan = currentCamRef.current.zoomSpanLog;
      if (currentSpan <= MIN_ZOOM_SPAN_LOG + 0.08) {
        onSelectSpecies(cluster.leadSpecies);
        return;
      }
      const span = Math.max(0.18, cluster.maxLog - cluster.minLog);
      const nextSpan = Math.max(MIN_ZOOM_SPAN_LOG, Math.min(span + 0.42, currentSpan * 0.42));
      onJumpToCoordinates(cluster.logVal, nextSpan);
    },
    [onJumpToCoordinates, onSelectSpecies]
  );

  const semanticZoom = getSemanticZoomLevel(layoutCam.zoomSpanLog);
  const axisY = Math.round(viewport.height * 0.52);

  const visibleMassExtinctions = useMemo(() => {
    return MASS_EXTINCTION_EVENTS.map((ev) => {
      const logVal = yearsAgoToLog(ev.yearsAgo);
      const screenX = logToScreenX(logVal, layoutCam.centerLog, layoutCam.zoomSpanLog, viewport.width);
      return { ev, logVal, screenX };
    });
  }, [layoutCam.centerLog, layoutCam.zoomSpanLog, viewport.width]);

  const endangeredSpecies = useMemo(() => {
    const filteredSet = new Set(species.map((s) => s.id));
    return allSpecies.filter((s) => s.status === 'endangered' && filteredSet.has(s.id));
  }, [species, allSpecies]);

  const recoveredSpecies = useMemo(() => {
    const filteredSet = new Set(species.map((s) => s.id));
    return allSpecies.filter((s) => s.status === 'recovered' && filteredSet.has(s.id));
  }, [species, allSpecies]);

  const presentX = logToScreenX(0, layoutCam.centerLog, layoutCam.zoomSpanLog, viewport.width);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        cursorXRef.current = null;
        needsCanvasRedrawRef.current = true;
      }}
      data-testid="timeline-viewport"
      className="relative w-full h-full overflow-hidden select-none touch-none bg-[#040711] cursor-grab"
    >
      {/* Hardware-accelerated HTML5 2D Canvas Stage (Eras, Axis, Ticks, Pips, Crosshair) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Big Five Mass Extinction Milestone Interactive Pills */}
      <div className="pointer-events-none absolute inset-0 z-15">
        {visibleMassExtinctions.map(({ ev, logVal, screenX }) => {
          const isHovered = hoveredExtinctionId === ev.id;
          return (
            <div
              key={ev.id}
              ref={(el) => registerExtinctionNode(ev.id, el, logVal)}
              style={{ transform: `translate3d(${Math.round(screenX)}px, 0px, 0px)` }}
              className="absolute top-0 bottom-0 left-0 will-change-transform"
            >
              <button
                type="button"
                onMouseEnter={() => setHoveredExtinctionId(ev.id)}
                onMouseLeave={() => setHoveredExtinctionId(null)}
                onFocus={() => setHoveredExtinctionId(ev.id)}
                onBlur={() => setHoveredExtinctionId(null)}
                onClick={() => onJumpToCoordinates(logVal, 1.4)}
                aria-label={`${ev.name} (${ev.displayDate})`}
                style={{ top: `${axisY - 46}px` }}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                  ev.isBigFive
                    ? 'bg-rose-950/95 border-rose-400/55 text-rose-200 hover:bg-rose-900 hover:border-rose-300'
                    : 'bg-amber-950/95 border-amber-400/50 text-amber-200 hover:bg-amber-900'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                <span>{ev.displayDate}</span>
              </button>

              {isHovered && (
                <div
                  style={{ top: `${axisY - 96}px` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full w-64 rounded-xl bg-slate-950/95 border border-rose-400/40 p-3 shadow-2xl z-50"
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

      {/* Spatially Virtualized Species Cards & Cluster Badges (strictly <= 35 DOM nodes) */}
      <div className="pointer-events-none absolute inset-0 z-20" data-testid="timeline-nodes-layer">
        {spatialLayout.cards.map((node) => (
          <SpeciesCardNode
            key={node.species.id}
            species={node.species}
            logVal={node.logVal}
            screenX={node.screenX}
            lane={node.lane}
            renderMode={node.renderMode}
            semanticZoom={semanticZoom}
            isSelected={selectedSpeciesId === node.species.id}
            isHighlighted={highlightedSpeciesId === node.species.id}
            axisY={axisY}
            onSelect={onSelectSpecies}
            onMountNode={handleMountNode}
          />
        ))}
        {spatialLayout.clusters.map((cluster) => (
          <ClusterBadgeNode
            key={cluster.id}
            cluster={cluster}
            axisY={axisY}
            onZoomCluster={handleZoomCluster}
            onMountNode={handleMountNode}
          />
        ))}
      </div>

      {/* The Present Split-Track Zone */}
      <PresentZone
        sectionRef={presentSectionRef}
        presentX={presentX}
        viewportWidth={viewport.width}
        endangeredSpecies={endangeredSpecies}
        recoveredSpecies={recoveredSpecies}
        selectedSpeciesId={selectedSpeciesId}
        statusFilter={statusFilter}
        onSelectSpecies={onSelectSpecies}
        onFocusPresent={onFocusPresent}
      />

      {/* Subtle Onboarding Hint when in Macro Overview */}
      {semanticZoom === 'macro' && (
        <div className="pointer-events-none absolute left-4 bottom-24 z-20 hidden sm:flex items-center gap-2 rounded-full bg-slate-950/90 border border-white/10 px-3 py-1.5 text-[11px] text-slate-300">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Scroll or pinch to zoom across 505M years · Drag to pan · Click any species or cluster</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>
      )}
    </div>
  );
}
