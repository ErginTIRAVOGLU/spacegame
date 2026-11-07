"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  SHIPYARD_CATALOG,
  type ShipDefinition,
  evaluateShipPrerequisites,
} from "@/lib/shipyardCatalog";
import { ShipDetailPanel } from "@/components/shipyard/ShipDetailPanel";
import { ShipyardQueue } from "@/components/shipyard/ShipyardQueue";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
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
  Sun,
  Cog,
  Lock,
} from "lucide-react";

const SHIP_VISUALS: Record<number, { icon: ReactNode; gradient: string }> = {
  // Savaş Gemileri
  204: { icon: <Rocket className="h-8 w-8 text-cyan-300" />, gradient: "from-cyan-950/70 via-slate-900 to-[#070a0f]" },
  205: { icon: <Rocket className="h-8 w-8 text-sky-300" />, gradient: "from-sky-950/70 via-slate-900 to-[#070a0f]" },
  206: { icon: <Crosshair className="h-8 w-8 text-amber-300" />, gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]" },
  207: { icon: <Swords className="h-8 w-8 text-red-400" />, gradient: "from-red-950/70 via-slate-900 to-[#070a0f]" },
  215: { icon: <Swords className="h-8 w-8 text-rose-300" />, gradient: "from-rose-950/70 via-slate-900 to-[#070a0f]" },
  211: { icon: <Bomb className="h-8 w-8 text-orange-400" />, gradient: "from-orange-950/70 via-slate-900 to-[#070a0f]" },
  213: { icon: <Crosshair className="h-8 w-8 text-purple-300" />, gradient: "from-purple-950/70 via-slate-900 to-[#070a0f]" },
  214: { icon: <Skull className="h-8 w-8 text-fuchsia-400" />, gradient: "from-fuchsia-950/80 via-slate-900 to-[#070a0f]" },
  218: { icon: <Skull className="h-8 w-8 text-emerald-400" />, gradient: "from-emerald-950/80 via-slate-900 to-[#070a0f]" },
  219: { icon: <Compass className="h-8 w-8 text-indigo-300" />, gradient: "from-indigo-950/70 via-slate-900 to-[#070a0f]" },

  // Sivil Gemiler
  202: { icon: <Truck className="h-8 w-8 text-zinc-300" />, gradient: "from-zinc-800/80 via-slate-900 to-[#070a0f]" },
  203: { icon: <Box className="h-8 w-8 text-zinc-200" />, gradient: "from-zinc-700/80 via-slate-900 to-[#070a0f]" },
  208: { icon: <Globe2 className="h-8 w-8 text-teal-300" />, gradient: "from-teal-950/70 via-slate-900 to-[#070a0f]" },
  209: { icon: <Recycle className="h-8 w-8 text-emerald-300" />, gradient: "from-emerald-950/70 via-slate-900 to-[#070a0f]" },
  210: { icon: <Eye className="h-8 w-8 text-sky-300" />, gradient: "from-sky-950/70 via-slate-900 to-[#070a0f]" },
  212: { icon: <Sun className="h-8 w-8 text-amber-300" />, gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]" },
  217: { icon: <Cog className="h-8 w-8 text-amber-400" />, gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]" },
};

function findShipUnitTypeFromQuery(param: string | null): number | null {
  if (!param) return null;
  const num = Number(param);
  if (!isNaN(num) && SHIPYARD_CATALOG.some((s) => s.unitType === num)) {
    return num;
  }
  const clean = param.toLowerCase().replace(/[-_]/g, "");

  if (clean === "heavyfighter" || clean === "heavy" || clean === "agiravci") return 205;
  if (clean === "lightfighter" || clean === "light" || clean === "hafifavci") return 204;
  if (clean === "cruiser" || clean === "kruvazor") return 206;
  if (clean === "battleship" || clean === "komutasavagemisi") return 207;
  if (clean === "battlecruiser" || clean === "muharebekruvazoru") return 215;
  if (clean === "bomber" || clean === "bombardimangemisi") return 211;
  if (clean === "destroyer" || clean === "muhrip") return 213;
  if (clean === "deathstar" || clean === "olumyildizi") return 214;
  if (clean === "reaper" || clean === "azim") return 218;
  if (clean === "pathfinder" || clean === "rehber") return 219;
  if (clean === "smallcargo" || clean === "kucuknakliye") return 202;
  if (clean === "largecargo" || clean === "buyuknakliye") return 203;
  if (clean === "colonyship" || clean === "kolonigemisi") return 208;
  if (clean === "recycler" || clean === "geridonusumcu") return 209;
  if (clean === "espionageprobe" || clean === "casusluksondasi") return 210;
  if (clean === "solarsatellite" || clean === "solarnydu") return 212;
  if (clean === "crawler" || clean === "paletli") return 217;

  const matchKey = SHIPYARD_CATALOG.find((s) => {
    const keyClean = s.key.toLowerCase().replace(/[-_]/g, "");
    return (
      keyClean === clean ||
      s.key.toLowerCase() === param.toLowerCase() ||
      s.name.toLowerCase().includes(param.toLowerCase())
    );
  });
  if (matchKey) return matchKey.unitType;
  return null;
}

