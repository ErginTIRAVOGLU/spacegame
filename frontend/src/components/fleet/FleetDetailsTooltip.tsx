"use client";

import React from "react";
import type { IncomingFleetAlert, IncomingFleetShip } from "@/store/useGameStore";
import {
  Rocket,
  ShieldAlert,
  HelpCircle,
  Eye,
  EyeOff,
  X,
  Crosshair,
} from "lucide-react";

interface FleetDetailsTooltipProps {
  fleet: IncomingFleetAlert;
  onClose?: () => void;
  className?: string;
}

export function FleetDetailsTooltip({
  fleet,
  onClose,
  className = "",
}: FleetDetailsTooltipProps) {
  const defenderEsp = fleet.defenderEspionageLevel ?? 6;
  const attackerEsp = fleet.attackerEspionageLevel ?? 4;
  const deltaEsp = defenderEsp - attackerEsp;

  // Intelligence tier:
  // deltaEsp < 2: Tier 1 (Total count only)
  // deltaEsp in [2, 3]: Tier 2 (Ship classes only, obscured '?')
  // deltaEsp >= 4: Tier 3 (Full details, exact counts)
  const intelTier: 1 | 2 | 3 =
    deltaEsp < 2 ? 1 : deltaEsp <= 3 ? 2 : 3;

  // Fallback ships if backend ships list is not loaded yet
  const ships: IncomingFleetShip[] =
    fleet.ships && fleet.ships.length > 0
      ? fleet.ships
      : [
          {
            unitType: 202,
            shipName: "Küçük Nakliye Gemisi",
            exactCount: intelTier === 3 ? 4 : null,
            displayCount: intelTier === 3 ? "4" : intelTier === 2 ? "?" : "—",
          },
          {
            unitType: 204,
            shipName: "Hafif Avcı",
            exactCount: intelTier === 3 ? 2 : null,
            displayCount: intelTier === 3 ? "2" : intelTier === 2 ? "?" : "—",
          },
        ];

  return (
    <div
      role="tooltip"
      className={`rounded-lg border border-red-500/50 bg-[#0a0d16]/98 p-3 shadow-[0_12px_36px_rgba(239,68,68,0.25)] backdrop-blur-md z-50 text-left min-w-[260px] max-w-xs animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      {/* Header: Filo detayları: + close button */}
      <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span>Filo detayları:</span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-5 w-5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Espionage Intelligence Status Bar */}
      <div className="mb-2.5 p-1.5 rounded bg-red-950/30 border border-red-500/25 flex items-center justify-between text-[10px] font-mono">
        <span className="text-zinc-400 flex items-center gap-1">
          {intelTier === 3 ? (
            <Eye className="h-3 w-3 text-emerald-400" />
          ) : intelTier === 2 ? (
            <HelpCircle className="h-3 w-3 text-amber-400" />
          ) : (
            <EyeOff className="h-3 w-3 text-rose-400" />
          )}
          <span>Casusluk Farkı (Δ{deltaEsp}):</span>
        </span>
        <span
          className={`font-semibold ${
            intelTier === 3
              ? "text-emerald-400"
              : intelTier === 2
              ? "text-amber-400"
              : "text-rose-400"
          }`}
        >
          {intelTier === 3
            ? "Tam Tespit"
            : intelTier === 2
            ? "Sınıf Tespiti"
            : "Yetersiz İstihbarat"}
        </span>
      </div>

      {/* Tier 1: Total Count Only */}
      {intelTier === 1 && (
        <div className="space-y-1.5 py-1 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950/70 border border-zinc-800">
            <span className="text-zinc-300">Toplam Gemi Sayısı:</span>
            <span className="font-bold text-zinc-100">{fleet.shipCount}</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            Casusluk teknolojisi farkı (+2) altında olduğu için gemi sınıfları tespit edilemiyor.
          </p>
        </div>
      )}

      {/* Tier 2 & 3: Ship breakdown */}
      {intelTier >= 2 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Tespit Edilen Sınıflar</span>
            <span className="text-zinc-300">
              Toplam: {fleet.shipCount} gemi
            </span>
          </div>

          <div className="space-y-1 divide-y divide-zinc-800/60 bg-[#060810] border border-zinc-800/80 rounded-md p-1.5">
            {ships.map((ship, idx) => {
              const displayVal =
                intelTier === 3
                  ? ship.exactCount?.toString() ?? ship.displayCount
                  : "?";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-mono py-1 px-1.5"
                >
                  <span className="text-zinc-200 flex items-center gap-1.5">
                    <Rocket className="h-3 w-3 text-red-400" />
                    <span>{ship.shipName}:</span>
                  </span>
                  <span
                    className={`font-bold ${
                      displayVal === "?"
                        ? "text-amber-400 font-extrabold text-sm"
                        : "text-zinc-100"
                    }`}
                  >
                    {displayVal}
                  </span>
                </div>
              );
            })}
          </div>

          {intelTier === 2 && (
            <p className="text-[10px] font-mono text-amber-400/90 leading-tight pt-1">
              Gemi tipleri belirlendi fakat kesin sayılar için Casusluk Teknolojisi farkının en az +4 olması gerekir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

