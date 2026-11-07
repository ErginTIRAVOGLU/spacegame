"use client";

import { useState } from "react";
import { useCountdown, formatCountdownTurkish } from "@/hooks/useCountdown";
import { useGameStore, type ShipyardQueueEntry } from "@/store/useGameStore";
import { SHIPYARD_CATALOG } from "@/lib/shipyardCatalog";
import { DEFENSE_CATALOG } from "@/lib/defenseCatalog";
import { InstantCompleteModal } from "@/components/buildings/InstantCompleteModal";
import { SpeedupActionButtons } from "@/components/common/SpeedupActionButtons";
import {
  calculateHalveDurationCost,
  calculateInstantCompletionCost,
} from "@/lib/darkMatterFormulas";
import { Rocket, Clock, CheckCircle2 } from "lucide-react";

interface ShipyardQueueProps {
  queue: ShipyardQueueEntry[];
  serverTimeUtc?: string;
}

export function ShipyardQueue({ queue, serverTimeUtc }: ShipyardQueueProps) {
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const halveShipyardDuration = useGameStore((s) => s.halveShipyardDuration);
  const instantCompleteShipyardBatch = useGameStore(
    (s) => s.instantCompleteShipyardBatch
  );

  const [speedupModal, setSpeedupModal] = useState<{
    isOpen: boolean;
    itemName: string;
    cost: number;
    actionType: "instant" | "halve";
    batchId?: string;
  } | null>(null);

  const activeBatch = queue[0] ?? null;

  const currentUnitTimer = useCountdown(
    activeBatch?.nextUnitFinishUtc,
    undefined,
    {
      referenceUtc: serverTimeUtc,
      onComplete: () => {
        fetchBootstrap();
      },
    }
  );

  if (!queue || queue.length === 0) {
    return null;
  }

  // Calculate total remaining seconds across all queued batches
  const totalRemainingSeconds = queue.reduce((sum, item) => {
    const remainingUnits = Math.max(0, item.totalCount - item.completedCount);
    return sum + remainingUnits * item.unitDurationSeconds;
  }, 0);

  const activeRemainingUnits = activeBatch
    ? Math.max(0, activeBatch.totalCount - activeBatch.completedCount)
    : 0;
  const activeRemainingSec = activeBatch
    ? activeRemainingUnits * activeBatch.unitDurationSeconds
    : 0;
  const activeTotalSec = activeBatch
    ? Math.max(1, activeBatch.totalCount * activeBatch.unitDurationSeconds)
    : 1;
  const activeHalveCost = activeBatch
    ? calculateHalveDurationCost(1, activeRemainingSec, activeTotalSec)
    : 750;
  const activeInstantCost = activeBatch
    ? calculateInstantCompletionCost(1, activeRemainingSec)
    : 750;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#16120b] via-[#0d1017] to-[#070a10] p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Aktif Tersane Üretim Kuyruğu ({queue.length} Sipariş)
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-zinc-500">Toplam Kalan Süre:</span>
          <span className="text-amber-300 font-bold">
            {formatCountdownTurkish(totalRemainingSeconds)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {queue.map((batch, index) => {
          const shipDef = SHIPYARD_CATALOG.find((s) => s.unitType === batch.unitType);
          const defenseDef = DEFENSE_CATALOG.find((d) => d.unitType === batch.unitType);
          const unitName = shipDef?.name ?? defenseDef?.name ?? `Birim #${batch.unitType}`;
          const isCurrent = index === 0;
          const progressPct = Math.min(
            100,
            Math.round((batch.completedCount / Math.max(1, batch.totalCount)) * 100)
          );

          return (
            <div
              key={batch.id}
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 text-xs font-mono ${
                isCurrent
                  ? "bg-[#111926] border-amber-500/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                  : "bg-[#0b1018] border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">#{index + 1}</span>
                  <span className="font-bold text-zinc-100">{unitName}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-300 font-bold">
                      Üretiliyor
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-cyan-300 font-bold">
                    {batch.completedCount} / {batch.totalCount} Adet
                  </span>
                  {isCurrent && (
                    <span
                      suppressHydrationWarning
                      className="text-amber-400 font-bold tabular-nums"
                    >
                      Sonraki: {currentUnitTimer.formattedTr}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCurrent
                      ? "bg-gradient-to-r from-amber-500 to-amber-300"
                      : "bg-zinc-700"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {isCurrent ? (
                <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>Birim üretim süresi: {batch.unitDurationSeconds}sn</span>
                    <span>
                      Kalan: {Math.max(0, batch.totalCount - batch.completedCount)} Adet
                    </span>
                  </div>

                  <SpeedupActionButtons
                    variant="compact"
                    halveCost={activeHalveCost}
                    instantCost={activeInstantCost}
                    onHalve={() =>
                      setSpeedupModal({
                        isOpen: true,
                        itemName: unitName,
                        cost: activeHalveCost,
                        actionType: "halve",
                        batchId: batch.id,
                      })
                    }
                    onInstant={() =>
                      setSpeedupModal({
                        isOpen: true,
                        itemName: unitName,
                        cost: activeInstantCost,
                        actionType: "instant",
                        batchId: batch.id,
                      })
                    }
                    halveTitle={`Tersane üretim süresini yarıya indirir (${activeHalveCost} KM)`}
                    instantTitle={`Tersane üretimini hemen tamamlar (${activeInstantCost} KM)`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Birim üretim süresi: {batch.unitDurationSeconds}sn</span>
                  <span>
                    Kalan: {Math.max(0, batch.totalCount - batch.completedCount)} Adet
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {speedupModal?.isOpen && (
        <InstantCompleteModal
          isOpen={speedupModal.isOpen}
          onClose={() => setSpeedupModal(null)}
          itemName={speedupModal.itemName}
          cost={speedupModal.cost}
          userDarkMatter={darkMatter}
          actionType={speedupModal.actionType}
          isShipyard
          onConfirm={async () => {
            if (speedupModal.actionType === "halve") {
              await halveShipyardDuration(selectedPlanetId, speedupModal.batchId);
            } else {
              await instantCompleteShipyardBatch(selectedPlanetId, speedupModal.batchId);
            }
          }}
        />
      )}
    </div>
  );
}

