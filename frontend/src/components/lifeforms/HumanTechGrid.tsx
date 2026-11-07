"use client";

import React, { useState } from "react";
import {
  type LifeformTechItemMeta,
  type PlanetLifeformStateDto,
  calculateLifeformTechUpgrade,
  getTechForSlot,
  getAllTechsForSlot,
  normalizeSpeciesId,
  LIFEFORMS_CATALOG,
  type LifeformId,
} from "@/lib/lifeformsCatalog";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  GitBranch,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Info,
  X,
  Compass,
  Pickaxe,
  Rocket,
  EyeOff,
  ShieldAlert,
  Bot,
  Globe2,
  TrendingUp,
  Crosshair,
  Radar,
  Flame,
  Snowflake,
  Bomb,
  Shield,
  Cpu,
  Layers,
  FlaskConical,
  RefreshCw,
  Check,
} from "lucide-react";

interface HumanTechGridProps {
  planet: {
    id: string;
    name: string;
    metal: number;
    crystal: number;
    deuterium: number;
  };
  lifeformState: PlanetLifeformStateDto;
  onResearch: (slot: number) => Promise<void>;
  isResearching: boolean;
  highlightedKey?: string | null;
  highlightClass?: string;
  onSelectSlotTech?: (slot: number, speciesId: string) => Promise<void>;
}

const TECH_SLOT_ICONS: Record<number, React.ReactNode> = {
  1: <Compass className="h-5 w-5 text-cyan-300" />,
  2: <Pickaxe className="h-5 w-5 text-amber-300" />,
  3: <Rocket className="h-5 w-5 text-sky-300" />,
  4: <EyeOff className="h-5 w-5 text-purple-300" />,
  5: <ShieldAlert className="h-5 w-5 text-emerald-300" />,
  6: <Bot className="h-5 w-5 text-indigo-300" />,
  7: <Globe2 className="h-5 w-5 text-teal-300" />,
  8: <TrendingUp className="h-5 w-5 text-amber-400" />,
  9: <Crosshair className="h-5 w-5 text-rose-300" />,
  10: <Rocket className="h-5 w-5 text-orange-400" />,
  11: <Radar className="h-5 w-5 text-sky-400" />,
  12: <Flame className="h-5 w-5 text-purple-400" />,
  13: <Snowflake className="h-5 w-5 text-cyan-400" />,
  14: <Bomb className="h-5 w-5 text-rose-400" />,
  15: <Shield className="h-5 w-5 text-emerald-400" />,
  16: <Crosshair className="h-5 w-5 text-amber-300" />,
  17: <Bot className="h-5 w-5 text-purple-300" />,
  18: <Cpu className="h-5 w-5 text-fuchsia-400" />,
};

const SPECIES_BADGE_STYLES: Record<LifeformId, { text: string; bg: string; border: string }> = {
  humans: { text: "text-cyan-300", bg: "bg-cyan-950/70", border: "border-cyan-500/40" },
  rocktal: { text: "text-amber-300", bg: "bg-amber-950/70", border: "border-amber-500/40" },
  mechas: { text: "text-sky-300", bg: "bg-sky-950/70", border: "border-sky-500/40" },
  kaelesh: { text: "text-emerald-300", bg: "bg-emerald-950/70", border: "border-emerald-500/40" },
};

