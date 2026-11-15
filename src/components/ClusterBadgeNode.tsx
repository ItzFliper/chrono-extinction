'use client';

import React, { useCallback } from 'react';
import { Layers, ZoomIn } from 'lucide-react';
import type { TimelineCluster } from '@/lib/timelineMath';
import { TIMELINE_LANE_OFFSETS } from '@/components/SpeciesCardNode';

interface ClusterBadgeNodeProps {
  cluster: TimelineCluster;
  axisY: number;
  onZoomCluster: (cluster: TimelineCluster) => void;
  onMountNode?: (id: string, el: HTMLDivElement | null, logVal: number) => void;
}

export const ClusterBadgeNode = React.memo(function ClusterBadgeNode({
  cluster,
  axisY,
  onZoomCluster,
  onMountNode,
}: ClusterBadgeNodeProps) {
  const setWrapperRef = useCallback(
    (el: HTMLDivElement | null) => {
      onMountNode?.(cluster.id, el, cluster.logVal);
    },
    [onMountNode, cluster.id, cluster.logVal]
  );

  const offsetY = TIMELINE_LANE_OFFSETS[cluster.lane % TIMELINE_LANE_OFFSETS.length];
  const isAbove = offsetY < 0;
  const stemHeight = Math.max(24, Math.abs(offsetY) - 28);
  const px = Math.round(cluster.screenX);
  const py = Math.round(axisY);

  return (
    <div
      ref={setWrapperRef}
      data-timeline-node="cluster-badge"
      className="absolute top-0 left-0 pointer-events-none z-25 will-change-transform"
      style={{
        transform: `translate3d(${px}px, ${py}px, 0px)`,
      }}
    >
      {/* Axis cluster dot */}
      <span className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-indigo-400 border-2 border-slate-950" />
      {/* Connector stem */}
      <span
        className="absolute left-0 -translate-x-1/2 w-px bg-indigo-400/50"
        style={{
          top: isAbove ? `${-stemHeight}px` : '0px',
          height: `${stemHeight}px`,
        }}
      />
      {/* Solid-surface interactive cluster badge */}
      <button
        type="button"
        onClick={() => onZoomCluster(cluster)}
        style={{
          top: `${offsetY}px`,
        }}
        title={`Zoom into ${cluster.count} ${cluster.eraName} species`}
        className="pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 w-[184px] rounded-xl bg-zinc-900/95 hover:bg-zinc-800 border border-indigo-400/45 hover:border-sky-300 px-2.5 py-2 text-left transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-200 group-hover:text-white truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">{cluster.label}</span>
          </span>
          <ZoomIn className="w-3 h-3 text-slate-400 group-hover:text-sky-300 shrink-0" />
        </div>
        {cluster.sampleNames.length > 0 && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {cluster.sampleNames.join(' · ')}
          </p>
        )}
      </button>
    </div>
  );
});
