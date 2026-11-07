"use client";

import Link from "next/link";
import {
  Globe2,
  Flag,
  Dna,
  RefreshCw,
  Eye,
  MessageSquare,
  UserPlus,
  Rocket,
  Star,
  Radar,
} from "lucide-react";

export interface GalaxyRowActionsProps {
  slot: number;
  hasPlanet: boolean;
  isSelf: boolean;
  isDestroyedPlanet?: boolean;
  playerId?: string | null;
  playerName?: string | null;
  isWeakProtected?: boolean;
  probeCount: number;
  isSpying?: boolean;
  colonyShipCount?: number;
  colonizedCount?: number;
  maxColonizedCount?: number;
  galaxy: number;
  system: number;
  hasIntergalacticEnvoys: boolean;
  isLifeformDiscoveryFocused?: boolean;
  onQuickSpy: (slot: number) => void;
  onOpenMessage: (playerId: string, playerName: string) => void;
  onAddFriend: (playerId: string, playerName: string) => void;
  onOpenMissileModal: (slot: number, planetName?: string) => void;
  onDispatchLifeformDiscovery: (slot: number) => void;
  onOpenRelocateModal: (slot: number) => void;
  onOpenPhalanxModal?: (slot: number) => void;
  isSlotBookmarked?: boolean;
  isCommanderActive?: boolean;
  onToggleFavorite?: (slot: number, planetName?: string | null) => void;
}

