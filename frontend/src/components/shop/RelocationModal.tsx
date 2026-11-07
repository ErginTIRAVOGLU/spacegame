"use client";

import React, { useState } from "react";
import { canRelocateToSlot } from "@/services/planetGenerationService";
import {
  Globe,
  Compass,
  Coins,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

interface RelocationModalProps {
  isOpen: boolean;
  planetId: string;
  planetName: string;
  currentGalaxy: number;
  currentSystem: number;
  currentSlot: number;
  isMoon?: boolean;
  currentDarkMatter: number;
  costDarkMatter: number;
  onClose: () => void;
  onConfirm: (targetGalaxy: number, targetSystem: number, targetSlot: number) => Promise<void>;
  isSubmitting: boolean;
}

export function RelocationModal({
  isOpen,
  planetId,
  planetName,
  currentGalaxy,
  currentSystem,
  currentSlot,
  isMoon = false,
  currentDarkMatter,
  costDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: RelocationModalProps) {
  const [targetGalaxy, setTargetGalaxy] = useState<number>(currentGalaxy);
  const [targetSystem, setTargetSystem] = useState<number>(currentSystem);
  const [targetSlot, setTargetSlot] = useState<number>(currentSlot === 15 ? 1 : currentSlot + 1);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canAfford = currentDarkMatter >= costDarkMatter;
  const isSameCoordinate =
    targetGalaxy === currentGalaxy &&
    targetSystem === currentSystem &&
    targetSlot === currentSlot;

  const handleStartRelocation = async () => {
    if (targetGalaxy < 1 || targetGalaxy > 9) {
      setValidationError("Hedef Galaksi 1 ile 9 arasında olmalıdır.");
      return;
    }
    if (targetSystem < 1 || targetSystem > 499) {
      setValidationError("Hedef Sistem 1 ile 499 arasında olmalıdır.");
      return;
    }
    if (targetSlot < 1 || targetSlot > 15) {
      setValidationError("Hedef Pozisyon (Slot) 1 ile 15 arasında olmalıdır.");
      return;
    }
    if (isSameCoordinate) {
      setValidationError("Hedef koordinat mevcut gezegen konumu ile aynı olamaz.");
      return;
    }
    if (!canRelocateToSlot(currentSlot, targetSlot)) {
      setValidationError(
        "Yörünge Taşıma Kuralı: Slot 4–12 arasındaki standart gezegenler yalnızca Slot 4–12 arasına taşınabilir (Slot 1–3 ve 13–15 arasına taşınamaz)."
      );
      return;
    }

    setValidationError(null);
    await onConfirm(targetGalaxy, targetSystem, targetSlot);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-700 bg-[#0d121c] p-6 shadow-2xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/50 text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Gezegen Taşıma (Planetary Relocation)
            </h3>
            <p className="text-xs text-zinc-400">
              Mevcut Konum:{" "}
              <span className="font-semibold text-cyan-300">
                {planetName} [{currentGalaxy}:{currentSystem}:{currentSlot}]
              </span>
            </p>
          </div>
        </div>

        {/* Target Coordinate Inputs */}
        <div className="mt-5 p-4 rounded-xl border border-zinc-800 bg-[#070b13] space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
            Hedef Koordinatları Belirleyin:
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">
                Galaksi (1-9)
              </span>
              <input
                type="number"
                min={1}
                max={9}
                value={targetGalaxy}
                onChange={(e) => setTargetGalaxy(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">
                Sistem (1-499)
              </span>
              <input
                type="number"
                min={1}
                max={499}
                value={targetSystem}
                onChange={(e) => setTargetSystem(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">
                Pozisyon (1-15)
              </span>
              <input
                type="number"
                min={1}
                max={15}
                value={targetSlot}
                onChange={(e) => setTargetSlot(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
            <span className="text-zinc-400">Seçilen Rota:</span>
            <span className="font-mono font-bold text-cyan-300">
              [{currentGalaxy}:{currentSystem}:{currentSlot}] ➔ [{targetGalaxy}:{targetSystem}:{targetSlot}]
            </span>
          </div>
        </div>

        {validationError && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Relocation Rules & Checkpoints */}
        <div className="mt-4 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Gereksinimler ve Kurallar:
          </span>
          <ul className="space-y-1 text-zinc-300 text-[11px] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Hedef pozisyonun galaksi haritasında tamamen <strong>boş</strong> olması şarttır.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Gezegene bağlı <strong>aktif filo görevi</strong> (gidiş, dönüş, bekleme) bulunmamalıdır.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Devam eden bina, tersane, canlı türü veya laboratuvar araştırması olmamalıdır.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Taşıma onaylandığında <strong>24 saatlik hazırlık geri sayımı</strong> başlar. Süre dolana dek iptal edilirse 240.000 KM tam iade edilir. İntikal tamamlandığında 48 saatlik bekleme süresi devreye girer.</span>
            </li>
          </ul>
        </div>

        {/* Price & Balance */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block">Taşıma Bedeli:</span>
            <span className="font-mono font-bold text-purple-300 text-sm flex items-center gap-1">
              <Coins className="w-4 h-4 text-purple-400" />
              {costDarkMatter.toLocaleString("tr-TR")} KM
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 block">Mevcut Bakiyeniz:</span>
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
            Yetersiz Karanlık Madde! Bu işlem için en az {costDarkMatter.toLocaleString("tr-TR")} KM gereklidir.
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
            onClick={handleStartRelocation}
            disabled={!canAfford || isSubmitting || isSameCoordinate}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              canAfford && !isSubmitting && !isSameCoordinate
                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Taşımayı Başlat (240.000 KM)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

