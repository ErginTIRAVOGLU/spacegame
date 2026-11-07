"use client";

import { useMemo, type ReactNode } from "react";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { FLEET_SHIPS, type FleetShipMeta } from "@/lib/fleetCatalog";
import {
  Rocket,
  Shield,
  Crosshair,
  Swords,
  Bomb,
  Skull,
  Radio,
  Compass,
  Truck,
  Box,
  Globe2,
  Recycle,
  Eye,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface FleetShipSelectorProps {
  stationedUnits: { unitType: number; count: number }[];
  selectedShips: Record<number, number>;
  onShipChange: (unitType: number, count: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onNext: () => void;
  activeFleets: number;
  maxFleets: number;
}

const SHIP_ICONS: Record<number, { icon: ReactNode; gradient: string }> = {
  // Savaş Gemileri
  204: { icon: <Rocket className="h-6 w-6 text-cyan-300" />, gradient: "from-cyan-950/60 to-slate-900" },
  205: { icon: <Rocket className="h-6 w-6 text-sky-300" />, gradient: "from-sky-950/60 to-slate-900" },
  206: { icon: <Crosshair className="h-6 w-6 text-amber-300" />, gradient: "from-amber-950/60 to-slate-900" },
  207: { icon: <Swords className="h-6 w-6 text-red-400" />, gradient: "from-red-950/60 to-slate-900" },
  215: { icon: <Swords className="h-6 w-6 text-rose-300" />, gradient: "from-rose-950/60 to-slate-900" },
  211: { icon: <Bomb className="h-6 w-6 text-orange-400" />, gradient: "from-orange-950/60 to-slate-900" },
  213: { icon: <Crosshair className="h-6 w-6 text-purple-300" />, gradient: "from-purple-950/60 to-slate-900" },
  214: { icon: <Skull className="h-6 w-6 text-fuchsia-400" />, gradient: "from-fuchsia-950/60 to-slate-900" },
  218: { icon: <Skull className="h-6 w-6 text-emerald-400" />, gradient: "from-emerald-950/60 to-slate-900" },
  219: { icon: <Compass className="h-6 w-6 text-indigo-300" />, gradient: "from-indigo-950/60 to-slate-900" },

  // Sivil Gemiler
  202: { icon: <Truck className="h-6 w-6 text-zinc-300" />, gradient: "from-zinc-800/60 to-slate-900" },
  203: { icon: <Box className="h-6 w-6 text-zinc-200" />, gradient: "from-zinc-700/60 to-slate-900" },
  208: { icon: <Globe2 className="h-6 w-6 text-teal-300" />, gradient: "from-teal-950/60 to-slate-900" },
  209: { icon: <Recycle className="h-6 w-6 text-emerald-300" />, gradient: "from-emerald-950/60 to-slate-900" },
  210: { icon: <Eye className="h-6 w-6 text-sky-300" />, gradient: "from-sky-950/60 to-slate-900" },
};

export function FleetShipSelector({
  stationedUnits,
  selectedShips,
  onShipChange,
  onSelectAll,
  onClearAll,
  onNext,
  activeFleets,
  maxFleets,
}: FleetShipSelectorProps) {
  const combatShips = useMemo(() => FLEET_SHIPS.filter((s) => s.category === "combat"), []);
  const civilShips = useMemo(() => FLEET_SHIPS.filter((s) => s.category === "civil"), []);

  const getStationedCount = (unitType: number) => {
    return stationedUnits.find((u) => u.unitType === unitType)?.count ?? 0;
  };

  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedShips).reduce((sum, c) => sum + Math.max(0, c), 0);
  }, [selectedShips]);

  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
  });

  const isSlotCapReached = activeFleets >= maxFleets;
  const canProceed = totalSelectedCount > 0 && !isSlotCapReached;

  const renderShipCard = (ship: FleetShipMeta) => {
    const stationed = getStationedCount(ship.unitType);
    const selected = Math.min(stationed, selectedShips[ship.unitType] ?? 0);
    const visual = SHIP_ICONS[ship.unitType] ?? {
      icon: <Rocket className="h-6 w-6 text-cyan-400" />,
      gradient: "from-slate-900 to-[#070a0f]",
    };

    const isAvailable = stationed > 0;
    const isSelected = selected > 0;
    const kebab = ship.key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const isFocused =
      isHighlighted(ship.unitType) ||
      isHighlighted(ship.key) ||
      isHighlighted(kebab) ||
      isHighlighted(`${kebab}-input`) ||
      ((ship.unitType === 202 || ship.unitType === 204) &&
        (isHighlighted("expedition-fleet") ||
          isHighlighted("expedition-dispatch") ||
          isHighlighted("expedition")));

    return (
      <div
        key={ship.unitType}
        id={`card-${kebab}`}
        data-ship-id={ship.unitType}
        data-ship-key={kebab}
        className={`group relative rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400/80 bg-[#121824] shadow-[0_0_16px_rgba(251,191,36,0.18)] ring-1 ring-amber-400/40"
            : isAvailable
            ? "border-zinc-800 bg-[#0a0f18] hover:border-zinc-700 hover:bg-[#0c121e]"
            : "border-zinc-900 bg-[#070a10]/50 opacity-40 grayscale"
        }`}
      >
        {/* Top: Icon + Ship Name & Stationed Badge */}
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <div
              className={`w-8 h-8 rounded-lg border border-zinc-800/80 flex items-center justify-center shrink-0 bg-gradient-to-br ${visual.gradient} shadow-sm`}
            >
              {visual.icon}
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                    : isAvailable
                    ? "bg-cyan-950/60 border-cyan-500/30 text-cyan-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-600"
                }`}
                title="Mevcut Gezegen Filosu"
              >
                {stationed > 0 ? stationed.toLocaleString() : "0"}
              </span>
              <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Mevcut</div>
            </div>
          </div>

          <div
            className="text-xs font-bold text-zinc-100 truncate mb-1"
            title={ship.name}
          >
            {ship.name}
          </div>

          {/* Quick Stats: Speed & Cargo */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 py-1 border-t border-zinc-800/50">
            <span title="Temel Hız">⚡ {ship.baseSpeed.toLocaleString()}</span>
            <span title="Kargo Kapasitesi">📦 {ship.cargoCapacity.toLocaleString()}</span>
          </div>
        </div>

        {/* Bottom: Input + Max Toggle */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/60">
          <input
            id={`${kebab}-input`}
            type="number"
            min={0}
            max={stationed}
            disabled={!isAvailable}
            value={selected || ""}
            placeholder="0"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(stationed, val));
              onShipChange(ship.unitType, clamped);
            }}
            className={`w-full min-w-0 px-2 py-1 rounded border bg-zinc-950 text-xs font-mono text-zinc-100 text-center focus:outline-none disabled:opacity-30 disabled:pointer-events-none ${
              isFocused
                ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                : "border-zinc-700 focus:border-amber-400"
            }`}
          />
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => onShipChange(ship.unitType, selected === stationed ? 0 : stationed)}
            title={selected === stationed ? "Sıfırla" : "Maksimum Seç"}
            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold transition-all shrink-0 disabled:opacity-20 disabled:pointer-events-none ${
              selected === stationed && isAvailable
                ? "border-amber-400 bg-amber-500/25 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                : "border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300"
            }`}
          >
            Max
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Dual Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Savaş Gemileri */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Swords className="h-4 w-4 text-amber-400" />
              Savaş Gemileri
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {combatShips.reduce((s, ship) => s + getStationedCount(ship.unitType), 0).toLocaleString()} Adet
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {combatShips.map((ship) => renderShipCard(ship))}
          </div>
        </div>

        {/* Right Column: Sivil Gemiler */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              Sivil Gemiler
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {civilShips.reduce((s, ship) => s + getStationedCount(ship.unitType), 0).toLocaleString()} Adet
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {civilShips.map((ship) => renderShipCard(ship))}
          </div>
        </div>
      </div>

      {/* Bottom Action Toolbar */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-xs font-mono font-bold text-cyan-300 transition-colors"
          >
            <span>&gt;&gt;</span>
            <span>Tüm Gemileri Seç</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Sıfırla (0)</span>
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <div className="text-right font-mono text-xs">
            <div className="text-zinc-400">
              Seçilen Gemi:{" "}
              <strong className={totalSelectedCount > 0 ? "text-amber-300" : "text-zinc-500"}>
                {totalSelectedCount.toLocaleString()} Adet
              </strong>
            </div>
            {isSlotCapReached && (
              <div className="text-[11px] text-rose-400 font-bold">
                Maksimum filo yuvası dolu ({activeFleets}/{maxFleets})
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={onNext}
            className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <span>DEVAM</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

