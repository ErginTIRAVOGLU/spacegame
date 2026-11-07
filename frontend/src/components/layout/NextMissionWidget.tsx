"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useGameStore } from "@/store/useGameStore";
import { useTutorialStore } from "@/store/useTutorialStore";
import { syncActiveQuestWithLivePlanet } from "@/services/questEvaluationService";
import { Sparkles, CheckCircle2, ChevronRight, Pin } from "lucide-react";

interface NextMissionWidgetProps {
  className?: string;
}

export function NextMissionWidget({ className = "" }: NextMissionWidgetProps) {
  const userId = useGameStore((s) => s.userId);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const fetchTutorial = useTutorialStore((s) => s.fetchTutorial);
  const nextDirectiveSummary = useTutorialStore((s) => s.nextDirectiveSummary);
  const canClaimReward = useTutorialStore((s) => s.canClaimReward);
  const activeQuest = useTutorialStore((s) => s.activeQuest);
  const pinnedQuestKey = useTutorialStore((s) => s.pinnedQuestKey);
  const pinnedQuestId = useTutorialStore((s) => s.pinnedQuestId);
  const currentDirectiveStage = useTutorialStore((s) => s.currentDirectiveStage);
  const currentDirectiveId = useTutorialStore((s) => s.currentDirectiveId);
  const activeDirectiveId = useTutorialStore((s) => s.activeDirectiveId);
  const completedQuestKeys = useTutorialStore((s) => s.completedQuestKeys);
  const allQuests = useTutorialStore((s) => s.allQuests);
  const getActiveTrackedQuest = useTutorialStore((s) => s.getActiveTrackedQuest);

  useEffect(() => {
    const targetDir = currentDirectiveId || activeDirectiveId || 1;
    fetchTutorial(planet?.id, userId, targetDir);
    if (planet) {
      syncActiveQuestWithLivePlanet(planet);
    }
    const interval = setInterval(() => {
      const activeDir =
        useTutorialStore.getState().currentDirectiveId ||
        useTutorialStore.getState().activeDirectiveId ||
        1;
      fetchTutorial(planet?.id, userId, activeDir);
      if (planet) {
        syncActiveQuestWithLivePlanet(planet);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTutorial, planet, userId, currentDirectiveId, activeDirectiveId]);

  const metalMineLevel =
    planet?.buildings.find((b) => b.key === "metalMine")?.level ?? 0;
  const fallbackDirectiveText =
    metalMineLevel < 1
      ? "Metal Madeni binasını 1. seviyeye yükselt"
      : `Metal Madeni binasını ${metalMineLevel + 1}. seviyeye yükselt`;

  // Task 05BH: Priority resolution:
  // 1. Manuel Pin
  // 2. İçinde bulunulan yönergenin ilk eksik görevi
  // 3. Fallback
  const trackedQuest = getActiveTrackedQuest();
  const isPinned = Boolean(
    pinnedQuestKey && !completedQuestKeys.includes(pinnedQuestKey)
  );

  let displayDirectiveText: string;
  if (trackedQuest) {
    const isPinnedPrefix = isPinned ? "[Sabitlendi] " : "";
    const goalText =
      ("goals" in trackedQuest && trackedQuest.goals?.[0]) ||
      ("steps" in trackedQuest &&
        trackedQuest.steps?.find((s) => !s.isMet)?.description) ||
      trackedQuest.description;
    displayDirectiveText = `${isPinnedPrefix}#${trackedQuest.questId} ${trackedQuest.title}: ${goalText}`;
  } else if (nextDirectiveSummary) {
    displayDirectiveText = nextDirectiveSummary;
  } else if (activeQuest) {
    displayDirectiveText = `#${activeQuest.questId} ${activeQuest.title}: ${
      activeQuest.steps.find((s) => !s.isMet)?.description || activeQuest.description
    }`;
  } else {
    displayDirectiveText = fallbackDirectiveText;
  }

  // Label alignment per Task 05AK & 05BH
  const isClaimReady =
    canClaimReward &&
    trackedQuest != null &&
    currentDirectiveStage === trackedQuest.questId;
  const headerLabel = isClaimReady
    ? "Ödül Hazır!"
    : isPinned
    ? "Takip Edilen Görev"
    : "Aktif Görev";

  return (
    <Link
      href="/rewards"
      title={
        isClaimReady
          ? "Ödülü almak için Görev Listesine git"
          : "Görev Listesi ve Ödülleri İncele"
      }
      className={`block rounded-md border p-2.5 transition group select-none ${
        isClaimReady
          ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/45 to-[#0b1018] shadow-[0_0_18px_rgba(52,211,153,0.3)] animate-pulse"
          : isPinned
          ? "border-purple-500/50 bg-gradient-to-b from-purple-950/35 to-[#0b1018] hover:border-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "border-amber-500/40 bg-gradient-to-b from-amber-950/35 to-[#0b1018] hover:border-amber-400/70 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
      } ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold">
        <span
          className={`flex items-center gap-1 ${
            isClaimReady
              ? "text-emerald-300"
              : isPinned
              ? "text-purple-300"
              : "text-amber-400"
          }`}
        >
          {isClaimReady ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400 animate-bounce" />
          ) : isPinned ? (
            <Pin className="h-3 w-3 text-purple-400 fill-purple-400/30" />
          ) : (
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
          )}
          {headerLabel}
        </span>
        <ChevronRight
          className={`h-3 w-3 ${
            isClaimReady
              ? "text-emerald-400"
              : isPinned
              ? "text-purple-400"
              : "text-amber-400"
          } group-hover:translate-x-0.5 transition-transform`}
        />
      </div>
      <p className="text-[11px] text-zinc-200 leading-snug mt-1 font-medium line-clamp-2">
        {displayDirectiveText}
      </p>
    </Link>
  );
}

export default NextMissionWidget;

