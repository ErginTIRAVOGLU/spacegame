"use client";

import React from "react";
import {
  QuarterlyBoosterItem,
  formatQuarterlyDuration,
  QUARTERLY_TIER_CONFIG,
  QUARTERLY_RESOURCE_CONFIG,
} from "@/lib/quarterlyBoostersCatalog";
import {
  AlertTriangle,
  Coins,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface HazardBoosterModalProps {
  isOpen: boolean;
  booster: QuarterlyBoosterItem | null;
  planetName: string;
  currentDarkMatter: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function HazardBoosterModal({
  isOpen,
  booster,
  planetName,
  currentDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: HazardBoosterModalProps) {
  if (!isOpen || !booster) return null;

  const hasActiveExisting =
    booster.isActive ||
    booster.activeDifferentTier ||
    booster.activeRemainingSeconds > 0;

  const existingPercent = booster.isActive
    ? booster.percent
    : booster.activeDifferentTierPercent;

  const tierCfg = QUARTERLY_TIER_CONFIG[booster.tier] || QUARTERLY_TIER_CONFIG.Silver;
  const resCfg =
    QUARTERLY_RESOURCE_CONFIG[booster.resourceType] || QUARTERLY_RESOURCE_CONFIG.Metal;
  const canAfford = currentDarkMatter >= booster.costDarkMatter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#0c111a] shadow-2xl overflow-hidden"
        style={{
          boxShadow: hasActiveExisting
            ? "0 0 40px rgba(245, 158, 11, 0.3)"
            : "0 0 40px rgba(6, 182, 212, 0.25)",
        }}
      >
        {/* Hazard Striped Banner when active existing booster exists */}
        {hasActiveExisting ? (
          <div
            className="h-3 w-full border-b border-black/40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #eab308, #eab308 12px, #000 12px, #000 24px)",
            }}
          />
        ) : (
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />
        )}

        <div className="p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                hasActiveExisting
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-400"
                  : "bg-cyan-950/60 border-cyan-500/50 text-cyan-400"
              }`}
            >
              {hasActiveExisting ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {hasActiveExisting
                  ? "İkaz: Mevcut Güçlendiricinin Üzerine Yaz"
                  : "90 Günlük Güçlendiriciyi Aktif Et"}
              </h3>
              <p className="text-xs text-zinc-400">
                Hedef Gezegen:{" "}
                <span className="font-semibold text-zinc-200">{planetName}</span>
              </p>
            </div>
          </div>

          {/* Hazard Alert Box */}
          {hasActiveExisting && (
            <div className="mt-4 p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-amber-300 uppercase tracking-wide">
                    Bu gezegende zaten aktif bir güçlendirici bulunuyor!
                  </p>
                  <p className="text-zinc-300 mt-1">
                    90 Günlük yeni güçlendirici mevcut olanın süresini sıfırlayarak
                    üzerine yazılacaktır. Devam etmek istiyor musun?
                  </p>
                  <p className="text-amber-300/90 mt-1 font-mono text-[11px]">
                    Şu anki aktif: +%{existingPercent} {resCfg.nameTr} (Kalan:{" "}
                    {formatQuarterlyDuration(booster.activeRemainingSeconds)})
                  </p>
                </div>
              </div>

              {/* Status Comparison */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800">
                  <span className="text-[10px] uppercase text-zinc-400 block font-mono">
                    Mevcut Durum
                  </span>
                  <span className="font-bold text-zinc-300 mt-0.5 block">
                    +%{existingPercent} {resCfg.nameTr}
                  </span>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {formatQuarterlyDuration(booster.activeRemainingSeconds)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/50">
                  <span className="text-[10px] uppercase text-cyan-400 block font-mono">
                    Yeni 90 Günlük Paket
                  </span>
                  <span className="font-bold text-cyan-200 mt-0.5 block">
                    +%{booster.percent} {resCfg.nameTr}
                  </span>
                  <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                    90 Gün (2.160 Saat)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booster Product Overview */}
          <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-[#070b13] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100 text-sm">
                    {booster.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${tierCfg.badgeClass}`}
                  >
                    {tierCfg.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{booster.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
              <span className="text-zinc-400">Üretim Katkısı:</span>
              <span className="font-bold text-emerald-400">
                +{booster.percent}% {resCfg.nameTr} Üretimi
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Kullanım Süresi:</span>
              <span className="font-mono text-zinc-200">
                90 Gün (2.160 Saat)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Toplu Alım Tasarrufu:</span>
              <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {booster.savingsDarkMatter.toLocaleString("tr-TR")} KM Tasarruf
              </span>
            </div>
          </div>

          {/* Price & Balance */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-400 block">Maliyet:</span>
              <span className="font-mono font-bold text-purple-300 text-sm flex items-center gap-1">
                <Coins className="w-4 h-4 text-purple-400" />
                {booster.costDarkMatter.toLocaleString("tr-TR")} KM
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block">Karanlık Madde Bakiyeniz:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  canAfford ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {currentDarkMatter.toLocaleString("tr-TR")} KM
              </span>
            </div>
          </div>

          {!canAfford && (
            <p className="text-xs text-rose-400 text-center mt-2 font-medium">
              Yetersiz Karanlık Madde! Bu işlem için en az{" "}
              {booster.costDarkMatter.toLocaleString("tr-TR")} KM gereklidir.
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition"
            >
              Vazgeç
            </button>
            <button
              onClick={onConfirm}
              disabled={!canAfford || isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                canAfford && !isSubmitting
                  ? hasActiveExisting
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
              }`}
            >
              {isSubmitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : hasActiveExisting ? (
                <>
                  <span>Onayla ve Üzerine Yaz</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Satın Al ve Aktif Et (90 Gün)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

