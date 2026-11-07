"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/store/useGameStore";
import { Hammer, Orbit, Percent, AlertTriangle } from "lucide-react";

const PLANET_GRADIENTS = [
  "from-cyan-500 via-blue-700 to-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.35)]",
  "from-sky-300 via-cyan-700 to-slate-950 shadow-[0_0_16px_rgba(125,211,252,0.3)]",
  "from-amber-400 via-orange-700 to-zinc-950 shadow-[0_0_16px_rgba(251,191,36,0.3)]",
  "from-emerald-400 via-teal-800 to-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.3)]",
];

export function PlanetList() {
  const planets = useGameStore((s) => s.planets);
  const settings = useGameStore((s) => s.settings);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const selectPlanet = useGameStore((s) => s.selectPlanet);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const incomingFleets = useGameStore((s) => s.incomingFleets);
  const [nowMs, setNowMs] = useState(Date.now());

  const sorting = settings.planetSorting ?? "order";
  const sortedPlanets = [...planets].sort((a, b) => {
    if (sorting === "coords") {
      const aVal = a.galaxy * 10000 + a.system * 100 + a.slot;
      const bVal = b.galaxy * 10000 + b.system * 100 + b.slot;
      return aVal - bVal;
    }
    if (sorting === "alphabetical") {
      return a.name.localeCompare(b.name);
    }
    if (sorting === "fields") {
      return b.maxFields - a.maxFields;
    }
    return 0;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="w-[140px] shrink-0 border-l border-cyan-500/15 bg-gradient-to-b from-[#0b1018]/95 to-[#06090e]/95 flex flex-col justify-between select-none z-10">
      <div className="p-2.5 space-y-2.5 overflow-y-auto">
        {/* Colony Counter Header */}
        <div className="px-2 py-1.5 rounded bg-[#070a0f] border border-zinc-800/90 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-center gap-1">
            <Orbit className="h-3 w-3 text-cyan-400" />
            <span>Gezegenler</span>
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
            {planets.length} / {Math.max(2, planets.length)}
          </div>
        </div>

        {/* Planet Cards */}
        <div className="space-y-2">
          {sortedPlanets.map((planet, index) => {
            const isSelected = planet.id === selectedPlanetId;
            const sphereGradient =
              PLANET_GRADIENTS[index % PLANET_GRADIENTS.length];
            const displayName =
              index === 0 && planet.name === "Aethelgard Prime"
                ? "Ana Gezegen"
                : planet.name;

            // Determine if planet has active building, shipyard, research or lifeforms
            const hasActiveBuilding = Boolean(
              planet.activeBuildingQueue &&
                new Date(planet.activeBuildingQueue.endTimeUtc).getTime() > nowMs
            );
            const hasActiveShipyard = Boolean(
              planet.shipyardQueue && planet.shipyardQueue.length > 0
            );
            const hasActiveResearch = Boolean(
              activeResearchQueue &&
                activeResearchQueue.originPlanetId === planet.id &&
                new Date(activeResearchQueue.endTimeUtc).getTime() > nowMs
            );
            const hasActiveLifeform = Boolean(
              planet.activeLifeformQueue &&
                new Date(planet.activeLifeformQueue.endTimeUtc).getTime() > nowMs
            );
            const isWorking =
              hasActiveBuilding ||
              hasActiveShipyard ||
              hasActiveResearch ||
              hasActiveLifeform;

            const hasIncomingHostile = incomingFleets.some(
              (f) =>
                f.isHostile &&
                (f.targetCoords === planet.coords ||
                  f.targetPlanetName === planet.name ||
                  (isSelected && f.targetPlanetName === "TR_NEW"))
            );

            let tooltipText = "";
            if (hasActiveBuilding && planet.activeBuildingQueue) {
              tooltipText = `İnşaat: ${planet.activeBuildingQueue.buildingName} (Sv.${planet.activeBuildingQueue.targetLevel})`;
            } else if (hasActiveShipyard) {
              tooltipText = `Tersane: Üretim yapılıyor (${planet.shipyardQueue.length} sipariş)`;
            } else if (hasActiveResearch && activeResearchQueue) {
              tooltipText = `Araştırma: ${activeResearchQueue.researchName} (Sv.${activeResearchQueue.targetLevel})`;
            } else if (hasActiveLifeform && planet.activeLifeformQueue) {
              tooltipText = `Canlı Türü: ${planet.activeLifeformQueue.buildingName} (Sv.${planet.activeLifeformQueue.targetLevel})`;
            }

            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => selectPlanet(planet.id)}
                className={`w-full p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 relative group ${
                  isSelected
                    ? "bg-gradient-to-b from-cyan-950/60 to-[#0c141f] border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.2)]"
                    : "bg-[#0a0f17]/80 border-zinc-800/80 hover:border-cyan-500/40 hover:bg-[#101824]"
                }`}
              >
                {/* Active Construction / Operation Indicator */}
                {isWorking && (
                  <span
                    title={tooltipText}
                    className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-amber-500/25 border border-amber-400/70 flex items-center justify-center text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)] transition-all animate-in fade-in"
                  >
                    <Hammer className="h-2.5 w-2.5 animate-bounce" />
                  </span>
                )}

                {/* Hostile Raid Yellow Hazard Badge */}
                {hasIncomingHostile && (
                  <span
                    title="Düşman saldırı filosu yaklaşıyor!"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-amber-400 border border-amber-300 text-zinc-950 text-[9px] font-mono font-extrabold flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.85)] animate-bounce z-20"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 text-zinc-950 fill-zinc-950" />
                    <span>UYARI</span>
                  </span>
                )}

                {/* Circular Planet Visual */}
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${sphereGradient} border ${
                    isSelected ? "border-cyan-300" : "border-zinc-700/80"
                  } relative overflow-hidden transition-transform group-hover:scale-105`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_55%)]" />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-black/45 blur-[2px]" />
                </div>

                {/* Planet Name & Coordinates */}
                <div className="w-full min-w-0">
                  <div
                    className={`text-[11px] font-semibold truncate ${
                      isSelected ? "text-cyan-200" : "text-zinc-200"
                    }`}
                  >
                    {displayName}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/90 truncate">
                    {planet.coords}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promotional Sale Banner */}
      <div className="p-2 border-t border-rose-500/20 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent">
        <Link
          href="/shop/special-offers"
          className="block p-2 rounded-lg border border-rose-500/40 bg-[#0e070c] hover:border-rose-400 hover:bg-rose-950/40 transition group text-center shadow-[0_0_14px_rgba(244,63,94,0.18)]"
        >
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest animate-pulse">
            <Percent className="w-3 h-3 text-rose-400" />
            <span>%30 SALE</span>
          </div>
          <div className="text-[10px] text-zinc-300 font-medium mt-0.5 group-hover:text-rose-200">
            Özel İndirimler
          </div>
        </Link>
      </div>
    </aside>
  );
}


