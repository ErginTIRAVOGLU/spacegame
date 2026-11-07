"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type BuildingInfo,
  type PlanetSummary,
  type ResourceItemKey,
  calculateUpgradeCost,
  evaluateBuildingPrerequisites,
  useGameStore,
} from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  ArrowUpCircle,
  Clock,
  Boxes,
  Gem,
  Droplets,
  FastForward,
  GitBranch,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
  Trash2,
  Flame,
  Plus,
  Layers,
} from "lucide-react";
import { DemolitionModal } from "./DemolitionModal";
import { SpaceDockWreckPanel } from "./SpaceDockWreckPanel";
import { InstantCompleteModal } from "@/components/buildings/InstantCompleteModal";
import { SpeedupActionButtons } from "@/components/common/SpeedupActionButtons";
import {
  calculateHalveDurationCost,
  calculateInstantCompletionCost,
} from "@/lib/darkMatterFormulas";
import { Zap } from "lucide-react";

const INDESTRUCTIBLE_BUILDING_KEYS = new Set([
  "spaceDock",
  "terraformer",
  "lunarBase",
  "moonBase",
]);

interface FacilityDetailPanelProps {
  building: BuildingInfo;
  planet: PlanetSummary;
  remainingQueueSeconds: number;
  onSelectFacility?: (key: ResourceItemKey) => void;
  onClose?: () => void;
}

