"use client";

import { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  UserPlus,
  UserX,
  Shield,
  ExternalLink,
  Award,
} from "lucide-react";

interface PlayerProfilePopoverProps {
  playerId: string;
  playerName: string;
  playerPoints?: number | null;
  allianceTag?: string | null;
  statusBadge?: string;
  onSendMessage: (playerId: string, playerName: string) => void;
  onAddFriend: (playerId: string, playerName: string) => void;
  onBlockUser: (playerId: string, playerName: string) => void;
  onShowProfile: (playerId: string, playerName: string) => void;
  children: React.ReactNode;
}

export function PlayerProfilePopover({
  playerId,
  playerName,
  playerPoints,
  allianceTag,
  statusBadge,
  onSendMessage,
  onAddFriend,
  onBlockUser,
  onShowProfile,
  children,
}: PlayerProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Approximate rank from points
  const points = playerPoints ?? 0;
  const rank = points > 100_000 ? 12 : points > 10_000 ? 84 : 340;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-xl border border-zinc-700 bg-[#0d121c] p-4 shadow-2xl space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-slate-900 border border-cyan-500/50 flex items-center justify-center font-bold text-white shadow-md">
              {playerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-zinc-100 text-sm truncate">
                <span>{playerName}</span>
                {statusBadge && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {statusBadge}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {allianceTag ? `[${allianceTag}] İttifakı` : "Bağımsız Komutan"}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                Sıralama:
              </span>
              <strong className="text-zinc-200">#{rank}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Toplam Puan:
              </span>
              <strong className="text-cyan-300">{points.toLocaleString()}</strong>
            </div>
          </div>

          {/* Action List */}
          <div className="pt-2 border-t border-zinc-800 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSendMessage(playerId, playerName);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors text-left"
            >
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mesaj Yaz</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddFriend(playerId, playerName);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-emerald-300 transition-colors text-left"
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Arkadaşlık İsteği</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onShowProfile(playerId, playerName);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition-colors text-left"
            >
              <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
              <span>Profili Göster</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onBlockUser(playerId, playerName);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors text-left"
            >
              <UserX className="h-3.5 w-3.5 text-rose-400" />
              <span>Oyuncuyu Yok Say</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

