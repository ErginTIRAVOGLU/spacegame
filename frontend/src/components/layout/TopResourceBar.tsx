"use client";

import { useEffect, useState } from "react";
import { useLiveResource } from "@/hooks/useLiveResource";
import { useGameStore, calculateStorageCapacity } from "@/store/useGameStore";
import { useResourceStore } from "@/store/useResourceStore";
import { ResourceTooltip } from "@/components/layout/ResourceTooltip";
import {
  Boxes,
  Gem,
  Droplets,
  Zap,
  Users,
  Sprout,
  Sparkles,
  Globe2,
} from "lucide-react";

export function TopResourceBar() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const selectPlanet = useGameStore((s) => s.selectPlanet);
  const darkMatter = useGameStore((s) => s.darkMatter);

  const getPopulationMetrics = useResourceStore((s) => s.getPopulationMetrics);
  const getFoodMetrics = useResourceStore((s) => s.getFoodMetrics);
  const getEnergyMetrics = useResourceStore((s) => s.getEnergyMetrics);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  // 1-second interval interpolation tick for live store recalculation
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveMetal = useLiveResource({
    currentAmount: planet.metal,
    hourlyRate: planet.metalPerHour,
    serverTimeUtc: planet.serverTimeUtc,
  });

  const liveCrystal = useLiveResource({
    currentAmount: planet.crystal,
    hourlyRate: planet.crystalPerHour,
    serverTimeUtc: planet.serverTimeUtc,
  });

  const liveDeuterium = useLiveResource({
    currentAmount: planet.deuterium,
    hourlyRate: planet.deuteriumPerHour,
    serverTimeUtc: planet.serverTimeUtc,
  });

  const energyMetrics = getEnergyMetrics(planet);
  const netEnergy = energyMetrics.current;
  const isEnergyDeficit = netEnergy < 0;

  // Storage caps
  const metalStorageLvl =
    planet.buildings.find((b) => b.key === "metalStorage" || b.buildingType === 22)
      ?.level ?? 0;
  const crystalStorageLvl =
    planet.buildings.find((b) => b.key === "crystalStorage" || b.buildingType === 23)
      ?.level ?? 0;
  const deutStorageLvl =
    planet.buildings.find((b) => b.key === "deuteriumTank" || b.buildingType === 24)
      ?.level ?? 0;

  const metalCap = calculateStorageCapacity(metalStorageLvl);
  const crystalCap = calculateStorageCapacity(crystalStorageLvl);
  const deutCap = calculateStorageCapacity(deutStorageLvl);

  const isMetalFull = liveMetal >= metalCap;
  const isCrystalFull = liveCrystal >= crystalCap;
  const isDeutFull = liveDeuterium >= deutCap;

  const popMetrics = getPopulationMetrics(planet.id);
  const foodMetrics = getFoodMetrics(planet.id);

  return (
    <header className="h-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur px-6 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
      {/* 7 Live Resource Tickers */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 1. Metal */}
        <ResourceTooltip type="metal" liveAmount={liveMetal} align="left">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[135px] cursor-pointer transition-colors">
            <Boxes className="h-4 w-4 text-zinc-300 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-1.5">
                <span>Metal</span>
                <span className="text-emerald-400 font-mono">+{planet.metalPerHour}/h</span>
              </div>
              <div
                className={`text-sm font-mono font-semibold tabular-nums ${
                  isMetalFull ? "text-red-500 font-bold" : "text-zinc-100"
                }`}
              >
                {liveMetal.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 2. Crystal */}
        <ResourceTooltip type="crystal" liveAmount={liveCrystal} align="center">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[135px] cursor-pointer transition-colors">
            <Gem className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-1.5">
                <span>Kristal</span>
                <span className="text-cyan-400 font-mono">+{planet.crystalPerHour}/h</span>
              </div>
              <div
                className={`text-sm font-mono font-semibold tabular-nums ${
                  isCrystalFull ? "text-red-500 font-bold" : "text-cyan-300"
                }`}
              >
                {liveCrystal.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 3. Deuterium */}
        <ResourceTooltip type="deuterium" liveAmount={liveDeuterium} align="center">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[135px] cursor-pointer transition-colors">
            <Droplets className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-1.5">
                <span>Deuterium</span>
                <span className="text-emerald-400 font-mono">+{planet.deuteriumPerHour}/h</span>
              </div>
              <div
                className={`text-sm font-mono font-semibold tabular-nums ${
                  isDeutFull ? "text-red-500 font-bold" : "text-emerald-300"
                }`}
              >
                {liveDeuterium.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 4. Enerji */}
        <ResourceTooltip type="energy" align="center">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[125px] cursor-pointer transition-colors">
            <Zap
              className={`h-4 w-4 shrink-0 ${
                isEnergyDeficit ? "text-rose-500 animate-pulse" : "text-amber-400"
              }`}
            />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                Enerji
              </div>
              <div
                className={`text-sm font-mono font-semibold tabular-nums ${
                  isEnergyDeficit ? "text-rose-500" : "text-amber-300"
                }`}
              >
                {netEnergy >= 0 ? `+${netEnergy.toLocaleString("en-US")}` : netEnergy.toLocaleString("en-US")}{" "}
                <span className="text-[11px] text-zinc-500">
                  ({energyMetrics.produced.toLocaleString("en-US")})
                </span>
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 5. Canlı Türü Nüfus */}
        <ResourceTooltip type="population" align="center">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[125px] cursor-pointer transition-colors">
            <Users className="h-4 w-4 text-violet-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-1.5">
                <span>Nüfus</span>
                <span className="text-emerald-400 font-mono">+0.03</span>
              </div>
              <div className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">
                {popMetrics.current.toLocaleString("en-US")}
                <span className="text-[11px] text-zinc-500"> / {popMetrics.housing}</span>
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 6. Canlı Türü Besin */}
        <ResourceTooltip type="food" align="center">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[125px] cursor-pointer transition-colors">
            <Sprout className="h-4 w-4 text-lime-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-1.5">
                <span>Besin</span>
                <span className="text-emerald-400 font-mono">+{foodMetrics.surplus}/h</span>
              </div>
              <div className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">
                {foodMetrics.current.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </ResourceTooltip>

        {/* 7. Karanlık Madde */}
        <ResourceTooltip type="darkMatter" align="right">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md min-w-[125px] cursor-pointer transition-colors">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                Karanlık Madde
              </div>
              <div className="text-sm font-mono font-semibold text-amber-300 tabular-nums">
                {darkMatter.toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </ResourceTooltip>
      </div>

      {/* Planet Selector */}
      <div className="flex items-center gap-3 shrink-0">
        <Globe2 className="h-5 w-5 text-cyan-400" />
        <label htmlFor="planet-select" className="sr-only">
          Select Active Planet
        </label>
        <select
          id="planet-select"
          value={planet.id}
          onChange={(e) => selectPlanet(e.target.value)}
          className="bg-zinc-900 border border-cyan-500/40 text-zinc-100 text-sm rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
        >
          {planets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.coords}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
