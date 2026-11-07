"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

export interface FleetTimeDisplayProps {
  targetTimestamp: number | string; // Milisaniye cinsinden varış unix zamanı veya ISO UTC string
  returnTimestamp?: number | string | null; // Dönüş unix zamanı (varsa)
  isReturning: boolean;
  referenceUtc?: string;
  onComplete?: () => void;
  className?: string;
  boxed?: boolean;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export function formatClockTime(timestamp: number | string): string {
  const date =
    typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return "--:--:--";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function FleetTimeDisplay({
  targetTimestamp,
  returnTimestamp,
  isReturning,
  referenceUtc,
  onComplete,
  className,
  boxed = false,
}: FleetTimeDisplayProps) {
  const [now, setNow] = useState<number | null>(null);
  const hasTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // If returning and returnTimestamp is provided, flight target is returnTimestamp
  const effectiveTarget =
    isReturning && returnTimestamp ? returnTimestamp : targetTimestamp;
  const targetMs =
    typeof effectiveTarget === "string"
      ? new Date(effectiveTarget).getTime()
      : effectiveTarget;

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [targetMs]);

  // Current client timestamp, with initial SSR fallback if referenceUtc is provided
  const currentNow =
    now ?? (referenceUtc ? new Date(referenceUtc).getTime() : Date.now());

  const remainingMs = Number.isFinite(targetMs)
    ? Math.max(0, targetMs - currentNow)
    : 0;
  const remainingFormatted = formatDuration(remainingMs); // Örn: "00:14:22" (Geri sayım)
  const clockFormatted = formatClockTime(targetMs); // Örn: "23:42:15" (Kesin Saat)

  // Optional return clock if outbound and returnTimestamp is present
  const returnClockFormatted =
    !isReturning && returnTimestamp ? formatClockTime(returnTimestamp) : null;

  useEffect(() => {
    if (now !== null && targetMs > 0 && remainingMs <= 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onCompleteRef.current?.();
    }
  }, [now, targetMs, remainingMs]);

  return (
    <div
      className={`flex flex-col items-end text-xs leading-tight font-mono ${
        boxed
          ? "px-2.5 py-1 rounded bg-zinc-950/90 border border-amber-500/40 shadow-sm"
          : ""
      } ${className ?? ""}`}
    >
      {/* 1. Satır: Canlı Geri Sayım (Vurgulu Sarı/Amber) */}
      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
        <Clock className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-[10px] text-amber-500/80">Kalan:</span>
        <span suppressHydrationWarning>{remainingFormatted}</span>
      </div>

      {/* 2. Satır: Kesin Varış Saati (Soluk Gri/Mavi) */}
      <div className="flex items-center gap-1 text-[11px] text-cyan-300/80 mt-0.5">
        <span className="text-[10px] text-gray-500">
          {isReturning ? "Dönüş:" : "Varış:"}
        </span>
        <span suppressHydrationWarning>{clockFormatted}</span>
      </div>

      {/* 3. Satır (Opsiyonel): Gidiş görevinde varsa kesin dönüş saati */}
      {returnClockFormatted && (
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
          <span>Dönüş:</span>
          <span suppressHydrationWarning>{returnClockFormatted}</span>
        </div>
      )}
    </div>
  );
}

