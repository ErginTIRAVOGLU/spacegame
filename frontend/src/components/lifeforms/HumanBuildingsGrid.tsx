"use client";

import React, { useState } from "react";
import {
  type LifeformBuildingKey,
  type LifeformBuildingMeta,
  type PlanetLifeformStateDto,
  calculateLifeformBuildingUpgrade,
  getBuildingsForSpecies,
  LIFEFORMS_CATALOG,
  normalizeSpeciesId,
} from "@/lib/lifeformsCatalog";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  Users,
  Sprout,
  FlaskConical,
  GraduationCap,
  BrainCircuit,
  Flame,
  Warehouse,
  Atom,
  Building2,
  Microscope,
  Landmark,
  Shield,
  Clock,
  Zap,
  Info,
  CheckCircle2,
  Hammer,
  X,
  Database,
  Layers,
} from "lucide-react";

interface HumanBuildingsGridProps {
  planet: {
    id: string;
    name: string;
    metal: number;
    crystal: number;
    deuterium: number;
    energy?: number;
  };
  lifeformState: PlanetLifeformStateDto;
  onUpgrade: (buildingKey: LifeformBuildingKey) => Promise<void>;
  isUpgrading: boolean;
  highlightedKey?: string | null;
  highlightClass?: string;
}

const DEFAULT_INDEX_ICONS: Record<
  number,
  { icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  1: {
    icon: <Users className="h-6 w-6 text-cyan-300" />,
    colorClass: "text-cyan-300 border-cyan-500/40",
    bgClass: "from-cyan-950/70 via-slate-900 to-[#070b13]",
  },
  2: {
    icon: <Sprout className="h-6 w-6 text-emerald-300" />,
    colorClass: "text-emerald-300 border-emerald-500/40",
    bgClass: "from-emerald-950/70 via-slate-900 to-[#070b13]",
  },
  3: {
    icon: <FlaskConical className="h-6 w-6 text-purple-300" />,
    colorClass: "text-purple-300 border-purple-500/40",
    bgClass: "from-purple-950/70 via-slate-900 to-[#070b13]",
  },
  4: {
    icon: <GraduationCap className="h-6 w-6 text-sky-300" />,
    colorClass: "text-sky-300 border-sky-500/40",
    bgClass: "from-sky-950/70 via-slate-900 to-[#070b13]",
  },
  5: {
    icon: <BrainCircuit className="h-6 w-6 text-fuchsia-300" />,
    colorClass: "text-fuchsia-300 border-fuchsia-500/40",
    bgClass: "from-fuchsia-950/70 via-slate-900 to-[#070b13]",
  },
  6: {
    icon: <Flame className="h-6 w-6 text-amber-300" />,
    colorClass: "text-amber-300 border-amber-500/40",
    bgClass: "from-amber-950/70 via-slate-900 to-[#070b13]",
  },
  7: {
    icon: <Warehouse className="h-6 w-6 text-lime-300" />,
    colorClass: "text-lime-300 border-lime-500/40",
    bgClass: "from-lime-950/70 via-slate-900 to-[#070b13]",
  },
  8: {
    icon: <Atom className="h-6 w-6 text-teal-300" />,
    colorClass: "text-teal-300 border-teal-500/40",
    bgClass: "from-teal-950/70 via-slate-900 to-[#070b13]",
  },
  9: {
    icon: <Building2 className="h-6 w-6 text-indigo-300" />,
    colorClass: "text-indigo-300 border-indigo-500/40",
    bgClass: "from-indigo-950/70 via-slate-900 to-[#070b13]",
  },
  10: {
    icon: <Microscope className="h-6 w-6 text-emerald-400" />,
    colorClass: "text-emerald-400 border-emerald-500/40",
    bgClass: "from-emerald-950/70 via-slate-900 to-[#070b13]",
  },
  11: {
    icon: <Landmark className="h-6 w-6 text-amber-400" />,
    colorClass: "text-amber-400 border-amber-500/40",
    bgClass: "from-amber-950/70 via-slate-900 to-[#070b13]",
  },
  12: {
    icon: <Shield className="h-6 w-6 text-cyan-400" />,
    colorClass: "text-cyan-400 border-cyan-500/40",
    bgClass: "from-cyan-950/70 via-slate-900 to-[#070b13]",
  },
};

