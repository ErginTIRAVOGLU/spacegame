"use client";

import React, { useState, useRef, type ReactNode } from "react";

export type OfficerTooltipKey =
  | "commander"
  | "admiral"
  | "engineer"
  | "geologist"
  | "technocrat";

interface OfficerTooltipProps {
  officerKey: OfficerTooltipKey;
  isActive?: boolean;
  remainingSeconds?: number;
  children: ReactNode;
  align?: "left" | "center" | "right";
}

interface OfficerTooltipData {
  title: string;
  activeTitle: string;
  perksText: string;
  accentColor: string;
}

const OFFICER_TOOLTIP_DATA: Record<OfficerTooltipKey, OfficerTooltipData> = {
  commander: {
    title: "Commander edin",
    activeTitle: "Commander (Aktif)",
    perksText:
      "+40 favori, inşa listesi, kısayollar, nakliye tarayıcısı, reklamsız oyun* (*oyuna dair notlar hariç)",
    accentColor: "text-amber-400",
  },
  admiral: {
    title: "Amiral görevlendir",
    activeTitle: "Amiral (Aktif)",
    perksText:
      "Maksimum filo sayısı +2, Max. keşifler +1, geliştirilmiş filo kaçış oranı, Savaş simülasyonu depo alanı +20",
    accentColor: "text-blue-400",
  },
  engineer: {
    title: "Mühendis görevlendir",
    activeTitle: "Mühendis (Aktif)",
    perksText: "Savunmada yarı yarıya düşüş, +%10 enerji üretimi",
    accentColor: "text-emerald-400",
  },
  geologist: {
    title: "Jeolog görevlendir",
    activeTitle: "Jeolog (Aktif)",
    perksText: "+%10 maden geliri",
    accentColor: "text-orange-400",
  },
  technocrat: {
    title: "Teknokrat görevlendir",
    activeTitle: "Teknokrat (Aktif)",
    perksText: "+2 casusluk seviyesi, %25 daha az araştırma süresi",
    accentColor: "text-cyan-400",
  },
};

function formatDuration(secs: number): string {
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (days > 0) return `${days}g ${hours}s`;
  if (hours > 0) return `${hours}s ${mins}d`;
  return `${mins}d ${secs % 60}sn`;
}

export function OfficerTooltip({
  officerKey,
  isActive = false,
  remainingSeconds = 0,
  children,
  align = "center",
}: OfficerTooltipProps) {
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

  const data = OFFICER_TOOLTIP_DATA[officerKey];

  const alignClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  }[align];

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
          {/* Header Title with Active Status */}
          <div className="flex items-center justify-between border-b border-[#263238] pb-1.5 mb-2">
            <span
              className={`font-semibold tracking-wide ${
                isActive ? "text-emerald-300" : data.accentColor
              }`}
            >
              {isActive ? data.activeTitle : data.title}
            </span>
            {isActive ? (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                {remainingSeconds > 0 ? formatDuration(remainingSeconds) : "Aktif"}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                Pasif
              </span>
            )}
          </div>

          {/* Perks description body */}
          <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
            {data.perksText}
          </p>

          {/* Bottom quick navigation hint */}
          <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Yönetmek için tıkla</span>
            <span className="font-mono text-amber-400">/officers →</span>
          </div>
        </div>
      )}
    </div>
  );
}

