"use client";

import React from "react";
import Link from "next/link";
import { getQuestTargetRoute } from "@/config/questRouteMapping";
import { useGameStore } from "@/store/useGameStore";
import { ExternalLink, Compass, ArrowUpRight } from "lucide-react";

interface QuestActionLinkProps {
  text: string;
  className?: string;
  showIcon?: boolean;
  showBadge?: boolean;
  overrideRoute?: string;
  onClick?: () => void;
}

export function QuestActionLink({
  text,
  className = "",
  showIcon = true,
  showBadge = false,
  overrideRoute,
  onClick,
}: QuestActionLinkProps) {
  const target = getQuestTargetRoute(text);
  const route = overrideRoute || target.route;

  const handleClick = (e: React.MouseEvent) => {
    if (target.meta?.requireColonySwitch) {
      const { planets, selectedPlanetId, selectPlanet } = useGameStore.getState();
      const currentPlanet = planets.find((p) => p.id === selectedPlanetId);
      if (currentPlanet?.isCapital) {
        const colony = planets.find((p) => !p.isCapital);
        if (colony) {
          selectPlanet(colony.id);
        }
      }
    }

    if (target.modalId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-game-modal", {
          detail: { modalId: target.modalId },
        })
      );
    }

    if (target.focusKey && typeof document !== "undefined") {
      const candidates = [
        document.getElementById(`card-${target.focusKey}`),
        document.getElementById(`item-${target.focusKey}`),
        document.getElementById(target.focusKey),
      ];
      const el = candidates.find((c) => c !== null);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={route}
      onClick={handleClick}
      title={`Görevin olduğu yere git (${target.label})`}
      className={`inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 hover:underline cursor-pointer group transition-colors ${className}`}
    >
      <span className="truncate">{text}</span>
      {showIcon && (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cyan-400/80 group-hover:text-cyan-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      )}
      {showBadge && (
        <span className="shrink-0 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 group-hover:bg-cyan-900 group-hover:border-cyan-400 transition-colors">
          Git: {target.label}
        </span>
      )}
    </Link>
  );
}

export default QuestActionLink;

