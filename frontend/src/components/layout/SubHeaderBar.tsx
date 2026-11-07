"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { HeaderSpeciesWidget } from "@/components/layout/HeaderSpeciesWidget";
import { HeaderClassWidget } from "@/components/layout/HeaderClassWidget";
import { MiniOfficersBar } from "@/components/layout/MiniOfficersBar";
import { MessagesHubResponse } from "@/lib/messagesCatalog";
import {
  Mail,
  MessageSquare,
  Sliders,
  Trophy,
  User,
  FileText,
  UserCheck,
  Search,
} from "lucide-react";

export function SubHeaderBar() {
  const pathname = usePathname();
  const userId = useGameStore((s) => s.userId);
  const setIsSettingsOpen = useGameStore((s) => s.setIsSettingsOpen);
  const setIsNotesOpen = useGameStore((s) => s.setIsNotesOpen);
  const setIsBuddiesOpen = useGameStore((s) => s.setIsBuddiesOpen);
  const setIsSearchOpen = useGameStore((s) => s.setIsSearchOpen);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread messages count
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages?userId=${userId}`);
        if (res.ok) {
          const data = (await res.json()) as MessagesHubResponse;
          if (isMounted && data.playerMessages) {
            const count = data.playerMessages.filter((m) => !m.isRead).length;
            setUnreadCount(count);
          }
        }
      } catch {
        // ignore network error
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");
  const isChatActive = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="relative z-20 flex items-center justify-between px-4 py-1.5 bg-[#0d1014]/90 border-b border-[#263238] min-h-[46px] select-none gap-4">
      {/* Left Area: Messages and Chat Action Buttons (Relocated from Sidebar) */}
      <div className="flex items-center gap-2">
        {/* Messages Button */}
        <Link
          href="/messages"
          title="Mesajlar ve Raporlar"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
            isMessagesActive
              ? "bg-gradient-to-r from-cyan-950/80 via-[#132334] to-[#0f1924] text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
              : "bg-[#0b1018] hover:bg-[#121a24] text-zinc-300 hover:text-cyan-200 border-[#263238] hover:border-cyan-500/40"
          }`}
        >
          <Mail
            className={`h-4 w-4 ${
              isMessagesActive ? "text-cyan-400" : "text-zinc-400"
            }`}
          />
          <span>Mesajlar</span>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Chat Button */}
        <Link
          href="/chat"
          title="Genel ve İttifak Sohbeti"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
            isChatActive
              ? "bg-gradient-to-r from-cyan-950/80 via-[#132334] to-[#0f1924] text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
              : "bg-[#0b1018] hover:bg-[#121a24] text-zinc-300 hover:text-cyan-200 border-[#263238] hover:border-cyan-500/40"
          }`}
        >
          <MessageSquare
            className={`h-4 w-4 ${
              isChatActive ? "text-cyan-400" : "text-zinc-400"
            }`}
          />
          <span>Sohbet</span>

          {/* Active room indicator */}
          <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Evren
          </span>
        </Link>
        {/* Top-Bar Links: Sıralama & Profil */}
        <Link
          href="/highscores"
          title="Evren Sıralaması (Highscores)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
            pathname.startsWith("/highscores")
              ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.25)]"
              : "bg-[#0b1018] hover:bg-[#121a24] text-zinc-300 hover:text-cyan-200 border-[#263238]"
          }`}
        >
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span>Sıralama</span>
        </Link>

        <Link
          href="/profile"
          title="Oyuncu Profili & Başarımlar"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
            pathname.startsWith("/profile")
              ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.25)]"
              : "bg-[#0b1018] hover:bg-[#121a24] text-zinc-300 hover:text-cyan-200 border-[#263238]"
          }`}
        >
          <User className="h-3.5 w-3.5 text-cyan-400" />
          <span>Profil</span>
        </Link>
      </div>

      {/* Right Area: Lifeform, Character Class, Officers, Utility Modals, Settings */}
      <div className="flex items-center gap-2">
        {/* Canlı Türü İkonu */}
        <HeaderSpeciesWidget />

        {/* Karakter Sınıfı İkonu */}
        <HeaderClassWidget />

        {/* Subay Portreleri (5'li Mini Bar) */}
        <MiniOfficersBar />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Notlar Modalı Butonu */}
        <button
          type="button"
          onClick={() => setIsNotesOpen(true)}
          title="Kişisel Notlar"
          aria-label="Notlar"
          className="h-8 w-8 rounded-lg border border-zinc-700/80 bg-[#0c1422] hover:bg-[#132034] hover:border-amber-400 text-zinc-300 hover:text-amber-300 flex items-center justify-center transition shadow-md shrink-0 cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5 text-amber-400" />
        </button>

        {/* Arkadaşlar Modalı Butonu */}
        <button
          type="button"
          onClick={() => setIsBuddiesOpen(true)}
          title="Arkadaşlar & İletişim"
          aria-label="Arkadaşlar"
          className="h-8 w-8 rounded-lg border border-zinc-700/80 bg-[#0c1422] hover:bg-[#132034] hover:border-cyan-400 text-zinc-300 hover:text-cyan-300 flex items-center justify-center transition shadow-md shrink-0 cursor-pointer"
        >
          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
        </button>

        {/* Evrensel Ara Modalı Butonu */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          title="Evrensel Arama (Oyuncu, İttifak, Gezegen)"
          aria-label="Ara"
          className="h-8 w-8 rounded-lg border border-zinc-700/80 bg-[#0c1422] hover:bg-[#132034] hover:border-cyan-400 text-zinc-300 hover:text-cyan-300 flex items-center justify-center transition shadow-md shrink-0 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-zinc-300" />
        </button>

        {/* Settings (Dişli İkonu) */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title="Oyun & Sistem Ayarları"
          aria-label="Ayarlar"
          className="h-8 w-8 rounded-lg border border-cyan-500/30 bg-[#0c1422] hover:bg-[#132034] hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition shadow-md shrink-0 cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SubHeaderBar;

