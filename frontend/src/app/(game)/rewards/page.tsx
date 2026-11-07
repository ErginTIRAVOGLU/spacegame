"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { useTutorialStore } from "@/store/useTutorialStore";
import {
  TutorialCurrentResponse,
  DirectiveQuestSummary,
} from "@/lib/tutorialCatalog";
import { QuestActionLink } from "@/components/tutorial/QuestActionLink";
import { QuestStageList } from "@/components/tutorial/QuestStageList";
import { QuestDetailCard } from "@/components/tutorial/QuestDetailCard";
import { syncActiveQuestWithLivePlanet } from "@/services/questEvaluationService";
import { getQuestTargetRoute } from "@/config/questRouteMapping";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Boxes,
  Gem,
  Droplets,
  Coins,
  ChevronRight,
  Gift,
  HelpCircle,
  Lightbulb,
  Radio,
  Compass,
  ArrowRight,
  Clock,
  Shield,
  ShieldCheck,
  Award,
  Layers,
  Rocket,
  Wrench,
  Users,
  MessageSquare,
  Globe,
  Binary,
  X,
  Pin,
  PinOff,
  Dna,
  Eye,
} from "lucide-react";

export default function RewardsTutorialPage() {
  const userId = useGameStore((s) => s.userId);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  // Tutorial Store for Pinned & Inspected Quest Synchronization (Task 05AK & 05AM)
  const pinnedQuestKey = useTutorialStore((s) => s.pinnedQuestKey);
  const pinnedQuestId = useTutorialStore((s) => s.pinnedQuestId);
  const inspectedQuestId = useTutorialStore((s) => s.inspectedQuestId);
  const setInspectedQuestId = useTutorialStore((s) => s.setInspectedQuestId);
  const pinQuest = useTutorialStore((s) => s.pinQuest);
  const unpinQuest = useTutorialStore((s) => s.unpinQuest);
  const isQuestPinned = useTutorialStore((s) => s.isQuestPinned);

  const [activeDirectiveId, setActiveDirectiveId] = useState<number>(1);
  const [data, setData] = useState<TutorialCurrentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isFinalClaiming, setIsFinalClaiming] = useState(false);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const loadTutorial = useCallback(
    async (directiveIdToLoad?: number) => {
      try {
        const query = new URLSearchParams();
        // Task 05BH: Resolve target directive: explicit > pinned quest directive > store active directive
        let resolvedDir = directiveIdToLoad;
        if (typeof resolvedDir !== "number") {
          const storePinned = useTutorialStore.getState().pinnedQuestKey;
          if (storePinned) {
            const match = storePinned.match(/^d(\d+)_/);
            if (match) {
              resolvedDir = parseInt(match[1], 10);
            }
          }
        }
        if (typeof resolvedDir !== "number") {
          resolvedDir =
            useTutorialStore.getState().currentDirectiveId ||
            useTutorialStore.getState().activeDirectiveId ||
            1;
        }

        if (typeof resolvedDir === "number") {
          query.append("directiveId", resolvedDir.toString());
        }
        if (selectedPlanetId) query.append("planetId", selectedPlanetId);
        if (userId) query.append("userId", userId);
        query.append("opened", "true");

        const res = await fetch(`${API_BASE_URL}/api/tutorial/current?${query}`);
        if (res.ok) {
          const json = (await res.json()) as TutorialCurrentResponse;
          setData(json);
          setActiveDirectiveId(json.directiveId);
          // Sync with Zustand tutorial store
          useTutorialStore.getState().fetchTutorial(selectedPlanetId, userId, json.directiveId);
        }
      } catch {
        // ignore network errors
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlanetId, userId]
  );

  useEffect(() => {
    loadTutorial();
  }, [loadTutorial]);

  // Real-time quest sync with live planet energy & buildings
  useEffect(() => {
    const currentPlanet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
    if (currentPlanet) {
      syncActiveQuestWithLivePlanet(currentPlanet);
    }
  }, [planets, selectedPlanetId, data]);

  const handleDirectiveSwitch = (newId: number) => {
    setActiveDirectiveId(newId);
    useTutorialStore.getState().selectDirective(newId);
    setIsLoading(true);
    loadTutorial(newId);
  };

  const handleRecordEvent = async (eventType: string, unitId?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutorial/directive-${activeDirectiveId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          unitId,
          planetId: selectedPlanetId || undefined,
          userId: userId || undefined,
        }),
      });
      if (res.ok) {
        await loadTutorial(activeDirectiveId);
        setFeedback({
          text: "Görev ilerlemesi başarıyla güncellendi!",
          type: "success",
        });
      }
    } catch {
      // ignore
    }
  };

  const handleOpenTechTreeModal = async () => {
    setIsTechTreeOpen(true);
    await handleRecordEvent("tech_tree_viewed", "SmallCargo");
    setFeedback({
      text: "Küçük Nakliye Gemisi teknoloji ağacı incelendi! Görev koşulu kaydedildi.",
      type: "success",
    });
  };

  const handleClaimReward = async (questId: number) => {
    if (isClaiming) return;
    try {
      setIsClaiming(true);
      const res = await fetch(`${API_BASE_URL}/api/tutorial/claim-reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directiveId: activeDirectiveId,
          questId,
          planetId: selectedPlanetId || undefined,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFeedback({
          text: resData.message || "Ödül alınırken hata oluştu.",
          type: "error",
        });
      } else {
        setFeedback({
          text: resData.message || "Görev ödülü başarıyla deponuza aktarıldı!",
          type: "success",
        });
        await loadTutorial();
        await fetchBootstrap();
      }
    } catch {
      setFeedback({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimFinalReward = async () => {
    if (isFinalClaiming) return;
    try {
      setIsFinalClaiming(true);
      const res = await fetch(`${API_BASE_URL}/api/tutorial/claim-final-reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directiveId: activeDirectiveId,
          planetId: selectedPlanetId || undefined,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFeedback({
          text: resData.message || "Final ödülü alınırken hata oluştu.",
          type: "error",
        });
      } else {
        // Task 05AX: Mark completed and prune stale pins in store
        useTutorialStore.getState().completeDirective(activeDirectiveId);

        setFeedback({
          text: resData.message || "Yönerge tamamlama ödülü başarıyla tanımlandı!",
          type: "success",
        });
        const nextDirectiveId = activeDirectiveId + 1;
        setActiveDirectiveId(nextDirectiveId);
        await loadTutorial(nextDirectiveId);
        await fetchBootstrap();
      }
    } catch {
      setFeedback({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsFinalClaiming(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Radio className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Birinci Subay Nova ile frekans kuruluyor...
        </span>
      </div>
    );
  }

  const completedCount = data.allQuests.filter((q) => q.status === "Completed").length;
  const progressPercent = Math.round((completedCount / data.allQuests.length) * 100);

  // Inspected Quest vs Current Progression Stage (Task 05AK)
  const inspectedQuestSummary: DirectiveQuestSummary =
    data.allQuests.find((q) => q.questId === inspectedQuestId) ||
    data.allQuests.find((q) => q.questId === data.currentQuestStep) ||
    data.allQuests[0];
  const isCurrentStage = inspectedQuestSummary.questId === data.currentQuestStep;
  const displayedQuest = isCurrentStage ? data.activeQuest : inspectedQuestSummary;

  // Tactical shortcut helper for active / inspected quest actions
  const renderQuestActionHelper = () => {
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

    if (!isCurrentStage) {
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

    if (data.activeQuest.canClaim) {
      return (
        <button
          type="button"
          onClick={() => handleClaimReward(data.activeQuest.questId)}
          disabled={isClaiming}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-bounce cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Gift className="w-4 h-4 text-slate-950" />
          <span>{isClaiming ? "Alınıyor..." : "Görevi Tamamla & Ödülü Al"}</span>
        </button>
      );
    }

    const uncompletedStep = data.activeQuest.steps.find((s) => !s.isMet);
    const target = getQuestTargetRoute(uncompletedStep?.description || data.activeQuest.title);

    const primaryGoToBtn = (
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

    if (activeDirectiveId === 1) {
      return primaryGoToBtn;
    }

    if (activeDirectiveId === 3) {
      switch (data.activeQuest.questId) {
        case 1:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Araştırma: Enerji Tekniği</span>
            </Link>
          );
        case 2:
          return (
            <Link
              href="/resources"
              className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Kaynaklar: Füzyoenerji Santrali</span>
            </Link>
          );
        case 3:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/resources"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Bina Yıkımı İçin Kaynaklar</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("building_demolished")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono flex items-center gap-1"
                title="Bina yıkımını simüle et"
              >
                <span>Yıkımı Onayla</span>
              </button>
            </div>
          );
        case 4:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/shipyard"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Tersanede Solar Uydu Üret</span>
              </Link>
              <Link
                href="/resources"
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono"
              >
                <span>Madenler</span>
              </Link>
            </div>
          );
        case 5:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/research"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Araştırma Sayfası</span>
              </Link>
              <Link
                href="/facilities"
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono"
              >
                <span>Tesisler (Tersane)</span>
              </Link>
            </div>
          );
        case 6:
          return (
            <Link
              href="/shipyard"
              className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tersanede Casus Sondası Üret</span>
            </Link>
          );
        case 7:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/galaxy"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Galaksi: Casusluk Görevi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("espionage_performed")}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 transition text-xs font-mono"
                title="Casusluk raporu kaydet"
              >
                <span>Sonda Fırlat</span>
              </button>
            </div>
          );
        case 8:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filo: 16. Pozisyona Kaçırma</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("fleet_dispatched_slot16")}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 transition text-xs font-mono"
                title="16. pozisyona casusluk sevk et"
              >
                <span>16. Slot Simüle Et</span>
              </button>
            </div>
          );
        case 9:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filo Hareketleri: Geri Çağır</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("fleet_recalled")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono"
                title="Filo geri çağırma kaydet"
              >
                <span>Geri Çağırma Kaydet</span>
              </button>
            </div>
          );
        default:
          return null;
      }
    }

    if (activeDirectiveId === 4) {
      switch (data.activeQuest.questId) {
        case 1:
          return (
            <Link
              href="/resources"
              className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Kaynaklar: Maden Seviyelerini Yükselt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 2:
        case 3:
        case 9:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Araştırma Sayfasına Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 4:
          return (
            <Link
              href="/facilities"
              className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Tesisler: Tersane Seviye 4</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 5:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/shipyard"
                className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5 text-purple-400" />
                <span>Tersanede Koloni Gemisi Üret</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("colony_ship_produced")}
                className="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 hover:bg-purple-500/30 transition text-xs font-mono"
                title="Koloni gemisi üretimini kaydet"
              >
                <span>Üretimi Onayla</span>
              </button>
            </div>
          );
        case 6:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Filo: Yeni Gezegene Koloni Kur</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("planet_colonized")}
                className="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 hover:bg-purple-500/30 transition text-xs font-mono"
                title="Kolonileştirmeyi simüle et"
              >
                <span>Koloni Kuruldu Say</span>
              </button>
            </div>
          );
        case 7:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/overview"
                className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Genel Bakış: Koloni Adını Değiştir</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("colony_renamed")}
                className="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 hover:bg-purple-500/30 transition text-xs font-mono"
                title="Koloni isim değişikliğini onayla"
              >
                <span>İsim Değiştirildi</span>
              </button>
            </div>
          );
        case 8:
          return (
            <Link
              href="/resources"
              className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5 text-purple-400" />
              <span>Kolonide Maden & Solar İnşa Et</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 10:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-purple-100 hover:bg-purple-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Filo: 16. Pozisyona Keşif Seferi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("expedition_completed")}
                className="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 hover:bg-purple-500/30 transition text-xs font-mono"
                title="Seferi tamamla"
              >
                <span>Sefer Tamamlandı</span>
              </button>
            </div>
          );
        default:
          return null;
      }
    }

    if (activeDirectiveId === 5) {
      switch (data.activeQuest.questId) {
        case 1:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/defenses"
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Savunma: Roketatar İnşa Et</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("rocket_launcher_produced")}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition text-xs font-mono"
                title="Roketatar üretimini onayla"
              >
                <span>İnşa Onayla</span>
              </button>
            </div>
          );
        case 2:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Araştırma: Lazer Tekniği Seviye 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 3:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/defenses"
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Savunma: Hafif Lazer Topu İnşa Et</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("light_laser_produced")}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition text-xs font-mono"
                title="Hafif Lazer üretimini onayla"
              >
                <span>İnşa Onayla</span>
              </button>
            </div>
          );
        case 4:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Araştırma: Lazer Tekniği Seviye 6</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 5:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/defenses"
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Savunma: Ağır Lazer Topu İnşa Et</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("heavy_laser_produced")}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition text-xs font-mono"
                title="Ağır Lazer üretimini onayla"
              >
                <span>İnşa Onayla</span>
              </button>
            </div>
          );
        case 6:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Araştırma: Uzay Gemisi Zırhı Seviye 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 7:
          return (
            <Link
              href="/facilities"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>Tesisler: Araştırma Laboratuvarı Seviye 4</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 8:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Araştırma: Silah Tekniği Seviye 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 9:
          return (
            <Link
              href="/facilities"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>Tesisler: Araştırma Laboratuvarı Seviye 6</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 10:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Araştırma: Kalkan Tekniği Seviye 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 11:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/shipyard"
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5 text-rose-400" />
                <span>Tersane: Ağır Avcı İnşa Et</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("heavy_fighter_produced")}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 hover:bg-rose-500/30 transition text-xs font-mono"
                title="Ağır Avcı üretimini onayla"
              >
                <span>Üretimi Onayla</span>
              </button>
            </div>
          );
        default:
          return null;
      }
    }

    if (activeDirectiveId === 6) {
      switch (data.activeQuest.questId) {
        case 1:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Dna className="w-3.5 h-3.5 text-teal-400" />
                <span>Canlı Türü: Biyosfer Çiftliği & Barınma</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_buildings_q1_completed")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Binaları onayla"
              >
                <span>Binaları Onayla</span>
              </button>
            </div>
          );
        case 2:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-teal-400" />
                <span>Canlı Türü: Araştırma Merkezi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("research_center_built")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Merkezi onayla"
              >
                <span>Merkezi Onayla</span>
              </button>
            </div>
          );
        case 3:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/tech-tree"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Araştırma: Galaksiler Arası Elçiler</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("intergalactic_envoys_researched")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Araştırmayı onayla"
              >
                <span>Elçileri Onayla</span>
              </button>
            </div>
          );
        case 4:
          return (
            <Link
              href="/research"
              className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Araştırma: Bilgisayar Tekniği Seviye 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          );
        case 5:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/galaxy"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Dna className="w-3.5 h-3.5 text-teal-400" />
                <span>Galaksi: DNA Keşif Görevi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_discovery_dispatched")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Keşif fırlat"
              >
                <span>Görevi Fırlat</span>
              </button>
            </div>
          );
        case 6:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/management"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Yönetim: Canlı Türü Keşifleri</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_species_discovered")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Tür keşfini onayla"
              >
                <span>Tür Keşfedildi</span>
              </button>
            </div>
          );
        case 7:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/management"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Yönetim: Sömürgeye Tür Ata</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_species_assigned")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Tür atamasını onayla"
              >
                <span>Tür Atandı</span>
              </button>
            </div>
          );
        case 8:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Boxes className="w-3.5 h-3.5 text-teal-400" />
                <span>Binalar: Biyosfer 23 & Barınma 22</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_buildings_q8_completed")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Yükseltmeyi onayla"
              >
                <span>Yükseltmeyi Onayla</span>
              </button>
            </div>
          );
        case 9:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/tech-tree"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Teknoloji Ağacı: 2. Slot Kilidi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_slot2_unlocked")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Slot kilidini aç"
              >
                <span>Kilidi Aç</span>
              </button>
            </div>
          );
        case 10:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/tech-tree"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Teknoloji Ağacı: 2. Slot Teknolojisi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_tech_selected")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Teknoloji seçimini onayla"
              >
                <span>Teknoloji Seçildi</span>
              </button>
            </div>
          );
        case 11:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/galaxy"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-teal-400" />
                <span>Galaksi: Antik Eser Keşfi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("artifacts_found_200")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="200 eser topla"
              >
                <span>200 Eser Onayla</span>
              </button>
            </div>
          );
        case 12:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/tech-tree"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Teknoloji Ağacı: 3. Slot Kilidi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("lifeform_q12_all_met")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="3. slot ve binaları onayla"
              >
                <span>3. Slot Açıldı</span>
              </button>
            </div>
          );
        case 13:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/lifeforms/tech-tree"
                className="px-4 py-2 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:bg-teal-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-teal-400" />
                <span>Teknoloji Ağacı: Eser Harca</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("artifacts_spent")}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500/30 transition text-xs font-mono"
                title="Eser harcamayı onayla"
              >
                <span>Eser Harcandı</span>
              </button>
            </div>
          );
        default:
          return null;
      }
    }

    if (activeDirectiveId === 7) {
      switch (data.activeQuest.questId) {
        case 1:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/shipyard"
                className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-amber-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5 text-amber-400" />
                <span>Tersane: Geri Dönüşümcü İnşa Et</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("recycler_produced")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono"
                title="Geri Dönüşümcü üretimini onayla"
              >
                <span>Üretimi Onayla</span>
              </button>
            </div>
          );
        case 2:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-amber-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Filo: Enkaz Alanına Söküm Görevi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("debris_harvested")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono"
                title="Enkaz alanını sök"
              >
                <span>Sökümü Onayla</span>
              </button>
            </div>
          );
        case 3:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/shop"
                className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-amber-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Dükkan: Karakter Sınıfı Seçimi</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("character_class_selected")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono"
                title="Karakter sınıfı seçimini onayla"
              >
                <span>Sınıf Seçildi</span>
              </button>
            </div>
          );
        case 4:
          return (
            <div className="flex items-center gap-2">
              <Link
                href="/merchant"
                className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-amber-900/60 transition text-xs font-mono flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Tüccar Menüsüne Git</span>
              </Link>
              <button
                type="button"
                onClick={() => handleRecordEvent("merchant_summoned")}
                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition text-xs font-mono"
                title="Tüccarı çağır"
              >
                <span>Tüccar Çağır</span>
              </button>
            </div>
          );
        default:
          return null;
      }
    }

    // Directive 2 specific shortcuts
    switch (data.activeQuest.questId) {
      case 1:
        return (
          <button
            type="button"
            onClick={handleOpenTechTreeModal}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30 transition text-xs font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Teknoloji Ağacını İncele (Küçük Nakliye)</span>
          </button>
        );
      case 2:
      case 5:
      case 6:
        return (
          <Link
            href="/facilities"
            className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition text-xs font-mono flex items-center gap-1.5"
          >
            <span>Tesisler Sayfasına Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      case 3:
      case 4:
        return (
          <Link
            href="/research"
            className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition text-xs font-mono flex items-center gap-1.5"
          >
            <span>Araştırma Sayfasına Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      case 7:
        return (
          <Link
            href="/shipyard"
            className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition text-xs font-mono flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tersane Sayfasına Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      case 8:
        return (
          <Link
            href="/alliance"
            className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition text-xs font-mono flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>İttifak Sayfasına Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      case 9:
        return (
          <Link
            href="/overview?action=rename-planet"
            className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition text-xs font-mono flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gezegen İsmini Değiştir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      case 10:
        return (
          <div className="flex items-center gap-2">
            <Link
              href="/messages?tab=friends&action=add-friend"
              className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/30 transition text-xs font-mono flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Arkadaş Ekle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleRecordEvent("friend_request_sent")}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center gap-1"
              title="İsteği simüle et"
            >
              <span>Simüle Et</span>
            </button>
          </div>
        );
      default:
        return primaryGoToBtn;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/50 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200 text-xs font-mono ml-4"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Directive Switcher Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-zinc-800/80 pb-3">
        <button
          type="button"
          onClick={() => handleDirectiveSwitch(1)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 1
              ? "bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span>Yönerge I: Sağlam Bir Ekonomi</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            13 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(2)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 2
              ? "bg-indigo-950/80 border border-indigo-400/60 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-indigo-400" />
          <span>Yönerge II: İlk Gemi</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            10 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(3)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 3
              ? "bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Yönerge III: Bilgi Güçtür</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            9 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(4)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 4
              ? "bg-purple-950/80 border border-purple-400/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>Yönerge IV: Derin Uzay</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            10 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(5)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 5
              ? "bg-rose-950/80 border border-rose-400/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>Yönerge V: Sınırları Güven Altına Al</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            11 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(6)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 6
              ? "bg-teal-950/80 border border-teal-400/60 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Dna className="w-3.5 h-3.5 text-teal-400" />
          <span>Yönerge VI: Dünya Dışı Yaşam</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            13 Görev
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDirectiveSwitch(7)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer ${
            activeDirectiveId === 7
              ? "bg-amber-950/80 border border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Yönerge VII: Daha Fazla İpucu</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-zinc-400 border border-zinc-800">
            4 Görev
          </span>
        </button>
      </div>

      {/* Guide Character Header Banner (Nova) */}
      <div
        className="relative rounded-2xl border border-cyan-500/30 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_30px_rgba(0,0,0,0.8)]"
        style={{
          backgroundImage:
            activeDirectiveId === 7
              ? "radial-gradient(90% 120% at 85% 0%, rgba(245,158,11,0.25) 0%, rgba(217,119,6,0.15) 45%, rgba(8,13,22,0.96) 100%)"
              : activeDirectiveId === 6
              ? "radial-gradient(90% 120% at 85% 0%, rgba(20,184,166,0.25) 0%, rgba(16,185,129,0.15) 45%, rgba(8,13,22,0.96) 100%)"
              : activeDirectiveId === 5
              ? "radial-gradient(90% 120% at 85% 0%, rgba(225,29,72,0.25) 0%, rgba(245,158,11,0.12) 45%, rgba(8,13,22,0.96) 100%)"
              : activeDirectiveId === 4
              ? "radial-gradient(90% 120% at 85% 0%, rgba(147,51,234,0.25) 0%, rgba(59,130,246,0.12) 45%, rgba(8,13,22,0.96) 100%)"
              : activeDirectiveId === 3
              ? "radial-gradient(90% 120% at 85% 0%, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.12) 45%, rgba(8,13,22,0.96) 100%)"
              : activeDirectiveId === 2
              ? "radial-gradient(90% 120% at 85% 0%, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.12) 45%, rgba(8,13,22,0.96) 100%)"
              : "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.2) 0%, rgba(59,130,246,0.1) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Nova Avatar & Speech */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-400 to-indigo-600 p-[2px] shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                <div className="w-full h-full rounded-2xl bg-[#090e17] flex items-center justify-center overflow-hidden">
                  <Compass className="w-8 h-8 text-cyan-300 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-400/60 text-cyan-300 shadow">
                NOVA
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  {data.guide.role} • {data.guide.name}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="text-[10px] font-mono text-emerald-400">İletişim Aktif</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                Yönerge {data.directiveId}: <span className="text-cyan-300">{data.title}</span>
              </h1>
              <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed italic border-l-2 border-cyan-500/40 pl-3 py-0.5 bg-cyan-950/20 rounded-r">
                &ldquo;{data.guide.introLore}&rdquo;
              </p>
            </div>
          </div>

          {/* Overall Progress Gauge */}
          <div className="w-full md:w-64 p-4 rounded-xl bg-[#0b111d] border border-cyan-500/25 shadow-md space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-400">Yönerge İlerlemesi</span>
              <span className="font-mono font-bold text-cyan-300">
                {completedCount} / {data.allQuests.length} (%{progressPercent})
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>
                Aşama {data.currentQuestStep} / {data.allQuests.length}
              </span>
              {data.isDirectiveCompleted ? (
                <span className="text-emerald-400 font-bold">TAMAMLANDI</span>
              ) : (
                <span className="text-amber-400 font-medium">Devam Ediyor</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final Completion Reward Showcase */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#14100b] via-[#0c121e] to-[#090e18] p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)] shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <span>Yönerge {data.directiveId} Tamamlama Ödülü</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>
            <div className="text-sm font-bold text-zinc-100">
              {activeDirectiveId === 7
                ? "Daha Fazla İpucu Yönergesini Tamamlayanlara Özel Mezuniyet & Tüccar İkramiyesi"
                : activeDirectiveId === 6
                ? "Dünya Dışı Yaşam Yönergesini Tamamlayanlara Özel Antik Eser & Canlı Türü İkramiyesi"
                : activeDirectiveId === 5
                ? "Sınırları Güven Altına Al Yönergesini Tamamlayanlara Özel Savunma & Ağır Avcı Filosu İkramiyesi"
                : activeDirectiveId === 4
                ? "Derin Uzay Yönergesini Tamamlayanlara Özel Galaktik Koloni & Sefer İkramiyesi"
                : activeDirectiveId === 3
                ? "Bilgi Güçtür Yönergesini Tamamlayanlara Özel İstihbarat & Enerji İkramiyesi"
                : activeDirectiveId === 2
                ? "İlk Gemi Yönergesini Tamamlayanlara Özel Filo İkramiyesi"
                : "Tüm 13 Görevi Bitiren Harbiyelilere Özel İkramiye"}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {activeDirectiveId === 7
                ? "Geri Dönüşümcü inşası, enkaz sökümü, karakter sınıfı seçimi ve tüccar mekaniklerini tamamlayarak tüm Harbiyeli eğitimini bitirin ve 3.000 Karanlık Madde kazanın."
                : activeDirectiveId === 6
                ? "Biyosfer çiftliklerini geliştirip, DNA keşif filolarıyla yabancı türleri kolonileştirerek ve antik eserlerle teknolojiler açarak 6.000 Karanlık Madde ve dev ödülü kazanın."
                : activeDirectiveId === 5
                ? "Roketatar ve lazer tabyalarını konuşlandırıp, askeri araştırmaları ve Ağır Avcı üretimini tamamlayarak 5.000 Karanlık Madde ve dev ikramiyeyi kazanın."
                : activeDirectiveId === 4
                ? "Astrofizik, yeni kolonileştirme ve 16. slot derin uzay keşiflerini tamamlayarak 4.000 Karanlık Madde ve dev ikramiyeyi kazanın."
                : activeDirectiveId === 3
                ? "Füzyoenerji santrali, casusluk sondaları ve filo kaçırma manevralarını tamamlayarak 3.000 Karanlık Madde ve dev ödülü kazanın."
                : activeDirectiveId === 2
                ? "Tersane ve araştırma görevlerini bitirerek 2.000 Karanlık Madde ve dev ikramiyeyi kazanın."
                : "Ekonomi yönergesini başarıyla tamamlayarak galaksinin en zengin kaynak sandığına hak kazanın."}
            </div>
          </div>
        </div>

        {/* Reward Pills & Final Claim Button */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-1.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-200">
              <Boxes className="w-3.5 h-3.5 text-zinc-400" />
              <span>+{data.finalReward.metal.toLocaleString("tr-TR")} Metal</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>+{data.finalReward.crystal.toLocaleString("tr-TR")} Kristal</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              <span>+{data.finalReward.deuterium.toLocaleString("tr-TR")} Deut</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              <span>+{data.finalReward.darkMatter.toLocaleString("tr-TR")} KM</span>
            </div>
          </div>

          {data.isDirectiveRewardClaimed ? (
            <div className="px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Final Ödülü Alındı</span>
            </div>
          ) : data.canClaimDirectiveReward ? (
            <button
              type="button"
              onClick={handleClaimFinalReward}
              disabled={isFinalClaiming}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold font-mono tracking-wider uppercase hover:from-amber-400 hover:to-yellow-300 transition-all shadow-[0_0_18px_rgba(251,191,36,0.5)] animate-pulse cursor-pointer disabled:opacity-50"
            >
              {isFinalClaiming ? "Aktarılıyor..." : "Final Ödülünü Al!"}
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-500 text-xs font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-600" />
              <span>{data.allQuests.length} Görev Sonrası Açılır</span>
            </div>
          )}
        </div>
      </div>

      {/* Inspected / Active Quest Hero Box (Task 05AT: Dynamic CTA & Detail Card) */}
      {!data.isDirectiveCompleted && (
        <div
          className={`rounded-2xl border-2 p-6 space-y-5 transition-all ${
            isCurrentStage
              ? "border-cyan-500/40 bg-gradient-to-b from-[#0a1322] to-[#070b13] shadow-[0_0_30px_rgba(34,211,238,0.12)]"
              : "border-purple-500/40 bg-gradient-to-b from-[#0f111f] to-[#070b13] shadow-[0_0_30px_rgba(168,85,247,0.12)]"
          }`}
        >
          <QuestDetailCard
            directiveId={data.directiveId}
            currentDirectiveStage={data.currentQuestStep}
            inspectedQuestId={inspectedQuestSummary.questId}
            activeQuest={data.activeQuest}
            inspectedQuestSummary={inspectedQuestSummary}
            isPinned={isQuestPinned(data.directiveId, displayedQuest.questId)}
            isClaiming={isClaiming}
            onClaimReward={handleClaimReward}
            onTogglePin={async (questId) => {
              const isPinned = isQuestPinned(data.directiveId, displayedQuest.questId);
              const res = isPinned
                ? await unpinQuest(selectedPlanetId, userId)
                : await pinQuest(data.directiveId, displayedQuest.questId, selectedPlanetId, userId);
              setFeedback({
                text: res.message || (isPinned ? "Sabitleme kaldırıldı." : "Görev takip listesine sabitlendi."),
                type: res.success ? "success" : "error",
              });
              await loadTutorial(data.directiveId);
            }}
          />
        </div>
      )}

      {/* Sequential Quests Timeline & Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold px-1">
          <span>
            Yönerge {data.directiveId} Aşama Listesi ({data.allQuests.length} Görev)
          </span>
          <span>Tüm Görev Ayrıntıları & Ödüller</span>
        </div>

        <QuestStageList
          quests={data.allQuests}
          currentDirectiveStage={data.currentQuestStep}
          pinnedQuestKey={pinnedQuestKey}
          pinnedQuestId={pinnedQuestId}
          inspectedQuestId={inspectedQuestId}
          activeDirectiveId={data.directiveId}
          isClaiming={isClaiming}
          onSelectQuest={(questId) => setInspectedQuestId(questId)}
          onTogglePin={async (questId) => {
            const isCurrentlyPinned = questId !== null && isQuestPinned(data.directiveId, questId);
            const res = (questId === null || isCurrentlyPinned)
              ? await unpinQuest(selectedPlanetId, userId)
              : await pinQuest(data.directiveId, questId, selectedPlanetId, userId);
            setFeedback({
              text: res.message || (questId ? "Görev takip listesine sabitlendi." : "Sabitleme kaldırıldı."),
              type: res.success ? "success" : "error",
            });
            await loadTutorial(data.directiveId);
          }}
          onClaimReward={handleClaimReward}
        />
      </div>

      {/* Tech Tree Inspection Modal for Small Cargo (Quest 1) */}
      {isTechTreeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#080d17] p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Binary className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-zinc-100 font-mono">
                  Teknoloji Ağacı • Küçük Nakliye Gemisi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTechTreeOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Küçük Nakliye Gemisi, gezegenler arası hızlı hammadde taşımacılığı için tasarlanmış temel sivil nakliye birimidir.
            </p>

            <div className="space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Gereksinimler (Ön Koşullar):
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium">Uzay Tersanesi</span>
                  <span className="font-mono text-cyan-300">Seviye 2</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium">Yanma Motoru</span>
                  <span className="font-mono text-cyan-300">Seviye 2</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium">Robot Fabrikası</span>
                  <span className="font-mono text-zinc-400">Seviye 2 (Tersane için)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTechTreeOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 transition"
              >
                Anlaşıldı (Kapat)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
