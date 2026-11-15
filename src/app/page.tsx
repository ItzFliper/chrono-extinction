'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import speciesDataset from '@/data/species.json';
import type { EraJumpTarget, Species } from '@/types/species';
import {
  DEFAULT_CENTER_LOG,
  DEFAULT_ZOOM_SPAN_LOG,
  getYearsAgo,
  yearsAgoToLog,
} from '@/lib/timelineMath';
import { ControlBar, type StatusFilter } from '@/components/ControlBar';
import {
  LogarithmicTimeline,
  type CameraTarget,
} from '@/components/LogarithmicTimeline';
import { EraDock, type EraDockHandle } from '@/components/EraDock';
import { SpeciesDrawer } from '@/components/SpeciesDrawer';

const ALL_SPECIES = speciesDataset as Species[];

export default function HomePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [highlightedSpeciesId, setHighlightedSpeciesId] = useState<string | null>(null);

  const [cameraTarget, setCameraTarget] = useState<CameraTarget>({
    centerLog: DEFAULT_CENTER_LOG,
    zoomSpanLog: DEFAULT_ZOOM_SPAN_LOG,
    version: 0,
  });

  // Settled camera state (only synced when camera comes to rest; zero per-frame React re-renders)
  const [settledCam, setSettledCam] = useState({
    centerLog: DEFAULT_CENTER_LOG,
    zoomSpanLog: DEFAULT_ZOOM_SPAN_LOG,
  });

  const liveCamRef = useRef({
    centerLog: DEFAULT_CENTER_LOG,
    zoomSpanLog: DEFAULT_ZOOM_SPAN_LOG,
  });
  const eraDockRef = useRef<EraDockHandle | null>(null);

  const filteredSpecies = useMemo(() => {
    if (statusFilter === 'all') return ALL_SPECIES;
    return ALL_SPECIES.filter((s) => s.status === statusFilter);
  }, [statusFilter]);

  const jumpToCamera = useCallback((centerLog: number, zoomSpanLog: number) => {
    setCameraTarget((prev) => ({
      centerLog,
      zoomSpanLog,
      version: prev.version + 1,
    }));
  }, []);

  const handleFocusPresent = useCallback(() => {
    jumpToCamera(-0.35, 1.6);
  }, [jumpToCamera]);

  const handleStatusFilterChange = useCallback(
    (nextFilter: StatusFilter) => {
      setStatusFilter(nextFilter);
      if (nextFilter === 'endangered' || nextFilter === 'recovered') {
        jumpToCamera(-0.35, 1.6);
      } else if (nextFilter === 'extinct' && liveCamRef.current.centerLog < 0.2) {
        jumpToCamera(4.6, 8.8);
      }
    },
    [jumpToCamera]
  );

  const handleFocusSpecies = useCallback(
    (sp: Species) => {
      setHighlightedSpeciesId(sp.id);
      if (sp.status === 'endangered' || sp.status === 'recovered') {
        jumpToCamera(-0.35, 1.6);
        return;
      }
      const yearsAgo = getYearsAgo(sp.extinctionYear, sp.status);
      const logVal = yearsAgoToLog(yearsAgo);
      const targetSpan = yearsAgo > 1_000_000 ? 0.65 : yearsAgo > 5_000 ? 0.9 : 0.75;
      jumpToCamera(logVal, targetSpan);
    },
    [jumpToCamera]
  );

  const handleSelectSearchSpecies = useCallback(
    (sp: Species) => {
      if (statusFilter !== 'all' && statusFilter !== sp.status) {
        setStatusFilter('all');
      }
      handleFocusSpecies(sp);
      setSelectedSpecies(sp);
    },
    [statusFilter, handleFocusSpecies]
  );

  const handleJumpToYearsAgo = useCallback(
    (yearsAgo: number) => {
      if (yearsAgo <= 1) {
        handleFocusPresent();
        return;
      }
      const logVal = yearsAgoToLog(yearsAgo);
      jumpToCamera(logVal, 0.95);
    },
    [handleFocusPresent, jumpToCamera]
  );

  const handleJumpToEra = useCallback(
    (target: EraJumpTarget) => {
      if (target.id !== 'present' && (statusFilter === 'endangered' || statusFilter === 'recovered')) {
        setStatusFilter('all');
      }
      jumpToCamera(target.targetCenterLog, target.targetZoomSpanLog);
    },
    [jumpToCamera, statusFilter]
  );

  const handleZoomChange = useCallback(
    (nextZoomSpanLog: number) => {
      jumpToCamera(liveCamRef.current.centerLog, nextZoomSpanLog);
    },
    [jumpToCamera]
  );

  const handleResetView = useCallback(() => {
    setStatusFilter('all');
    setHighlightedSpeciesId(null);
    jumpToCamera(DEFAULT_CENTER_LOG, DEFAULT_ZOOM_SPAN_LOG);
  }, [jumpToCamera]);

  const handleCameraFrame = useCallback((centerLog: number, zoomSpanLog: number) => {
    liveCamRef.current = { centerLog, zoomSpanLog };
    eraDockRef.current?.syncFrameTelemetry(centerLog, zoomSpanLog);
  }, []);

  const handleCameraSettle = useCallback((centerLog: number, zoomSpanLog: number) => {
    liveCamRef.current = { centerLog, zoomSpanLog };
    setSettledCam({ centerLog, zoomSpanLog });
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#040711]">
      <ControlBar
        allSpecies={ALL_SPECIES}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onSelectSearchSpecies={handleSelectSearchSpecies}
        onJumpToYearsAgo={handleJumpToYearsAgo}
        onResetView={handleResetView}
      />

      <LogarithmicTimeline
        species={filteredSpecies}
        allSpecies={ALL_SPECIES}
        statusFilter={statusFilter}
        cameraTarget={cameraTarget}
        selectedSpeciesId={selectedSpecies?.id ?? null}
        highlightedSpeciesId={highlightedSpeciesId}
        onSelectSpecies={setSelectedSpecies}
        onCameraFrame={handleCameraFrame}
        onCameraSettle={handleCameraSettle}
        onFocusPresent={handleFocusPresent}
        onJumpToCoordinates={jumpToCamera}
      />

      <EraDock
        ref={eraDockRef}
        centerLog={settledCam.centerLog}
        zoomSpanLog={settledCam.zoomSpanLog}
        onJumpToEra={handleJumpToEra}
        onZoomChange={handleZoomChange}
      />

      <SpeciesDrawer
        species={selectedSpecies}
        allSpecies={ALL_SPECIES}
        onClose={() => setSelectedSpecies(null)}
        onSelectSpecies={setSelectedSpecies}
        onFocusSpeciesOnTimeline={(sp) => {
          handleFocusSpecies(sp);
          setSelectedSpecies(null);
        }}
      />
    </main>
  );
}
