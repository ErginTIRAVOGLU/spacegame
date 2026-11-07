'use client';

import React from 'react';
import { COMMAND_STAFF_DEF } from '@/lib/officersCatalog';
import { ShieldCheck, Check, Sparkles, Star } from 'lucide-react';

interface CommandStaffCardProps {
  activeCount: number;
  userDarkMatter: number;
  onHireStaff: (duration: 'week' | 'month') => void;
  onOpenTopUp: () => void;
  isHiring: boolean;
}

export function CommandStaffCard({
  activeCount,
  userDarkMatter,
  onHireStaff,
  onOpenTopUp,
  isHiring
}: CommandStaffCardProps) {
  const isAllActive = activeCount >= 5;

  const handleHire = (duration: 'week' | 'month', cost: number) => {
    if (userDarkMatter < cost) {
      onOpenTopUp();
    } else {
      onHireStaff(duration);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/80 to-blue-950/30 border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-100">{COMMAND_STAFF_DEF.name}</h2>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                Özel Set Bonusu
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{COMMAND_STAFF_DEF.subtitle}</p>
          </div>
        </div>

        {/* Active Progress Badge */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
              Aktif Subay Durumu
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-base font-mono font-bold ${isAllActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {activeCount} / 5
              </span>
              <span className="text-xs text-zinc-400">aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Komuta Heyeti paketini kiraladığınızda tüm 5 kıdemli subay (Commander, Amiral, Mühendis, Jeolog ve Teknokrat)
            aynı anda görevlendirilir ve tek tek kiralamaya kıyasla <strong>%15 tasarruf</strong> sağlarsınız.
          </p>
          <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-300">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              Tüm heyet aktif olduğunda <strong>+1 Filo Slotu</strong>, <strong>+%2 Enerji</strong>, <strong>+%2 Maden</strong> ve <strong>+1 Casusluk</strong> ek set avantajı kazanırsınız.
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
            Komuta Heyeti Set Avantajları
          </h3>
          <ul className="space-y-2">
            {COMMAND_STAFF_DEF.bonuses.map((bonus, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>{bonus}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          disabled={isHiring}
          onClick={() => handleHire('week', COMMAND_STAFF_DEF.weeklyPrice)}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>Tüm Heyeti 1 Hafta Kirala:</span>
          <span className="font-mono text-amber-100 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-400/40">
            {COMMAND_STAFF_DEF.weeklyPrice.toLocaleString()} KM
          </span>
        </button>

        <button
          disabled={isHiring}
          onClick={() => handleHire('month', COMMAND_STAFF_DEF.monthlyPrice)}
          className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold tracking-wide uppercase border border-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>Tüm Heyeti 3 Ay Kirala:</span>
          <span className="font-mono text-amber-300 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-700">
            {COMMAND_STAFF_DEF.monthlyPrice.toLocaleString()} KM
          </span>
        </button>
      </div>
    </div>
  );
}

