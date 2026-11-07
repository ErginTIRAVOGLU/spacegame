"use client";

import { useState } from "react";
import {
  type BuildingInfo,
  type PlanetSummary,
  calculateBuildingEnergyDelta,
  calculateSolarSatelliteUnitEnergy,
  calculateStorageCapacity,
  calculateUpgradeCost,
  useGameStore,
} from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  ArrowUpCircle,
  Clock,
  Zap,
  Boxes,
  Gem,
  Droplets,
  FastForward,
  Database,
  X,
  Trash2,
  Flame,
  Rocket,
  Plus,
  Layers,
} from "lucide-react";
import { DemolitionModal } from "@/components/facilities/DemolitionModal";
import { InstantCompleteModal } from "@/components/buildings/InstantCompleteModal";
import { SpeedupActionButtons } from "@/components/common/SpeedupActionButtons";
import {
  calculateHalveDurationCost,
  calculateInstantCompletionCost,
} from "@/lib/darkMatterFormulas";

const INDESTRUCTIBLE_BUILDING_KEYS = new Set([
  "spaceDock",
  "terraformer",
  "lunarBase",
  "moonBase",
]);

interface ResourceDetailPanelProps {
  building: BuildingInfo;
  planet: PlanetSummary;
  remainingQueueSeconds: number;
  onClose?: () => void;
}

