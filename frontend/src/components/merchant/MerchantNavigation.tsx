"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  Coins,
  Scale,
  Gavel,
  Recycle,
  PackageSearch,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ROOMS = [
  {
    title: "Ham Madde Pazarı",
    href: "/merchant/resources",
    icon: Scale,
    badge: "3:2:1 Takas",
  },
  {
    title: "Müzayedeci",
    href: "/merchant/auction",
    icon: Gavel,
    badge: "Canlı Açık Artırma",
  },
  {
    title: "Hurdacı",
    href: "/merchant/scrapper",
    icon: Recycle,
    badge: "Filo Geri Dönüşüm",
  },
  {
    title: "İthalat / İhracat",
    href: "/merchant/import-export",
    icon: PackageSearch,
    badge: "Günün Ürünü",
  },
];

export function MerchantNavigation({ currentRoomTitle }: { currentRoomTitle?: string }) {
  const pathname = usePathname();
  const darkMatter = useGameStore((s) => s.darkMatter);

  const currentIndex = ROOMS.findIndex((r) => r.href === pathname);
  const prevRoom =
    currentIndex > 0
      ? ROOMS[currentIndex - 1]
      : ROOMS[ROOMS.length - 1];
  const nextRoom =
    currentIndex >= 0 && currentIndex < ROOMS.length - 1
      ? ROOMS[currentIndex + 1]
      : ROOMS[0];

  return (
    <div className="space-y-3">
      {/* Top Header Row with Breadcrumbs, Dark Matter, and Next/Prev Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0f18]/90 border border-zinc-800/80 rounded-lg p-3.5">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link
            href="/merchant"
            className="text-zinc-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
          >
            <Coins className="h-4 w-4 text-amber-400" />
            <span>Tüccar Merkezi</span>
          </Link>
          {currentRoomTitle && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-cyan-300 font-semibold">
                {currentRoomTitle}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Room Cycler Arrows */}
          <div className="flex items-center gap-1">
            <Link
              href={prevRoom.href}
              title={`Önceki Oda: ${prevRoom.title}`}
              className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-200 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={nextRoom.href}
              title={`Sonraki Oda: ${nextRoom.title}`}
              className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-200 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Dark Matter Badge */}
          <div className="px-3 py-1 rounded bg-purple-950/40 border border-purple-500/40 text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>{darkMatter.toLocaleString("en-US")} KM</span>
          </div>
        </div>
      </div>

      {/* 4 Room Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ROOMS.map((room) => {
          const Icon = room.icon;
          const isActive = pathname === room.href;
          return (
            <Link
              key={room.href}
              href={room.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-950/80 via-[#122336] to-[#0c1825] border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                  : "bg-[#0b1019]/90 hover:bg-[#111926] border-zinc-800/90 text-zinc-300 hover:text-cyan-300"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-cyan-400" : "text-zinc-500"
                  }`}
                />
                <span className="truncate">{room.title}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                {room.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

