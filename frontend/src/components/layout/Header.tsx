"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ResourceCounterBar } from "@/components/resources/ResourceCounter";
import { Shield, Trophy, Clock } from "lucide-react";

function formatServerUtcClock(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function Header() {
  const username = useGameStore((s) => s.username);
  const totalPoints = useGameStore((s) => s.totalPoints);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveClockMs = nowMs ?? new Date(planet.serverTimeUtc).getTime();

  return (
    <header className="h-[75px] shrink-0 w-full border-b border-cyan-500/20 bg-gradient-to-b from-[#0f1622]/95 via-[#090d14]/95 to-[#06090e]/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.65)] z-20">
      {/* Brand + Commander Summary */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5 pr-3 border-r border-zinc-800/80">
          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          <div>
            <div className="text-sm font-extrabold tracking-widest uppercase text-zinc-100 leading-none">
              OGame <span className="text-cyan-400">Regulus</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 tracking-wider mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span suppressHydrationWarning>{formatServerUtcClock(effectiveClockMs)}</span>
            </div>
          </div>
        </div>

        {/* Commander & Rank Badge */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#0c121b] border border-zinc-800/90 shadow-inner">
          <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-zinc-100 leading-tight flex items-center gap-1.5">
              <span>{username === "Commander" ? "Consul Pegasus" : username}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-0.5">
                <Trophy className="h-2.5 w-2.5 text-amber-400" />
                #1
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              Puan: {totalPoints.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </div>

      {/* Live Resource Bar */}
      <div className="flex items-center gap-2">
        <ResourceCounterBar />
      </div>
    </header>
  );
}