export function ResourceDetailPanel({
  building,
  planet,
  remainingQueueSeconds,
  onClose,
}: ResourceDetailPanelProps) {
  const [showDemolishModal, setShowDemolishModal] = useState(false);
  const [speedupModalType, setSpeedupModalType] = useState<"instant" | "halve" | null>(null);

  const darkMatter = useGameStore((s) => s.darkMatter);
  const researches = useGameStore((s) => s.researches);
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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const planetQueuedOrders = queuedBuildingOrders.filter((q) => q.planetId === planet.id);

  const roboticsLevel =
    planet.buildings.find((b) => b.key === "roboticsFactory")?.level ?? 0;
  const naniteLevel =
    planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;
  const cost = calculateUpgradeCost(building, roboticsLevel, naniteLevel);
  const energyTechLevel = researches[113] ?? 0;
  const energyDelta = calculateBuildingEnergyDelta(building, planet.tempMax, energyTechLevel);
  const satUnitEnergy = calculateSolarSatelliteUnitEnergy(planet.tempMax);

  const dynamicDescription = building.description.replace(
    "{SolarSatelliteEnergy}",
    String(satUnitEnergy)
  );

  const activeQueue = planet.activeBuildingQueue;
  const isUpgradingThis = activeQueue?.buildingKey === building.key;
  const isQueueBusy = Boolean(activeQueue) && !building.isUnit;

  const canAffordMetal = planet.metal >= cost.metal;
  const canAffordCrystal = planet.crystal >= cost.crystal;
  const canAffordDeut = planet.deuterium >= cost.deuterium;
  const canAfford = canAffordMetal && canAffordCrystal && canAffordDeut;

  const isStorageItem = building.category === "storage";
  const isForbiddenOnMoon = Boolean(planet.isMoon) && isStorageItem;
  const maxStorageCapacity = calculateStorageCapacity(building.level);
  const nextStorageCapacity = calculateStorageCapacity(building.level + 1);
  const currentStoredResource =
    building.key === "metalStorage"
      ? planet.metal
      : building.key === "crystalStorage"
      ? planet.crystal
      : building.key === "deuteriumTank"
      ? planet.deuterium
      : 0;
  const storageFillPercent = Math.min(
    100,
    Math.round((currentStoredResource / Math.max(1, maxStorageCapacity)) * 100)
  );

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
                {building.isUnit
                  ? `Konuşlu: ${building.level}`
                  : `Kademe ${building.level}`}
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
          </div>

          <div className="flex items-center gap-4 flex-wrap mt-2 text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-zinc-400">Yapım süresi:</span>
              <span className="text-amber-300 font-semibold">
                {formatCountdownTurkish(cost.durationSeconds)}
              </span>
            </span>

            {energyDelta.value !== 0 && (
              <span className="flex items-center gap-1.5">
                <Zap
                  className={`h-3.5 w-3.5 ${
                    energyDelta.isProduction
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                />
                <span className="text-zinc-400">{energyDelta.label}:</span>
                <span
                  className={
                    energyDelta.isProduction
                      ? "text-emerald-300 font-semibold"
                      : "text-amber-300 font-semibold"
                  }
                >
                  {energyDelta.value}
                </span>
              </span>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dynamic OGame Description */}
      <p className="text-xs text-zinc-300 leading-relaxed bg-[#06090e]/80 border border-zinc-800/80 rounded p-3">
        {dynamicDescription}
      </p>

      {/* Storage Capacity Progress Bar (Shown when Metal Deposu, Kristal Deposu, or Deuterium Tankeri is selected) */}
      {isStorageItem && (
        <div className="p-3.5 rounded-lg bg-[#070b12] border border-cyan-500/25 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 flex items-center gap-1.5 font-semibold">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Depo kapasitesi:</span>
            </span>
            <span className="text-zinc-100 font-bold">
              {Math.floor(currentStoredResource).toLocaleString("en-US")} /{" "}
              {maxStorageCapacity.toLocaleString("en-US")}{" "}
              <span className="text-emerald-400 text-[11px]">
                (Sonraki Kademe: {nextStorageCapacity.toLocaleString("en-US")})
              </span>
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                storageFillPercent >= 90
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-400"
              }`}
              style={{ width: `${storageFillPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Solar Satellite Active Shipyard Queue Indicator (Task 05AO) */}
      {building.key === "solarSatellite" && (() => {
        const satBatch = planet.shipyardQueue?.find((b) => b.unitType === 212);
        if (!satBatch || satBatch.totalCount <= satBatch.completedCount) return null;
        const remaining = satBatch.totalCount - satBatch.completedCount;
        return (
          <div className="flex items-center justify-between p-3 rounded-lg bg-sky-950/40 border border-sky-400/50 text-xs font-mono text-sky-200 shadow-md">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-sky-400 animate-pulse" />
              <span className="font-bold">Tersane Kuyruğunda Üretim Devam Ediyor:</span>
              <span>{remaining} adet Solar Uydu üretiliyor</span>
            </div>
            <span className="text-sky-300 font-bold tabular-nums">
              {satBatch.completedCount} / {satBatch.totalCount}
            </span>
          </div>
        );
      })()}

      {/* Upgrade Requirements & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            {building.isUnit
              ? "1 Birim Üretim Maliyeti:"
              : `Kademe ${cost.targetLevel} İçin Gereken Hammaddeler:`}
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

        {/* Big Green Upgrade / Active Speedup Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
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
          ) : isQueueBusy && bonuses.hasCommander ? (
            <button
              type="button"
              disabled={isForbiddenOnMoon || !canAfford}
              onClick={() => {
                if (isForbiddenOnMoon) return;
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
                !isForbiddenOnMoon && canAfford
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                  : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>{isForbiddenOnMoon ? "Ayda İnşa Edilemez" : "Sıraya Ekle (Commander)"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isForbiddenOnMoon || isQueueBusy || !canAfford}
              onClick={() => !isForbiddenOnMoon && startBuildingUpgrade(building.key)}
              className={`px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${
                !isForbiddenOnMoon && !isQueueBusy && canAfford
                  ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>
                {isForbiddenOnMoon
                  ? "Ayda İnşa Edilemez"
                  : isQueueBusy
                  ? "İnşaat Sırası Dolu"
                  : !canAfford
                  ? "Yetersiz Hammadde"
                  : building.isUnit
                  ? "Üret (+1)"
                  : "Yükselt"}
              </span>
            </button>
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

      {/* Speedup / Instant Completion Modal */}
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

