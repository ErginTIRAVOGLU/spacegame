"use client";

import { User, Shield, Award, Calendar, Globe2, X, Flag } from "lucide-react";

interface PlayerProfileModalProps {
  playerId: string;
  playerName: string;
  playerPoints?: number | null;
  allianceTag?: string | null;
  onClose: () => void;
  onSendMessage: () => void;
}

export function PlayerProfileModal({
  playerName,
  playerPoints,
  allianceTag,
  onClose,
  onSendMessage,
}: PlayerProfileModalProps) {
  const points = playerPoints ?? 0;
  const rank = points > 100_000 ? 12 : points > 10_000 ? 84 : 340;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#0d1017] p-6 space-y-5 shadow-2xl relative font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Komutan Profili</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-[#090d14]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-indigo-900 border-2 border-amber-400 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            {playerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">{playerName}</h2>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              {allianceTag ? (
                <span className="text-amber-400 font-semibold">
                  [{allianceTag}] İttifakı Üyesi
                </span>
              ) : (
                <span className="text-zinc-500">Bağımsız İmparatorluk</span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
              <Flag className="h-3 w-3 text-cyan-400" />
              Evren: Sagittarius &bull; Sektör 1-9
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" />
              Genel Sıralama:
            </span>
            <div className="text-base font-bold text-amber-300">#{rank}</div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-cyan-400" />
              Toplam Puan:
            </span>
            <div className="text-base font-bold text-cyan-300">
              {points.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSendMessage();
            }}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-cyan-500/25 transition-all cursor-pointer"
          >
            Mesaj Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

