'use client';

import React from 'react';
import { Award, Trophy, Star, Sparkles, ShieldCheck } from 'lucide-react';

export function OGameTab() {
  const achievements = [
    {
      id: 'ach-1',
      sender: 'Filo Kumandanı',
      title: '#3 - Daha Yükseğe',
      description: 'Bir gezegen veya aydaki herhangi bir binayı 20 kez genişlet.',
      rewardPoints: 100,
      rewardTitle: 'Parti Mekânı Patronu',
      rewardAvatar: 'Avatar #12 - Başmimar',
      unlockedAt: 'Dün, 18:42'
    },
    {
      id: 'ach-2',
      sender: 'Stratejik İstihbarat Dairesi',
      title: '#14 - Galaktik Gözcü',
      description: 'Farklı güneş sistemlerinde en az 50 başarılı casusluk taraması gerçekleştir.',
      rewardPoints: 250,
      rewardTitle: 'Gölge Avcısı',
      rewardAvatar: 'Avatar #04 - Keşif Subayı',
      unlockedAt: '3 gün önce'
    },
    {
      id: 'ach-3',
      sender: 'Yüksek Madencilik Loncası',
      title: '#22 - Cevher Baroğu',
      description: 'Tek bir gezegende saatlik metal üretimini 50.000 birimin üzerine çıkar.',
      rewardPoints: 300,
      rewardTitle: 'Maden Baronu',
      rewardAvatar: 'Avatar #09 - Jeoloji Ustası',
      unlockedAt: '1 hafta önce'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Başarılar, Ünvanlar & Avatarlar
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Galaksideki askeri, ekonomik ve bilimsel başarılarınız neticesinde kazandığınız kademeler ve ödüller.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">650 Başarı Puanı</span>
        </div>
      </div>

      <div className="grid gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="p-5 bg-gradient-to-r from-zinc-900/80 via-zinc-900/60 to-amber-950/20 border border-zinc-800/80 hover:border-amber-500/40 rounded-xl shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                  BAŞARININ KİLİDİ AÇILDI!
                </span>
                <span className="text-zinc-400">Gönderen: <strong className="text-zinc-200">{ach.sender}</strong></span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">{ach.unlockedAt}</span>
            </div>

            <div>
              <h3 className="font-bold text-zinc-100 text-sm">{ach.title}</h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{ach.description}</p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Kazanılan Ödüller:
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                +{ach.rewardPoints} Puan
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-cyan-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ünvan: {ach.rewardTitle}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-purple-300 text-xs font-medium">
                <Award className="w-3.5 h-3.5" />
                {ach.rewardAvatar}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