export function FacilityDetailPanel({
  building,
  planet,
  remainingQueueSeconds,
  onSelectFacility,
  onClose,
}: FacilityDetailPanelProps) {
  const [showTechTree, setShowTechTree] = useState(false);
  const [showDemolishModal, setShowDemolishModal] = useState(false);
  const [speedupModalType, setSpeedupModalType] = useState<"instant" | "halve" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const researches = useGameStore((s) => s.researches);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const lastError = useGameStore((s) => s.lastError);
  const startBuildingUpgrade = useGameStore((s) => s.startBuildingUpgrade);
  const halveBuildingDuration = useGameStore((s) => s.halveBuildingDuration);
  const instantCompleteBuildingUpgrade = useGameStore(
    (s) => s.instantCompleteBuildingUpgrade
  );
  const cancelBuildingUpgrade = useGameStore((s) => s.cancelBuildingUpgrade);
  const bonuses = useOfficerStore((s) => s.bonuses);
  const queuedBuildingOrders = useOfficerStore((s) => s.queuedBuildingOrders);
  const enqueueBuildingOrder = useOfficerStore((s) => s.enqueueBuildingOrder);
  const dequeueBuildingOrder = useOfficerStore((s) => s.dequeueBuildingOrder);

  const planetQueuedOrders = queuedBuildingOrders.filter((q) => q.planetId === planet.id);

  const roboticsLevel =
    planet.buildings.find((b) => b.key === "roboticsFactory")?.level ?? 0;
  const naniteLevel =
    planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;

  const cost = calculateUpgradeCost(building, roboticsLevel, naniteLevel);
  const prerequisites = evaluateBuildingPrerequisites(
    building,
    planet,
    researches
  );
  const allPrerequisitesMet = prerequisites.every((p) => p.met);

  const activeQueue = planet.activeBuildingQueue;
  const isUpgradingThis = activeQueue?.buildingKey === building.key;
  const isQueueBusy = Boolean(activeQueue);

  const canAffordMetal = planet.metal >= cost.metal;
  const canAffordCrystal = planet.crystal >= cost.crystal;
  const canAffordDeut = planet.deuterium >= cost.deuterium;
  const canAfford = canAffordMetal && canAffordCrystal && canAffordDeut;

  const canUpgrade = !isQueueBusy && canAfford && allPrerequisitesMet;

  const halveCost = activeQueue
    ? calculateHalveDurationCost(
        activeQueue.targetLevel,
        remainingQueueSeconds,
        (new Date(activeQueue.endTimeUtc).getTime() -
          new Date(activeQueue.startTimeUtc).getTime()) /
          1000
      )
    : 750;

  const instantCost = activeQueue
    ? calculateInstantCompletionCost(
        activeQueue.targetLevel,
        remainingQueueSeconds
      )
    : 750;

  return (
    <div className="rounded-lg border border-cyan-500/35 bg-gradient-to-b from-[#101824]/95 via-[#0b111a]/95 to-[#070a10]/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.75)] space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-100">{building.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300">
                Kademe {building.level}
              </span>

              {/* Kırmızı Yıkım Butonu (Yıkılamaz binalar: SpaceDock, Terraformer, LunarBase) */}
              {building.level > 0 &&
                !building.isUnit &&
                !INDESTRUCTIBLE_BUILDING_KEYS.has(building.key) && (
                <button
                  type="button"
                  onClick={() => setShowDemolishModal(true)}
                  title={`${building.name} binasını yık (1 kademe düşür)`}
                  disabled={isQueueBusy}
                  className={`p-1 rounded border text-xs font-mono transition flex items-center justify-center ${
                    isQueueBusy
                      ? "bg-zinc-800/50 border-zinc-700/60 text-zinc-600 cursor-not-allowed"
                      : "bg-rose-950/80 hover:bg-rose-900 border-rose-500/60 text-rose-300 hover:text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {!allPrerequisitesMet && (
              <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center gap-1">
                <Lock className="h-3 w-3 text-rose-400" />
                <span>Ön Koşul Eksik</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap mt-2 text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-zinc-400">Yapım süresi:</span>
              <span className="text-amber-300 font-semibold">
                {formatCountdownTurkish(cost.durationSeconds)}
              </span>
            </span>

            {building.key === "terraformer" && (
              <span className="text-emerald-300 font-semibold">
                Gezegen Alanı Bonusu: +5 Alan / Kademe
              </span>
            )}
            {building.key === "roboticsFactory" && (
              <span className="text-cyan-300 font-semibold">
                İnşaat Hızı Çarpanı: x{1 + building.level} → x
                {1 + building.level + 1}
              </span>
            )}
            {building.key === "naniteFactory" && (
              <span className="text-purple-300 font-semibold">
                Üretim Süresi Azaltımı: %50 / Kademe
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Teknoloji A. (Prerequisites / Tech Tree) Button */}
          <button
            type="button"
            onClick={() => setShowTechTree((v) => !v)}
            className={`px-3 py-1.5 rounded border text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
              showTechTree
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                : "bg-[#141e2d] hover:bg-[#1a273b] border-cyan-500/35 text-cyan-300"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
            <span>Teknoloji A.</span>
          </button>

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
      </div>

      {/* OGame Description */}
      <p className="text-xs text-zinc-300 leading-relaxed bg-[#06090e]/80 border border-zinc-800/80 rounded p-3">
        {building.description}
      </p>

      {/* Prerequisites / Teknoloji Ağacı Box (Always visible when unmet or when Teknoloji A. is toggled) */}
      {(showTechTree || prerequisites.length > 0) && (
        <div className="p-3.5 rounded-lg bg-[#070b12] border border-zinc-800/90 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
              <span>Teknoloji Ağacı & Ön Koşullar ({building.name})</span>
            </span>
            <Link
              href="/research"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
            >
              Araştırma Laboratuvarına Git →
            </Link>
          </div>

          {prerequisites.length === 0 ? (
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Bu tesis için herhangi bir ön koşul bulunmuyor.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prerequisites.map((req) => {
                const matchingFacility = planet.buildings.find(
                  (b) => b.name === req.label
                );
                return (
                  <div
                    key={req.label}
                    className={`px-3 py-2 rounded border flex items-center justify-between text-xs font-mono ${
                      req.met
                        ? "bg-emerald-950/20 border-emerald-500/35 text-emerald-300"
                        : "bg-rose-950/25 border-rose-500/45 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      )}
                      {matchingFacility && onSelectFacility ? (
                        <button
                          type="button"
                          onClick={() => onSelectFacility(matchingFacility.key)}
                          className="font-semibold hover:underline text-left"
                        >
                          {req.label}
                        </button>
                      ) : (
                        <Link
                          href={req.href}
                          className="font-semibold hover:underline"
                        >
                          {req.label}
                        </Link>
                      )}
                    </div>
                    <span className="font-bold">
                      Kademe {req.currentLevel} / {req.requiredLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Space Dock Wreckfield Panel (Task 15) */}
      {building.key === "spaceDock" && (
        <SpaceDockWreckPanel
          planetId={planet.id}
          spaceDockLevel={building.level}
        />
      )}

      {lastError && (
        <div className="px-3 py-2 rounded border border-rose-500/40 bg-rose-950/30 text-xs font-mono text-rose-300">
          {lastError}
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
          </div>
        </div>

        {/* Big Green Upgrade / Active Speedup & Dark Matter Shortcut Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {isUpgradingThis ? (
            <>
              {activeQueue?.isDemolition && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded bg-rose-950/70 border border-rose-500/60 text-rose-300 font-mono text-xs font-bold">
                  <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
                  <span>Yıkım: Kademe {activeQueue.targetLevel}</span>
                </div>
              )}

              <SpeedupActionButtons
                halveCost={halveCost}
                instantCost={instantCost}
                onHalve={() => setSpeedupModalType("halve")}
                onInstant={() => setSpeedupModalType("instant")}
                halveTitle={`Kalan süreyi yarıya indirir (${halveCost} KM)`}
                instantTitle={`İnşayı hemen tamamlar (${instantCost} KM)`}
              />

              <button
                type="button"
                onClick={() => cancelBuildingUpgrade(planet.id)}
                className="px-3 py-2.5 rounded-md bg-rose-950/80 hover:bg-rose-800 border border-rose-500/50 text-rose-200 font-mono text-xs font-semibold transition cursor-pointer"
              >
                İptal
              </button>
            </>
          ) : (
            <>
              {isQueueBusy && activeQueue && (
                <div className="flex items-center gap-2">
                  <SpeedupActionButtons
                    halveCost={halveCost}
                    instantCost={instantCost}
                    onHalve={() => setSpeedupModalType("halve")}
                    onInstant={() => setSpeedupModalType("instant")}
                    halveTitle={`Aktif inşaatı (${activeQueue.buildingName}) yarıya indirir (${halveCost} KM)`}
                    instantTitle={`Aktif inşaatı (${activeQueue.buildingName}) hemen tamamlar (${instantCost} KM)`}
                  />
                </div>
              )}

              {isQueueBusy && bonuses.hasCommander && allPrerequisitesMet ? (
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => {
                    const res = enqueueBuildingOrder({
                      planetId: planet.id,
                      buildingKey: building.key,
                      targetLevel: building.level + 1,
                      cost,
                      durationSeconds: cost.durationSeconds,
                    });
                    if (res.success) {
                      setFeedback({ type: "success", text: res.message });
                    } else {
                      setFeedback({ type: "error", text: res.message });
                    }
                  }}
                  className={`px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                    canAfford
                      ? "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                      : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Sıraya Ekle (Commander)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canUpgrade}
                  onClick={() => startBuildingUpgrade(building.key)}
                  className={`px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${
                    canUpgrade
                      ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                      : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>
                    {!allPrerequisitesMet
                      ? "Ön Koşul Gerekli"
                      : isQueueBusy
                      ? "İnşaat Sırası Dolu"
                      : !canAfford
                      ? "Yetersiz Hammadde"
                      : "Yükselt"}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Queue Inspector: Commander Multi-Queue (Task 05AP) */}
      {bonuses.hasCommander && planetQueuedOrders.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Gelişmiş İnşa Kuyruğu (Commander - {planetQueuedOrders.length}/5)
            </span>
          </div>
          <div className="space-y-1.5">
            {planetQueuedOrders.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-zinc-800 text-xs font-mono"
              >
                <span className="text-zinc-200">
                  <span className="text-amber-400 font-bold mr-2">#{idx + 2}</span>
                  {q.buildingKey} (Kademe {q.targetLevel})
                </span>
                <button
                  type="button"
                  onClick={() => dequeueBuildingOrder(q.id)}
                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px]"
                >
                  İptal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/50 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Speedup / Instant Complete Modal */}
      {speedupModalType && activeQueue && (
        <InstantCompleteModal
          isOpen={Boolean(speedupModalType)}
          onClose={() => setSpeedupModalType(null)}
          itemName={activeQueue.buildingName}
          targetLevel={activeQueue.targetLevel}
          cost={speedupModalType === "halve" ? halveCost : instantCost}
          userDarkMatter={darkMatter}
          actionType={speedupModalType}
          onConfirm={async () => {
            if (speedupModalType === "halve") {
              await halveBuildingDuration(planet.id);
            } else {
              await instantCompleteBuildingUpgrade(planet.id);
            }
          }}
        />
      )}

      {/* Demolition Confirmation Modal */}
      <DemolitionModal
        isOpen={showDemolishModal}
        onClose={() => setShowDemolishModal(false)}
        building={building}
        planet={planet}
      />
    </div>
  );
}

