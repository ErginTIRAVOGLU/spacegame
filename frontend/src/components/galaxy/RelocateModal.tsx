"use client";

import { useState } from "react";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { canRelocateToSlot } from "@/services/planetGenerationService";
import { Compass, AlertCircle, CheckCircle2, X, Sparkles, Loader2 } from "lucide-react";

interface RelocateModalProps {
  originPlanetId: string;
  originPlanetName: string;
  originCoords: string;
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const RELOCATION_COST_DM = 240_000;

export function RelocateModal({
  originPlanetId,
  originPlanetName,
  originCoords,
  targetGalaxy,
  targetSystem,
  targetSlot,
  onClose,
  onSuccess,
}: RelocateModalProps) {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canAfford = darkMatter >= RELOCATION_COST_DM;

  const handleStartRelocation = async () => {
    const originSlot = Number(originCoords.split(":")[2] || 8);
    if (!canRelocateToSlot(originSlot, targetSlot)) {
      setErrorMsg(
        "Yörünge Taşıma Kuralı: Slot 4–12 arasındaki standart gezegenler yalnızca Slot 4–12 arasına taşınabilir (Slot 1–3 ve 13–15 arasına taşınamaz)."
      );
      return;
    }

    if (!canAfford) {
      setErrorMsg("Yetersiz Karanlık Madde! Gezegen taşımak için en az 240.000 KM gereklidir.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/relocation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId: originPlanetId,
          targetGalaxy,
          targetSystem,
          targetSlot,
          userId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.message || "Gezegen taşıma başlatılamadı.");
        return;
      }

      await fetchBootstrap();
      onSuccess(
        data?.message ||
          `[${targetGalaxy}:${targetSystem}:${targetSlot}] koordinatına gezegen taşıma işlemi başlatıldı.`
      );
      onClose();
    } catch {
      setErrorMsg("Ağ bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="w-full max-w-md rounded-xl border border-cyan-500/40 bg-[#0d1017] p-6 space-y-4 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Gezegen İskân Et (Taşıma)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-zinc-300">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Mevcut Gezegen:</span>
              <span className="font-bold text-zinc-200">
                {originPlanetName} [{originCoords}]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Hedef Koordinat:</span>
              <span className="font-bold text-cyan-300">
                [{targetGalaxy}:{targetSystem}:{targetSlot}]
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800/80 pt-1.5">
              <span className="text-zinc-500">Gereken Karanlık Madde:</span>
              <span className="font-bold text-amber-400">
                {RELOCATION_COST_DM.toLocaleString("tr-TR")} KM
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Mevcut Bakiyeniz:</span>
              <span
                className={`font-bold ${
                  canAfford ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {darkMatter.toLocaleString("tr-TR")} KM
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            İskân işlemi başlatıldığında 24 saatlik hazırlık sayacı başlar. Sayacın
            sonunda gezegen ve varsa bağlı olan Ay, tüm filoları ve savunmasıyla
            birlikte hedef koordinata taşınacaktır. Taşıma sırasında aktif filo görevi
            olmamalıdır.
          </p>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-[11px]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleStartRelocation}
            disabled={!canAfford || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-100 font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-lg shadow-cyan-600/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                <span>İskân Et (240.000 KM)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

