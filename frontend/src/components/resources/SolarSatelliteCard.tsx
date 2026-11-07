"use client";

import React, { ReactNode } from "react";
import { Satellite, Rocket, Clock } from "lucide-react";
import { BuildingInfo, ShipyardQueueEntry, useGameStore } from "@/store/useGameStore";
import { useCountdown, formatCountdownTurkish } from "@/hooks/useCountdown";

export interface SolarSatelliteCardProps {
  item: BuildingInfo;
  isSelected: boolean;
  isFocused: boolean;
  highlightClass: string;
  onClick: () => void;
  queue?: ShipyardQueueEntry[];
  serverTimeUtc?: string;
  icon?: ReactNode;
  gradient?: string;
}

export function SolarSatelliteCard({
  item,
  isSelected,
  isFocused,
  highlightClass,
  onClick,
  queue,
  serverTimeUtc,
  icon,
  gradient = "from-sky-900/70 via-slate-900 to-[#070a0f]",
}: SolarSatelliteCardProps) {
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  // Solar Satellite unitType is 212
  const satBatch = queue?.find((b) => b.unitType === 212);
  const isProducing = Boolean(satBatch && satBatch.totalCount > satBatch.completedCount);

  const countdown = useCountdown(satBatch?.nextUnitFinishUtc, undefined, {
    referenceUtc: serverTimeUtc,
    onComplete: () => {
      fetchBootstrap();
    },
  });

  const remainingUnits = satBatch
    ? Math.max(0, satBatch.totalCount - satBatch.completedCount)
    : 0;

  // Calculate total remaining seconds for this batch
  const totalBatchRemainingSeconds = satBatch
    ? Math.max(0, (remainingUnits - 1) * satBatch.unitDurationSeconds + countdown.remainingSeconds)
    : 0;

  const displayTime =
    totalBatchRemainingSeconds > 0
      ? formatCountdownTurkish(totalBatchRemainingSeconds)
      : countdown.formattedTr || countdown.formattedClock;

  // Calculate progress percentage
  const batchProgressPct = satBatch
    ? Math.min(
        100,
        Math.max(
          5,
          Math.round((satBatch.completedCount / Math.max(1, satBatch.totalCount)) * 100)
        )
      )
    : 0;

  return (
    <button
      id="card-solar-satellite"
      data-key="solarSatellite"
      type="button"
      onClick={onClick}
      className={`group relative h-28 rounded-lg border overflow-hidden flex flex-col justify-between p-2.5 text-left transition-all ${
        isFocused
          ? highlightClass
          : isSelected
          ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
          : "border-zinc-800 hover:border-cyan-500/50"
      } bg-gradient-to-br ${gradient}`}
    >
      {/* Top Item Name */}
      <div className="relative z-10 text-[11px] font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
        {item.name}
      </div>

      {/* Center Visual Icon */}
      <div className="relative z-10 flex items-center justify-center my-auto opacity-85 group-hover:scale-110 transition-transform">
        {icon ?? <Satellite className="h-8 w-8 text-sky-300" />}
      </div>

      {/* Bottom-Right Count Badge */}
      <div className="relative z-10 flex items-center justify-end">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
            isProducing
              ? "bg-sky-950/90 border-sky-400/70 text-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
              : isSelected
              ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
              : "bg-black/80 border-zinc-700/80 text-cyan-300"
          }`}
        >
          {item.level}
          {isProducing && (
            <span className="text-[10px] text-sky-400 ml-1 font-semibold">
              (+{remainingUnits})
            </span>
          )}
        </span>
      </div>

      {/* Live Production Queue Mirror Overlay (Task 05AO) */}
      {isProducing && (
        <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 text-center border border-sky-400/80 shadow-[inset_0_0_15px_rgba(56,189,248,0.2)]">
          <div className="flex items-center gap-1 text-[9px] font-mono uppercase font-bold text-sky-300">
            <Rocket className="h-3 w-3 text-sky-400 animate-pulse" />
            <span>{remainingUnits} Adet Üretiliyor</span>
          </div>

          <div
            suppressHydrationWarning
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-sky-200 tabular-nums my-0.5"
          >
            <Clock className="h-3 w-3 text-sky-400" />
            <span>{displayTime}</span>
          </div>

          {/* Mini Production Progress Bar */}
          <div className="w-full">
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-300 transition-all duration-300 shadow-[0_0_6px_#38bdf8]"
                style={{ width: `${batchProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 mt-0.5 px-0.5">
              <span>%{batchProgressPct}</span>
              <span>
                {satBatch!.completedCount}/{satBatch!.totalCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

