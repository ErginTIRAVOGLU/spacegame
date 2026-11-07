"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  type PlanetSummary,
  useGameStore,
  calculateSolarSatelliteUnitEnergy,
  API_BASE_URL,
} from "@/store/useGameStore";
import {
  type ShipDefinition,
  calculateMaxAffordableUnits,
  calculateUnitDurationSeconds,
  evaluateShipPrerequisites,
} from "@/lib/shipyardCatalog";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  Hammer,
  Clock,
  Boxes,
  Gem,
  Droplets,
  Lock,
  GitBranch,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";

interface ShipDetailPanelProps {
  ship: ShipDefinition;
  planet: PlanetSummary;
  stationedCount: number;
  onClose?: () => void;
}

export function ShipDetailPanel({
  ship,
  planet,
  stationedCount,
  onClose,
}: ShipDetailPanelProps) {
  const researches = useGameStore((s) => s.researches);
  const enqueueShipyardBatch = useGameStore((s) => s.enqueueShipyardBatch);
  const userId = useGameStore((s) => s.userId);

  const [quantity, setQuantity] = useState<number>(1);
  const [showTechTree, setShowTechTree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Task 05BI: Autofocus amount input when arriving via quest deep-link
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const focus = params.get("focus");
      if (focus) {
        const clean = focus.toLowerCase().replace(/[-_]/g, "");
        const shipClean = ship.key.toLowerCase().replace(/[-_]/g, "");
        if (
          clean === shipClean ||
          clean === String(ship.unitType) ||
          ship.name.toLowerCase().includes(clean)
        ) {
          const timer = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          }, 150);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [ship.key, ship.unitType, ship.name]);

  const maxAffordable = calculateMaxAffordableUnits(
    ship,
    planet.metal,
    planet.crystal,
    planet.deuterium
  );

  const shipyardLevel =
    planet.buildings.find((b) => b.key === "shipyard")?.level ?? 0;
  const naniteLevel =
    planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;

  const unitDurationSeconds = calculateUnitDurationSeconds(
    ship.metal,
    ship.crystal,
    shipyardLevel,
    naniteLevel
  );

  const totalDurationSeconds = unitDurationSeconds * Math.max(1, quantity);

  const prereqResults = evaluateShipPrerequisites(
    ship,
    planet.buildings,
    researches
  );
  const allPrerequisitesMet = prereqResults.every((p) => p.met);

  const satUnitEnergy = calculateSolarSatelliteUnitEnergy(planet.tempMax);
  const dynamicDescription = ship.description.replace(
    "{SolarSatelliteEnergy}",
    String(satUnitEnergy)
  );

  const totalMetalCost = ship.metal * quantity;
  const totalCrystalCost = ship.crystal * quantity;
  const totalDeutCost = ship.deuterium * quantity;

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
    const ok = await enqueueShipyardBatch(ship.unitType, quantity);
    setIsSubmitting(false);

    if (ok) {
      setFeedback({
        type: "success",
        text: `${quantity.toLocaleString()}x ${ship.name} tersane kuyruğuna başarıyla eklendi!`,
      });
      setQuantity(1);
    } else {
      setFeedback({
        type: "error",
        text: "Tersane kuyruğuna eklenemedi. Lütfen hammadde veya tersane seviyesini kontrol edin.",
      });
    }
  };

  return (
    <div className="rounded-lg border border-cyan-500/35 bg-gradient-to-b from-[#101824]/95 via-[#0b111a]/95 to-[#070a10]/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.75)] space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-100">{ship.name}</h2>
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300">
              Konuşlu: {stationedCount.toLocaleString("en-US")} Adet
            </span>
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
              <span className="text-zinc-400">Birim yapım süresi:</span>
              <span className="text-amber-300 font-semibold">
                {formatCountdownTurkish(unitDurationSeconds)}
              </span>
            </span>

            {quantity > 1 && (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span>Toplam süre:</span>
                <span className="text-zinc-200 font-semibold">
                  {formatCountdownTurkish(totalDurationSeconds)}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Teknoloji A. Button */}
          <button
            type="button"
            onClick={() => {
              setShowTechTree((v) => !v);
              if (ship.unitType === 202) {
                fetch(`${API_BASE_URL}/api/tutorial/directive-2/progress`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    eventType: "tech_tree_viewed",
                    unitId: "SmallCargo",
                    planetId: planet.id,
                    userId: userId || undefined,
                  }),
                }).catch(() => {});
              }
            }}
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

      {/* Lore Description */}
      <p className="text-xs text-zinc-300 leading-relaxed bg-[#06090e]/80 border border-zinc-800/80 rounded p-3">
        {dynamicDescription}
      </p>

      {/* Prerequisites Box (visible when unmet or toggled) */}
      {(showTechTree || !allPrerequisitesMet) && (
        <div className="p-3.5 rounded-lg bg-[#070b12] border border-zinc-800/90 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Teknoloji Ağacı & Ön Koşullar ({ship.name})</span>
            </span>
            <Link
              href="/research"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40"
            >
              Araştırma Sayfasına Git →
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
                  <Link href={req.href} className="font-semibold hover:underline truncate">
                    {req.label}
                  </Link>
                </div>
                <span className="font-bold shrink-0 ml-2">
                  Kademe {req.currentLevel} / {req.requiredLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Unit Cost Breakdown + Dynamic (max. X) Calculator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            <span>Birim Başına Maliyet:</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, maxAffordable))}
              className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
            >
              (max. {maxAffordable.toLocaleString("en-US")})
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            {ship.metal > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  planet.metal >= totalMetalCost
                    ? "border-zinc-800 text-zinc-100"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  Metal: {ship.metal.toLocaleString("en-US")}
                  {quantity > 1 && ` (Toplam: ${totalMetalCost.toLocaleString()})`}
                </span>
              </div>
            )}

            {ship.crystal > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  planet.crystal >= totalCrystalCost
                    ? "border-zinc-800 text-cyan-300"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Gem className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  Kristal: {ship.crystal.toLocaleString("en-US")}
                  {quantity > 1 && ` (Toplam: ${totalCrystalCost.toLocaleString()})`}
                </span>
              </div>
            )}

            {ship.deuterium > 0 && (
              <div
                className={`px-3 py-1.5 rounded bg-[#070a0f] border flex items-center gap-1.5 ${
                  planet.deuterium >= totalDeutCost
                    ? "border-zinc-800 text-emerald-300"
                    : "border-rose-500/50 text-rose-400 font-bold"
                }`}
              >
                <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  Deuterium: {ship.deuterium.toLocaleString("en-US")}
                  {quantity > 1 && ` (Toplam: ${totalDeutCost.toLocaleString()})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quantity Input & İnşa Et Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              id="shipyard-amount-input"
              type="number"
              min={1}
              max={Math.max(1, maxAffordable)}
              value={quantity || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(Number.isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-24 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 text-center focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
            />
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, maxAffordable))}
              className="px-2.5 py-2 rounded bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-xs font-mono font-bold text-amber-300"
            >
              Max
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting || !canAfford || !allPrerequisitesMet}
            onClick={handleBuild}
            className={`px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${
              canAfford && allPrerequisitesMet
                ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
            }`}
          >
            <Hammer className="h-4 w-4" />
            <span>
              {!allPrerequisitesMet
                ? "Ön Koşul Gerekli"
                : !canAfford
                ? "Yetersiz Kaynak"
                : "İnşa Et"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

