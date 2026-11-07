"use client";

import { useState } from "react";
import {
  type BuildingInfo,
  type PlanetSummary,
  calculateDemolitionCost,
  useGameStore,
} from "@/store/useGameStore";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  AlertTriangle,
  Boxes,
  Gem,
  Droplets,
  Clock,
  Flame,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface DemolitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: BuildingInfo;
  planet: PlanetSummary;
}

export function DemolitionModal({
  isOpen,
  onClose,
  building,
  planet,
}: DemolitionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const researches = useGameStore((s) => s.researches);
  const startBuildingDemolish = useGameStore((s) => s.startBuildingDemolish);

  if (!isOpen) return null;

  // Ion Technology (ResearchType 121)
  const INDESTRUCTIBLE_BUILDING_KEYS = new Set([
    "spaceDock",
    "terraformer",
    "lunarBase",
    "moonBase",
  ]);
  const isIndestructible = INDESTRUCTIBLE_BUILDING_KEYS.has(building.key);

  const ionTechLevel = researches[121] ?? 0;
  const roboticsLevel =
    planet.buildings.find((b) => b.key === "roboticsFactory")?.level ?? 0;
  const naniteLevel =
    planet.buildings.find((b) => b.key === "naniteFactory")?.level ?? 0;

  const cost = calculateDemolitionCost(
    building,
    ionTechLevel,
    roboticsLevel,
    naniteLevel
  );

  const canAffordMetal = planet.metal >= cost.metal;
  const canAffordCrystal = planet.crystal >= cost.crystal;
  const canAffordDeut = planet.deuterium >= cost.deuterium;
  const canAfford = canAffordMetal && canAffordCrystal && canAffordDeut;
  const isQueueBusy = Boolean(planet.activeBuildingQueue);

  const handleConfirm = async () => {
    if (isIndestructible || !canAfford || isQueueBusy || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await startBuildingDemolish(building.key);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message ?? "Yıkım başlatılamadı.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-rose-500/50 bg-[#0b0f17] shadow-[0_0_50px_rgba(244,63,94,0.25)] overflow-hidden">
        {/* Sarı-Siyah Uyarı Çizgili Üst Başlık (Hazard Stripes) */}
        <div
          className="relative px-5 py-3.5 flex items-center justify-between border-b border-amber-500/40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #eab308 0, #eab308 14px, #000000 14px, #000000 28px)",
          }}
        >
          <div className="flex items-center gap-2.5 bg-black/90 px-3 py-1 rounded border border-amber-400 shadow-md">
            <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse shrink-0" />
            <span className="text-sm font-black font-mono tracking-widest text-amber-300 uppercase">
              Dikkat: Bina Yıkımı
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-black/90 hover:bg-black text-zinc-300 hover:text-white border border-zinc-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-5 space-y-4">
          {/* Soru */}
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-zinc-100">
              <span className="text-rose-400">{building.name}</span> binası
              gerçekten bir kademe düşürülsün mü?
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
              <span>Mevcut: Kademe {building.level}</span>
              <span>→</span>
              <span className="text-amber-300 font-bold">
                Yeni: Kademe {cost.targetLevel}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-cyan-400">Alan Kazancı: +1 Boş Alan</span>
            </div>
          </div>

          {/* İyon Tekniği İndirim Rozeti */}
          {ionTechLevel > 0 && (
            <div className="px-3 py-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>İyon Tekniği (Seviye {ionTechLevel})</span>
              </span>
              <span className="font-bold text-cyan-200">
                %{cost.discountPercent} Yıkım Tasarrufu
              </span>
            </div>
          )}

          {/* Maliyet & Süre Tablosu */}
          <div className="rounded-lg border border-zinc-800 bg-[#070a0f] overflow-hidden">
            <div className="px-3.5 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Yıkım Maliyet ve Süre Tablosu</span>
              {cost.discountPercent > 0 && (
                <span className="text-emerald-400 font-bold">
                  İndirimli Maliyet
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-center">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-zinc-400 bg-zinc-950/40">
                    <th className="py-2.5 px-3 font-semibold">Metal</th>
                    <th className="py-2.5 px-3 font-semibold">Kristal</th>
                    <th className="py-2.5 px-3 font-semibold">Deuterium</th>
                    <th className="py-2.5 px-3 font-semibold">Süre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  <tr>
                    {/* Metal */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Boxes className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span
                          className={`font-bold ${
                            canAffordMetal
                              ? "text-zinc-200"
                              : "text-rose-400 font-black"
                          }`}
                        >
                          {cost.metal.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </td>

                    {/* Kristal */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Gem className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span
                          className={`font-bold ${
                            canAffordCrystal
                              ? "text-cyan-300"
                              : "text-rose-400 font-black"
                          }`}
                        >
                          {cost.crystal.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </td>

                    {/* Deuterium */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span
                          className={`font-bold ${
                            canAffordDeut
                              ? "text-emerald-300"
                              : "text-rose-400 font-black"
                          }`}
                        >
                          {cost.deuterium.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </td>

                    {/* Süre */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1 text-amber-300 font-bold">
                        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>{formatCountdownTurkish(cost.durationSeconds)}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Hata veya Uyarı Mesajı */}
          {errorMessage && (
            <div className="px-3.5 py-2 rounded bg-rose-950/60 border border-rose-500/50 text-xs font-mono text-rose-300">
              {errorMessage}
            </div>
          )}

          {isIndestructible && (
            <div className="px-3.5 py-2 rounded bg-rose-950/60 border border-rose-500/60 text-xs font-mono text-rose-300 text-center font-bold">
              Bu bina yıkılamaz (Uzay İskelesi, Terraformer ve Ay Üssü yıkılamaz yapılardır).
            </div>
          )}

          {!canAfford && !isIndestructible && (
            <div className="px-3.5 py-2 rounded bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-300 text-center">
              Yıkım işlemi için yeterli hammaddeniz bulunmuyor.
            </div>
          )}

          {isQueueBusy && (
            <div className="px-3.5 py-2 rounded bg-amber-950/40 border border-amber-500/40 text-xs font-mono text-amber-300 text-center">
              Gezegende aktif bir inşaat görevi sürerken yeni yıkım başlatılamaz.
            </div>
          )}

          {/* Aksiyonlar (Evet / Hayır) */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs font-semibold transition"
            >
              Hayır
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isIndestructible || !canAfford || isQueueBusy || isSubmitting}
              className={`px-6 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition shadow-lg ${
                !isIndestructible && canAfford && !isQueueBusy && !isSubmitting
                  ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-900/40"
                  : "bg-zinc-800/90 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Yıkılıyor...</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 text-rose-200" />
                  <span>Evet, Yık</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

