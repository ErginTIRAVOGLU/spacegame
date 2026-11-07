"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL, useGameStore, type IncomingFleetAlert } from "@/store/useGameStore";
import { EventListBox } from "@/components/fleet/EventListBox";
import * as signalR from "@microsoft/signalr";
import {
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";

function playRaidAlarmSiren() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    // Sci-fi high-low alert siren tone (880Hz down to 440Hz, then up to 880Hz)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio context may require prior user interaction
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

export function HostileAlertBar() {
  const incomingFleets = useGameStore((s) => s.incomingFleets);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const [isEventBoxOpen, setIsEventBoxOpen] = useState(false);
  const [, setTick] = useState(0);
  const prevHostileCountRef = useRef(0);

  // 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hostileFleets = incomingFleets.filter((f) => f.isHostile);
  const hasHostiles = hostileFleets.length > 0;

  // SignalR subscription to FleetMovementHub
  useEffect(() => {
    let connection: signalR.HubConnection | null = null;
    let isCancelled = false;
    let isStarted = false;

    try {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/fleet`, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .configureLogging(signalR.LogLevel.None)
        .withAutomaticReconnect()
        .build();

      connection.on("OnHostileFleetDetected", () => {
        playRaidAlarmSiren();
        fetchBootstrap();
      });

      connection.on("OnFleetArrived", () => {
        fetchBootstrap();
      });

      connection
        .start()
        .then(() => {
          isStarted = true;
          if (isCancelled && connection) {
            connection.stop().catch(() => {});
          }
        })
        .catch(() => {
          // Gracefully fallback if SignalR WebSocket fails or cancels
        });
    } catch {
      // Ignore
    }

    return () => {
      isCancelled = true;
      if (connection && isStarted) {
        connection.stop().catch(() => {});
      }
    };
  }, [fetchBootstrap]);

  // Audio alert on new incoming hostiles
  useEffect(() => {
    if (hostileFleets.length > prevHostileCountRef.current) {
      playRaidAlarmSiren();
    }
    prevHostileCountRef.current = hostileFleets.length;
  }, [hostileFleets.length]);

  if (!hasHostiles) {
    return null;
  }

  // Earliest impact mission
  const sortedHostiles = [...hostileFleets].sort(
    (a, b) => new Date(a.arrivalUtc).getTime() - new Date(b.arrivalUtc).getTime()
  );
  const nextHostile = sortedHostiles[0];
  const nextCountdown = formatTickingCountdown(nextHostile.arrivalUtc);
  const totalMissionsCount = incomingFleets.length;
  const hostileCount = hostileFleets.length;

  return (
    <div className="w-full relative z-30">
      {/* Top Red Bar matching screenshot */}
      <div
        onClick={() => setIsEventBoxOpen((prev) => !prev)}
        className="h-10 w-full bg-gradient-to-r from-red-950 via-[#180a0d] to-red-950 border-b-2 border-red-500/80 px-4 flex items-center justify-between shadow-[0_4px_16px_rgba(239,68,68,0.4)] cursor-pointer hover:bg-red-950/90 transition select-none"
      >
        {/* Left: Alert Text + Next Impact */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-extrabold text-red-500 animate-pulse tracking-wide flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-red-500 animate-ping shrink-0" />
            <span>
              {totalMissionsCount} Görev: {hostileCount} düşmanca
            </span>
          </span>

          <span className="text-zinc-600 hidden sm:inline">•</span>

          <span className="text-xs font-mono text-zinc-300 flex items-center gap-1">
            <span className="text-zinc-400">Bir sonraki:</span>
            <span className="text-red-400 font-bold">{nextCountdown}</span>
          </span>

          <div className="hidden md:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[11px] font-mono">
            <span className="text-zinc-400">Tür:</span>
            <span className="text-red-400 font-bold">
              {nextHostile.missionTypeName || "Saldır"}
            </span>
          </div>
        </div>

        {/* Right: Hazard Triangle Icon + Expand Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
            <span className="hidden sm:inline">Olayları Göster</span>
            {isEventBoxOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          <div className="h-6 w-6 rounded bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 animate-bounce">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
        </div>
      </div>

      {/* Collapsible Event List Box */}
      {isEventBoxOpen && (
        <div className="p-3 bg-[#060810]/95 border-b border-red-500/40 shadow-2xl">
          <EventListBox
            incomingFleets={incomingFleets}
            onClose={() => setIsEventBoxOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

