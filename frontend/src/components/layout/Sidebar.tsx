"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { NextMissionWidget } from "@/components/layout/NextMissionWidget";
import {
  Globe,
  Pickaxe,
  Factory,
  Coins,
  FlaskConical,
  Rocket,
  ShieldAlert,
  Send,
  Orbit,
  Crown,
  Users,
  Dna,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Sliders,
  ShoppingBag,
  Award,
  CheckCircle2,
  Network,
  Swords,
} from "lucide-react";

const navItems = [
  { label: "Genel Bakış", href: "/overview", icon: Globe },
  { label: "Ödüller", href: "/rewards", icon: Award },
  { label: "Kaynaklar", href: "/resources", icon: Pickaxe },
  { label: "Canlı Türleri", href: "/lifeforms", icon: Dna },
  { label: "Tesisler", href: "/facilities", icon: Factory },
  { label: "Tüccar", href: "/merchant", icon: Coins },
  { label: "Dükkan", href: "/shop/classes", icon: ShoppingBag },
  { label: "Araştırma", href: "/research", icon: FlaskConical },
  { label: "Tersane", href: "/shipyard", icon: Rocket },
  { label: "Savunma", href: "/defenses", icon: ShieldAlert },
  { label: "Filo", href: "/fleet", icon: Send },
  { label: "Simülatör", href: "/simulator", icon: Swords },
  { label: "Galaksi", href: "/galaxy", icon: Orbit },
  { label: "İmparatorluk", href: "/empire", icon: Crown },
  { label: "Teknoloji", href: "/techtree", icon: Network },
  { label: "İttifak", href: "/alliance", icon: Users },
  { label: "Subaylar", href: "/officers", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const userId = useGameStore((s) => s.userId);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const setIsSettingsOpen = useGameStore((s) => s.setIsSettingsOpen);

  return (
    <aside className="w-[180px] shrink-0 border-r border-cyan-500/15 bg-gradient-to-b from-[#0b1018]/95 to-[#06090e]/95 flex flex-col justify-between select-none z-10">
      <div className="p-2.5 space-y-3 overflow-y-auto">
        {/* Next/Active Mission Notification Widget - Connected to Normalized Tutorial Store */}
        <NextMissionWidget />

        {/* Classic OGame Metallic Beveled Button Stack */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (pathname === "/" && item.href === "/overview");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center justify-between px-3 py-2 rounded text-xs font-semibold tracking-wide transition-all border-t border-b border-x ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-950/80 via-[#132334] to-[#0f1924] text-cyan-300 border-t-cyan-400/50 border-b-cyan-900/60 border-x-cyan-500/40 shadow-[0_0_14px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(34,211,238,0.25)]"
                    : "bg-gradient-to-b from-[#161f2c] to-[#0b1017] text-zinc-300 border-t-zinc-700/50 border-b-zinc-950 border-x-zinc-800/80 hover:from-[#1c2838] hover:to-[#101824] hover:text-cyan-200 hover:border-cyan-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive
                        ? "text-cyan-400"
                        : "text-zinc-500 group-hover:text-cyan-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.label === "Dükkan" && (
                    <span className="px-1 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.35)] animate-pulse">
                      SALE
                    </span>
                  )}
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings Button */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold tracking-wide transition-all border border-zinc-800/90 bg-gradient-to-b from-[#141b26] to-[#0c1119] text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/50 cursor-pointer shadow-sm group"
          >
            <span className="flex items-center gap-2.5 truncate">
              <Sliders className="h-3.5 w-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              <span>Ayarlar</span>
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Universe Status Badge */}
      <div className="p-2.5 m-2 rounded border border-zinc-800/80 bg-[#070a0f]/90 text-[10px] font-mono text-zinc-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Evren Hızı</span>
          <span className="text-emerald-400">Eko 5x / Filo 2x</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Harabe Oranı</span>
          <span className="text-cyan-400">%30 Gemi</span>
        </div>
      </div>
    </aside>
  );
}
