"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLiveResource } from "@/hooks/useLiveResource";
import { useGameStore, calculateStorageCapacity } from "@/store/useGameStore";
import { useResourceStore } from "@/store/useResourceStore";
import { ResourceTooltip } from "@/components/layout/ResourceTooltip";
import {
  Boxes,
  Gem,
  Droplets,
  Zap,
  Sparkles,
  Users,
  Sprout,
  Crown,
  Anchor,
  Wrench,
  Pickaxe,
  Cpu,
} from "lucide-react";

interface ResourceCounterItemProps {
  label: string;
  value: number;
  subLabel: string;
  icon: ReactNode;
  valueColorClass: string;
  borderAccentClass?: string;
  isSigned?: boolean;
}

export function ResourceCounter({
  label,
  value,
  subLabel,
  icon,
  valueColorClass,
  borderAccentClass = "border-zinc-800/90",
  isSigned = false,
}: ResourceCounterItemProps) {
  const formatted = isSigned
    ? value >= 0
      ? `+${value.toLocaleString("en-US")}`
      : value.toLocaleString("en-US")
    : value.toLocaleString("en-US");

  return (
    <div
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded bg-gradient-to-b from-[#131b26] to-[#0a0f16] border ${borderAccentClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] min-w-[110px] xl:min-w-[124px] cursor-pointer transition-colors hover:border-cyan-500/40`}
    >
      <div className="h-7 w-7 rounded bg-[#070a0f] border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          suppressHydrationWarning
          className={`text-xs font-mono font-bold tabular-nums leading-tight truncate ${valueColorClass}`}
        >
          {formatted}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[9px] xl:text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
            {label}
          </span>
          <span className="text-[9px] xl:text-[10px] font-mono text-zinc-500 truncate">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ResourceCounterBar() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
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

  // Storage caps to detect capacity limit
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
    <div className="flex items-center gap-1.5 xl:gap-2 flex-wrap">
      {/* 1. Metal */}
      <ResourceTooltip type="metal" liveAmount={liveMetal} align="left">
        <ResourceCounter
          label="Metal"
          value={liveMetal}
          subLabel={`+${planet.metalPerHour}/h`}
          icon={<Boxes className="h-4 w-4 text-zinc-300" />}
          valueColorClass={isMetalFull ? "text-red-500 font-bold" : "text-zinc-100"}
          borderAccentClass={isMetalFull ? "border-red-500/50 bg-red-950/20" : "border-zinc-800/90"}
        />
      </ResourceTooltip>

      {/* 2. Kristal */}
      <ResourceTooltip type="crystal" liveAmount={liveCrystal} align="center">
        <ResourceCounter
          label="Kristal"
          value={liveCrystal}
          subLabel={`+${planet.crystalPerHour}/h`}
          icon={<Gem className="h-4 w-4 text-cyan-400" />}
          valueColorClass={isCrystalFull ? "text-red-500 font-bold" : "text-cyan-300"}
          borderAccentClass={isCrystalFull ? "border-red-500/50 bg-red-950/20" : "border-zinc-800/90"}
        />
      </ResourceTooltip>

      {/* 3. Deuterium */}
      <ResourceTooltip type="deuterium" liveAmount={liveDeuterium} align="center">
        <ResourceCounter
          label="Deuterium"
          value={liveDeuterium}
          subLabel={`+${planet.deuteriumPerHour}/h`}
          icon={<Droplets className="h-4 w-4 text-emerald-400" />}
          valueColorClass={isDeutFull ? "text-red-500 font-bold" : "text-emerald-300"}
          borderAccentClass={isDeutFull ? "border-red-500/50 bg-red-950/20" : "border-zinc-800/90"}
        />
      </ResourceTooltip>

      {/* 4. Enerji */}
      <ResourceTooltip type="energy" align="center">
        <ResourceCounter
          label="Enerji"
          value={netEnergy}
          subLabel={`${energyMetrics.produced.toLocaleString("en-US")}`}
          icon={
            <Zap
              className={`h-4 w-4 ${
                isEnergyDeficit ? "text-rose-500 animate-pulse" : "text-amber-400"
              }`}
            />
          }
          valueColorClass={isEnergyDeficit ? "text-rose-500" : "text-amber-300"}
          borderAccentClass={
            isEnergyDeficit ? "border-rose-500/60 bg-rose-950/20" : "border-zinc-800/90"
          }
          isSigned
        />
      </ResourceTooltip>

      {/* 5. Canlı Türü Nüfus */}
      <ResourceTooltip type="population" align="center">
        <ResourceCounter
          label="Nüfus"
          value={popMetrics.current}
          subLabel={popMetrics.growthRate}
          icon={<Users className="h-4 w-4 text-violet-400" />}
          valueColorClass="text-violet-300"
          borderAccentClass="border-violet-500/30"
        />
      </ResourceTooltip>

      {/* 6. Canlı Türü Besin */}
      <ResourceTooltip type="food" align="center">
        <ResourceCounter
          label="Besin"
          value={foodMetrics.current}
          subLabel={`+${foodMetrics.surplus}/h`}
          icon={<Sprout className="h-4 w-4 text-lime-400" />}
          valueColorClass="text-lime-300"
          borderAccentClass="border-lime-500/30"
        />
      </ResourceTooltip>

      {/* 7. Karanlık Madde */}
      <ResourceTooltip type="darkMatter" align="right">
        <ResourceCounter
          label="Karanlık M."
          value={darkMatter}
          subLabel="KM"
          icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          valueColorClass="text-amber-300"
          borderAccentClass="border-amber-500/30"
        />
      </ResourceTooltip>
    </div>
  );
}
