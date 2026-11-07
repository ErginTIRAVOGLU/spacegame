'use client';

import React from 'react';
import { OfficerDef, OfficerStatusDto } from '@/lib/officersCatalog';
import { Check, X, Sparkles, Clock, Crown } from 'lucide-react';

interface OfficerDetailCardProps {
  officer: OfficerDef;
  status?: OfficerStatusDto;
  userDarkMatter: number;
  onHire: (officerKey: string, duration: 'week' | 'month') => void;
  onOpenTopUp: () => void;
  isHiring: boolean;
}

export function OfficerDetailCard({
  officer,
  status,
  userDarkMatter,
  onHire,
  onOpenTopUp,
  isHiring
}: OfficerDetailCardProps) {
  const isActive = status?.isActive || false;
  const remainingSeconds = status?.remainingSeconds || 0;

  const formatTime = (secs: number) => {
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (days > 0) return `${days}g ${hours}s ${mins}d`;
    if (hours > 0) return `${hours}s ${mins}d`;
    return `${mins}d ${secs % 60}sn`;
  };

  const handleHireClick = (duration: 'week' | 'month', cost: number) => {
    if (userDarkMatter < cost) {
      onOpenTopUp();
    } else {
      onHire(officer.key, duration);
    }
  };

  return (
    <div
      id="officer-inspector-card"
      className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6"
    >
      {/* Top Banner Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${officer.themeColor} flex items-center justify-center border shadow-lg`}>
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-100">{officer.name}</h2>
              {officer.isAccountCurrency ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-950/80 border border-purple-700 text-purple-300">
                  Hesap Para Birimi
                </span>
              ) : isActive ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Aktif ({formatTime(remainingSeconds)})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Pasif
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{officer.subtitle}</p>
          </div>
        </div>

        {/* Status countdown box */}
        {!officer.isAccountCurrency && isActive && (
          <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Kalan Görev Süresi
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Description & Lore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Genel Açıklama
            </h3>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {officer.description}
            </p>
          </div>

          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Galaktik Arşiv Notu
            </h4>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              &quot;{officer.lore}&quot;
            </p>
          </div>
        </div>

        {/* Perks Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Sağlanan İmparatorluk Avantajları
          </h3>
          <ul className="space-y-2.5">
            {officer.perks.map((perk, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-300"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Purchase Pricing Actions */}
      {!officer.isAccountCurrency && (
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            disabled={isHiring}
            onClick={() => handleHireClick('week', officer.weeklyPrice)}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>1 Hafta için gereken:</span>
            <span className="font-mono text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/50">
              {officer.weeklyPrice.toLocaleString()} KM
            </span>
          </button>

          <button
            disabled={isHiring}
            onClick={() => handleHireClick('month', officer.monthlyPrice)}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold tracking-wide uppercase border border-zinc-700/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>3 Ay (90 Gün) için gereken:</span>
            <span className="font-mono text-amber-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              {officer.monthlyPrice.toLocaleString()} KM
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