export function GalaxyRowActions({
  slot,
  hasPlanet,
  isSelf,
  isDestroyedPlanet,
  playerId,
  playerName,
  isWeakProtected = false,
  probeCount,
  isSpying = false,
  colonyShipCount = 0,
  colonizedCount = 1,
  maxColonizedCount = 1,
  galaxy,
  system,
  hasIntergalacticEnvoys,
  isLifeformDiscoveryFocused = false,
  onQuickSpy,
  onOpenMessage,
  onAddFriend,
  onOpenMissileModal,
  onDispatchLifeformDiscovery,
  onOpenRelocateModal,
  onOpenPhalanxModal,
  isSlotBookmarked,
  isCommanderActive,
  onToggleFavorite,
}: GalaxyRowActionsProps) {
  // 1. SELF-OWNED PLANET
  if (isSelf) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        {/* Only dim/passive Colonize icon on self-owned planets */}
        <button
          type="button"
          disabled
          title="Kendi Gezegeniniz (Sömürgeleştirilemez)"
          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-600 opacity-30 cursor-not-allowed select-none"
        >
          <div className="relative flex items-center justify-center">
            <Globe2 className="h-3.5 w-3.5" />
            <Flag className="h-2 w-2 absolute -top-1 -right-1 text-zinc-500" />
          </div>
        </button>

        {/* Favorite Bookmark */}
        {onToggleFavorite && (
          <FavoriteButton
            slot={slot}
            planetName={playerName}
            isSlotBookmarked={isSlotBookmarked}
            isCommanderActive={isCommanderActive}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    );
  }

  // 2. OCCUPIED OTHER PLAYER SLOT
  if (hasPlanet && !isSelf) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        {/* EspionageEyeIcon */}
        <button
          type="button"
          disabled={isWeakProtected || probeCount <= 0 || isSpying}
          onClick={() => onQuickSpy(slot)}
          title={isWeakProtected ? "Casusluk olanağı yok" : "Casusluk"}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isWeakProtected || probeCount <= 0
              ? "border-zinc-800 bg-zinc-900/50 text-zinc-600 opacity-40 cursor-not-allowed"
              : "border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {/* MessageChatIcon */}
        <button
          type="button"
          onClick={() => onOpenMessage(playerId ?? "", playerName ?? "")}
          title="Mesaj yaz"
          className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>

        {/* FriendRequestIcon */}
        <button
          type="button"
          onClick={() => onAddFriend(playerId ?? "", playerName ?? "")}
          title="Arkadaşlık isteği"
          className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-colors cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
        </button>

        {/* MissileAttackIcon */}
        <button
          type="button"
          onClick={() => onOpenMissileModal(slot, playerName ?? undefined)}
          title="Roket saldırısı"
          className="p-1.5 rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
        >
          <Rocket className="h-3.5 w-3.5" />
        </button>

        {/* SensorPhalanxScanIcon */}
        {onOpenPhalanxModal && (
          <button
            type="button"
            onClick={() => onOpenPhalanxModal(slot)}
            title="Sensör Falanksı Taraması (5.000 Deuterium)"
            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition-colors cursor-pointer"
          >
            <Radar className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Favorite Bookmark */}
        {onToggleFavorite && (
          <FavoriteButton
            slot={slot}
            planetName={playerName}
            isSlotBookmarked={isSlotBookmarked}
            isCommanderActive={isCommanderActive}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    );
  }

  // 3. DESTROYED PLANET
  if (isDestroyedPlanet) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-zinc-600 italic select-none">
          Kalıntılar
        </span>
      </div>
    );
  }

  // 4. EMPTY SLOTS (1 - 15)
  const colonizeTooltip =
    "Sömürgeleştir - Güneş sisteminin bu konumunda genellikle en büyük gezegenler bulunmaktadır. Güneş yeterince enerji sağlar ve bu deuterium kaynağı beklenilen seviyededir. (Bir gezegeni koloni gemisi olmadan kolonileştiremezsiniz.)";

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* ColonizeIcon */}
      <Link
        href={`/fleet?targetGalaxy=${galaxy}&targetSystem=${system}&targetSlot=${slot}&mission=7`}
        title={colonizeTooltip}
        className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-950/30 hover:bg-teal-900/50 text-teal-300 hover:text-teal-200 transition-colors cursor-pointer relative group flex items-center justify-center"
      >
        <Globe2 className="h-3.5 w-3.5" />
        <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5 text-emerald-400 group-hover:scale-110 transition-transform" />
      </Link>

      {/* LifeformDnaIcon */}
      <button
        type="button"
        id={isLifeformDiscoveryFocused ? "card-lifeform-discover" : undefined}
        data-focus="lifeform-discover"
        disabled={!hasIntergalacticEnvoys}
        onClick={() => onDispatchLifeformDiscovery(slot)}
        title={
          hasIntergalacticEnvoys
            ? "Canlı Türü Keşif Görevi Başlat"
            : "Yeni canlı türlerini keşfetmek için gereken araştırma henüz onaylanmadı."
        }
        className={`p-1.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex items-center justify-center ${
          !hasIntergalacticEnvoys
            ? "border-zinc-800 bg-zinc-900/50 text-zinc-600 opacity-50 cursor-not-allowed"
            : isLifeformDiscoveryFocused
            ? "border-cyan-400 bg-cyan-900/70 text-cyan-200 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse"
            : "border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 hover:border-purple-400 shadow-sm"
        }`}
      >
        <Dna className="h-3.5 w-3.5" />

        {/* Diagonal red line across icon when research is incomplete */}
        {!hasIntergalacticEnvoys && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[140%] h-[1.5px] bg-rose-500/90 rotate-45 transform origin-center shadow-[0_0_2px_rgba(244,63,94,0.8)]" />
          </div>
        )}
      </button>

      {/* RelocateIcon */}
      <button
        type="button"
        onClick={() => onOpenRelocateModal(slot)}
        title="İskân et"
        className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>

      {/* Favorite Bookmark */}
      {onToggleFavorite && (
        <FavoriteButton
          slot={slot}
          planetName={playerName}
          isSlotBookmarked={isSlotBookmarked}
          isCommanderActive={isCommanderActive}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}

function FavoriteButton({
  slot,
  planetName,
  isSlotBookmarked,
  isCommanderActive,
  onToggleFavorite,
}: {
  slot: number;
  planetName?: string | null;
  isSlotBookmarked?: boolean;
  isCommanderActive?: boolean;
  onToggleFavorite: (slot: number, planetName?: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggleFavorite(slot, planetName)}
      title={
        isSlotBookmarked
          ? "Favorilerden Çıkar"
          : isCommanderActive
          ? "Favorilere Ekle (Commander)"
          : "Commander ile Favorilere Ekle"
      }
      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
        isSlotBookmarked
          ? "border-amber-500/50 bg-amber-950/40 text-amber-300"
          : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-500 hover:text-amber-400"
      }`}
    >
      <Star
        className={`h-3.5 w-3.5 ${
          isSlotBookmarked ? "fill-amber-400 text-amber-400" : ""
        }`}
      />
    </button>
  );
}

