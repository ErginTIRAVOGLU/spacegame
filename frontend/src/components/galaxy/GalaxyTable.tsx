"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type GalaxySlot,
  getPlanetBiome,
  parsePlayerStatus,
  formatDebrisTotal,
} from "@/lib/galaxyCatalog";
import { PlayerProfilePopover } from "@/components/galaxy/PlayerProfilePopover";
import { GalaxyRowActions } from "@/components/galaxy/GalaxyRowActions";
import {
  Globe2,
  Sparkles,
  Recycle,
  CircleDot,
  Flame,
  Snowflake,
  Trees,
  Waves,
} from "lucide-react";

interface GalaxyTableProps {
  galaxy: number;
  system: number;
  slots: GalaxySlot[];
  probeCount: number;
  ipmCount: number;
  colonyShipCount?: number;
  colonizedCount?: number;
  maxColonizedCount?: number;
  currentUserId?: string | null;
  onQuickSpy: (slot: number) => void;
  onOpenMessage: (playerId: string, playerName: string) => void;
  onAddFriend: (playerId: string, playerName: string) => void;
  onBlockUser: (playerId: string, playerName: string) => void;
  onShowProfile: (playerId: string, playerName: string) => void;
  onOpenMissileModal: (slot: number, planetName?: string) => void;
  onHarvestDebris: (slot: number) => void;
  isSpyingSlot?: number | null;
  isCommanderActive?: boolean;
  isSlotBookmarked?: (slot: number) => boolean;
  onToggleFavorite?: (slot: number, planetName?: string | null) => void;
  hasIntergalacticEnvoys?: boolean;
  isLifeformDiscoveryFocused?: boolean;
  onDispatchLifeformDiscovery: (slot: number) => void;
  onOpenRelocateModal: (slot: number) => void;
  onOpenPhalanxModal?: (slot: number) => void;
}

