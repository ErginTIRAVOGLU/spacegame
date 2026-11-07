"use client";

import { useEffect, useState, useCallback } from "react";
import {
  scanWithSensorPhalanx,
  calculatePhalanxRange,
  type PhalanxFleetMovement,
} from "@/services/phalanxService";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  Radar,
  X,
  Clock,
  ArrowRight,
  Shield,
  AlertTriangle,
  Loader2,
  Droplets,
  Ship,
} from "lucide-react";

interface PhalanxScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannerUserId: string;
  originMoonId: string;
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
  phalanxLevel: number;
  originCoords?: string;
}

const MISSION_NAMES: Record<number, string> = {
  1: "Saldırı",
  2: "İttifak Saldırısı (ACS)",
  3: "Nakliye",
  4: "Konuşlanma",
  5: "Savunma / Duraklama",
  6: "Casusluk",
  7: "Sömürgeleştirme",
  8: "Geri Dönüşüm",
  9: "Ay Yok Etme",
  15: "Keşif",
};

export function PhalanxScanModal({
  isOpen,
  onClose,
  scannerUserId,
  originMoonId,
  targetGalaxy,
  targetSystem,
  targetSlot,
  phalanxLevel,
  originCoords,
}: PhalanxScanModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState<PhalanxFleetMovement[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performScan = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg(null);

    const res = await scanWithSensorPhalanx({
      scannerUserId,
      originMoonId,
      targetGalaxy,
      targetSystem,
      targetSlot,
    });

    setIsLoading(false);
    if (res.success && res.data) {
      setMovements(res.data.movements ?? []);
    } else {
      setErrorMsg(res.message ?? "Sensör Falanksı taraması başarısız oldu.");
    }
  }, [
    isOpen,
    scannerUserId,
    originMoonId,
    targetGalaxy,
    targetSystem,
    targetSlot,
  ]);

  useEffect(() => {
    performScan();
  }, [performScan]);

  if (!isOpen) return null;

  const phalanxRange = calculatePhalanxRange(phalanxLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono text-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#080d17] p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radar className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <span>Sensör Falanksı Taraması</span>
                <span className="text-cyan-400 font-mono text-xs">
                  [{targetGalaxy}:{targetSystem}:{targetSlot}]
                </span>
              </h3>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                <span>Falanks Kademesi: {phalanxLevel}</span>
                <span>•</span>
                <span>Menzil: {phalanxRange} Sistem</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  5.000 Deuterium
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-xs">Yörünge frekansları taranıyor...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 space-y-2">
              <Shield className="w-8 h-8 mx-auto text-cyan-400/60 opacity-60" />
              <div className="font-bold text-zinc-300">
                Tespit Edilen Filo Hareketi Yok
              </div>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                [{targetGalaxy}:{targetSystem}:{targetSlot}] koordinatında
                herhangi bir görünür filo sinyali bulunamadı (Ay hedefli/çıkışlı
                filolar ve konuşlanma dönüşleri Falanks tarafından taranamamaktadır).
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between">
                <span>Tespit Edilen Rotalar ({movements.length})</span>
                <span className="text-zinc-500 text-[10px]">
                  Falanks Görünürlük Matrisi Aktif
                </span>
              </div>

              {movements.map((m) => {
                const missionLabel =
                  MISSION_NAMES[m.missionType] ?? `Görev #${m.missionType}`;
                const totalShips = Object.values(m.ships).reduce(
                  (a, b) => a + b,
                  0
                );
                const isReturning = m.status === 3 || m.status === 6;

                return (
                  <div
                    key={m.fleetMissionId}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-cyan-500/30 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.missionType === 1 || m.missionType === 2
                            ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                            : m.missionType === 4
                            ? "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                            : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {missionLabel} {isReturning ? "(Dönüş / Geri Çağrıldı)" : "(Gidiş)"}
                      </span>

                      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isReturning && m.returnUtc
                            ? `Dönüş: ${new Date(m.returnUtc).toLocaleTimeString()}`
                            : `Varış: ${new Date(m.arrivalUtc).toLocaleTimeString()}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">
                          {m.originCoordinates}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-cyan-300 font-bold">
                          {m.targetCoordinates}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                        <Ship className="w-3.5 h-3.5" />
                        <span>{totalShips.toLocaleString("tr-TR")} Gemi</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