export function HumanTechGrid({
  planet,
  lifeformState,
  onResearch,
  isResearching,
  highlightedKey,
  highlightClass,
  onSelectSlotTech,
}: HumanTechGridProps) {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | "all">("all");
  const [activeModalMeta, setActiveModalMeta] = useState<LifeformTechItemMeta | null>(null);
  const [swapModalSlot, setSwapModalSlot] = useState<number | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const totalPopulation =
    (lifeformState.t1Population || 0) +
    (lifeformState.t2Population || 0) +
    (lifeformState.t3Population || 0);

  const activeTechQueue = lifeformState.activeTechQueue;

  // Find tech institute/research centre level across active species buildings
  const researchCentreLevel =
    lifeformState.buildingLevels?.researchCentre ??
    lifeformState.buildingLevels?.runeTechnologicalInstitute ??
    lifeformState.buildingLevels?.coreMatrix ??
    lifeformState.buildingLevels?.cosmicResonator ??
    (lifeformState.buildingLevels as Record<string, number> | undefined)?.["researchCenter"] ??
    0;
  const isPrerequisiteMet = researchCentreLevel >= 1;

  // Build the 18 active slot techs based on slotSpecies assignment or active species
  const all18Slots: LifeformTechItemMeta[] = Array.from({ length: 18 }, (_, idx) => {
    const slotNum = idx + 1;
    const assignedSpecies = lifeformState.slotSpecies?.[slotNum] ?? lifeformState.activeSpecies;
    return getTechForSlot(slotNum, assignedSpecies);
  });

  const filteredTechs =
    selectedTier === "all"
      ? all18Slots
      : all18Slots.filter((t) => t.tier === selectedTier);

  const handleSelectSlotSpecies = async (slot: number, speciesId: string) => {
    if (!onSelectSlotTech || isSwapping) return;
    setIsSwapping(true);
    try {
      await onSelectSlotTech(slot, speciesId);
      setSwapModalSlot(null);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prerequisite Alert if Research Centre is not yet built */}
      {!isPrerequisiteMet && (
        <div className="p-3.5 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-3">
          <Lock className="h-5 w-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-bold uppercase tracking-wider text-rose-200">
              Canlı Türü Gelişimi Kilitli
            </div>
            <div className="text-zinc-300 text-[11px] mt-0.5">
              Canlı türü teknolojilerini araştırabilmek için önce Canlı Türü Binalarından &ldquo;Araştırma Merkezi / Teknoloji Enstitüsü&rdquo; inşa edilmelidir (En az Seviye 1).
            </div>
          </div>
        </div>
      )}

      {/* Tier Switcher Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <span>18 Yuvalı Canlı Türü Teknoloji Ağacı</span>
            <span className="text-zinc-500">•</span>
            <span className="text-cyan-300">
              Mevcut Nüfus: {totalPopulation.toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
            <span>Teknoloji Enstitüsü Lv {researchCentreLevel} indirimi (%{researchCentreLevel * 2}).</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400 flex items-center gap-1 font-mono">
              <Sparkles className="h-3 w-3" />
              Artifakt Stoku: {lifeformState.artifactCount ?? 420} / {lifeformState.maxArtifacts ?? 3600}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => setSelectedTier("all")}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              selectedTier === "all"
                ? "bg-purple-600 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tümü (18 Yuva)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier(1)}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              selectedTier === 1
                ? "bg-cyan-600 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kademe 1 (Yuva 1-6)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier(2)}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              selectedTier === 2
                ? "bg-sky-600 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kademe 2 (Yuva 7-12)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier(3)}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              selectedTier === 3
                ? "bg-fuchsia-600 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kademe 3 (Yuva 13-18)
          </button>
        </div>
      </div>

      {/* Grid of 18 Tech Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTechs.map((tech) => {
          const currentLevel = lifeformState.techLevels?.[tech.slot] ?? 0;
          const upgradeSpec = calculateLifeformTechUpgrade(
            tech,
            currentLevel,
            researchCentreLevel
          );

          const isPopulationMet = totalPopulation >= tech.requiredPopulation;
          const isSlotUnlocked = isPrerequisiteMet && isPopulationMet;

          const isQueueBusy = Boolean(activeTechQueue);
          const isCurrentlyResearching = activeTechQueue?.slot === tech.slot;

          const canAffordMetal = planet.metal >= upgradeSpec.metal;
          const canAffordCrystal = planet.crystal >= upgradeSpec.crystal;
          const canAffordDeut = planet.deuterium >= upgradeSpec.deuterium;
          const canAfford = canAffordMetal && canAffordCrystal && canAffordDeut;

          const techSpeciesId = normalizeSpeciesId(tech.speciesId);
          const badgeStyle = SPECIES_BADGE_STYLES[techSpeciesId] || SPECIES_BADGE_STYLES.humans;
          const speciesDef = LIFEFORMS_CATALOG[techSpeciesId];

          const cleanHighlight = highlightedKey?.toLowerCase().replace(/[-_]/g, "");
          const isTargetFocused =
            Boolean(cleanHighlight) &&
            (tech.name.toLowerCase().replace(/[-_]/g, "").includes(cleanHighlight!) ||
              (cleanHighlight?.includes("envoy") && tech.slot === 1));

          return (
            <div
              key={tech.slot}
              id={`tech-slot-${tech.slot}`}
              style={
                !isSlotUnlocked
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(15,19,26,0.95) 0px, rgba(15,19,26,0.95) 12px, rgba(9,13,20,0.98) 12px, rgba(9,13,20,0.98) 24px)",
                    }
                  : undefined
              }
              className={`rounded-xl border transition-all p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#121927]/90 via-[#0a0f18] to-[#070b13] ${
                isTargetFocused
                  ? `${highlightClass ?? "ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]"} scale-[1.01]`
                  : isSlotUnlocked
                  ? "border-zinc-800/80 hover:border-zinc-700/80"
                  : "border-zinc-900/90 opacity-85"
              }`}
            >
              {/* Top Row: Icon + Slot + Species Badge + Level */}
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border bg-[#080d16] ${
                        isSlotUnlocked ? "border-purple-500/40" : "border-zinc-800"
                      }`}
                    >
                      {TECH_SLOT_ICONS[tech.slot] ?? (
                        <FlaskConical className="h-5 w-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Yuva #{tech.slot} (T{tech.tier})
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {speciesDef?.name ?? "İnsanlar"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 mt-0.5">
                        <span>{tech.name}</span>
                      </h3>
                    </div>
                  </div>

                  {/* Level Badge or Lock Icon */}
                  <div className="text-right shrink-0">
                    {isSlotUnlocked ? (
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#0b101a] border border-cyan-700/50 text-cyan-300">
                        Lv {currentLevel}
                      </span>
                    ) : (
                      <span className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-zinc-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                  {tech.description}
                </p>

                {/* Population Threshold Status */}
                {!isPopulationMet && (
                  <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2 mb-3 text-[11px] font-mono text-amber-300/90 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      Gerekli Nüfus: {tech.requiredPopulation.toLocaleString("tr-TR")} (Mevcut:{" "}
                      {totalPopulation.toLocaleString("tr-TR")})
                    </span>
                  </div>
                )}

                {/* Costs & Times */}
                {isSlotUnlocked && (
                  <div className="bg-[#0b101a]/90 rounded-lg p-2.5 border border-zinc-800/90 space-y-1.5 mb-3 text-xs font-mono">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1 flex items-center justify-between">
                      <span>Araştırma Maliyeti (Lv {upgradeSpec.targetLevel})</span>
                      <button
                        onClick={() => setActiveModalMeta(tech)}
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
                        <span className="text-[10px] text-zinc-500">Deut</span>
                        <span>{upgradeSpec.deuterium.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{formatCountdownTurkish(upgradeSpec.durationSeconds)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        Küresel İmparatorluk Bonusu
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="space-y-1.5">
                {isCurrentlyResearching ? (
                  <div className="w-full py-2 px-3 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-pulse">
                    <FlaskConical className="h-3.5 w-3.5 animate-spin" />
                    <span>Araştırılıyor...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onResearch(tech.slot)}
                    disabled={!isSlotUnlocked || !canAfford || isQueueBusy || isResearching}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                      !isSlotUnlocked
                        ? "bg-zinc-800/40 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                        : !canAfford
                        ? "bg-zinc-800/50 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                        : isQueueBusy
                        ? "bg-zinc-800/40 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white shadow-lg shadow-purple-900/30 border border-purple-400/30"
                    }`}
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>
                      {!isSlotUnlocked
                        ? "Kilitli (Nüfus Yetersiz)"
                        : !canAfford
                        ? "Yetersiz Hammadde"
                        : isQueueBusy
                        ? "Araştırma Kuyruğu Dolu"
                        : `Araştır (Seviye ${upgradeSpec.targetLevel})`}
                    </span>
                  </button>
                )}

                {/* Cross-Species Swap Tech Button */}
                {isSlotUnlocked && onSelectSlotTech && (
                  <button
                    onClick={() => setSwapModalSlot(tech.slot)}
                    className="w-full py-1.5 px-3 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-amber-300 bg-[#090d15] hover:bg-amber-950/20 border border-zinc-800 hover:border-amber-500/40 transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3 text-amber-400" />
                    <span>Tür Teknolojisini Değiştir (100 Artifakt)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Species Tech Swap Modal */}
      {swapModalSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-5 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Çapraz Canlı Türü Yuva Değişimi • Yuva #{swapModalSlot}
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">
                  Bu Yuva İçin İstediğin Canlı Türü Teknolojisini Seç
                </h3>
              </div>
              <button
                onClick={() => setSwapModalSlot(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              OGame resmi mekaniği uyarınca keşfettiğin diğer canlı türlerinin teknolojilerini
              bu yuvaya atayabilirsin. Seçim 100 Artifakt gerektirir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getAllTechsForSlot(swapModalSlot).map(({ species, tech }) => {
                const assignedSpecies =
                  lifeformState.slotSpecies?.[swapModalSlot] ?? lifeformState.activeSpecies;
                const isSelected = normalizeSpeciesId(assignedSpecies) === species.id;
                const badge = SPECIES_BADGE_STYLES[species.id];

                return (
                  <div
                    key={species.id}
                    className={`rounded-lg border p-3.5 flex flex-col justify-between transition ${
                      isSelected
                        ? "border-amber-400/80 bg-amber-950/20"
                        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {species.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Seçili
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100">{tech.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2 border-t border-zinc-800/80">
                      {isSelected ? (
                        <div className="text-[10px] font-mono text-zinc-500 text-center py-1">
                          Şu Anda Aktif
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectSlotSpecies(swapModalSlot, species.id)}
                          disabled={isSwapping}
                          className="w-full py-1.5 px-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Bu Teknolojiyi Ata</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSwapModalSlot(null)}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Info Details Modal */}
      {activeModalMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                  Teknoloji Spesifikasyonu • Yuva #{activeModalMeta.slot} (T{activeModalMeta.tier})
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
                <span>Gerekli Nüfus:</span>
                <span className="text-cyan-400 font-bold">
                  {activeModalMeta.requiredPopulation.toLocaleString("tr-TR")}
                </span>
              </div>
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
                <span>Etki Kapsamı:</span>
                <span className="text-emerald-400 font-bold">
                  Tüm İmparatorluk (Küresel Bonus)
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