export function GalaxyTable({
  galaxy,
  system,
  slots,
  probeCount,
  ipmCount,
  colonyShipCount = 0,
  colonizedCount = 1,
  maxColonizedCount = 1,
  currentUserId,
  onQuickSpy,
  onOpenMessage,
  onAddFriend,
  onBlockUser,
  onShowProfile,
  onOpenMissileModal,
  onHarvestDebris,
  isSpyingSlot,
  isCommanderActive,
  isSlotBookmarked,
  onToggleFavorite,
  hasIntergalacticEnvoys = false,
  isLifeformDiscoveryFocused = false,
  onDispatchLifeformDiscovery,
  onOpenRelocateModal,
  onOpenPhalanxModal,
}: GalaxyTableProps) {
  // 1 to 15 slots array guaranteed
  const filledSlots: GalaxySlot[] = Array.from({ length: 15 }, (_, i) => {
    const slotNum = i + 1;
    const existing = slots.find((s) => s.slot === slotNum);
    return (
      existing ?? {
        slot: slotNum,
        planetId: null,
        planetName: null,
        playerId: null,
        playerName: null,
        allianceTag: null,
        hasMoon: false,
        debrisField: null,
        activity: null,
        playerStatusFlags: [],
      }
    );
  });

  const renderPlanetIcon = (slot: number) => {
    const biome = getPlanetBiome(slot);
    switch (biome) {
      case "desert":
        return <Flame className="h-4 w-4 text-amber-500" />;
      case "jungle":
        return <Trees className="h-4 w-4 text-emerald-400" />;
      case "ocean":
        return <Waves className="h-4 w-4 text-cyan-400" />;
      case "ice":
        return <Snowflake className="h-4 w-4 text-sky-300" />;
      case "gas":
      default:
        return <Globe2 className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0d1017] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-[#090d14] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-3 w-16 text-center">Gezegen</th>
              <th className="py-3 px-4 min-w-[160px]">İsim</th>
              <th className="py-3 px-3 w-14 text-center">Ay</th>
              <th className="py-3 px-4 min-w-[140px]">HA (Enkaz)</th>
              <th className="py-3 px-4 min-w-[180px]">Oyuncu (Statü)</th>
              <th className="py-3 px-3 min-w-[100px]">İttifak</th>
              <th className="py-3 px-4 min-w-[180px] text-right">Aksiyon</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-800/60">
            {filledSlots.map((row) => {
              const hasPlanet = !!row.planetName && !row.isDestroyedPlanet;
              const isSelf = currentUserId && row.playerId === currentUserId;
              const status = parsePlayerStatus(row.playerStatusFlags ?? []);
              const hasDebris =
                row.debrisField &&
                (row.debrisField.metal > 0 || row.debrisField.crystal > 0);

              return (
                <tr
                  key={row.slot}
                  className={`transition-colors ${
                    isSelf
                      ? "bg-cyan-950/20 hover:bg-cyan-950/30"
                      : hasPlanet
                      ? "hover:bg-zinc-900/60"
                      : "hover:bg-zinc-900/30 opacity-70"
                  }`}
                >
                  {/* Slot Number & Planet Biome Icon */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-bold">
                      <span className="text-zinc-500">{row.slot}</span>
                      {hasPlanet && renderPlanetIcon(row.slot)}
                    </div>
                  </td>

                  {/* Planet Name & Activity Indicator */}
                  <td className="py-3 px-4">
                    {hasPlanet ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-100">
                          {row.planetName}
                        </span>

                        {/* Activity Indicator (*) or (24m) */}
                        {row.activity && (
                          <span
                            title="Son gezegen etkinliği"
                            className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] animate-pulse"
                          >
                            {row.activity}
                          </span>
                        )}
                      </div>
                    ) : row.isDestroyedPlanet ? (
                      <span className="text-zinc-500 italic">
                        Yok Edilmiş Gezegen
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">
                        &mdash; Boş Yörünge &mdash;
                      </span>
                    )}
                  </td>

                  {/* Moon (Ay) */}
                  <td className="py-3 px-3 text-center">
                    {row.hasMoon ? (
                      <div
                        title={`Ay • Çap: ${row.moonDiameter ?? 8400} km`}
                        className="inline-flex items-center justify-center p-1 rounded-full bg-slate-800 border border-slate-600 text-slate-200 hover:text-amber-300 cursor-pointer transition-colors"
                      >
                        <CircleDot className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <span className="text-zinc-700">&mdash;</span>
                    )}
                  </td>

                  {/* Debris Field (HA) */}
                  <td className="py-3 px-4">
                    {hasDebris ? (
                      <button
                        type="button"
                        onClick={() => onHarvestDebris(row.slot)}
                        title={`Enkazı Topla: ${formatDebrisTotal(row.debrisField)}`}
                        className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 hover:underline cursor-pointer group"
                      >
                        <Recycle className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
                        <span className="text-[11px]">
                          {formatDebrisTotal(row.debrisField)}
                        </span>
                      </button>
                    ) : (
                      <span className="text-zinc-700">&mdash;</span>
                    )}
                  </td>

                  {/* Player Name & Status */}
                  <td className="py-3 px-4">
                    {hasPlanet && row.playerName ? (
                      <PlayerProfilePopover
                        playerId={row.playerId ?? ""}
                        playerName={row.playerName}
                        playerPoints={row.playerPoints}
                        allianceTag={row.allianceTag}
                        statusBadge={status.badgeText}
                        onSendMessage={onOpenMessage}
                        onAddFriend={onAddFriend}
                        onBlockUser={onBlockUser}
                        onShowProfile={onShowProfile}
                      >
                        <button
                          type="button"
                          className={`font-semibold text-left transition-colors cursor-pointer flex items-center gap-1.5 ${status.colorClass}`}
                        >
                          <span>{row.playerName}</span>
                          {status.badgeText && (
                            <span className="text-[11px] font-bold">
                              {status.badgeText}
                            </span>
                          )}
                        </button>
                      </PlayerProfilePopover>
                    ) : (
                      <span className="text-zinc-700">&mdash;</span>
                    )}
                  </td>

                  {/* Alliance Tag */}
                  <td className="py-3 px-3">
                    {row.allianceTag ? (
                      <Link
                        href={`/alliance?tag=${encodeURIComponent(row.allianceTag)}`}
                        className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                      >
                        [{row.allianceTag}]
                      </Link>
                    ) : (
                      <span className="text-zinc-700">&mdash;</span>
                    )}
                  </td>

                  {/* Quick Action Bar (Aksiyon Sütunu) */}
                  <td className="py-3 px-4 text-right">
                    <GalaxyRowActions
                      slot={row.slot}
                      hasPlanet={hasPlanet}
                      isSelf={!!isSelf}
                      isDestroyedPlanet={row.isDestroyedPlanet}
                      playerId={row.playerId}
                      playerName={row.playerName}
                      isWeakProtected={status.isNoob}
                      probeCount={probeCount}
                      isSpying={isSpyingSlot === row.slot}
                      colonyShipCount={colonyShipCount}
                      colonizedCount={colonizedCount}
                      maxColonizedCount={maxColonizedCount}
                      galaxy={galaxy}
                      system={system}
                      hasIntergalacticEnvoys={hasIntergalacticEnvoys}
                      isLifeformDiscoveryFocused={isLifeformDiscoveryFocused}
                      onQuickSpy={onQuickSpy}
                      onOpenMessage={onOpenMessage}
                      onAddFriend={onAddFriend}
                      onOpenMissileModal={onOpenMissileModal}
                      onDispatchLifeformDiscovery={onDispatchLifeformDiscovery}
                      onOpenRelocateModal={onOpenRelocateModal}
                      onOpenPhalanxModal={onOpenPhalanxModal}
                      isSlotBookmarked={isSlotBookmarked?.(row.slot)}
                      isCommanderActive={isCommanderActive}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

