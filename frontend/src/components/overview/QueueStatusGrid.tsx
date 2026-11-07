"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useGameStore } from "@/store/useGameStore";
import { useCountdown } from "@/hooks/useCountdown";
import { InstantCompleteModal } from "@/components/buildings/InstantCompleteModal";
import { SpeedupActionButtons } from "@/components/common/SpeedupActionButtons";
import {
  calculateHalveDurationCost,
  calculateInstantCompletionCost,
} from "@/lib/darkMatterFormulas";
import {
  Hammer,
  FlaskConical,
  Rocket,
  Dna,
  BrainCircuit,
  X,
  FastForward,
  Zap,
} from "lucide-react";

const UNIT_NAMES: Record<number, string> = {
  202: "Küçük Nakliye",
  203: "Büyük Nakliye",
  204: "Hafif Avcı",
  205: "Ağır Avcı",
  206: "Kruvazör",
  207: "Komuta Gemisi",
  208: "Koloni Gemisi",
  209: "Geri Dönüşümcü",
  210: "Casus Sondası",
};

export function QueueStatusGrid() {
  const queryClient = useQueryClient();
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const cancelBuildingUpgrade = useGameStore((s) => s.cancelBuildingUpgrade);
  const halveBuildingDuration = useGameStore((s) => s.halveBuildingDuration);
  const instantCompleteBuildingUpgrade = useGameStore(
    (s) => s.instantCompleteBuildingUpgrade
  );
  const halveResearchDuration = useGameStore((s) => s.halveResearchDuration);
  const instantCompleteResearch = useGameStore((s) => s.instantCompleteResearch);
  const cancelLifeformBuilding = useGameStore((s) => s.cancelLifeformBuilding);
  const halveLifeformBuildingDuration = useGameStore(
    (s) => s.halveLifeformBuildingDuration
  );
  const instantCompleteLifeformBuilding = useGameStore(
    (s) => s.instantCompleteLifeformBuilding
  );
  const halveShipyardDuration = useGameStore((s) => s.halveShipyardDuration);
  const instantCompleteShipyardBatch = useGameStore(
    (s) => s.instantCompleteShipyardBatch
  );
  const completeActiveBuildingUpgrade = useGameStore(
    (s) => s.completeActiveBuildingUpgrade
  );

  const [speedupModal, setSpeedupModal] = useState<{
    isOpen: boolean;
    itemName: string;
    targetLevel: number;
    cost: number;
    actionType: "instant" | "halve";
    isResearch: boolean;
    isLifeform?: boolean;
    isShipyard?: boolean;
  } | null>(null);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const buildingQueue = planet.activeBuildingQueue;
  const shipyardBatch = planet.shipyardQueue?.[0] ?? null;

  const nowMs = Date.now();
  const buildingRemainingSec = buildingQueue
    ? Math.max(0, (new Date(buildingQueue.endTimeUtc).getTime() - nowMs) / 1000)
    : 0;
  const buildingTotalSec = buildingQueue
    ? Math.max(
        1,
        (new Date(buildingQueue.endTimeUtc).getTime() -
          new Date(buildingQueue.startTimeUtc).getTime()) /
          1000
      )
    : 1;

  const buildingHalveCost = buildingQueue
    ? calculateHalveDurationCost(
        buildingQueue.targetLevel,
        buildingRemainingSec,
        buildingTotalSec
      )
    : 750;

  const buildingInstantCost = buildingQueue
    ? calculateInstantCompletionCost(
        buildingQueue.targetLevel,
        buildingRemainingSec
      )
    : 750;

  const researchRemainingSec = activeResearchQueue
    ? Math.max(
        0,
        (new Date(activeResearchQueue.endTimeUtc).getTime() - nowMs) / 1000
      )
    : 0;
  const researchTotalSec = activeResearchQueue
    ? Math.max(
        1,
        (new Date(activeResearchQueue.endTimeUtc).getTime() -
          new Date(activeResearchQueue.startTimeUtc).getTime()) /
          1000
      )
    : 1;

  const researchHalveCost = activeResearchQueue
    ? calculateHalveDurationCost(
        activeResearchQueue.targetLevel,
        researchRemainingSec,
        researchTotalSec
      )
    : 750;

  const researchInstantCost = activeResearchQueue
    ? calculateInstantCompletionCost(
        activeResearchQueue.targetLevel,
        researchRemainingSec
      )
    : 750;

  const lifeformQueue = planet.activeLifeformQueue;

  const lifeformRemainingSec = lifeformQueue
    ? Math.max(0, (new Date(lifeformQueue.endTimeUtc).getTime() - nowMs) / 1000)
    : 0;
  const lifeformTotalSec = lifeformQueue
    ? Math.max(
        1,
        (new Date(lifeformQueue.endTimeUtc).getTime() -
          new Date(lifeformQueue.startTimeUtc).getTime()) /
          1000
      )
    : 1;

  const lifeformHalveCost = lifeformQueue
    ? calculateHalveDurationCost(
        lifeformQueue.targetLevel,
        lifeformRemainingSec,
        lifeformTotalSec
      )
    : 750;

  const lifeformInstantCost = lifeformQueue
    ? calculateInstantCompletionCost(
        lifeformQueue.targetLevel,
        lifeformRemainingSec
      )
    : 750;

  const lifeformTimer = useCountdown(
    lifeformQueue?.endTimeUtc,
    lifeformQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ["planet", planet.id] });
        completeActiveBuildingUpgrade();
      },
    }
  );

  const buildingTimer = useCountdown(
    buildingQueue?.endTimeUtc,
    buildingQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ["planet", planet.id] });
        completeActiveBuildingUpgrade();
      },
    }
  );

  const researchTimer = useCountdown(
    activeResearchQueue?.endTimeUtc,
    activeResearchQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ["planet", planet.id] });
        completeActiveBuildingUpgrade();
      },
    }
  );

  const shipyardTimer = useCountdown(
    shipyardBatch?.nextUnitFinishUtc,
    undefined,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ["planet", planet.id] });
        completeActiveBuildingUpgrade();
      },
    }
  );

  const shipyardProgressPct = shipyardBatch
    ? Math.min(
        100,
        Math.round(
          (shipyardBatch.completedCount / Math.max(1, shipyardBatch.totalCount)) *
            100
        )
      )
    : 0;

  const shipyardRemainingUnits = shipyardBatch
    ? Math.max(0, shipyardBatch.totalCount - shipyardBatch.completedCount)
    : 0;
  const shipyardRemainingSec = shipyardBatch
    ? shipyardRemainingUnits * shipyardBatch.unitDurationSeconds
    : 0;
  const shipyardTotalSec = shipyardBatch
    ? Math.max(1, shipyardBatch.totalCount * shipyardBatch.unitDurationSeconds)
    : 1;
  const shipyardHalveCost = shipyardBatch
    ? calculateHalveDurationCost(1, shipyardRemainingSec, shipyardTotalSec)
    : 750;
  const shipyardInstantCost = shipyardBatch
    ? calculateInstantCompletionCost(1, shipyardRemainingSec)
    : 750;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* 1. Bina (Building Queue) */}
      <div className="rounded-lg border border-zinc-800/90 bg-gradient-to-b from-[#111823]/95 to-[#090d14]/95 overflow-hidden flex flex-col justify-between shadow-md">
        <div className="px-3.5 py-2 bg-[#16202e] border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <Hammer className="h-3.5 w-3.5 text-cyan-400" />
            <span>Bina</span>
          </span>
          {buildingQueue && (
            <button
              type="button"
              onClick={() => cancelBuildingUpgrade(planet.id)}
              title="İnşaatı İptal Et"
              className="h-5 w-5 rounded bg-rose-950/80 hover:bg-rose-600 border border-rose-500/60 text-rose-200 flex items-center justify-center transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between">
          {buildingQueue ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-gradient-to-br from-cyan-900/60 to-zinc-950 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Hammer className="h-6 w-6 text-cyan-300 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate">
                    {buildingQueue.buildingName}
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 font-semibold ${
                      buildingQueue.isDemolition
                        ? "text-rose-400"
                        : "text-cyan-300"
                    }`}
                  >
                    {buildingQueue.isDemolition
                      ? `Yıkım: Kademe ${buildingQueue.targetLevel}`
                      : `Yükselt: Kademe ${buildingQueue.targetLevel}`}
                  </div>
                  <div
                    suppressHydrationWarning
                    className="text-sm font-mono font-bold text-amber-400 mt-1 tabular-nums"
                  >
                    {buildingTimer.formattedTr}
                  </div>
                </div>
              </div>

              <SpeedupActionButtons
                variant="compact"
                halveCost={buildingHalveCost}
                instantCost={buildingInstantCost}
                onHalve={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: buildingQueue.buildingName,
                    targetLevel: buildingQueue.targetLevel,
                    cost: buildingHalveCost,
                    actionType: "halve",
                    isResearch: false,
                  })
                }
                onInstant={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: buildingQueue.buildingName,
                    targetLevel: buildingQueue.targetLevel,
                    cost: buildingInstantCost,
                    actionType: "instant",
                    isResearch: false,
                  })
                }
                halveTitle={`Kalan süreyi yarıya indirir (${buildingHalveCost} KM)`}
                instantTitle={`İnşayı hemen tamamlar (${buildingInstantCost} KM)`}
              />
            </div>
          ) : (
            <div className="py-4 text-center space-y-1.5">
              <div className="text-xs text-zinc-400">Bina inşası yok.</div>
              <Link
                href="/resources"
                className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
              >
                (İkmale Git)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. Araştırma (Research Queue) */}
      <div className="rounded-lg border border-zinc-800/90 bg-gradient-to-b from-[#111823]/95 to-[#090d14]/95 overflow-hidden flex flex-col justify-between shadow-md">
        <div className="px-3.5 py-2 bg-[#16202e] border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
            <span>Araştırma</span>
          </span>
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-center">
          {activeResearchQueue ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-gradient-to-br from-emerald-900/60 to-zinc-950 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-6 w-6 text-emerald-300 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate">
                    {activeResearchQueue.researchName}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                    Yükselt: Kademe {activeResearchQueue.targetLevel}
                  </div>
                  <div
                    suppressHydrationWarning
                    className="text-sm font-mono font-bold text-amber-400 mt-1 tabular-nums"
                  >
                    {researchTimer.formattedTr}
                  </div>
                </div>
              </div>

              <SpeedupActionButtons
                variant="compact"
                halveCost={researchHalveCost}
                instantCost={researchInstantCost}
                onHalve={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: activeResearchQueue.researchName,
                    targetLevel: activeResearchQueue.targetLevel,
                    cost: researchHalveCost,
                    actionType: "halve",
                    isResearch: true,
                  })
                }
                onInstant={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: activeResearchQueue.researchName,
                    targetLevel: activeResearchQueue.targetLevel,
                    cost: researchInstantCost,
                    actionType: "instant",
                    isResearch: true,
                  })
                }
                halveTitle={`Kalan araştırma süresini yarıya indirir (${researchHalveCost} KM)`}
                instantTitle={`Araştırmayı hemen tamamlar (${researchInstantCost} KM)`}
              />
            </div>
          ) : (
            <div className="py-4 text-center space-y-1.5">
              <div className="text-xs text-zinc-400">
                Şuan araştırma yapılmıyor.
              </div>
              <Link
                href="/research"
                className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
              >
                (Araştırmaya Git)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Tersane (Shipyard Queue) */}
      <div className="rounded-lg border border-zinc-800/90 bg-gradient-to-b from-[#111823]/95 to-[#090d14]/95 overflow-hidden flex flex-col justify-between shadow-md">
        <div className="px-3.5 py-2 bg-[#16202e] border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <Rocket className="h-3.5 w-3.5 text-amber-400" />
            <span>Tersane</span>
          </span>
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-center">
          {shipyardBatch ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-gradient-to-br from-amber-900/50 to-zinc-950 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Rocket className="h-6 w-6 text-amber-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate">
                    {UNIT_NAMES[shipyardBatch.unitType] ??
                      `Ünite #${shipyardBatch.unitType}`}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300">
                    Kalan:{" "}
                    {Math.max(
                      0,
                      shipyardBatch.totalCount - shipyardBatch.completedCount
                    )}{" "}
                    / {shipyardBatch.totalCount}
                  </div>
                  <div
                    suppressHydrationWarning
                    className="text-xs font-mono text-amber-400 mt-0.5 tabular-nums"
                  >
                    Sonraki: {shipyardTimer.formattedTr}
                  </div>
                </div>
              </div>

              <div className="h-1.5 w-full rounded bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${shipyardProgressPct}%` }}
                />
              </div>

              <SpeedupActionButtons
                variant="compact"
                halveCost={shipyardHalveCost}
                instantCost={shipyardInstantCost}
                onHalve={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName:
                      UNIT_NAMES[shipyardBatch.unitType] ??
                      `Ünite #${shipyardBatch.unitType}`,
                    targetLevel: 1,
                    cost: shipyardHalveCost,
                    actionType: "halve",
                    isResearch: false,
                    isShipyard: true,
                  })
                }
                onInstant={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName:
                      UNIT_NAMES[shipyardBatch.unitType] ??
                      `Ünite #${shipyardBatch.unitType}`,
                    targetLevel: 1,
                    cost: shipyardInstantCost,
                    actionType: "instant",
                    isResearch: false,
                    isShipyard: true,
                  })
                }
                halveTitle={`Tersane üretim süresini yarıya indirir (${shipyardHalveCost} KM)`}
                instantTitle={`Tersane üretimini hemen tamamlar (${shipyardInstantCost} KM)`}
              />
            </div>
          ) : (
            <div className="py-4 text-center space-y-1.5">
              <div className="text-xs text-zinc-400">
                Gemi/Savunma inşası yok.
              </div>
              <Link
                href="/shipyard"
                className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
              >
                (Gemi tersanesine git)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 4. Canlı Türü Binası (Lifeform Building) */}
      <div className="rounded-lg border border-zinc-800/90 bg-gradient-to-b from-[#111823]/95 to-[#090d14]/95 overflow-hidden flex flex-col justify-between shadow-md">
        <div className="px-3.5 py-2 bg-[#16202e] border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Dna className="h-3.5 w-3.5 text-purple-400" />
            <span>Canlı Türü Binası</span>
          </span>
          {lifeformQueue && (
            <button
              type="button"
              onClick={() => cancelLifeformBuilding(planet.id)}
              title="İnşaatı İptal Et"
              className="h-5 w-5 rounded bg-rose-950/80 hover:bg-rose-600 border border-rose-500/60 text-rose-200 flex items-center justify-center transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between">
          {lifeformQueue ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-gradient-to-br from-purple-900/60 to-zinc-950 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <Dna className="h-6 w-6 text-purple-300 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-100 truncate">
                    {lifeformQueue.buildingName}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 font-semibold text-purple-300">
                    Yükselt: Kademe {lifeformQueue.targetLevel}
                  </div>
                  <div
                    suppressHydrationWarning
                    className="text-sm font-mono font-bold text-amber-400 mt-1 tabular-nums"
                  >
                    {lifeformTimer.formattedTr}
                  </div>
                </div>
              </div>

              <SpeedupActionButtons
                variant="compact"
                halveCost={lifeformHalveCost}
                instantCost={lifeformInstantCost}
                onHalve={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: lifeformQueue.buildingName,
                    targetLevel: lifeformQueue.targetLevel,
                    cost: lifeformHalveCost,
                    actionType: "halve",
                    isResearch: false,
                    isLifeform: true,
                  })
                }
                onInstant={() =>
                  setSpeedupModal({
                    isOpen: true,
                    itemName: lifeformQueue.buildingName,
                    targetLevel: lifeformQueue.targetLevel,
                    cost: lifeformInstantCost,
                    actionType: "instant",
                    isResearch: false,
                    isLifeform: true,
                  })
                }
                halveTitle={`Kalan süreyi yarıya indirir (${lifeformHalveCost} KM)`}
                instantTitle={`İnşayı hemen tamamlar (${lifeformInstantCost} KM)`}
              />
            </div>
          ) : (
            <div className="py-4 text-center space-y-1.5">
              <div className="text-xs text-zinc-500">
                Canlı türü bina inşası yok.
              </div>
              <Link
                href="/lifeforms"
                className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
              >
                (Canlı Türü Binalarına Git)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Canlı Türü Araştırması (Lifeform Research Placeholder) */}
      <div className="rounded-lg border border-zinc-800/75 bg-gradient-to-b from-[#0e141d]/90 to-[#070a0f]/90 overflow-hidden flex flex-col justify-between md:col-span-2">
        <div className="px-3.5 py-2 bg-[#121a26] border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
            <span>Canlı Türü Araştırması</span>
          </span>
        </div>
        <div className="p-4 text-center space-y-1.5">
          <div className="text-xs text-zinc-500">
            Şu anda canlı türü araştırması yapılmıyor.
          </div>
          <Link
            href="/lifeforms/tech-tree"
            className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
          >
            (Canlı Türü Gelişimine Git)
          </Link>
        </div>
      </div>

      {speedupModal?.isOpen && (
        <InstantCompleteModal
          isOpen={speedupModal.isOpen}
          onClose={() => setSpeedupModal(null)}
          itemName={speedupModal.itemName}
          targetLevel={speedupModal.targetLevel}
          cost={speedupModal.cost}
          userDarkMatter={darkMatter}
          actionType={speedupModal.actionType}
          isResearch={speedupModal.isResearch}
          isShipyard={speedupModal.isShipyard}
          isLifeform={speedupModal.isLifeform}
          onConfirm={async () => {
            if (speedupModal.isShipyard) {
              if (speedupModal.actionType === "halve") {
                await halveShipyardDuration(planet.id);
              } else {
                await instantCompleteShipyardBatch(planet.id);
              }
            } else if (speedupModal.isLifeform) {
              if (speedupModal.actionType === "halve") {
                await halveLifeformBuildingDuration(planet.id);
              } else {
                await instantCompleteLifeformBuilding(planet.id);
              }
            } else if (speedupModal.isResearch) {
              if (speedupModal.actionType === "halve") {
                await halveResearchDuration();
              } else {
                await instantCompleteResearch();
              }
            } else {
              if (speedupModal.actionType === "halve") {
                await halveBuildingDuration(planet.id);
              } else {
                await instantCompleteBuildingUpgrade(planet.id);
              }
            }
          }}
        />
      )}
    </div>
  );
}

