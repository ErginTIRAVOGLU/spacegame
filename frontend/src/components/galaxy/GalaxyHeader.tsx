"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Radar,
  Compass,
  Radio,
  Search,
} from "lucide-react";

interface GalaxyHeaderProps {
  galaxy: number;
  system: number;
  onGalaxyChange: (val: number) => void;
  onSystemChange: (val: number) => void;
  onNavigate: () => void;
  probeCount: number;
  ipmCount: number;
  returningFleetsCount: number;
  activeFleets: number;
  maxFleets: number;
  activeExpeditions: number;
  maxExpeditions: number;
  extraFleetSlots?: number;
  extraExpeditionSlots?: number;
  onSystemEspionage: () => void;
  onSystemPhalanx: () => void;
  isScanningSystem?: boolean;
}

export function GalaxyHeader({
  galaxy,
  system,
  onGalaxyChange,
  onSystemChange,
  onNavigate,
  probeCount,
  ipmCount,
  returningFleetsCount,
  activeFleets,
  maxFleets,
  activeExpeditions,
  maxExpeditions,
  extraFleetSlots = 0,
  extraExpeditionSlots = 0,
  onSystemEspionage,
  onSystemPhalanx,
  isScanningSystem,
}: GalaxyHeaderProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNavigate();
  };

  return (
    <div className="space-y-3">
      {/* Top Bar with Inputs & Action Shortcuts */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Navigation Selector Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 flex-wrap font-mono text-xs"
        >
          {/* Galaxy Control */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
            <span className="text-zinc-400 px-2 font-semibold uppercase text-[11px]">
              Galaksi
            </span>
            <button
              type="button"
              onClick={() => onGalaxyChange(Math.max(1, galaxy - 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              max={9}
              value={galaxy}
              onChange={(e) =>
                onGalaxyChange(Math.max(1, Math.min(9, Number(e.target.value) || 1)))
              }
              className="w-12 bg-transparent text-center font-bold text-zinc-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onGalaxyChange(Math.min(9, galaxy + 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* System Control */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
            <span className="text-zinc-400 px-2 font-semibold uppercase text-[11px]">
              Sistem
            </span>
            <button
              type="button"
              onClick={() => onSystemChange(Math.max(1, system - 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              max={499}
              value={system}
              onChange={(e) =>
                onSystemChange(Math.max(1, Math.min(499, Number(e.target.value) || 1)))
              }
              className="w-16 bg-transparent text-center font-bold text-zinc-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onSystemChange(Math.min(499, system + 1))}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Haydi!</span>
          </button>
        </form>

        {/* Top Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onSystemPhalanx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:border-amber-500/40 text-xs font-semibold text-zinc-300 hover:text-amber-300 transition-colors"
          >
            <Radar className="h-3.5 w-3.5 text-amber-400" />
            <span>Sistem Falanksı</span>
          </button>

          <button
            type="button"
            disabled={isScanningSystem || probeCount <= 0}
            onClick={onSystemEspionage}
            title={probeCount <= 0 ? "Gezegende casus sondası yok" : "Tüm sisteme sonda gönder"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-xs font-semibold text-cyan-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isScanningSystem ? "Taranıyor..." : "Sistem Casusluğu"}</span>
          </button>

          <Link
            href="/fleet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:border-indigo-500/40 text-xs font-semibold text-zinc-300 hover:text-indigo-300 transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-indigo-400" />
            <span>Keşifler</span>
          </Link>
        </div>
      </div>

      {/* Status Indicator Strip & Universe Legend Badges */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#090d14] px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        {/* Resource / Unit Statuses */}
        <div className="flex items-center gap-4 flex-wrap text-zinc-400 text-[11px]">
          <span>
            Cas.Sonda:{" "}
            <strong className={probeCount > 0 ? "text-cyan-300" : "text-zinc-600"}>
              {probeCount.toLocaleString()}
            </strong>
          </span>
          <span>
            Geri Dön.:{" "}
            <strong className="text-zinc-200">{returningFleetsCount}</strong>
          </span>
          <span>
            Gez.Ar.Rok.:{" "}
            <strong className={ipmCount > 0 ? "text-red-400" : "text-zinc-600"}>
              {ipmCount.toLocaleString()}
            </strong>
          </span>
          <span>
            Kullanılan slot:{" "}
            <strong
              className={activeFleets >= maxFleets ? "text-rose-400" : "text-amber-300"}
            >
              {activeFleets} / {maxFleets}
            </strong>
            {extraFleetSlots > 0 && (
              <span className="ml-1 text-[10px] text-amber-400 font-bold" title="Amiral & Komuta Heyeti bonusu">
                (+{extraFleetSlots} Amiral)
              </span>
            )}
          </span>
          <span>
            Keşifler:{" "}
            <strong className="text-indigo-300">
              {activeExpeditions} / {maxExpeditions}
            </strong>
            {extraExpeditionSlots > 0 && (
              <span className="ml-1 text-[10px] text-cyan-400 font-bold" title="Amiral bonusu">
                (+{extraExpeditionSlots} Amiral)
              </span>
            )}
          </span>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 select-none">
          <span className="text-zinc-500 font-semibold mr-1">Statü:</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            E: Aktif
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            I: İnaktif
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            N: Zayıf
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            S: Güçlü
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            V: Tatil
          </span>
        </div>
      </div>
    </div>
  );
}

