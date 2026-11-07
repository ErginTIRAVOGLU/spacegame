"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchSpaceDockInfo,
  startSpaceDockRepair,
  type SpaceDockInfo,
} from "@/services/spaceDockService";
import { formatCountdownTurkish } from "@/hooks/useCountdown";
import {
  Wrench,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";

interface SpaceDockWreckPanelProps {
  planetId: string;
  spaceDockLevel: number;
}

export function SpaceDockWreckPanel({
  planetId,
  spaceDockLevel,
}: SpaceDockWreckPanelProps) {
  const [info, setInfo] = useState<SpaceDockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRepairingAction, setIsRepairingAction] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchSpaceDockInfo(planetId);
    setInfo(data);
    setIsLoading(false);
  }, [planetId]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleStartRepair = async () => {
    setIsRepairingAction(true);
    setFeedback(null);
    const res = await startSpaceDockRepair(planetId);
    setIsRepairingAction(false);
    if (res.success) {
      setFeedback(res.message ?? "Savunma gemileri onarımı başlatıldı.");
      loadInfo();
    } else {
      setFeedback(res.message ?? "Onarım başlatılamadı.");
    }
  };

  const repairRatioPercent = Math.min(
    80,
    50 + Math.max(0, spaceDockLevel) * 2
  );

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-[#070d18] p-4 space-y-3.5 shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            Uzay İskelesi Enkaz Alanı (72 Saatlik Wreckfield)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>Kademe {spaceDockLevel}</span>
          <span className="text-cyan-400 font-bold">
            (Onarım Oranı: %{repairRatioPercent})
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-4 text-center text-xs font-mono text-zinc-500 animate-pulse">
          Enkaz alanı bilgileri yükleniyor...
        </div>
      ) : info?.hasWreckField && !info.isExpired ? (
        <div className="space-y-3">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded bg-zinc-950 border border-amber-500/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">
                  Kalan Enkaz Ömrü
                </div>
                <div className="text-amber-300 font-bold">
                  {formatCountdownTurkish(info.remainingLifeSeconds)}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-zinc-950 border border-cyan-500/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">
                  Onarım Kapasitesi
                </div>
                <div className="text-cyan-300 font-bold">
                  %{Math.round(info.maxRepairRatio * 100)} (Ücretsiz)
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-zinc-950 border border-emerald-500/30 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">
                  Onarım Süresi
                </div>
                <div className="text-emerald-300 font-bold">
                  {formatCountdownTurkish(info.totalRepairDurationSeconds)}
                </div>
              </div>
            </div>
          </div>

          {/* Ships Table */}
          <div className="rounded border border-zinc-800 overflow-hidden bg-zinc-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c1422] text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Gemi Tipi</th>
                  <th className="py-2 px-3 text-right">Yok Edilen</th>
                  <th className="py-2 px-3 text-right text-emerald-400">
                    Kurtarılacak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {info.ships.map((s) => (
                  <tr key={s.unitType} className="hover:bg-zinc-900/40">
                    <td className="py-2 px-3 text-zinc-200 font-medium">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400">
                      {s.wreckCount.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-300 font-bold">
                      +{s.repairableCount.toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            {info.isRepairing ? (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2 w-full justify-center">
                <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span>
                  Uzay İskelesi onarımı sürüyor. Tamamlandığında gemiler filonuza
                  katılacak.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartRepair}
                disabled={isRepairingAction}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Wrench className="w-4 h-4" />
                <span>
                  {isRepairingAction
                    ? "Onarım Başlatılıyor..."
                    : "Savunma Enkazını Onar (Ücretsiz)"}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded bg-zinc-950/60 border border-zinc-800 text-xs font-mono text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Aktif Enkaz Alanı Yok</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Gezegeninizde gerçekleşen savunma savaşında filonuz yok edildiğinde,
            kaybedilen gemilerin %50-%80&apos;i (Uzay İskelesi kademesine bağlı)
            burada 72 saat süreyle kurtarılabilir durumda bekler ve ücretsiz
            onarılır.
          </p>
        </div>
      )}
    </div>
  );
}

