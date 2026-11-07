"use client";

import React, { useState, useRef, type ReactNode } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useResourceStore } from "@/store/useResourceStore";
import { useOfficerStore } from "@/store/useOfficerStore";

export type ResourceTooltipType =
  | "metal"
  | "crystal"
  | "deuterium"
  | "energy"
  | "population"
  | "food"
  | "darkMatter";

interface ResourceTooltipProps {
  type: ResourceTooltipType;
  liveAmount?: number;
  children: ReactNode;
  align?: "left" | "center" | "right";
}

export function ResourceTooltip({
  type,
  liveAmount,
  children,
  align = "center",
}: ResourceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const bonuses = useOfficerStore((s) => s.bonuses);

  const getMineralMetrics = useResourceStore((s) => s.getMineralMetrics);
  const getEnergyMetrics = useResourceStore((s) => s.getEnergyMetrics);
  const getPopulationMetrics = useResourceStore((s) => s.getPopulationMetrics);
  const getFoodMetrics = useResourceStore((s) => s.getFoodMetrics);
  const getDarkMatterMetrics = useResourceStore((s) => s.getDarkMatterMetrics);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const alignClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  }[align];

  const renderTooltipContent = () => {
    if (!planet) return null;

    if (type === "metal" || type === "crystal" || type === "deuterium") {
      const fallbackAmount =
        type === "metal"
          ? planet.metal
          : type === "crystal"
          ? planet.crystal
          : planet.deuterium;

      const currentLive = liveAmount ?? fallbackAmount;
      const metrics = getMineralMetrics(planet, type, currentLive);
      const title =
        type === "metal"
          ? "Metal"
          : type === "crystal"
          ? "Kristal"
          : "Deuterium";

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-1.5">
            <span className="font-semibold text-zinc-200 tracking-wide">
              {title}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Mevcut:</span>
            <span
              className={`font-mono font-medium tabular-nums ${
                metrics.isFull ? "text-red-500 font-bold" : "text-zinc-100"
              }`}
            >
              {metrics.current.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Depo kapasitesi:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.capacity.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Güncel üretim:</span>
            <span className="font-mono text-emerald-400 tabular-nums font-semibold">
              +{metrics.hourlyProduction.toLocaleString("en-US")}
            </span>
          </div>
          {type === "deuterium" && metrics.fusionDeuteriumConsumption !== undefined && metrics.fusionDeuteriumConsumption > 0 && (
            <div className="flex justify-between items-center text-[11px] text-rose-400 font-mono">
              <span>• Füzyoenerji Tüketimi:</span>
              <span className="tabular-nums">
                -{metrics.fusionDeuteriumConsumption.toLocaleString("en-US")}/sa
              </span>
            </div>
          )}
          {bonuses.hasGeologist && (
            <div className="flex justify-between items-center text-[11px] text-orange-400 font-mono">
              <span>• Jeolog (+%10):</span>
              <span className="tabular-nums">
                +{Math.round((metrics.hourlyProduction / bonuses.mineProductionMultiplier) * 0.10).toLocaleString("en-US")}
              </span>
            </div>
          )}
          {bonuses.hasFullCommandStaff && (
            <div className="flex justify-between items-center text-[11px] text-amber-300 font-mono">
              <span>• Komuta Heyeti (+%2):</span>
              <span className="tabular-nums">
                +{Math.round((metrics.hourlyProduction / bonuses.mineProductionMultiplier) * 0.02).toLocaleString("en-US")}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Korunak Kapasitesi:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.bunkerCapacity.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      );
    }

    if (type === "energy") {
      const metrics = getEnergyMetrics(planet);
      const isPositive = metrics.current >= 0;

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-1.5">
            <span className="font-semibold text-zinc-200 tracking-wide">
              Enerji
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Mevcut:</span>
            <span
              className={`font-mono font-medium tabular-nums ${
                isPositive ? "text-emerald-400" : "text-rose-500"
              }`}
            >
              {isPositive ? `+${metrics.current.toLocaleString("en-US")}` : metrics.current.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Güncel üretim:</span>
            <span className="font-mono text-emerald-400 tabular-nums font-semibold">
              +{metrics.produced.toLocaleString("en-US")}
            </span>
          </div>
          {metrics.solarPlantEnergy > 0 && (
            <div className="flex justify-between items-center text-[11px] text-zinc-300 font-mono pl-2">
              <span>• Solar Enerji Santrali:</span>
              <span className="tabular-nums">+{metrics.solarPlantEnergy.toLocaleString("en-US")}</span>
            </div>
          )}
          {metrics.fusionReactorEnergy > 0 && (
            <div className="flex justify-between items-center text-[11px] text-purple-300 font-mono pl-2">
              <span>• Füzyoenerji Santrali:</span>
              <span className="tabular-nums">+{metrics.fusionReactorEnergy.toLocaleString("en-US")}</span>
            </div>
          )}
          {metrics.fusionLevel > 0 && metrics.fusionReactorEnergy === 0 && (
            <div className="flex justify-between items-center text-[11px] text-rose-400/80 font-mono pl-2">
              <span>• Füzyoenerji Santrali:</span>
              <span>0 (Döteryum yok veya kapalı)</span>
            </div>
          )}
          {metrics.solarSatelliteEnergy > 0 && (
            <div className="flex justify-between items-center text-[11px] text-sky-300 font-mono pl-2">
              <span>• Solar Uydu:</span>
              <span className="tabular-nums">+{metrics.solarSatelliteEnergy.toLocaleString("en-US")}</span>
            </div>
          )}
          {bonuses.hasEngineer && (
            <div className="flex justify-between items-center text-[11px] text-emerald-300 font-mono">
              <span>• Mühendis (+%10):</span>
              <span className="tabular-nums">
                +{Math.round((metrics.produced / bonuses.energyProductionMultiplier) * 0.10).toLocaleString("en-US")}
              </span>
            </div>
          )}
          {bonuses.hasFullCommandStaff && (
            <div className="flex justify-between items-center text-[11px] text-amber-300 font-mono">
              <span>• Komuta Heyeti (+%2):</span>
              <span className="tabular-nums">
                +{Math.round((metrics.produced / bonuses.energyProductionMultiplier) * 0.02).toLocaleString("en-US")}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Tüketim:</span>
            <span className="font-mono text-rose-400 tabular-nums">
              -{metrics.consumed.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      );
    }

    if (type === "population") {
      const metrics = getPopulationMetrics(planet.id);

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-1.5">
            <span className="font-semibold text-zinc-200 tracking-wide">
              Canlı Türü Nüfus
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Mevcut:</span>
            <span className="font-mono text-zinc-100 tabular-nums">
              {metrics.current.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">T2 Canlı Türleri:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.t2.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">T3 Canlı Türleri:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.t3.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Konut:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.housing.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Beslenen:</span>
            <span className="font-mono text-emerald-400 tabular-nums">
              {metrics.fed.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Yetersiz besleme:</span>
            <span
              className={`font-mono tabular-nums ${
                metrics.underfed > 0 ? "text-rose-400 font-semibold" : "text-zinc-300"
              }`}
            >
              {metrics.underfed.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Büyüme oranı:</span>
            <span className="font-mono text-emerald-400 tabular-nums">
              {metrics.growthRate}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Sığınak Yeri:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.shelterCapacity.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      );
    }

    if (type === "food") {
      const metrics = getFoodMetrics(planet.id);

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-1.5">
            <span className="font-semibold text-zinc-200 tracking-wide">
              Canlı Türü Besin
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Mevcut:</span>
            <span className="font-mono text-zinc-100 tabular-nums">
              {metrics.current.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Depo kapasitesi:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.capacity.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Fazla üretim:</span>
            <span className="font-mono text-emerald-400 tabular-nums">
              +{metrics.surplus.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Tüketim:</span>
            <span className="font-mono text-rose-400 tabular-nums">
              -{metrics.consumption.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Tüketim süresi:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.consumptionTimeRemaining}
            </span>
          </div>
        </div>
      );
    }

    if (type === "darkMatter") {
      const metrics = getDarkMatterMetrics(darkMatter);

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-1.5">
            <span className="font-semibold text-zinc-200 tracking-wide">
              Karanlık Madde
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Mevcut:</span>
            <span className="font-mono font-semibold text-amber-300 tabular-nums">
              {metrics.total.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Satın alındı:</span>
            <span className="font-mono text-zinc-300 tabular-nums">
              {metrics.purchased.toLocaleString("en-US")}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Bulundu:</span>
            <span className="font-mono text-cyan-400 tabular-nums">
              {metrics.found.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute top-[calc(100%+8px)] ${alignClasses} z-50 w-64 min-w-[220px] bg-[#0d1014] border border-[#263238] shadow-2xl rounded p-3 text-xs select-none pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95`}
        >
          {renderTooltipContent()}
        </div>
      )}
    </div>
  );
}

