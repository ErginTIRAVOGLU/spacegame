"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, X, Sparkles, Loader2, FastForward, Zap } from "lucide-react";

export type DarkMatterActionType = "instant" | "halve";

export interface DarkMatterSpeedupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemName: string;
  targetLevel?: number;
  cost: number;
  userDarkMatter: number;
  actionType?: DarkMatterActionType;
  isResearch?: boolean;
  isShipyard?: boolean;
  isLifeform?: boolean;
  onConfirm: () => Promise<void>;
}

export function InstantCompleteModal({
  isOpen,
  onClose,
  title = "Bilgilendirme",
  itemName,
  targetLevel,
  cost,
  userDarkMatter,
  actionType = "instant",
  isResearch = false,
  isShipyard = false,
  isLifeform = false,
  onConfirm,
}: DarkMatterSpeedupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasEnoughDm = userDarkMatter >= cost;

  const handleConfirm = async () => {
    if (!hasEnoughDm || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İşlem sırasında hata oluştu.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionSubject = isResearch
    ? "Araştırma"
    : isShipyard
    ? "Tersane üretim"
    : isLifeform
    ? "Canlı türü bina"
    : "İnşa";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-zinc-700/80 bg-[#0d1117] shadow-2xl overflow-hidden relative text-zinc-100 flex flex-col">
        {/* Yellow-and-black hazard warning stripes banner */}
        <div className="h-3.5 w-full bg-[repeating-linear-gradient(45deg,#eab308,#eab308_12px,#090d14_12px,#090d14_24px)] border-b border-amber-500/40" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-zinc-800 bg-[#121824]/90">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {itemName}
                {typeof targetLevel === "number" && !isShipyard ? ` • Kademe ${targetLevel}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm sm:text-base text-zinc-200 text-center leading-relaxed font-medium">
            {actionType === "halve" ? (
              <>
                {actionSubject} süresini yarıya indirmek için{" "}
                <span className="font-bold text-amber-400 font-mono">
                  {cost.toLocaleString("tr-TR")}
                </span>{" "}
                Karanlık Madde kullanılacak. Şu an toplam{" "}
                <span className="font-bold text-cyan-300 font-mono">
                  {userDarkMatter.toLocaleString("tr-TR")}
                </span>{" "}
                Karanlık Maddeniz var. Emin misiniz?
              </>
            ) : (
              <>
                {actionSubject} emrini{" "}
                <span className="font-bold text-amber-400 font-mono">
                  {cost.toLocaleString("tr-TR")}
                </span>{" "}
                Karanlık Madde karşılığında hemen tamamlamak istiyor musun? Şu an toplam{" "}
                <span className="font-bold text-cyan-300 font-mono">
                  {userDarkMatter.toLocaleString("tr-TR")}
                </span>{" "}
                Karanlık Maddeniz var.
              </>
            )}
          </p>

          {/* DM Balance Indicator */}
          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Mevcut Karanlık Madde:</span>
            </span>
            <span
              className={`font-bold ${
                hasEnoughDm ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {userDarkMatter.toLocaleString("tr-TR")} KM
            </span>
          </div>

          {/* Low Balance Warning */}
          {!hasEnoughDm && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-800/60 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>Yetersiz Karanlık Madde!</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Bu işlemi gerçekleştirmek için{" "}
                <span className="font-mono font-bold text-rose-200">
                  {(cost - userDarkMatter).toLocaleString("tr-TR")} KM
                </span>{" "}
                daha gereklidir.
              </p>
              <Link
                href="/officers"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-semibold transition mt-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Karanlık Madde Tedarik Et (Subaylar)</span>
              </Link>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-rose-950/60 border border-rose-800 p-2.5 text-xs text-rose-300 text-center">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#121824]/60 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Hayır</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasEnoughDm || isSubmitting}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{actionType === "halve" ? "Kısaltılıyor..." : "Tamamlanıyor..."}</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Evet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
