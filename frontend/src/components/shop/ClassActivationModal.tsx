"use client";

import React, { useState } from "react";
import { ShopClassItem } from "@/lib/shopCatalog";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  AlertTriangle,
  Coins,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ClassActivationModalProps {
  item: ShopClassItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClass: ShopClassItem) => void;
}

export function ClassActivationModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: ClassActivationModalProps) {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const addToast = useGameStore((s) => s.addToast);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveCost = item.isDiscountActive
    ? item.discountCost
    : item.baseCost;
  const hasEnoughDarkMatter = darkMatter >= effectiveCost;

  const handleActivate = async () => {
    if (!hasEnoughDarkMatter) {
      setErrorMessage(
        `Yetersiz Karanlık Madde! Sınıf değiştirmek için ${effectiveCost.toLocaleString(
          "tr-TR"
        )} KM gereklidir.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/classes/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || undefined,
          targetClass: item.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBootstrap();
        addToast({
          type: "research",
          title: "Sınıf Değişimi Başarılı!",
          message: `${item.title} sınıfı aktif edildi. Yeni bonuslarınız hesabınıza tanımlandı.`,
        });
        onSuccess(item);
        onClose();
      } else {
        setErrorMessage(
          data.message || "Sınıf aktifleştirme işlemi başarısız oldu."
        );
      }
    } catch {
      setErrorMessage("Sunucuyla bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-700/80 bg-gradient-to-b from-[#111622] via-[#0c1018] to-[#070a0f] p-6 shadow-2xl shadow-cyan-950/30 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hazard Warning Header */}
        <div className="flex items-start gap-3 border-b border-amber-500/20 pb-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Kritik İşlem Onayı
            </span>
            <h3 className="text-base font-bold text-zinc-100 mt-0.5">
              Dikkat / Sınıf Değişimi
            </h3>
          </div>
        </div>

        {/* Warning Text */}
        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          <p>
            Yeni bir sınıf öğesi aktif ettiğinde mevcut sınıfın tamamen
            silinecektir. Bir hesapta aynı anda{" "}
            <strong>yalnızca tek bir sınıf aktif kalabilir</strong>. Devam
            etmek istiyor musun?
          </p>
        </div>

        {/* Item Target Preview */}
        <div className="p-3.5 rounded-lg bg-[#080d14] border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Aktif Edilecek Sınıf:</span>
            <span className={`text-xs font-bold ${item.accentColor} uppercase`}>
              {item.title}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Hedef Profil:</span>
            <span className="text-xs text-zinc-300 font-medium">
              {item.targetAudience}
            </span>
          </div>
        </div>

        {/* Cost & Balance Breakdown */}
        <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-xs space-y-2 font-mono">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Mevcut Karanlık Madde:</span>
            <span
              className={`font-bold ${
                hasEnoughDarkMatter ? "text-purple-300" : "text-rose-400"
              }`}
            >
              {darkMatter.toLocaleString("tr-TR")} KM
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>İşlem Maliyeti:</span>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{effectiveCost.toLocaleString("tr-TR")} KM</span>
              {item.isDiscountActive && (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/40">
                  İNDİRİM
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-zinc-800/80 pt-2 flex justify-between items-center">
            <span className="text-zinc-500">Kalan Bakiye:</span>
            <span
              className={`font-bold ${
                hasEnoughDarkMatter ? "text-zinc-200" : "text-rose-400"
              }`}
            >
              {hasEnoughDarkMatter
                ? `${(darkMatter - effectiveCost).toLocaleString("tr-TR")} KM`
                : "YETERSİZ BAKİYE"}
            </span>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={isSubmitting || !hasEnoughDarkMatter}
            onClick={handleActivate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : !hasEnoughDarkMatter ? (
              <span>Yetersiz Karanlık Madde</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Satın Al ve Aktif Et</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
