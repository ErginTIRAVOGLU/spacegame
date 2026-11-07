/**
 * LifeformTechTree.tsx
 *
 * Implements the 3-Tier Lifeform Technology Evolution Tree with:
 * - Tier 1 (Slots 1-6), Tier 2 (Slots 7-12), Tier 3 (Slots 13-18)
 * - Free Reset (with cooldown based on active slots)
 * - Dark Matter Instant Reset (0s cooldown)
 * - Tier Pause Indicator (if lower tier doesn't have all 6 slots filled)
 * - 60-Minute "Geri Yükle (Restore)" button with live countdown timer
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  type LifeformTechItemMeta,
  getTechForSlot,
} from '@/lib/lifeformsCatalog';
import { useLifeformStore } from '@/store/useLifeformStore';
import {
  FlaskConical,
  Lock,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface LifeformTechTreeProps {
  planetId: string;
  activeSpecies?: string;
  currentPopulation?: number;
  researchCentreLevel?: number;
  onSelectTech?: (tech: LifeformTechItemMeta) => void;
  selectedSlot?: number;
}

export function LifeformTechTree({
  planetId,
  activeSpecies = 'humans',
  currentPopulation = 200_000,
  researchCentreLevel = 1,
  onSelectTech,
  selectedSlot = 1,
}: LifeformTechTreeProps) {
  const planetData = useLifeformStore((s) => s.getPlanetData(planetId));
  const isTierPaused = useLifeformStore((s) => s.isTierPaused);
  const freeResetTier = useLifeformStore((s) => s.freeResetTier);
  const dmResetTier = useLifeformStore((s) => s.dmResetTier);
  const restoreTier = useLifeformStore((s) => s.restoreTier);

  const [now, setNow] = useState<number>(Date.now());

  // 1-second interval for smooth countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSeconds = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderTierBlock = (tier: 1 | 2 | 3, title: string, subtitle: string) => {
    const minSlot = (tier - 1) * 6 + 1;
    const maxSlot = tier * 6;
    const isPaused = isTierPaused(planetId, tier);

    const cooldownUntil = planetData.freeResetCooldownUntil[tier] ?? 0;
    const freeCooldownSecs = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

    const restoreSnapshot = planetData.tierRestoreSnapshots[tier];
    const restoreExpiresAt = restoreSnapshot?.restoreExpiresAt ?? 0;
    const restoreRemainingSecs = Math.max(0, Math.ceil((restoreExpiresAt - now) / 1000));
    const canRestore = restoreRemainingSecs > 0;

    const slotsArray = Array.from({ length: 6 }, (_, i) => minSlot + i);

    return (
      <div
        key={tier}
        className={`rounded-lg border bg-[#090d14]/95 overflow-hidden flex flex-col transition-all ${
          isPaused
            ? 'border-amber-600/50 opacity-90'
            : 'border-zinc-800/90'
        }`}
      >
        {/* Tier Header */}
        <div className="px-4 py-3 bg-[#121a26] border-b border-zinc-800 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
              {title}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-cyan-400" />
              <span>{subtitle}</span>
            </div>
          </div>

          {isPaused ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 border border-amber-500/60 text-amber-300 flex items-center gap-1 shrink-0">
              <AlertTriangle className="h-3 w-3" />
              <span>Duraklatıldı</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              <span>Aktif</span>
            </span>
          )}
        </div>

        {/* Tier Pause Warning Banner */}
        {isPaused && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Bu kademedeki teknolojilerin bonusları geçici olarak duraklatıldı.
              Alt kademedeki 6 yuvanın tamamı seçildiğinde yeniden aktifleşir.
            </span>
          </div>
        )}

        {/* 6 Tech Slots Grid */}
        <div className="p-3 space-y-2.5 flex-1">
          {slotsArray.map((slot) => {
            const techMeta = getTechForSlot(slot, activeSpecies);
            const slotData = planetData.slots[slot];
            const isUnlocked =
              researchCentreLevel > 0 &&
              currentPopulation >= techMeta.requiredPopulation;
            const level = slotData?.level ?? 0;
            const isSelected = selectedSlot === slot;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectTech?.(techMeta)}
                className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-amber-400 ring-1 ring-amber-400/50 bg-[#141d2b]'
                    : isUnlocked
                    ? 'border-purple-500/40 bg-[#0d1420] hover:border-cyan-400/50'
                    : 'border-zinc-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-9 w-9 rounded flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <FlaskConical className="h-4 w-4" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-amber-400/80" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {techMeta.name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      Slot {slot} • Nüfus: {techMeta.requiredPopulation.toLocaleString()}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border shrink-0 ${
                    isUnlocked
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Sv.{level}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier Controls Footer (Reset & 60-Minute Restore) */}
        <div className="p-3 bg-[#0c121d] border-t border-zinc-800 space-y-2">
          {/* 60-Minute Restore Button if available */}
          {canRestore && (
            <button
              type="button"
              onClick={() => restoreTier(planetId, tier)}
              className="w-full py-2 px-3 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-xs font-bold text-emerald-200 flex items-center justify-center gap-2 shadow transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Geri Yükle (Kalan: {formatSeconds(restoreRemainingSecs)})
              </span>
            </button>
          )}

          {/* Reset Buttons Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Free Reset */}
            <button
              type="button"
              disabled={freeCooldownSecs > 0}
              onClick={() => freeResetTier(planetId, tier)}
              className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 transition ${
                freeCooldownSecs > 0
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 font-semibold'
              }`}
            >
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>
                {freeCooldownSecs > 0
                  ? `Bekleme: ${formatSeconds(freeCooldownSecs)}`
                  : 'Ücretsiz Sıfırla'}
              </span>
            </button>

            {/* Dark Matter Reset */}
            <button
              type="button"
              onClick={() => dmResetTier(planetId, tier)}
              className="py-1.5 px-2 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-200 font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>DM Sıfırla</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {renderTierBlock(1, 'Seviye 1 Araştırma (Nüfus 210)', 'Slot 1 - 6 • Temel Canlı Türü Teknolojileri')}
      {renderTierBlock(2, 'Seviye 2 Araştırma', 'Slot 7 - 12 • Gelişmiş Endüstri & Filo')}
      {renderTierBlock(3, 'Seviye 3 Araştırma', 'Slot 13 - 18 • Metropol Hiper-Teknolojileri')}
    </div>
  );
}

