"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IncomingFleetAlert } from "@/store/useGameStore";
import { FleetDetailsTooltip } from "@/components/fleet/FleetDetailsTooltip";
import {
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Clock,
  X,
  Target,
  Plane,
  AlertTriangle,
  User,
  Radio,
} from "lucide-react";

interface EventListBoxProps {
  incomingFleets: IncomingFleetAlert[];
  onClose?: () => void;
  className?: string;
}

function parseCoords(coordsStr: string): { galaxy: number; system: number; slot: number } {
  const match = coordsStr.match(/\[?(\d+):(\d+):(\d+)\]?/);
  if (match) {
    return {
      galaxy: parseInt(match[1], 10),
      system: parseInt(match[2], 10),
      slot: parseInt(match[3], 10),
    };
  }
  return { galaxy: 1, system: 1, slot: 1 };
}

function formatArrivalTime(utcString: string): string {
  try {
    const d = new Date(utcString);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} Saat`;
  } catch {
    return "12:00:00 Saat";
  }
}

function formatTickingCountdown(targetUtc: string): string {
  const now = Date.now();
  const target = new Date(targetUtc).getTime();
  const diffSec = Math.max(0, Math.floor((target - now) / 1000));
  const minutes = Math.floor(diffSec / 60);
  const seconds = diffSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}dk ${pad(seconds)}sn`;
}

export function EventListBox({
  incomingFleets,
  onClose,
  className = "",
}: EventListBoxProps) {
  const router = useRouter();
  const [, setTick] = useState(0);
  const [hoveredFleetId, setHoveredFleetId] = useState<string | null>(null);

  // 1-second countdown ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hostileCount = incomingFleets.filter((f) => f.isHostile).length;
  const totalCount = incomingFleets.length;

  return (
    <div
      className={`rounded-xl border border-red-500/60 bg-[#090d18]/98 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden ${className}`}
    >
      {/* Header: Olaylar + Close Button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-950/70 via-[#101422] to-[#0a0d18] border-b border-red-500/40">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>Olaylar</span>
            <span className="text-xs font-mono text-red-400">
              ({totalCount} Görev: {hostileCount} düşmanca)
            </span>
          </h3>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Fleets List */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto divide-y divide-zinc-800/60">
        {incomingFleets.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-zinc-400">
            Aktif veya yaklaşan düşman filo hareketi tespit edilmedi.
          </div>
        ) : (
          incomingFleets.map((fleet) => {
            const countdownStr = formatTickingCountdown(fleet.arrivalUtc);
            const arrivalClockStr = formatArrivalTime(fleet.arrivalUtc);
            const origin = parseCoords(fleet.originCoords);
            const target = parseCoords(fleet.targetCoords);
            const isHovered = hoveredFleetId === fleet.id;

            return (
              <div
                key={fleet.id}
                className={`pt-2 first:pt-0 relative transition-all rounded-lg p-2.5 ${
                  fleet.isHostile
                    ? "bg-red-950/20 border border-red-500/30 hover:border-red-400"
                    : "bg-zinc-900/40 border border-zinc-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Countdown & Arrival Time */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold font-mono text-red-500 tracking-wide animate-pulse">
                        {countdownStr}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{arrivalClockStr}</span>
                      </span>
                    </div>

                    {/* Mission badge */}
                    <div className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[11px] font-mono font-bold text-red-400">
                      {fleet.missionTypeName || (fleet.isHostile ? "Saldır" : fleet.missionType)}
                    </div>
                  </div>

                  {/* Center: Flight Vector Leg (Attacker -> Arrow -> Destination) */}
                  <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                    {/* Origin / Attacker */}
                    <div className="flex items-center gap-1.5 bg-[#070b13] px-2 py-1 rounded border border-zinc-800">
                      <User className="h-3 w-3 text-red-400" />
                      <span className="font-semibold text-zinc-200">
                        {fleet.originPlanetName || "Romulus"}
                      </span>
                      <Link
                        href={`/galaxy?galaxy=${origin.galaxy}&system=${origin.system}`}
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {fleet.originCoords}
                      </Link>
                    </div>

                    {/* Directional Flight Vector Arrow */}
                    <div className="flex items-center text-red-400 animate-pulse">
                      <ChevronRight className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4 -ml-2" />
                    </div>

                    {/* Destination Target */}
                    <div className="flex items-center gap-1.5 bg-[#070b13] px-2 py-1 rounded border border-zinc-800">
                      <Target className="h-3 w-3 text-emerald-400" />
                      <span className="font-semibold text-zinc-200">
                        {fleet.targetPlanetName || "TR_NEW"}
                      </span>
                      <Link
                        href={`/galaxy?galaxy=${target.galaxy}&system=${target.system}`}
                        className="text-emerald-400 hover:text-emerald-300 underline"
                      >
                        {fleet.targetCoords}
                      </Link>
                    </div>
                  </div>

                  {/* Right: Total Ship Badge & Tooltip Trigger */}
                  <div className="relative flex items-center gap-2">
                    <div
                      onMouseEnter={() => setHoveredFleetId(fleet.id)}
                      onMouseLeave={() => setHoveredFleetId(null)}
                      onClick={() =>
                        setHoveredFleetId((cur) => (cur === fleet.id ? null : fleet.id))
                      }
                      className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-bold shadow-md cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Plane className="h-3.5 w-3.5 text-red-600" />
                      <span>{fleet.shipCount}</span>
                    </div>

                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute right-0 top-full mt-2 z-50">
                        <FleetDetailsTooltip
                          fleet={fleet}
                          onClose={() => setHoveredFleetId(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

