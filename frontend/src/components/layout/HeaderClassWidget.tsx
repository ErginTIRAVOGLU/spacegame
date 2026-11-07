"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { HelpCircle, Crosshair, Compass, Pickaxe } from "lucide-react";

export function HeaderClassWidget() {
  const router = useRouter();
  const playerClass = useGameStore((s) => s.playerClass);

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

  const isAssigned =
    Boolean(playerClass) &&
    playerClass !== "None";

  const classKey = (playerClass || "None").toLowerCase();

  const getEmblemConfig = () => {
    if (classKey.includes("collector") || classKey.includes("kolekt")) {
      return {
        name: "Koleksiyoncu (Collector)",
        title: "Koleksiyoncu Sınıfı",
        subtitle: "+%25 Maden, +%10 Enerji, +%50 Paletli ve Nakliye hızı bonusu aktif.",
        icon: Pickaxe,
        borderClass: "border-amber-500/60 bg-gradient-to-b from-amber-500/20 to-amber-950/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        auraColor: "text-amber-400",
      };
    }

    if (classKey.includes("general")) {
      return {
        name: "General Sınıfı",
        title: "General Sınıfı",
        subtitle: "Savaş gemileri +%100 hız, -%50 deut, +2 filo slotu ve Azrail enkaz yağması.",
        icon: Crosshair,
        borderClass: "border-rose-500/60 bg-gradient-to-b from-rose-500/20 to-rose-950/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
        auraColor: "text-rose-400",
      };
    }

    if (classKey.includes("discover") || classKey.includes("kaşif") || classKey.includes("kasif")) {
      return {
        name: "Kaşif (Discoverer)",
        title: "Kaşif Sınıfı",
        subtitle: "+2 keşif slotu, çarpanlı sefer kazancı, Rehber enkaz sökümü ve -%25 araştırma.",
        icon: Compass,
        borderClass: "border-cyan-500/60 bg-gradient-to-b from-cyan-500/20 to-cyan-950/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]",
        auraColor: "text-cyan-400",
      };
    }

    return {
      name: "Sınıf seç",
      title: "Sınıf seç",
      subtitle: "Özel bonuslar için sınıfını seç.",
      icon: HelpCircle,
      borderClass: "border-amber-500/70 bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-950 text-amber-400 animate-pulse shadow-[0_0_14px_rgba(245,158,11,0.35)]",
      auraColor: "text-amber-400",
    };
  };

  const config = getEmblemConfig();
  const Icon = config.icon;

  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => router.push("/character-class")}
        title={config.title}
        aria-label="Character Class Selection Hub"
        className={`h-8 w-8 rounded-lg border relative flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${config.borderClass}`}
      >
        <Icon className="h-4 w-4 shrink-0" />

        {/* Small corner badge if unassigned */}
        {!isAssigned && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}
      </button>

      {/* Floating Hover Tooltip */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-64 min-w-[220px] bg-[#0d1014] border border-[#263238] shadow-2xl rounded p-3 text-xs select-none pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-2">
            <span className={`font-semibold tracking-wide ${config.auraColor}`}>
              {config.title}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isAssigned
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
              }`}
            >
              {isAssigned ? "Aktif" : "Seçilmedi"}
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
            {config.subtitle}
          </p>

          <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Sınıf Merkezine Git</span>
            <span className="font-mono text-cyan-400">/character-class →</span>
          </div>
        </div>
      )}
    </div>
  );
}