function ShipyardPageContent() {
  const searchParams = useSearchParams();
  const shipParam =
    searchParams.get("focus") ??
    searchParams.get("ship") ??
    searchParams.get("unit") ??
    searchParams.get("key");

  const initialUnitType = findShipUnitTypeFromQuery(shipParam) ?? 204; // Default: Hafif Avcı (204)

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const shipyardLevel = planet.buildings.find((b) => b.key === "shipyard")?.level ?? 0;
  const naniteLevel = planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;

  const [selectedUnitType, setSelectedUnitType] = useState<number>(initialUnitType);

  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (focus) => {
      const matched = findShipUnitTypeFromQuery(focus);
      if (matched !== null) {
        setSelectedUnitType(matched);
      }
    },
  });

  useEffect(() => {
    const matched = findShipUnitTypeFromQuery(shipParam);
    if (matched !== null) {
      setSelectedUnitType(matched);
    }
  }, [shipParam]);

  const combatShips = SHIPYARD_CATALOG.filter((s) => s.category === "combat");
  const civilShips = SHIPYARD_CATALOG.filter((s) => s.category === "civil");

  const selectedShip =
    SHIPYARD_CATALOG.find((s) => s.unitType === selectedUnitType) ??
    SHIPYARD_CATALOG[0];

  const getStationedCount = (unitType: number) => {
    return planet.units?.find((u) => u.unitType === unitType)?.count ?? 0;
  };

  const renderShipCard = (ship: ShipDefinition) => {
    const isSelected = ship.unitType === selectedShip.unitType;
    const visual = SHIP_VISUALS[ship.unitType] ?? SHIP_VISUALS[204];
    const stationed = getStationedCount(ship.unitType);
    const kebab = ship.key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const isFocused =
      isHighlighted(ship.unitType) ||
      isHighlighted(ship.key) ||
      isHighlighted(kebab) ||
      (ship.unitType === 205 &&
        (isHighlighted("heavy-fighter") ||
          isHighlighted("heavyfighter") ||
          isHighlighted("heavy")));

    const prereqResults = evaluateShipPrerequisites(
      ship,
      planet.buildings,
      researches
    );
    const prerequisitesMet = prereqResults.every((p) => p.met);

    return (
      <button
        key={ship.unitType}
        id={`card-${kebab}`}
        data-card-key={`card-${ship.key}`}
        data-unit-type={ship.unitType}
        type="button"
        onClick={() => setSelectedUnitType(ship.unitType)}
        className={`group relative h-28 rounded-lg border overflow-hidden flex flex-col justify-between p-2.5 text-left transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
            : "border-zinc-800 hover:border-cyan-500/50"
        } bg-gradient-to-br ${visual.gradient}`}
      >
        {/* Top: Name + Prerequisite lock */}
        <div className="relative z-10 flex items-start justify-between gap-1 w-full">
          <div className="text-[11px] font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
            {ship.name}
          </div>
          {!prerequisitesMet && (
            <span
              title="Ön koşullar karşılanmadı"
              className="p-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 shrink-0"
            >
              <Lock className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Center: Icon */}
        <div
          className={`relative z-10 flex items-center justify-center my-auto transition-transform group-hover:scale-110 ${
            prerequisitesMet ? "opacity-90" : "opacity-40 grayscale"
          }`}
        >
          {visual.icon}
        </div>

        {/* Bottom Right: Stationed Fleet Count Badge */}
        <div className="relative z-10 flex items-center justify-end w-full">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
              isSelected
                ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                : "bg-black/80 border-zinc-700/80 text-cyan-300"
            }`}
          >
            {stationed > 0 ? `${stationed.toLocaleString()}` : "0"}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Hero Banner */}
      <div
        className="relative rounded-lg border border-cyan-500/25 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(245,158,11,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            Gezegen Yörünge Tersanesi • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Tersane - <span className="text-cyan-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Savaş ve sivil gemilerin inşa edildiği yörünge montaj hangarları. Parti üretimi (batch queue) Hangfire tarafından otomatik işlenir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-[#0e1420] border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">Tersane: </span>
            <span className="text-cyan-300 font-bold">Kademe {shipyardLevel}</span>
            {naniteLevel > 0 && (
              <span className="text-purple-400 ml-2">(Nanit: {naniteLevel})</span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Ship Detail & Build Panel */}
      {selectedShip && (
        <ShipDetailPanel
          ship={selectedShip}
          planet={planet}
          stationedCount={getStationedCount(selectedShip.unitType)}
        />
      )}

      {/* Dual Category Ship Grid (Left: Savaş Gemileri, Right: Sivil Gemiler) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Savaş Gemileri */}
        <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                A. Savaş Gemileri ({combatShips.length} Model)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Avcılar, Kruvazörler, Muhripler
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {combatShips.map(renderShipCard)}
          </div>
        </div>

        {/* Right Column: Sivil Gemiler */}
        <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                B. Sivil Gemiler ({civilShips.length} Model)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Nakliyeler, Koloni, Geri Dönüşüm, Uydular
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {civilShips.map(renderShipCard)}
          </div>
        </div>
      </div>

      {/* Shipyard Batch Queue */}
      <ShipyardQueue
        queue={planet.shipyardQueue}
        serverTimeUtc={planet.serverTimeUtc}
      />
    </div>
  );
}

export default function ShipyardPage() {
  return (
    <Suspense fallback={null}>
      <ShipyardPageContent />
    </Suspense>
  );
}

