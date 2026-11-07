"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useResourceStore } from "@/store/useResourceStore";
import { useGameStore } from "@/store/useGameStore";
import {
  Dna,
  Users,
  Pickaxe,
  Cpu,
  Compass,
  Sparkles,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  LIFEFORMS_CATALOG,
  normalizeSpeciesId,
  type LifeformId,
} from "@/lib/lifeformsCatalog";

export function HeaderSpeciesWidget() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const planets = useGameStore((s) => s.planets);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const lifeformState = useResourceStore((s) =>
    planet?.id ? s.getPlanetLifeformState(planet.id) : null
  );

  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const hasAssignedSpecies = Boolean(
    mounted &&
      lifeformState?.activeSpecies &&
      lifeformState.activeSpecies !== "none" &&
      lifeformState.activeSpecies !== "Durduruldu"
  );

  const activeSpeciesKey = hasAssignedSpecies
    ? normalizeSpeciesId(lifeformState?.activeSpecies)
    : null;
  const activeSpeciesConfig = activeSpeciesKey
    ? LIFEFORMS_CATALOG[activeSpeciesKey]
    : null;

  const isSpeciesActive = mounted
    ? lifeformState?.isActive !== false &&
      hasAssignedSpecies &&
      lifeformState?.activeSpecies !== "Durduruldu"
    : true;

  const speciesLevel = mounted ? (lifeformState?.speciesLevel ?? 0) : 0;
  const currentXp = mounted ? (lifeformState?.currentXp ?? 0) : 0;
  const maxXp = mounted ? (lifeformState?.maxXp ?? 900) : 900;
  const techBonus = mounted ? (lifeformState?.techBonusPercent ?? 0.8) : 0.8;

  // Species icon & theme mapping
  const renderSpeciesIcon = (id: LifeformId | null) => {
    switch (id) {
      case "rocktal":
        return <Pickaxe className="h-4 w-4 text-amber-300" />;
      case "mechas":
        return <Cpu className="h-4 w-4 text-sky-300" />;
      case "kaelesh":
        return <Compass className="h-4 w-4 text-emerald-300" />;
      case "humans":
      default:
        return <Users className="h-4 w-4 text-purple-300" />;
    }
  };

  const speciesInitial = (id: LifeformId | null) => {
    switch (id) {
      case "rocktal":
        return "R";
      case "mechas":
        return "M";
      case "kaelesh":
        return "K";
      case "humans":
      default:
        return "H";
    }
  };

  // If no species is assigned (e.g. Colony with activeSpecies = null / "none")
  if (mounted && !hasAssignedSpecies) {
    return (
      <div
        className="relative inline-block shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => router.push("/lifeforms?focus=species-selector")}
          title="Canlı Türü Seçimi - Bu sömürgeye henüz bir canlı türü atanmadı"
          aria-label="Sömürge Canlı Türü Seç"
          className="h-8 px-2.5 rounded-lg border border-dashed border-amber-500/70 bg-gradient-to-b from-amber-500/20 via-slate-900 to-[#070a10] text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
        >
          <Dna className="h-3.5 w-3.5 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] font-bold text-amber-200">Tür Seç</span>
          <Plus className="h-3 w-3 text-amber-400/80 -ml-0.5" />
        </button>

        {/* Unassigned Quick Tooltip Popover */}
        {isOpen && (
          <div
            role="tooltip"
            className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-amber-500/40 bg-[#0c1117] p-3.5 shadow-2xl z-[100] text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Dna className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-bold text-gray-200">
                  Sömürge Canlı Türü
                </h4>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Atanmamış
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-[#0b0e12] border border-zinc-800 rounded p-2.5 mb-2.5">
              Bu sömürgeye henüz bir canlı türü atanmadı. Koloninizi uzmanlaştırmak ve canlı türü binalarını inşa edebilmek için bir tür atayın.
            </p>

            <button
              type="button"
              onClick={() => router.push("/lifeforms?focus=species-selector")}
              className="w-full mt-1 py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Canlı Türü Ata</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Assigned Species State (Homeworld or Colony with species assigned)
  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => router.push("/lifeforms")}
        title={`Canlı Türü Yönetimi - ${activeSpeciesConfig?.name ?? "İnsanlar"}`}
        aria-label="Canlı Türü Yönetimi"
        className={`h-8 w-8 rounded-lg border relative flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md ${
          isSpeciesActive
            ? "border-purple-500/60 bg-gradient-to-b from-purple-500/20 via-slate-900 to-[#070a10] text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            : "border-zinc-700 bg-zinc-900/80 text-zinc-400 opacity-70"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {renderSpeciesIcon(activeSpeciesKey)}
          <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold text-cyan-300">
            {speciesInitial(activeSpeciesKey)}
          </span>
        </div>

        <span
          suppressHydrationWarning
          className="absolute -top-1 -left-1 px-1 py-0.2 rounded-full bg-purple-950 border border-purple-400/60 text-[9px] font-mono font-bold text-purple-200"
        >
          T{speciesLevel}
        </span>
      </button>

      {/* Quick Tooltip Popover */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[#263238] bg-[#0c1117] p-3.5 shadow-2xl z-[100] text-left animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#263238] pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Dna className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <span>{activeSpeciesConfig?.name ?? "İnsanlar"}</span>
                  <span
                    suppressHydrationWarning
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    Kademe {speciesLevel}
                  </span>
                </h4>
              </div>
            </div>

            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isSpeciesActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}
            >
              {isSpeciesActive ? "Aktif" : "Durduruldu"}
            </span>
          </div>

          {/* Canonical Lore Text */}
          <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0e12] border border-[#263238] rounded p-2.5 mb-2.5">
            {activeSpeciesConfig
              ? `${activeSpeciesConfig.tagline}: ${activeSpeciesConfig.playstyle}`
              : "İnsanlar çok yönlü yeteneklere sahip bir canlı türüdür. Diğer canlı türlerini bulabilen tek türdür. Besin üretimleri ve halkının nüfus artışı dengelidir ayrıca tüm gezegenlerdeki kaynak üretimini artırırlar."}
          </p>

          {/* XP & Tech Bonus Progress */}
          <div className="space-y-1.5 text-[10px] font-mono border-t border-[#263238] pt-2 text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Tecrübe İlerlemesi:</span>
              <span className="text-purple-300 font-semibold">
                {currentXp} / {maxXp} XP
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((currentXp / Math.max(1, maxXp)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span>Aktif Teknoloji Bonusu:</span>
              <span className="text-emerald-400 font-semibold">%{techBonus}</span>
            </div>
          </div>

          {/* Click to manage footer */}
          <div
            onClick={() => router.push("/lifeforms")}
            className="mt-3 pt-2 border-t border-[#263238] flex items-center justify-between text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              Canlı Türü Yönetimi
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
    </div>
  );
}
