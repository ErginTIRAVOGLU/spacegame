"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  Pickaxe,
  Crosshair,
  Compass,
  Check,
  ShieldCheck,
  Coins,
  Loader2,
  Sparkles,
  Zap,
  ArrowRight,
  Rocket,
  Radar,
  Trophy,
} from "lucide-react";

interface SpecialUnitInfo {
  unitType: number;
  name: string;
  subtitle: string;
  description: string;
}

interface ClassItemDto {
  classType: "Collector" | "General" | "Discoverer";
  name: string;
  subtitle: string;
  color: "amber" | "rose" | "cyan";
  perks: string[];
  specialUnit: SpecialUnitInfo;
  costKm: number;
  isActive: boolean;
}

interface CharacterClassResponse {
  currentClass: string;
  currentClassId: number;
  isFreeActivationEligible: boolean;
  darkMatter: number;
  classChangeTokenCount: number;
  baseChangeCost: number;
  classes: ClassItemDto[];
}

function CharacterClassContent() {
  const storeUserId = useGameStore((s) => s.userId);
  const storeDarkMatter = useGameStore((s) => s.darkMatter);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [data, setData] = useState<CharacterClassResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchClassStatus = useCallback(async () => {
    try {
      const userStr =
        typeof window !== "undefined"
          ? localStorage.getItem("ogame_user")
          : null;
      const targetUserId =
        storeUserId ||
        (userStr ? JSON.parse(userStr).id : "f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7");

      const res = await fetch(
        `${API_BASE_URL}/api/character-class?userId=${targetUserId}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [storeUserId]);

  useEffect(() => {
    fetchClassStatus();
  }, [fetchClassStatus]);

  const handleSelectClass = async (classType: "Collector" | "General" | "Discoverer") => {
    setIsSelecting(true);
    setFeedback(null);

    try {
      const userStr =
        typeof window !== "undefined"
          ? localStorage.getItem("ogame_user")
          : null;
      const targetUserId =
        storeUserId ||
        (userStr ? JSON.parse(userStr).id : "f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7");

      const res = await fetch(`${API_BASE_URL}/api/character-class/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          classType,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: "success", message: resJson.message });
        await fetchClassStatus();
        await fetchBootstrap();
      } else {
        setFeedback({
          type: "error",
          message: resJson.message || "Sınıf seçimi gerçekleştirilemedi.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Sunucu bağlantı hatası oluştu." });
    } finally {
      setIsSelecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm text-zinc-400 font-medium">
          Sınıf verileri yükleniyor...
        </span>
      </div>
    );
  }

  const isFreeEligible = data?.isFreeActivationEligible ?? false;
  const currentClassStr = data?.currentClass ?? "None";
  const userDarkMatter = data?.darkMatter ?? storeDarkMatter ?? 0;
  const tokenCount = data?.classChangeTokenCount ?? 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 space-y-6 max-w-6xl">
      {/* Top Hero Sci-Fi Banner */}
      <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1522] via-[#09101a] to-[#0d1522] p-6 shadow-2xl overflow-hidden">
        {/* Ambient Nebula Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              Karakter Sınıfı Merkezi
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-zinc-100 uppercase">
              Sınıf Seçimi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
              &quot;Ekstra avantajlar için bir sınıf seç. Sınıfını sağ üstteki sınıf seçiminden değiştirebilirsin.&quot;
            </p>
          </div>

          {/* Current Status Summary Badge */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Mevcut Durum
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-zinc-100">
                  {currentClassStr === "None" ? "Sınıfsız (Seçilmedi)" : currentClassStr}
                </span>
                {isFreeEligible && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded animate-pulse">
                    Ücretsiz Hak
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-md ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/50 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3-Column Class Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data?.classes.map((cls) => {
          const isCurrentActive = cls.isActive;
          const isCollector = cls.classType === "Collector";
          const isGeneral = cls.classType === "General";
          const isDiscoverer = cls.classType === "Discoverer";

          const themeStyles = isCollector
            ? {
                accentBorder: "border-amber-500/50",
                glowBg: "from-amber-950/30 via-zinc-900/90 to-zinc-950",
                crestBg: "bg-gradient-to-br from-amber-500/25 to-amber-900/40 border-amber-500/60 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
                textColor: "text-amber-400",
                badgeBg: "bg-amber-500/15 border-amber-500/40 text-amber-300",
                icon: Pickaxe,
              }
            : isGeneral
            ? {
                accentBorder: "border-rose-500/50",
                glowBg: "from-rose-950/30 via-zinc-900/90 to-zinc-950",
                crestBg: "bg-gradient-to-br from-rose-500/25 to-rose-900/40 border-rose-500/60 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
                textColor: "text-rose-400",
                badgeBg: "bg-rose-500/15 border-rose-500/40 text-rose-300",
                icon: Crosshair,
              }
            : {
                accentBorder: "border-cyan-500/50",
                glowBg: "from-cyan-950/30 via-zinc-900/90 to-zinc-950",
                crestBg: "bg-gradient-to-br from-cyan-500/25 to-cyan-900/40 border-cyan-500/60 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
                textColor: "text-cyan-400",
                badgeBg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
                icon: Compass,
              };

          const EmblemIcon = themeStyles.icon;

          return (
            <div
              key={cls.classType}
              className={`rounded-2xl border ${themeStyles.accentBorder} bg-gradient-to-b ${themeStyles.glowBg} p-5 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-200 hover:border-opacity-90`}
            >
              <div className="space-y-4">
                {/* Header Action Button or Active Badge */}
                <div className="pb-3 border-b border-zinc-800/80">
                  {isCurrentActive ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wider uppercase text-center flex items-center justify-center gap-2 shadow-inner">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Aktif Sınıf
                    </div>
                  ) : isFreeEligible ? (
                    <button
                      type="button"
                      disabled={isSelecting}
                      onClick={() => handleSelectClass(cls.classType)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ücretsiz Etkinleştir
                    </button>
                  ) : tokenCount > 0 ? (
                    <button
                      type="button"
                      disabled={isSelecting}
                      onClick={() => handleSelectClass(cls.classType)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>Sınıf Değiştirme Eşyası Kullan</span>
                      <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded">
                        ({tokenCount} Adet)
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSelecting}
                      onClick={() => handleSelectClass(cls.classType)}
                      className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold tracking-wider uppercase border border-zinc-700 transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>500.000 KM ile Değiştir</span>
                    </button>
                  )}
                </div>

                {/* Circular Emblem & Name */}
                <div className="flex flex-col items-center text-center pt-2 space-y-2">
                  <div
                    className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${themeStyles.crestBg}`}
                  >
                    <EmblemIcon className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-wide text-zinc-100">
                      {cls.name}
                    </h2>
                    <span className="text-xs text-zinc-400 font-medium">
                      {cls.subtitle}
                    </span>
                  </div>
                </div>

                {/* Core Perks Checklist */}
                <div className="pt-2">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-300" />
                    Temel Sınıf Ayrılcalıkları
                  </div>
                  <ul className="space-y-1.5">
                    {cls.perks.map((perk, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60"
                      >
                        <Check
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${themeStyles.textColor}`}
                        />
                        <span className="leading-tight">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specialized Class Unit Card */}
                <div className="pt-3 border-t border-zinc-800/80">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-2 flex items-center justify-between">
                    <span>Özel Sınıf Gemisi / Ünitesi</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      #{cls.specialUnit.unitType}
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 flex gap-3 items-center shadow-inner">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${themeStyles.crestBg}`}
                    >
                      {isCollector ? (
                        <Pickaxe className="w-6 h-6" />
                      ) : isGeneral ? (
                        <Rocket className="w-6 h-6" />
                      ) : (
                        <Radar className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-zinc-100">
                        {cls.specialUnit.name}
                      </div>
                      <div className="text-[10px] font-medium text-zinc-400">
                        {cls.specialUnit.subtitle}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug line-clamp-3">
                        {cls.specialUnit.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CharacterClassPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm text-zinc-400 font-medium">
            Sınıf merkezi yükleniyor...
          </span>
        </div>
      }
    >
      <CharacterClassContent />
    </Suspense>
  );
}

