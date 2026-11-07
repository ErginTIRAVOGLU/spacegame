"use client";

import { useState } from "react";
import Link from "next/link";
import { type PlanetSummary, useGameStore } from "@/store/useGameStore";
import {
  type DefenseDefinition,
  calculateMaxAffordableDefenses,
  calculateUnitDurationSeconds,
  calculateMissileSiloStatus,
  calculateIpmRange,
  evaluateDefensePrerequisites,
} from "@/lib/defenseCatalog";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  Shield,
  Clock,
  Boxes,
  Gem,
  Droplets,
  Lock,
  GitBranch,
  CheckCircle2,
  X,
  ShieldAlert,
  Radio,
  Rocket,
  Info,
} from "lucide-react";

interface DefenseDetailPanelProps {
  defense: DefenseDefinition;
  planet: PlanetSummary;
  stationedCount: number;
  onClose?: () => void;
}

export function DefenseDetailPanel({
  defense,
  planet,
  stationedCount,
  onClose,
}: DefenseDetailPanelProps) {
  const researches = useGameStore((s) => s.researches);
  const enqueueShipyardBatch = useGameStore((s) => s.enqueueShipyardBatch);

  const [quantity, setQuantity] = useState<number>(1);
  const [showTechTree, setShowTechTree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const siloLevel = planet.buildings.find((b) => b.key === "missileSilo")?.level ?? 0;
  const shipyardLevel = planet.buildings.find((b) => b.key === "shipyard")?.level ?? 0;
  const naniteLevel = planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;
  const impulseDriveLevel = researches[117] ?? 0;

  const queuedBatches = planet.shipyardQueue ?? [];
  const queuedCount = queuedBatches
    .filter((q) => q.unitType === defense.unitType)
    .reduce((sum, q) => sum + Math.max(0, q.totalCount - q.completedCount), 0);

  const siloStatus = calculateMissileSiloStatus(siloLevel, planet.units ?? [], queuedBatches);

  const maxAffordable = calculateMaxAffordableDefenses(
    defense,
    planet.metal,
    planet.crystal,
    planet.deuterium,
    planet.units ?? [],
    queuedBatches,
    siloLevel
  );

  const unitDurationSeconds = calculateUnitDurationSeconds(
    defense.metal,
    defense.crystal,
    shipyardLevel,
    naniteLevel
  );

  const totalDurationSeconds = unitDurationSeconds * Math.max(1, quantity);

  const prereqResults = evaluateDefensePrerequisites(
    defense,
    planet.buildings,
    researches
  );
  const allPrerequisitesMet = prereqResults.every((p) => p.met);

  const ipmRange = calculateIpmRange(impulseDriveLevel);
  const dynamicDescription = defense.description.replace(
    "{Range}",
    String(ipmRange)
  );

  const isShieldDomeExceeded = defense.isShieldDome && stationedCount + queuedCount >= 1;
  const slotCost = defense.missileSlotCost ?? 1;
  const isMissileSiloFull = defense.isMissile && siloStatus.remainingSlots < slotCost;

  const totalMetalCost = defense.metal * quantity;
  const totalCrystalCost = defense.crystal * quantity;
  const totalDeutCost = defense.deuterium * quantity;

  const canAfford =
    quantity > 0 &&
    quantity <= maxAffordable &&
    planet.metal >= totalMetalCost &&
    planet.crystal >= totalCrystalCost &&
    planet.deuterium >= totalDeutCost;

  const handleBuild = async () => {
    if (quantity <= 0 || !canAfford || !allPrerequisitesMet) return;

    setIsSubmitting(true);
    setFeedback(null);

    const success = await enqueueShipyardBatch(defense.unitType, quantity);
    setIsSubmitting(false);

    if (success) {
      setFeedback({
        type: "success",
        text: `${quantity} adet ${defense.name} başarıyla üretim kuyruğuna eklendi.`,
      });
      setQuantity(1);
    } else {
      setFeedback({
        type: "error",
        text: "Savunma üretimi kuyruğa eklenemedi. Gereksinimleri veya kaynakları kontrol edin.",
      });
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-6 space-y-5 shadow-2xl relative">
      {/* Header bar */}
      <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-100">{defense.name}</h2>
            {defense.isShieldDome && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/80 border border-sky-500/40 text-sky-300">
                Gezegen Başına En Fazla 1 Adet
              </span>
            )}
            {defense.isMissile && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950/80 border border-red-500/40 text-red-300">
                {defense.missileSlotCost} Silo Yuvası
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
            <span>
              Mevcut Konuşlu:{" "}
              <strong className="text-zinc-200">{stationedCount} Adet</strong>
            </span>
            {queuedCount > 0 && (
              <span className="text-amber-400">
                (Kuyrukta: <strong>+{queuedCount}</strong>)
              </span>
            )}
            <span className="flex items-center gap-1 font-mono text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Yapım süresi:{" "}
              <span className="text-zinc-200">
                {formatCountdownTurkish(unitDurationSeconds)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTechTree(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 hover:border-amber-500/50 text-xs font-semibold text-zinc-300 hover:text-amber-300 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Teknoloji A.
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
        {dynamicDescription}
      </p>

      {/* Special Warnings / Status Banners */}
      {defense.isShieldDome && isShieldDomeExceeded && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 text-xs text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Bu gezegende kalkan kubbesi zaten konuşlandırılmış veya üretim kuyruğundadır. Gezegen başına maksimum 1 adet kurulabilir.
          </span>
        </div>
      )}

      {defense.isMissile && (
        <div className="p-3 rounded-lg border border-zinc-800 bg-[#090d14] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span className="text-zinc-300">
              Füze Silosu Durumu:{" "}
              <strong className="text-cyan-300">
                {siloStatus.usedSlots} / {siloStatus.totalCapacitySlots} Slot Dolu
              </strong>{" "}
              (Seviye {siloStatus.siloLevel})
            </span>
          </div>
          <div className="text-zinc-400">
            Kalan Boş Slot:{" "}
            <strong className={siloStatus.remainingSlots > 0 ? "text-emerald-400" : "text-rose-400"}>
              {siloStatus.remainingSlots}
            </strong>
          </div>
        </div>
      )}

      {/* Unit Cost Breakdown */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Birim Maliyeti:
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
              planet.metal < defense.metal * Math.max(1, quantity)
                ? "border-red-500/50 bg-red-950/20 text-red-300"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-zinc-400" />
              <span>Metal</span>
            </div>
            <span className="font-bold">
              {(defense.metal * Math.max(1, quantity)).toLocaleString()}
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
              planet.crystal < defense.crystal * Math.max(1, quantity)
                ? "border-red-500/50 bg-red-950/20 text-red-300"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Gem className="h-3.5 w-3.5 text-cyan-400" />
              <span>Kristal</span>
            </div>
            <span className="font-bold">
              {(defense.crystal * Math.max(1, quantity)).toLocaleString()}
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
              planet.deuterium < defense.deuterium * Math.max(1, quantity)
                ? "border-red-500/50 bg-red-950/20 text-red-300"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-teal-400" />
              <span>Döteryum</span>
            </div>
            <span className="font-bold">
              {(defense.deuterium * Math.max(1, quantity)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Production Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-3">
          <label
            htmlFor="defense-quantity"
            className="text-xs font-semibold text-zinc-300 shrink-0"
          >
            Miktar:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="defense-quantity"
              type="number"
              min={1}
              max={Math.max(1, maxAffordable)}
              disabled={!allPrerequisitesMet || maxAffordable <= 0}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-24 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-sm font-mono text-zinc-100 text-center focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!allPrerequisitesMet || maxAffordable <= 0}
              onClick={() => setQuantity(maxAffordable)}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono text-amber-300 hover:border-amber-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              (max. {maxAffordable})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right font-mono text-xs">
            <span className="text-zinc-400">Toplam Üretim Süresi:</span>
            <span className="text-amber-300 font-bold">
              {formatCountdownTurkish(totalDurationSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBuild}
            disabled={
              !allPrerequisitesMet ||
              !canAfford ||
              quantity <= 0 ||
              isSubmitting ||
              (defense.isShieldDome && isShieldDomeExceeded) ||
              (defense.isMissile && isMissileSiloFull)
            }
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-amber-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Shield className="h-4 w-4" />
            {isSubmitting ? "Kuyruğa Ekleniyor..." : "İnşa Et"}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/30 border-red-500/40 text-red-300"
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

      {/* Tech Tree Modal */}
      {showTechTree && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#0d1017] p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100">
                  {defense.name} - Teknoloji Ağacı
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTechTree(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Bu savunma ünitesini inşa edebilmek için gereken ön koşullar:
            </p>

            <div className="space-y-2">
              {prereqResults.map((prereq, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                    prereq.met
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-red-950/20 border-red-500/30 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {prereq.met ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-red-400" />
                    )}
                    <span className="font-semibold">{prereq.label}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono">
                      Gereken: Seviye {prereq.requiredLevel} | Mevcut: {prereq.currentLevel}
                    </span>
                    {!prereq.met && (
                      <Link
                        href={prereq.href}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-amber-400 hover:bg-zinc-700 transition-colors"
                        onClick={() => setShowTechTree(false)}
                      >
                        Git &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowTechTree(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

