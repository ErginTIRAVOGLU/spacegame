"use client";

import React, { useState } from "react";
import {
  ShopMasterItem,
  TIER_THEME,
  formatDarkMatterFull,
} from "@/lib/shopMasterCatalog";
import {
  AlertTriangle,
  X,
  Package,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
} from "lucide-react";

interface ProductInspectorCardProps {
  item: ShopMasterItem | null;
  onClose: () => void;
  onBuyAndActivate: (item: ShopMasterItem) => Promise<boolean>;
  userDarkMatter: number;
}

export function ProductInspectorCard({
  item,
  onClose,
  onBuyAndActivate,
  userDarkMatter,
}: ProductInspectorCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!item) return null;

  const tierStyle =
    TIER_THEME[item.tier as keyof typeof TIER_THEME] || TIER_THEME.Gold;
  const isAffordable = userDarkMatter >= item.effectiveCostDarkMatter;

  const handleAction = async () => {
    if (isSubmitting || !isAffordable) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      const ok = await onBuyAndActivate(item);
      if (ok) {
        setActionSuccess("Eşya başarıyla satın alındı ve etkinleştirildi!");
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-xl border ${tierStyle.border} ${tierStyle.glow} bg-gradient-to-r ${tierStyle.gradient} p-5 shadow-2xl backdrop-blur-md transition-all duration-300`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${tierStyle.badgeBg}`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-zinc-100">
              {item.name}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${tierStyle.text}`}>
                {item.tier} Kalite
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{item.targetSummary}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Inventory Count Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-zinc-300">
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>Envanter: {item.ownedQuantity ?? 0}</span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-900/80 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Visual Left + Description & Actions Right */}
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left Visual Slot: 3D Holographic Crate / Emblem */}
        <div className="flex flex-col items-center justify-center md:col-span-4 lg:col-span-3">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl border border-zinc-700/60 bg-gradient-to-b from-zinc-900 via-black to-zinc-950 p-4 shadow-inner">
            {/* Ambient Animated Glow Rings */}
            <div className="absolute inset-0 rounded-2xl bg-radial from-amber-500/10 via-transparent to-transparent opacity-80" />

            {/* Central Holographic Icon */}
            {item.categories.includes("classes") ? (
              <Shield className={`h-16 w-16 ${tierStyle.text} drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]`} />
            ) : item.categories.includes("construction") ? (
              <Layers className={`h-16 w-16 ${tierStyle.text} drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]`} />
            ) : (
              <Package className={`h-16 w-16 ${tierStyle.text} drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]`} />
            )}

            {/* Duration Pill at bottom of visual slot */}
            <div className="absolute -bottom-3 flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 shadow-md">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>Süresi: {item.duration}</span>
            </div>
          </div>
        </div>

        {/* Right Info & Checkout */}
        <div className="flex flex-col justify-between md:col-span-8 lg:col-span-9">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-zinc-300">
              {item.description}
            </p>

            {/* Storage Overflow Hazard Warning */}
            {item.hasStorageOverflow && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-600/70 bg-amber-950/40 p-3 text-amber-200 shadow-inner">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="text-xs leading-normal">
                  <span className="font-semibold text-amber-300">
                    {item.storageWarning ||
                      "Dikkat: Yeterli depo alanın yok! Paketi şimdi etkinleştirirsen, ancak depolarının alabildiği kadar kaynak alırsın. Fazlalıklar geçerliliğini yitirir."}
                  </span>
                </div>
              </div>
            )}

            {/* Success banner */}
            {actionSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-emerald-950/40 p-2.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>

          {/* Checkout Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-3">
            {/* Price section */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Fiyat:
              </span>
              {item.isDiscountActive && (
                <span className="text-sm text-zinc-500 line-through">
                  {formatDarkMatterFull(item.baseCostDarkMatter)}
                </span>
              )}
              <span className="text-lg font-extrabold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                {formatDarkMatterFull(item.effectiveCostDarkMatter)}
              </span>
              {item.isDiscountActive && (
                <span className="rounded bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-800">
                  İNDİRİM
                </span>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              disabled={isSubmitting || !isAffordable}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg transition-all duration-200 ${
                !isAffordable
                  ? "cursor-not-allowed border border-zinc-700 bg-zinc-800/80 text-zinc-500"
                  : isSubmitting
                  ? "border border-amber-600 bg-amber-600/50 text-white"
                  : "border border-amber-500 bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 hover:brightness-110 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>İşleniyor...</span>
                </>
              ) : !isAffordable ? (
                <span>Yetersiz Karanlık Madde</span>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Satın al & Etkinleştir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

