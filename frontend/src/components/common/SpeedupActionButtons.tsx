"use client";

import { useGameStore } from "@/store/useGameStore";
import { FastForward, Zap } from "lucide-react";

export interface SpeedupActionButtonsProps {
  halveCost: number;
  instantCost: number;
  onHalve: () => void;
  onInstant: () => void;
  halveLabel?: string;
  instantLabel?: string;
  halveTitle?: string;
  instantTitle?: string;
  variant?: "panel" | "compact";
  className?: string;
  disabled?: boolean;
}

export function SpeedupActionButtons({
  halveCost,
  instantCost,
  onHalve,
  onInstant,
  halveLabel,
  instantLabel,
  halveTitle,
  instantTitle,
  variant = "panel",
  className = "",
  disabled = false,
}: SpeedupActionButtonsProps) {
  const darkMatter = useGameStore((s) => s.darkMatter);

  const canHalve = darkMatter >= halveCost;
  const canComplete = darkMatter >= instantCost;

  const resolvedHalveTitle = !canHalve
    ? `Yetersiz Karanlık Madde (Gereken: ${halveCost} KM, Mevcut: ${darkMatter} KM)`
    : halveTitle ?? `Kalan süreyi yarıya indirir (${halveCost} KM)`;

  const resolvedInstantTitle = !canComplete
    ? `Yetersiz Karanlık Madde (Gereken: ${instantCost} KM, Mevcut: ${darkMatter} KM)`
    : instantTitle ?? `Hemen tamamlar (${instantCost} KM)`;

  if (variant === "compact") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {/* Halve Button */}
        <button
          type="button"
          disabled={disabled || !canHalve}
          onClick={onHalve}
          title={resolvedHalveTitle}
          className={`py-1.5 px-2 rounded bg-gradient-to-r from-amber-600/30 to-purple-600/30 hover:from-amber-500/40 hover:to-purple-500/40 border border-amber-400/50 text-[11px] font-mono font-semibold text-amber-200 flex items-center justify-center gap-1 transition ${
            !canHalve || disabled
              ? "opacity-40 cursor-not-allowed pointer-events-none grayscale"
              : "cursor-pointer"
          }`}
        >
          <FastForward className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span suppressHydrationWarning>
            {halveLabel ?? `Yarıla (${halveCost} KM)`}
          </span>
        </button>

        {/* Complete Button */}
        <button
          type="button"
          disabled={disabled || !canComplete}
          onClick={onInstant}
          title={resolvedInstantTitle}
          className={`py-1.5 px-2 rounded bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400/50 text-[11px] font-mono font-semibold text-emerald-200 flex items-center justify-center gap-1 transition ${
            !canComplete || disabled
              ? "opacity-40 cursor-not-allowed pointer-events-none grayscale"
              : "cursor-pointer"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
          <span suppressHydrationWarning>
            {instantLabel ?? `Tamamla (${instantCost} KM)`}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Halve Button */}
      <button
        type="button"
        disabled={disabled || !canHalve}
        onClick={onHalve}
        title={resolvedHalveTitle}
        className={`px-3.5 py-2.5 rounded-md bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_16px_rgba(251,191,36,0.3)] transition ${
          !canHalve || disabled
            ? "opacity-40 cursor-not-allowed pointer-events-none grayscale"
            : "cursor-pointer"
        }`}
      >
        <FastForward className="h-4 w-4 shrink-0" />
        <span suppressHydrationWarning>
          {halveLabel ?? `Yarıla (${halveCost} KM)`}
        </span>
      </button>

      {/* Complete Button */}
      <button
        type="button"
        disabled={disabled || !canComplete}
        onClick={onInstant}
        title={resolvedInstantTitle}
        className={`px-3.5 py-2.5 rounded-md bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_16px_rgba(16,185,129,0.3)] transition ${
          !canComplete || disabled
            ? "opacity-40 cursor-not-allowed pointer-events-none grayscale"
            : "cursor-pointer"
        }`}
      >
        <Zap className="h-4 w-4 shrink-0" />
        <span suppressHydrationWarning>
          {instantLabel ?? `Tamamla (${instantCost} KM)`}
        </span>
      </button>
    </div>
  );
}

