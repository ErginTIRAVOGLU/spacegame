"use client";

import React from "react";
import { DirectiveQuestSummary } from "@/lib/tutorialCatalog";
import { QuestActionLink } from "@/components/tutorial/QuestActionLink";
import { CheckCircle2, Lock, Pin, PinOff, Sparkles, Eye } from "lucide-react";

interface QuestStageListProps {
  quests: DirectiveQuestSummary[];
  currentDirectiveStage: number;
  pinnedQuestKey?: string | null;
  pinnedQuestId?: number | null;
  inspectedQuestId?: number;
  activeDirectiveId: number;
  isClaiming: boolean;
  onSelectQuest: (questId: number) => void;
  onTogglePin: (questId: number | null) => Promise<void>;
  onClaimReward: (questId: number) => Promise<void>;
}

export function QuestStageList({
  quests,
  currentDirectiveStage,
  pinnedQuestKey = null,
  pinnedQuestId = null,
  inspectedQuestId,
  activeDirectiveId,
  isClaiming,
  onSelectQuest,
  onTogglePin,
  onClaimReward,
}: QuestStageListProps) {
  return (
    <div className="space-y-2">
      {quests.map((quest) => {
        const isCompleted = quest.status === "Completed" || quest.isClaimed;
        const isCurrentStage = quest.questId === currentDirectiveStage;
        const isPinned = pinnedQuestKey
          ? pinnedQuestKey === `d${activeDirectiveId}_s${quest.questId}`
          : pinnedQuestId === quest.questId;
        const isInspected = inspectedQuestId === quest.questId;
        const isLocked = !isCompleted && !isCurrentStage;

        return (
          <div
            key={quest.questId}
            onClick={() => onSelectQuest(quest.questId)}
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
              isInspected
                ? "bg-gradient-to-r from-cyan-950/50 via-[#0e1b2f] to-[#070b13] border-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/40"
                : isPinned
                ? "bg-gradient-to-r from-purple-950/30 via-[#100d20] to-[#070b13] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                : isCurrentStage
                ? "bg-gradient-to-r from-cyan-950/30 via-[#0b1322] to-[#070b13] border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                : isCompleted
                ? "bg-emerald-950/10 hover:bg-emerald-950/20 border-emerald-500/20 text-zinc-300"
                : "bg-[#090d15]/80 hover:bg-[#0c121e] border-zinc-800/80 text-zinc-400"
            }`}
          >
            {/* Left Column: Number / Status Icon + Details */}
            <div className="flex items-start gap-3 min-w-0">
              {/* Status Indicator Icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrentStage ? (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-400/60 text-cyan-300 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse">
                    <span className="text-xs font-mono font-bold">
                      {quest.questId}
                    </span>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Quest Title, Goals & Badges */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-500 font-bold">
                    #{quest.questId}
                  </span>
                  <h3
                    className={`text-sm font-semibold truncate ${
                      isInspected
                        ? "text-cyan-200 font-bold"
                        : isCurrentStage
                        ? "text-zinc-100 font-semibold"
                        : isCompleted
                        ? "text-zinc-200"
                        : "text-zinc-400"
                    }`}
                  >
                    {quest.title}
                  </h3>

                  {/* Task 05AK: Badges alignment */}
                  {isCurrentStage && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse shadow-sm">
                      Mevcut Aşama
                    </span>
                  )}
                  {isInspected && !isCurrentStage && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      <span>İnceleniyor</span>
                    </span>
                  )}
                  {isPinned && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 fill-purple-400/40" />
                      <span>Takip Ediliyor</span>
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Tamamlandı
                    </span>
                  )}
                  {isLocked && !isPinned && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-600">
                      Kilitli
                    </span>
                  )}
                </div>

                {/* Goals via Interactive Quest Links */}
                <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                  {quest.goals.map((goal, gIdx) => (
                    <React.Fragment key={gIdx}>
                      {gIdx > 0 && <span className="text-zinc-600">•</span>}
                      <QuestActionLink
                        text={goal}
                        showIcon={false}
                        className="text-xs text-zinc-300 hover:text-cyan-300 cursor-pointer"
                      />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Pin Toggle & Rewards */}
            <div className="flex items-center gap-2.5 flex-wrap justify-end shrink-0">
              {/* Task 05AK: Takip Et / Takibi Bırak Button enabled on all steps */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(isPinned ? null : quest.questId);
                }}
                title={
                  isPinned
                    ? "Takibi Bırak (Mevcut aşamaya geri dön)"
                    : "Bu görevi HUD kutusuna sabitle"
                }
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isPinned
                    ? "bg-purple-950/60 border border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                    : isCurrentStage
                    ? "bg-cyan-950/50 border border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-cyan-200"
                }`}
              >
                {isPinned ? (
                  <>
                    <PinOff className="w-3 h-3 text-purple-300" />
                    <span>Takibi Bırak</span>
                  </>
                ) : isCurrentStage ? (
                  <>
                    <Pin className="w-3 h-3 text-cyan-400 fill-cyan-400/30" />
                    <span>Takip Ediliyor</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3 h-3 text-zinc-400 group-hover:text-cyan-300" />
                    <span>Takip Et</span>
                  </>
                )}
              </button>

              {/* Progress Count Text */}
              <span className="text-xs font-mono text-zinc-400">
                {quest.progressText}
              </span>

              {/* Reward Pills */}
              <div className="flex items-center gap-1.5">
                {quest.reward.metal > 0 && (
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium text-zinc-300">
                    +{quest.reward.metal.toLocaleString("tr-TR")} M
                  </span>
                )}
                {quest.reward.crystal > 0 && (
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium text-cyan-300">
                    +{quest.reward.crystal.toLocaleString("tr-TR")} K
                  </span>
                )}
                {quest.reward.deuterium > 0 && (
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium text-emerald-300">
                    +{quest.reward.deuterium.toLocaleString("tr-TR")} D
                  </span>
                )}
                {activeDirectiveId === 4 && quest.questId === 6 && (
                  <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300">
                    1x Gümüş Güçlendirici
                  </span>
                )}
              </div>

              {/* Current Progression Stage Claim Reward Button */}
              {isCurrentStage && quest.canClaim && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaimReward(quest.questId);
                  }}
                  disabled={isClaiming}
                  className="px-3.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider hover:bg-emerald-400 transition shadow-[0_0_12px_rgba(52,211,153,0.4)] animate-bounce cursor-pointer disabled:opacity-50"
                >
                  {isClaiming ? "Alınıyor..." : "Ödülü Al"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default QuestStageList;

