"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  DirectiveActiveQuest,
  DirectiveQuestSummary,
} from "@/lib/tutorialCatalog";
import { getQuestTargetRoute } from "@/config/questRouteMapping";
import { useGameStore } from "@/store/useGameStore";
import { QuestActionLink } from "@/components/tutorial/QuestActionLink";
import {
  Compass,
  ArrowRight,
  Gift,
  Pin,
  PinOff,
  CheckCircle2,
  Clock,
  Lock,
  Boxes,
  Gem,
  Droplets,
  Coins,
  Lightbulb,
  Eye,
} from "lucide-react";

export interface QuestDetailCardProps {
  directiveId: number;
  currentDirectiveStage: number;
  inspectedQuestId: number;
  activeQuest: DirectiveActiveQuest | null;
  inspectedQuestSummary: DirectiveQuestSummary;
  isPinned: boolean;
  isClaiming: boolean;
  onClaimReward: (questId: number) => Promise<void>;
  onTogglePin: (questId: number | null) => Promise<void>;
  planetName?: string;
}

export function QuestDetailCard({
  directiveId,
  currentDirectiveStage,
  inspectedQuestId,
  activeQuest,
  inspectedQuestSummary,
  isPinned,
  isClaiming,
  onClaimReward,
  onTogglePin,
}: QuestDetailCardProps) {
  const isCurrentStage = inspectedQuestSummary.questId === currentDirectiveStage;
  const displayedQuest = isCurrentStage && activeQuest ? activeQuest : inspectedQuestSummary;

  // Format reward text for button label (e.g. "+50 Kristal")
  const rewardLabel = useMemo(() => {
    const rew = displayedQuest.reward;
    if (!rew) return "";
    const parts: string[] = [];
    if (rew.metal > 0) parts.push(`+${rew.metal.toLocaleString("tr-TR")} Metal`);
    if (rew.crystal > 0) parts.push(`+${rew.crystal.toLocaleString("tr-TR")} Kristal`);
    if (rew.deuterium > 0) parts.push(`+${rew.deuterium.toLocaleString("tr-TR")} Deuterium`);
    if (rew.darkMatter > 0) parts.push(`+${rew.darkMatter.toLocaleString("tr-TR")} KM`);
    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
  }, [displayedQuest.reward]);

  // Tactical Primary Action CTA Button per Task 05AT
  const renderPrimaryCta = () => {
    const handleNavClick = (targetItem: { meta?: Record<string, any> }) => {
      if (targetItem.meta?.requireColonySwitch) {
        const { planets, selectedPlanetId, selectPlanet } = useGameStore.getState();
        const currentPlanet = planets.find((p) => p.id === selectedPlanetId);
        if (currentPlanet?.isCapital) {
          const colony = planets.find((p) => !p.isCapital);
          if (colony) {
            selectPlanet(colony.id);
          }
        }
      }
    };

    // 1. Not the current stage -> Direct go-to link for inspected quest
    if (!isCurrentStage || !activeQuest) {
      const goalText = inspectedQuestSummary.goals?.[0] || inspectedQuestSummary.title;
      const target = getQuestTargetRoute(goalText);
      return (
        <Link
          href={target.route}
          onClick={() => handleNavClick(target)}
          title={`Görevi tamamlamak için git: ${target.label}`}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2 group cursor-pointer"
        >
          <Compass className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
          <span>Görevin Olduğu Yere Git ({target.label})</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-100 group-hover:translate-x-1 transition-transform" />
        </Link>
      );
    }

    // 2. All conditions met & Ready to claim -> Pulsing emerald button
    if (activeQuest.canClaim) {
      return (
        <button
          type="button"
          onClick={() => onClaimReward(activeQuest.questId)}
          disabled={isClaiming}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_25px_rgba(52,211,153,0.6)] animate-pulse cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Gift className="w-4 h-4 text-slate-950" />
          <span>{isClaiming ? "Alınıyor..." : `Ödülü Al${rewardLabel}`}</span>
        </button>
      );
    }

    // 3. Find first uncompleted sub-step to dynamically route
    const uncompletedStep = activeQuest.steps.find((s) => !s.isMet);
    const uncompletedDesc = uncompletedStep?.description || activeQuest.title;

    // Special check for Directive 1 / Stage 3 (Step 1 met, Step 2 unmet)
    let target = getQuestTargetRoute(uncompletedDesc);
    if (directiveId === 1 && activeQuest.questId === 3 && activeQuest.steps[0]?.isMet && !activeQuest.steps[1]?.isMet) {
      target = {
        route: "/resources/settings",
        focusKey: "energy-settings",
        label: "Kaynaklar / Enerji Ayarları",
        category: "resources",
        buttonText: "Kaynaklar / Enerji Ayarlarına Git",
      };
    }

    return (
      <Link
        href={target.route}
        onClick={() => handleNavClick(target)}
        title={`Görevi tamamlamak için git: ${target.label}`}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2 group cursor-pointer"
      >
        <Compass className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
        <span>Görevin Olduğu Yere Git ({target.label.toUpperCase()})</span>
        <ArrowRight className="w-3.5 h-3.5 text-cyan-100 group-hover:translate-x-1 transition-transform" />
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row: Badges, Title & CTA Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isCurrentStage ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                Mevcut Aşama • Aşama {displayedQuest.questId}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                <Eye className="w-3 h-3 text-purple-400" />
                Seçilen Görev • Aşama {displayedQuest.questId}
              </span>
            )}

            {(isPinned || isCurrentStage) && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                  isPinned
                    ? "bg-purple-950/60 text-purple-300 border border-purple-400/50"
                    : "bg-cyan-950/60 text-cyan-300 border border-cyan-400/50"
                }`}
              >
                <Pin
                  className={`w-2.5 h-2.5 ${
                    isPinned ? "fill-purple-400/40" : "fill-cyan-400/40"
                  }`}
                />
                Takip Ediliyor
              </span>
            )}

            <span className="text-xs font-mono text-zinc-400">
              {isCurrentStage && activeQuest
                ? `İlerleme: ${activeQuest.completedCount} / ${activeQuest.totalCount}`
                : `Durum: ${inspectedQuestSummary.progressText}`}
            </span>
          </div>

          <h2 className="text-xl font-bold text-zinc-100 mt-1 flex items-center gap-2">
            <span>{displayedQuest.title}</span>
          </h2>
          <p className="text-xs text-zinc-300 mt-1">
            {displayedQuest.description}
          </p>
        </div>

        {/* Buttons Row: Pin & Primary CTA */}
        <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
          {/* Task 05AT Section 3: "Takip Et" button synchronization */}
          <button
            type="button"
            onClick={() => onTogglePin(isPinned ? null : displayedQuest.questId)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              isPinned
                ? "bg-purple-950/70 border border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : isCurrentStage
                ? "bg-cyan-950/50 border border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-200"
            }`}
            title={
              isPinned
                ? "Sabitlemeyi Kaldır"
                : isCurrentStage
                ? "Bu görev şu anda aktif yönergeniz olarak takip ediliyor"
                : "Görevi HUD'a Sabitle"
            }
          >
            {isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-purple-300" />
                <span>Takibi Bırak</span>
              </>
            ) : isCurrentStage ? (
              <>
                <Pin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                <span>Takip Ediliyor</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-zinc-400" />
                <span>Takip Et</span>
              </>
            )}
          </button>

          {renderPrimaryCta()}
        </div>
      </div>

      {/* Practical Hint / Tactical Advice */}
      {displayedQuest.hint && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-cyan-300">Nova&apos;nın Taktik Tavsiyesi: </span>
            <span className="text-zinc-300">{displayedQuest.hint}</span>
          </div>
        </div>
      )}

      {/* Sub-objectives List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
          Görev Hedefleri & Koşulları:
        </h3>

        {isCurrentStage && activeQuest ? (
          <div className="space-y-2">
            {activeQuest.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 ${
                  step.isMet
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {step.isMet ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  )}
                  <QuestActionLink
                    text={step.description}
                    showIcon={false}
                    className={`text-xs hover:underline truncate ${
                      step.isMet ? "text-emerald-300 font-semibold" : "text-zinc-200"
                    }`}
                  />
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      step.isMet
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {step.isMet ? "Tamamlandı" : "Devam Ediyor"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {inspectedQuestSummary.goals.map((goal, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border bg-zinc-900/60 border-zinc-800 text-xs font-mono flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {inspectedQuestSummary.isClaimed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <QuestActionLink
                    text={goal}
                    showIcon={false}
                    className="text-xs text-zinc-300 hover:underline truncate"
                  />
                </div>
                <span className="text-[10px] text-zinc-500">
                  {inspectedQuestSummary.isClaimed ? "Ödül Alındı" : "Sırası Bekleniyor"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards Grid */}
      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
          Bu Görevin Ödülleri:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Boxes className="w-3.5 h-3.5 text-zinc-400" />
              <span>Metal</span>
            </div>
            <span className="font-bold text-zinc-200">
              +{displayedQuest.reward.metal.toLocaleString("tr-TR")}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kristal</span>
            </div>
            <span className="font-bold text-cyan-200">
              +{displayedQuest.reward.crystal.toLocaleString("tr-TR")}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-teal-300">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              <span>Deuterium</span>
            </div>
            <span className="font-bold text-teal-200">
              +{displayedQuest.reward.deuterium.toLocaleString("tr-TR")}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Karanlık M.</span>
            </div>
            <span className="font-bold text-amber-200">
              +{displayedQuest.reward.darkMatter.toLocaleString("tr-TR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