export function HumanBuildingsGrid({
  planet,
  lifeformState,
  onUpgrade,
  isUpgrading,
  highlightedKey,
  highlightClass,
}: HumanBuildingsGridProps) {
  const [activeModalMeta, setActiveModalMeta] = useState<LifeformBuildingMeta | null>(null);

  const activeQueue = lifeformState.activeQueue;
  const currentSpeciesId = normalizeSpeciesId(lifeformState.activeSpecies);
  const speciesConfig = LIFEFORMS_CATALOG[currentSpeciesId];
  const buildingsList = getBuildingsForSpecies(currentSpeciesId);

  return (
    <div className="space-y-4">
      {/* Subheader */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <span>{speciesConfig?.name ?? "Canlı Türü"} Altyapısı</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">12 Yerel Gezegen Binası</span>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {buildingsList.map((meta) => {
          const currentLevel = lifeformState.buildingLevels?.[meta.key] ?? 0;
          const upgradeSpec = calculateLifeformBuildingUpgrade(meta, currentLevel);
          const iconConfig = DEFAULT_INDEX_ICONS[meta.index] || DEFAULT_INDEX_ICONS[1];

          const isQueueBusy = Boolean(activeQueue);
          const isCurrentlyBuilding = activeQueue?.buildingKey === meta.key;

          const canAffordMetal = planet.metal >= upgradeSpec.metal;
          const canAffordCrystal = planet.crystal >= upgradeSpec.crystal;
          const canAffordDeut = planet.deuterium >= upgradeSpec.deuterium;
          const canAfford = canAffordMetal && canAffordCrystal && canAffordDeut;

          const cleanHighlight = highlightedKey?.toLowerCase().replace(/[-_]/g, "");
          const normalizedHighlight = cleanHighlight?.replace("center", "centre");
          const normalizedKey = meta.key.toLowerCase().replace(/[-_]/g, "").replace("center", "centre");
          const isTargetFocused =
            Boolean(cleanHighlight) &&
            (normalizedKey === normalizedHighlight ||
              meta.key.toLowerCase().replace(/[-_]/g, "") === cleanHighlight ||
              meta.name.toLowerCase().replace(/[-_]/g, "").includes(cleanHighlight!));

          return (
            <div
              key={meta.key}
              id={`building-${meta.key}`}
              className={`rounded-xl border transition-all p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${
                iconConfig.bgClass
              } ${
                isTargetFocused
                  ? `${highlightClass ?? "ring-2 ring-amber-400 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]"} scale-[1.01]`
                  : "border-zinc-800/80 hover:border-zinc-700/80"
              }`}
            >
              {/* Header: Icon + Name + Level */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border bg-[#090d14]/80 ${iconConfig.colorClass}`}
                    >
                      {iconConfig.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        Yuva #{meta.index}
                      </div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        <span>{meta.name}</span>
                        {meta.capacityType && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 uppercase">
                            {meta.capacityType}
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Level Badge */}
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#0b101a] border border-zinc-700/60 text-cyan-300">
                      Lv {currentLevel}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400/90 leading-relaxed line-clamp-2 mb-3">
                  {meta.description}
                </p>

                {/* Requirements / Costs */}
                <div className="bg-[#0b101a]/90 rounded-lg p-2.5 border border-zinc-800/90 space-y-1.5 mb-3 text-xs font-mono">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1 flex items-center justify-between">
                    <span>Yükseltme Maliyeti (Lv {upgradeSpec.targetLevel})</span>
                    <button
                      onClick={() => setActiveModalMeta(meta)}
                      className="text-cyan-400 hover:text-cyan-300 underline font-sans text-[10px] flex items-center gap-0.5"
                    >
                      <Info className="h-3 w-3" />
                      Detay
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`flex flex-col ${
                        canAffordMetal ? "text-zinc-300" : "text-rose-400 font-semibold"
                      }`}
                    >
                      <span className="text-[10px] text-zinc-500">Metal</span>
                      <span>{upgradeSpec.metal.toLocaleString("tr-TR")}</span>
                    </div>

                    <div
                      className={`flex flex-col ${
                        canAffordCrystal ? "text-zinc-300" : "text-rose-400 font-semibold"
                      }`}
                    >
                      <span className="text-[10px] text-zinc-500">Kristal</span>
                      <span>{upgradeSpec.crystal.toLocaleString("tr-TR")}</span>
                    </div>

                    <div
                      className={`flex flex-col ${
                        canAffordDeut ? "text-zinc-300" : "text-rose-400 font-semibold"
                      }`}
                    >
                      <span className="text-[10px] text-zinc-500">Deuterium</span>
                      <span>{upgradeSpec.deuterium.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>

                  {/* Energy & Time row */}
                  <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{formatCountdownTurkish(upgradeSpec.durationSeconds)}</span>
                    </div>
                    {upgradeSpec.energyDelta > 0 && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Zap className="h-3 w-3" />
                        <span>-{upgradeSpec.energyDelta} En</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrentlyBuilding ? (
                  <div className="w-full py-2 px-3 rounded-lg bg-purple-950/60 border border-purple-500/50 text-purple-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-pulse">
                    <Hammer className="h-3.5 w-3.5 animate-spin" />
                    <span>İnşa Ediliyor...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onUpgrade(meta.key)}
                    disabled={!canAfford || isQueueBusy || isUpgrading}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                      !canAfford
                        ? "bg-zinc-800/50 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                        : isQueueBusy
                        ? "bg-zinc-800/40 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                        : "bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white shadow-lg shadow-cyan-900/30 border border-cyan-400/30"
                    }`}
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    <span>
                      {!canAfford
                        ? "Yetersiz Hammadde"
                        : isQueueBusy
                        ? "Kuyruk Dolu"
                        : `Geliştir (Seviye ${upgradeSpec.targetLevel})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Details Modal */}
      {activeModalMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                  Bina Spesifikasyonu • Yuva #{activeModalMeta.index}
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">
                  {activeModalMeta.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalMeta(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {activeModalMeta.description}
            </p>

            <div className="rounded-lg bg-[#0e1420] border border-zinc-800 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Temel Metal:</span>
                <span className="text-zinc-200">
                  {activeModalMeta.baseMetal.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Temel Kristal:</span>
                <span className="text-zinc-200">
                  {activeModalMeta.baseCrystal.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Temel Deuterium:</span>
                <span className="text-zinc-200">
                  {activeModalMeta.baseDeut.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Maliyet Katsayısı:</span>
                <span className="text-cyan-400">x{activeModalMeta.costFactor}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Gezegen Etki Türü:</span>
                <span className="text-purple-400 uppercase">
                  {activeModalMeta.capacityType ?? "Yerel Bonus"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModalMeta(null)}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
