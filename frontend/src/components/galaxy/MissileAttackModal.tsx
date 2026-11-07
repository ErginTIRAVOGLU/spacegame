"use client";

import { useState } from "react";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { Bomb, X, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";

interface MissileAttackModalProps {
  originPlanetId: string;
  originCoords: string;
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
  targetPlanetName?: string;
  ipmCount: number;
  ipmRange: number;
  isWithinRange: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const DEFENSE_TARGETS = [
  { value: 0, label: "Tüm Savunma Birimleri (Önceliksiz)" },
  { value: 401, label: "Roketatar" },
  { value: 402, label: "Hafif Lazer Topu" },
  { value: 403, label: "Ağır Lazer Topu" },
  { value: 404, label: "Gaus Topu" },
  { value: 405, label: "İyon Topu" },
  { value: 406, label: "Plazma Atıcı" },
  { value: 407, label: "Küçük Kalkan Kubbesi" },
  { value: 408, label: "Büyük Kalkan Kubbesi" },
];

export function MissileAttackModal({
  originPlanetId,
  originCoords,
  targetGalaxy,
  targetSystem,
  targetSlot,
  targetPlanetName,
  ipmCount,
  ipmRange,
  isWithinRange,
  onClose,
  onSuccess,
}: MissileAttackModalProps) {
  const userId = useGameStore((s) => s.userId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [missileCount, setMissileCount] = useState<number>(Math.min(1, ipmCount));
  const [primaryDefense, setPrimaryDefense] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    if (!userId) {
      setError("Oturum doğrulanamadı.");
      return;
    }

    if (missileCount <= 0 || missileCount > ipmCount) {
      setError("Geçersiz roket miktarı.");
      return;
    }

    if (!isWithinRange) {
      setError("Hedef koordinat Gezegenlerarası Roket menziliniz dışındadır.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/missiles/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attackerUserId: userId,
          originPlanetId,
          targetGalaxy,
          targetSystem,
          targetSlot,
          missileCount,
          primaryTargetDefenseType: primaryDefense > 0 ? primaryDefense : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? data?.message ?? "Roket saldırısı başlatılamadı.");
        return;
      }

      await fetchBootstrap();
      onSuccess(
        data?.message ??
          `${missileCount} adet Gezegenlerarası Roket [${targetGalaxy}:${targetSystem}:${targetSlot}] hedefine fırlatıldı!`
      );
      onClose();
    } catch {
      setError("Sunucuya bağlanırken ağ hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/50 bg-[#0d1017] p-6 space-y-4 shadow-2xl relative font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Bomb className="h-5 w-5 text-red-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Gezegenlerarası Roket Saldırısı
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/50 bg-red-950/30 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Info */}
        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/80 text-xs font-mono space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Kalkış Üssü:</span>
            <strong className="text-zinc-200">{originCoords}</strong>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Hedef Koordinat:</span>
            <strong className="text-red-400">
              [{targetGalaxy}:{targetSystem}:{targetSlot}] {targetPlanetName ? `(${targetPlanetName})` : ""}
            </strong>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Mevcut IPM Stoku:</span>
            <strong className={ipmCount > 0 ? "text-amber-300" : "text-zinc-600"}>
              {ipmCount} Adet
            </strong>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Maksimum Menzil:</span>
            <strong className={isWithinRange ? "text-emerald-400" : "text-rose-400"}>
              {ipmRange} Sistem {isWithinRange ? "(Menzil İçinde)" : "(Menzil Dışı)"}
            </strong>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Fırlatılacak Roket Miktarı:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={ipmCount}
                disabled={ipmCount <= 0 || !isWithinRange}
                value={missileCount}
                onChange={(e) =>
                  setMissileCount(Math.max(1, Math.min(ipmCount, Number(e.target.value) || 1)))
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-red-400 disabled:opacity-40"
              />
              <button
                type="button"
                disabled={ipmCount <= 0 || !isWithinRange}
                onClick={() => setMissileCount(ipmCount)}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-amber-300 transition-colors disabled:opacity-30"
              >
                Max
              </button>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Birincil Hedef Savunma Birimi:
            </label>
            <select
              value={primaryDefense}
              onChange={(e) => setPrimaryDefense(Number(e.target.value))}
              disabled={ipmCount <= 0 || !isWithinRange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-400 disabled:opacity-40"
            >
              {DEFENSE_TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            İptal
          </button>

          <button
            type="button"
            disabled={ipmCount <= 0 || !isWithinRange || isSubmitting}
            onClick={handleLaunch}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-zinc-100 font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
          >
            <Bomb className="h-4 w-4" />
            <span>{isSubmitting ? "Fırlatılıyor..." : "Roketi Fırlat"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

