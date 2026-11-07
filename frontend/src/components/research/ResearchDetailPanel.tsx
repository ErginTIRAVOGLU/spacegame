"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGameStore,
  type PlanetSummary,
} from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  RESEARCH_CATALOG,
  type ResearchDefinition,
  calculateResearchCost,
  calculateEffectiveLabLevel,
  calculateResearchDurationSeconds,
  evaluateResearchPrerequisites,
} from "@/lib/researchCatalog";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import { InstantCompleteModal } from "@/components/buildings/InstantCompleteModal";
import { SpeedupActionButtons } from "@/components/common/SpeedupActionButtons";
import {
  calculateHalveDurationCost,
  calculateInstantCompletionCost,
} from "@/lib/darkMatterFormulas";
import {
  ArrowUpCircle,
  Clock,
  Boxes,
  Gem,
  Droplets,
  Zap,
  FastForward,
  Lock,
  Network,
  CheckCircle2,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface ResearchDetailPanelProps {
  tech: ResearchDefinition;
  planet: PlanetSummary;
  planets: PlanetSummary[];
  researches: Record<number, number>;
  remainingQueueSeconds: number;
  onSelectTech?: (type: number) => void;
  onClose?: () => void;
}

export function ResearchDetailPanel({
  tech,
  planet,
  planets,
  researches,
  remainingQueueSeconds,
  onSelectTech,
  onClose,
}: ResearchDetailPanelProps) {
  const darkMatter = useGameStore((s) => s.darkMatter);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const startResearch = useGameStore((s) => s.startResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);
  const halveResearchDuration = useGameStore((s) => s.halveResearchDuration);
  const instantCompleteResearch = useGameStore((s) => s.instantCompleteResearch);
  const bonuses = useOfficerStore((s) => s.bonuses);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speedupModalType, setSpeedupModalType] = useState<"instant" | "halve" | null>(null);

  const currentLevel = researches[tech.researchType] ?? 0;
  const cost = calculateResearchCost(tech, currentLevel);

  const halveCost = activeResearchQueue
    ? calculateHalveDurationCost(
        activeResearchQueue.targetLevel,
        remainingQueueSeconds,
        (new Date(activeResearchQueue.endTimeUtc).getTime() -
          new Date(activeResearchQueue.startTimeUtc).getTime()) /
          1000
      )
    : 750;

  const instantCost = activeResearchQueue
    ? calculateInstantCompletionCost(
        activeResearchQueue.targetLevel,
        remainingQueueSeconds
      )
    : 750;

  // Origin planet lab level
  const originLabLevel =
    planet.buildings.find((b) => b.key === "researchLab")?.level ?? 0;

  // Other planets lab levels
  const otherLabs = planets
    .filter((p) => p.id !== planet.id)
    .map((p) => p.buildings.find((b) => b.key === "researchLab")?.level ?? 0);

  const irnLevel = researches[123] ?? 0; // IRN = 123

  const effectiveLabLevel = calculateEffectiveLabLevel(
    originLabLevel,
    otherLabs,
    irnLevel,
    tech.minLabLevel
  );

  const durationSeconds =
    tech.researchType === 199
      ? 1
      : calculateResearchDurationSeconds(
          cost.metal,
          cost.crystal,
          effectiveLabLevel,
          5, // Default 5x universe speed
          bonuses.researchDurationMultiplier
        );

  const prereqResults = evaluateResearchPrerequisites(
    tech,
    originLabLevel,
    researches,
    planet.producedEnergy
  );
  const allPrerequisitesMet = prereqResults.every((p) => p.met);

  const isResearchingThis =
    activeResearchQueue?.researchType === tech.researchType;
  const isAccountQueueBusy = Boolean(activeResearchQueue);

  // Affordability check
  const canAffordMetal = planet.metal >= cost.metal;
  const canAffordCrystal = planet.crystal >= cost.crystal;
  const canAffordDeut = planet.deuterium >= cost.deuterium;
  const canAffordEnergy =
    tech.researchType !== 199 || planet.producedEnergy >= 300000;
  const canAfford =
    canAffordMetal && canAffordCrystal && canAffordDeut && canAffordEnergy;

  const canStartResearch =
    !isAccountQueueBusy && canAfford && allPrerequisitesMet;

  const handleStart = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const res = await startResearch(tech.researchType);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="rounded-lg border border-cyan-500/35 bg-gradient-to-b from-[#101824]/95 via-[#0b111a]/95 to-[#070a10]/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.75)] space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-100">{tech.name}</h2>
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300">
              Kademe {currentLevel} → {currentLevel + 1}
            </span>
            {!allPrerequisitesMet && (
              <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center gap-1">
                <Lock className="h-3 w-3 text-rose-400" />
                <span>Ön Koşul Eksik</span>
              </span>
            )}
            {isResearchingThis && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Araştırılıyor</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap mt-2 text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-zinc-400">Araştırma süresi:</span>
              <span className="text-amber-300 font-semibold">
                {tech.researchType === 199
                  ? "Anında (1sn)"
                  : formatCountdownTurkish(durationSeconds)}
              </span>
              {bonuses.hasTechnocrat && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  ⚡ Teknokrat (-%25)
                </span>
              )}
            </span>

            {/* Effective Lab & IRN Info */}
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Network className="h-3.5 w-3.5 text-cyan-400" />
              <span>Efektif Lab Seviyesi: {effectiveLabLevel}</span>
              {irnLevel > 0 && (
                <span className="text-[11px] text-zinc-400">
                  (IRN Kademe {irnLevel})
                </span>
              )}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lore Description */}
      <p className="text-xs text-zinc-300 leading-relaxed bg-[#06090e]/80 border border-zinc-800/80 rounded p-3">
        {tech.description}
      </p>

      {/* Prerequisites Matrix */}
      <div className="p-3.5 rounded-lg bg-[#070b12] border border-zinc-800/90 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Ön Koşullar & Gereksinimler ({tech.name})</span>
          </span>
          <Link
            href="/facilities"
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
          >
            Tesis Binalarına Git →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prereqResults.map((req) => (
            <div
              key={req.label}
              className={`px-3 py-2 rounded border flex items-center justify-between text-xs font-mono ${
                req.met
                  ? "bg-emerald-950/20 border-emerald-500/35 text-emerald-300"
                  : "bg-rose-950/25 border-rose-500/45 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {req.met ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                )}
                {req.type === "tech" && onSelectTech ? (
                  <button
                    type="button"
                    onClick={() => {
                      const match = RESEARCH_CATALOG.find(
                        (t) => t.name.toLowerCase() === req.label.toLowerCase()
                      );
                      if (match) onSelectTech(match.researchType);
                    }}
                    className="font-semibold truncate text-left hover:text-cyan-300 hover:underline"
                  >
                    {req.label}
                  </button>
                ) : req.label === "Bilimsel Araştırma Laboratuvarı" ? (
                  <Link
                    href="/facilities?building=researchLab"
                    className="font-semibold truncate hover:text-cyan-300 hover:underline"
                  >
                    {req.label}
                  </Link>
                ) : (
                  <span className="font-semibold truncate">{req.label}</span>
                )}
              </div>
              <span className="font-bold shrink-0 ml-2">
                {req.type === "energy"
                  ? `${Math.floor(req.currentLevel).toLocaleString()} / 300.000`
                  : `Kademe ${req.currentLevel} / ${req.requiredLevel}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`px-3 py-2 rounded border text-xs font-mono ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
              : "border-rose-500/40 bg-rose-950/30 text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Account-wide queue warning if another tech is being researched */}
      {isAccountQueueBusy && !isResearchingThis && (
        <div className="px-3.5 py-2.5 rounded-lg border border-amber-500/40 bg-amber-950/20 flex items-center gap-2.5 text-xs font-mono text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Hesap genelinde şu anda{" "}
            <strong>{activeResearchQueue?.researchName}</strong> (Kademe{" "}
            {activeResearchQueue?.targetLevel}) araştırılıyor. OGame kuralları gereği imparatorluk genelinde aynı anda yalnızca 1 araştırma yürütülebilir.
          </span>
        </div>
      )}

      {/* Upgrade Requirements & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Kademe {cost.targetLevel} İçin Gereken Hammaddeler:
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            {cost.metal > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  canAffordMetal
                    ? "border-zinc-800 text-zinc-100"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                <span>Metal: {cost.metal.toLocaleString("en-US")}</span>
              </div>
            )}

            {cost.crystal > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  canAffordCrystal
                    ? "border-zinc-800 text-cyan-300"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Gem className="h-3.5 w-3.5 text-cyan-400" />
                <span>Kristal: {cost.crystal.toLocaleString("en-US")}</span>
              </div>
            )}

            {cost.deuterium > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  canAffordDeut
                    ? "border-zinc-800 text-emerald-300"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                <span>Deuterium: {cost.deuterium.toLocaleString("en-US")}</span>
              </div>
            )}

            {tech.researchType === 199 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  canAffordEnergy
                    ? "border-amber-500/50 text-amber-300 font-bold"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Enerji: 300.000</span>
              </div>
            )}
          </div>
        </div>

        {/* Big Green Araştır / Active Speedup & Cancel Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {isResearchingThis ? (
            <>
              <SpeedupActionButtons
                halveCost={halveCost}
                instantCost={instantCost}
                onHalve={() => setSpeedupModalType("halve")}
                onInstant={() => setSpeedupModalType("instant")}
                halveTitle={`Kalan araştırma süresini yarıya indirir (${halveCost} KM)`}
                instantTitle={`Araştırmayı hemen tamamlar (${instantCost} KM)`}
              />

              <button
                type="button"
                onClick={() => cancelResearch()}
                className="px-3 py-2.5 rounded-md bg-rose-950/80 hover:bg-rose-800 border border-rose-500/50 text-rose-200 font-mono text-xs font-semibold transition cursor-pointer"
              >
                İptal
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !canStartResearch}
              onClick={handleStart}
              className={`px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${
                canStartResearch
                  ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>
                {!allPrerequisitesMet
                  ? "Ön Koşul Gerekli"
                  : isAccountQueueBusy
                  ? "Araştırma Sırası Dolu"
                  : !canAfford
                  ? "Yetersiz Kaynak"
                  : "Araştır"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Speedup / Instant Complete Modal */}
      {speedupModalType && activeResearchQueue && (
        <InstantCompleteModal
          isOpen={Boolean(speedupModalType)}
          onClose={() => setSpeedupModalType(null)}
          itemName={activeResearchQueue.researchName}
          targetLevel={activeResearchQueue.targetLevel}
          cost={speedupModalType === "halve" ? halveCost : instantCost}
          userDarkMatter={darkMatter}
          actionType={speedupModalType}
          isResearch={true}
          onConfirm={async () => {
            if (speedupModalType === "halve") {
              await halveResearchDuration();
            } else {
              await instantCompleteResearch();
            }
          }}
        />
      )}
    </div>
  );
}

