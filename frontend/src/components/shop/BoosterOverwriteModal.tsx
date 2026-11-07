"use client";

import React from "react";
import {
  MonthlyBoosterItem,
  formatBoosterDuration,
  TIER_CONFIG,
  RESOURCE_CONFIG,
} from "@/lib/monthlyBoostersCatalog";
import {
  AlertTriangle,
  Coins,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface BoosterOverwriteModalProps {
  isOpen: boolean;
  booster: MonthlyBoosterItem | null;
  planetName: string;
  currentDarkMatter: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function BoosterOverwriteModal({
  isOpen,
  booster,
  planetName,
  currentDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: BoosterOverwriteModalProps) {
  if (!isOpen || !booster) return null;

  const hasActiveExisting =
    booster.isActive ||
    booster.activeDifferentTier ||
    booster.activeRemainingSeconds > 0;

  const existingPercent = booster.isActive
    ? booster.percent
    : booster.activeDifferentTierPercent;

  const tierCfg = TIER_CONFIG[booster.tier] || TIER_CONFIG.Silver;
  const resCfg = RESOURCE_CONFIG[booster.resourceType] || RESOURCE_CONFIG.Metal;
  const canAfford = currentDarkMatter >= booster.costDarkMatter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#0d121c] p-6 shadow-2xl overflow-hidden"
        style={{
          boxShadow: hasActiveExisting
            ? "0 0 35px rgba(245, 158, 11, 0.2)"
            : "0 0 35px rgba(34, 211, 238, 0.2)",
        }}
      >
        {/* Top glow decoration */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            hasActiveExisting
              ? "from-amber-500 via-orange-500 to-amber-500"
              : "from-cyan-500 via-purple-500 to-cyan-500"
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              hasActiveExisting
                ? "bg-amber-950/50 border-amber-500/40 text-amber-400"
                : "bg-cyan-950/50 border-cyan-500/40 text-cyan-400"
            }`}
          >
            {hasActiveExisting ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              {hasActiveExisting
                ? "Mevcut Güçlendiricinin Üzerine Yaz"
                : "30 Günlük Güçlendiriciyi Aktif Et"}
            </h3>
            <p className="text-xs text-zinc-400">
              Hedef Gezegen:{" "}
              <span className="font-semibold text-zinc-200">{planetName}</span>
            </p>
          </div>
        </div>

        {/* Overwrite Warning Banner */}
        {hasActiveExisting && (
          <div className="mt-4 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-amber-300">
                  Aktif Güçlendirici Bulundu!
                </p>
                <p className="text-zinc-300 mt-1">
                  Bu gezegende şu anda bir{" "}
                  <strong className="text-amber-200">
                    %{existingPercent} {resCfg.nameTr}
                  </strong>{" "}
                  güçlendiricisi aktif (Kalan süre:{" "}
                  <span className="font-mono text-amber-300">
                    {formatBoosterDuration(booster.activeRemainingSeconds)}
                  </span>
                  ).
                </p>
                <p className="text-amber-300/90 mt-1.5 font-medium">
                  OGame kuralı: Maden güçlendiricileri süre olarak birikmez
                  (stacking yapılmaz). Onayladığınızda mevcut güçlendiricinizin
                  yerini alacak ve süre baştan{" "}
                  <span className="underline">30 güne</span> ayarlanacaktır.
                </p>
              </div>
            </div>

            {/* Comparison Visual */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-center text-xs">
              <div className="p-2 rounded bg-black/40 border border-zinc-800">
                <span className="text-[10px] uppercase text-zinc-400 block">
                  Şu Anki Durum
                </span>
                <span className="font-bold text-zinc-300">
                  +%{existingPercent} Üretim
                </span>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {formatBoosterDuration(booster.activeRemainingSeconds)}
                </div>
              </div>
              <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] uppercase text-cyan-400 block">
                  Yeni Değer
                </span>
                <span className="font-bold text-cyan-200">
                  +%{booster.percent} Üretim
                </span>
                <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                  30 Gün (720 Saat)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booster Card Preview */}
        <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-[#070b12] space-y-3">
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
              <p className="text-xs text-zinc-400 mt-1">
                {booster.description}
              </p>
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
              {booster.durationDays} Gün
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Gezegen:</span>
            <span className="font-medium text-cyan-300">{planetName}</span>
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
            İptal
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
                <span>Satın Al ve Aktif Et</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

