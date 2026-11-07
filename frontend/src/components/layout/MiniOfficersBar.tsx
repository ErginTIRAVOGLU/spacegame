"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  OfficerTooltip,
  type OfficerTooltipKey,
} from "@/components/officers/OfficerTooltip";
import { Crown, Anchor, Wrench, Pickaxe, Cpu } from "lucide-react";

interface MiniOfficerItem {
  id: OfficerTooltipKey;
  label: string;
  icon: React.ElementType;
  activeColor: string;
}

const MINI_OFFICERS: MiniOfficerItem[] = [
  {
    id: "commander",
    label: "Commander",
    icon: Crown,
    activeColor: "text-amber-400",
  },
  {
    id: "admiral",
    label: "Amiral",
    icon: Anchor,
    activeColor: "text-blue-400",
  },
  {
    id: "engineer",
    label: "Mühendis",
    icon: Wrench,
    activeColor: "text-emerald-400",
  },
  {
    id: "geologist",
    label: "Jeolog",
    icon: Pickaxe,
    activeColor: "text-orange-400",
  },
  {
    id: "technocrat",
    label: "Teknokrat",
    icon: Cpu,
    activeColor: "text-cyan-400",
  },
];

interface OfficerStatusState {
  isActive: boolean;
  expiresAtUtc?: string | null;
  remainingSeconds: number;
}

export function MiniOfficersBar() {
  const router = useRouter();
  const userId = useGameStore((s) => s.userId);
  const officersStatus = useOfficerStore((s) => s.officers);
  const fetchOfficers = useOfficerStore((s) => s.fetchOfficers);
  const decrementTimers = useOfficerStore((s) => s.decrementTimers);

  useEffect(() => {
    fetchOfficers(userId || undefined);
    const interval = setInterval(() => {
      fetchOfficers(userId || undefined);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOfficers, userId]);

  // 1-second countdown decrement for local active officer timers
  useEffect(() => {
    const timer = setInterval(() => {
      decrementTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [decrementTimers]);

  const handleOfficerClick = (officerKey: OfficerTooltipKey) => {
    router.push(`/officers?select=${officerKey}`);
  };

  return (
    <div
      aria-label="Mini Officers Garrison Strip"
      className="flex items-center gap-1.5 pl-2 border-l border-zinc-800/80 shrink-0"
    >
      {MINI_OFFICERS.map((officer, index) => {
        const Icon = officer.icon;
        const status = officersStatus[officer.id] ?? {
          isActive: false,
          remainingSeconds: 0,
        };
        const isActive = status.isActive;
        const align = index >= 3 ? "right" : "center";

        return (
          <OfficerTooltip
            key={officer.id}
            officerKey={officer.id}
            isActive={isActive}
            remainingSeconds={status.remainingSeconds}
            align={align}
          >
            <button
              type="button"
              onClick={() => handleOfficerClick(officer.id)}
              title={`${officer.label} — ${isActive ? "Aktif" : "Pasif"}`}
              className={`h-8 w-8 rounded-lg border relative flex items-center justify-center transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-gradient-to-b from-[#14231e] via-[#0d1a15] to-[#07100d] border-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:border-emerald-400"
                  : "bg-zinc-900/90 border-zinc-800 text-zinc-500 grayscale opacity-60 hover:opacity-100 hover:border-zinc-700"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? officer.activeColor : "text-zinc-500"
                }`}
              />

              {/* Active green bottom indicator bar */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[1px] inset-x-1.5 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399]"
                />
              )}
            </button>
          </OfficerTooltip>
        );
      })}
    </div>
  );
}

