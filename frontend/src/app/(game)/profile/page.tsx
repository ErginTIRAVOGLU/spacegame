/**
 * ProfilePage.tsx - /profile
 *
 * Player Profile, Achievements & Cosmetics Page:
 * - Genel Bakış: Oyuncu istatistik özeti, aktif Karakter Sınıfı amblemi, aktif Unvan ve seçili Avatar
 * - Başarımlar: Kategori bazlı ilerleme çubukları (İnşaat, Araştırma, Savaş, Keşif, Özel) ve toplam Başarım Puanı
 * - Avatarlar & Unvanlar: Açılan kozmetikleri kuşanma ve önizleme ekranı
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/useGameStore';
import {
  User,
  Shield,
  Award,
  Crown,
  Trophy,
  Pickaxe,
  FlaskConical,
  Swords,
  Compass,
  Sparkles,
  Check,
  Lock,
  Edit2,
  Orbit,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface AchievementItem {
  id: string;
  category: 'construction' | 'research' | 'combat' | 'expedition' | 'special';
  title: string;
  description: string;
  points: number;
  current: number;
  max: number;
  isUnlocked: boolean;
}

const ACHIEVEMENTS: AchievementItem[] = [
  // Construction
  { id: 'c1', category: 'construction', title: 'İlk Adım', description: 'Metal Madenini 10. seviyeye yükselt.', points: 50, current: 10, max: 10, isUnlocked: true },
  { id: 'c2', category: 'construction', title: 'Ağır Sanayi', description: 'Nanit Fabrikasını 3. seviyeye yükselt.', points: 150, current: 2, max: 3, isUnlocked: false },
  { id: 'c3', category: 'construction', title: 'Metropol Kurucusu', description: 'En az 5 gezegende Canlı Türü Metropol binasını faaliyete geçir.', points: 200, current: 3, max: 5, isUnlocked: false },

  // Research
  { id: 'r1', category: 'research', title: 'Bilim Aşığı', description: 'Astrofizik araştırmasını 9. seviyeye yükselt.', points: 100, current: 9, max: 9, isUnlocked: true },
  { id: 'r2', category: 'research', title: 'Hiper Sürüş Çağı', description: 'Hiperuzay Motoru araştırmasını 10. seviyeye yükselt.', points: 150, current: 8, max: 10, isUnlocked: false },
  { id: 'r3', category: 'research', title: 'Yerçekimi Kontrolü', description: 'Graviton Araştırmasını tamamla.', points: 300, current: 1, max: 1, isUnlocked: true },

  // Combat
  { id: 'b1', category: 'combat', title: 'Yıldız Lordu', description: 'Toplam 500 Onur Puanı kazan.', points: 150, current: 500, max: 500, isUnlocked: true },
  { id: 'b2', category: 'combat', title: 'Filo Kıran', description: 'Savaşlarda toplam 10.000.000 hammadde değerinde düşman filosu yok et.', points: 250, current: 6500000, max: 10000000, isUnlocked: false },
  { id: 'b3', category: 'combat', title: 'Harabe Süpürücü', description: 'Reaper veya Recycler ile 1.000.000 harabe topla.', points: 100, current: 1000000, max: 1000000, isUnlocked: true },

  // Expedition
  { id: 'e1', category: 'expedition', title: 'Derin Uzay Kaşifi', description: '100 başarılı keşif görevi tamamla.', points: 100, current: 100, max: 100, isUnlocked: true },
  { id: 'e2', category: 'expedition', title: 'Bilinmeyen Medeniyetler', description: 'Tüm 4 canlı türünün (İnsanlar, Rocktal, Meka, Kaelesh) kilidini aç.', points: 200, current: 4, max: 4, isUnlocked: true },
  { id: 'e3', category: 'expedition', title: 'Antik Eser Avcısı', description: 'Mor DNA keşiflerinde 1.000 Eser topla.', points: 150, current: 840, max: 1000, isUnlocked: false },

  // Special
  { id: 's1', category: 'special', title: 'Parti Mekânı Patronu', description: 'Özel yaz etkinliğinde tüm görev zincirlerini tamamla.', points: 200, current: 1, max: 1, isUnlocked: true },
  { id: 's2', category: 'special', title: 'Karanlık Madde Efendisi', description: 'Keşif uçuşlarında toplam 50.000 Karanlık Madde bul.', points: 250, current: 38500, max: 50000, isUnlocked: false },
];

const AVAILABLE_TITLES = [
  { id: 't1', title: 'Parti Mekânı Patronu', isUnlocked: true, source: 'Özel Etkinlik Başarımı' },
  { id: 't2', title: 'Yıldız Kaşifi', isUnlocked: true, source: '100 Keşif Uçuşu' },
  { id: 't3', title: 'Demir Madenci', isUnlocked: true, source: 'Ekonomi Seviye 30' },
  { id: 't4', title: 'Galaksi Hükümdarı', isUnlocked: true, source: '1. Sıra Liderliği' },
  { id: 't5', title: 'Karanlık Madde Efendisi', isUnlocked: false, source: '50.000 KM Keşfi' },
  { id: 't6', title: 'Yüce Amiral', isUnlocked: false, source: '10.000.000 Yok Edilen Filo' },
];

const AVAILABLE_AVATARS = [
  { id: 'av1', name: 'Grand Consul', color: 'from-cyan-500 to-blue-700', icon: Crown, isUnlocked: true },
  { id: 'av2', name: 'Nova Commander', color: 'from-amber-400 to-orange-600', icon: Shield, isUnlocked: true },
  { id: 'av3', name: 'Shadow Fleet', color: 'from-purple-500 to-indigo-800', icon: Swords, isUnlocked: true },
  { id: 'av4', name: 'Deep Space Scout', color: 'from-emerald-400 to-teal-700', icon: Compass, isUnlocked: true },
  { id: 'av5', name: 'Cosmic Overlord', color: 'from-rose-500 to-red-800', icon: Star, isUnlocked: false },
];

export default function ProfilePage() {
  const username = useGameStore((s) => s.username);
  const totalPoints = useGameStore((s) => s.totalPoints);
  const planets = useGameStore((s) => s.planets);
  const playerClass = useGameStore((s) => s.playerClass);

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'cosmetics'>('overview');
  const [selectedTitle, setSelectedTitle] = useState('Parti Mekânı Patronu');
  const [selectedAvatarId, setSelectedAvatarId] = useState('av1');
  const [achievements, setAchievements] = useState<AchievementItem[]>(ACHIEVEMENTS);
  const [achCategory, setAchCategory] = useState<'all' | 'construction' | 'research' | 'combat' | 'expedition' | 'special'>('all');

  useEffect(() => {
    try {
      const storedTitle = localStorage.getItem('ogame_profile_title');
      const storedAvatar = localStorage.getItem('ogame_profile_avatar');
      if (storedTitle) setSelectedTitle(storedTitle);
      if (storedAvatar) setSelectedAvatarId(storedAvatar);
    } catch {
      // Ignore
    }
  }, []);

  const handleEquipTitle = (t: string) => {
    setSelectedTitle(t);
    try {
      localStorage.setItem('ogame_profile_title', t);
    } catch {
      // Ignore
    }
  };

  const handleEquipAvatar = (id: string) => {
    setSelectedAvatarId(id);
    try {
      localStorage.setItem('ogame_profile_avatar', id);
    } catch {
      // Ignore
    }
  };

  const activeAvatar = AVAILABLE_AVATARS.find((a) => a.id === selectedAvatarId) || AVAILABLE_AVATARS[0];
  const AvatarIcon = activeAvatar.icon;

  const totalAchievementPoints = achievements.filter((a) => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);
  const maxPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);

  const filteredAchievements = achievements.filter((a) => achCategory === 'all' || a.category === achCategory);

  return (
    <div className="space-y-6">
      {/* Profile Header Hero Card */}
      <div className="rounded-xl border border-cyan-500/35 bg-gradient-to-b from-[#0e1624] via-[#090d14] to-[#06090e] p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Sphere */}
          <div className={`h-20 w-20 rounded-2xl bg-gradient-to-tr ${activeAvatar.color} p-1 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0`}>
            <div className="h-full w-full rounded-xl bg-zinc-950/80 flex items-center justify-center text-cyan-300">
              <AvatarIcon className="h-10 w-10" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-100">{username === 'Commander' ? 'Consul Pegasus' : username}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                #1 Evren Lideri
              </span>
            </div>

            <div className="text-xs text-cyan-400 font-mono mt-1 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>&ldquo;{selectedTitle}&rdquo;</span>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 mt-1.5 flex items-center gap-3">
              <span>Sınıf: <strong className="text-zinc-200">{playerClass ?? 'General'}</strong></span>
              <span>•</span>
              <span>Gezegen: <strong className="text-zinc-200">{planets.length} Koloni</strong></span>
              <span>•</span>
              <span>Başarım Puanı: <strong className="text-amber-300">{totalAchievementPoints} AP</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 shrink-0 text-xs font-mono">
          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Toplam Puan</span>
            <span className="text-base font-bold text-zinc-100">{totalPoints.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Onur Puanı</span>
            <span className="text-base font-bold text-amber-300">+2.450 HP</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-[#090d14] px-4 pt-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Genel Bakış</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'achievements'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Başarımlar ({totalAchievementPoints} / {maxPossiblePoints} AP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cosmetics')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cosmetics'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Avatarlar & Unvanlar</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl border border-zinc-800 bg-[#090d14] space-y-3">
            <div className="flex items-center gap-2 font-bold text-zinc-200 text-sm">
              <Pickaxe className="h-4 w-4 text-emerald-400" />
              <span>Ekonomi Gelişimi</span>
            </div>
            <p className="text-xs text-zinc-400">
              Madenler, enerji santralleri, depolar ve üretim tesisleri toplam puanınızın %45&apos;ini oluşturmaktadır.
            </p>
            <div className="text-xs font-mono text-emerald-300">
              Ekonomi Puanı: 652.620
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-[#090d14] space-y-3">
            <div className="flex items-center gap-2 font-bold text-zinc-200 text-sm">
              <FlaskConical className="h-4 w-4 text-purple-400" />
              <span>Bilimsel İlerleme</span>
            </div>
            <p className="text-xs text-zinc-400">
              16 farklı teknoloji alanı ve 4 Canlı Türü ağacındaki toplam 72 araştırma yuvası tamamlandı.
            </p>
            <div className="text-xs font-mono text-purple-300">
              Araştırma Puanı: 387.660
            </div>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800 bg-[#090d14] space-y-3">
            <div className="flex items-center gap-2 font-bold text-zinc-200 text-sm">
              <Swords className="h-4 w-4 text-rose-400" />
              <span>Askeri Üstünlük</span>
            </div>
            <p className="text-xs text-zinc-400">
              17 gemi sınıfından oluşan aktif armada ve 10 savunma birimiyle korunan 5 gezegen/ay kompleksi.
            </p>
            <div className="text-xs font-mono text-rose-300">
              Askeri Puan: 410.000
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Sub-Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'construction', label: 'İnşaat' },
              { key: 'research', label: 'Araştırma' },
              { key: 'combat', label: 'Savaş' },
              { key: 'expedition', label: 'Keşif' },
              { key: 'special', label: 'Özel' },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setAchCategory(c.key as any)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  achCategory === c.key
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Achievement Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((ach) => {
              const progressPct = Math.min(100, Math.floor((ach.current / ach.max) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                    ach.isUnlocked
                      ? 'border-emerald-500/40 bg-[#0a141a]/90'
                      : 'border-zinc-800 bg-[#090d14]/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-100 text-sm">{ach.title}</h3>
                        {ach.isUnlocked && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Tamamlandı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{ach.description}</p>
                    </div>

                    <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
                      +{ach.points} AP
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span>İlerleme:</span>
                      <span>
                        {ach.current.toLocaleString()} / {ach.max.toLocaleString()} (%{progressPct})
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full transition-all duration-500 ${
                          ach.isUnlocked ? 'bg-emerald-400' : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Cosmetics (Avatars & Titles) */}
      {activeTab === 'cosmetics' && (
        <div className="space-y-6">
          {/* Avatar Selector */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-[#090d14] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Komutan Avatarları
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {AVAILABLE_AVATARS.map((av) => {
                const Icon = av.icon;
                const isEquipped = av.id === selectedAvatarId;

                return (
                  <button
                    key={av.id}
                    type="button"
                    disabled={!av.isUnlocked}
                    onClick={() => handleEquipAvatar(av.id)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2.5 ${
                      isEquipped
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : av.isUnlocked
                        ? 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                        : 'border-zinc-900 bg-zinc-950/30 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-tr ${av.color} p-0.5 flex items-center justify-center`}>
                      <div className="h-full w-full rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-100">
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-zinc-200">{av.name}</div>
                      <div className="text-[10px] font-mono mt-0.5 text-zinc-400">
                        {isEquipped ? (
                          <span className="text-cyan-300 font-bold flex items-center justify-center gap-1">
                            <Check className="h-3 w-3" /> Kuşanıldı
                          </span>
                        ) : av.isUnlocked ? (
                          'Açık'
                        ) : (
                          <span className="text-zinc-600 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Kilitli
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titles Selector */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-[#090d14] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Galaktik Unvanlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {AVAILABLE_TITLES.map((t) => {
                const isEquipped = t.title === selectedTitle;

                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'border-amber-400/80 bg-amber-950/20'
                        : t.isUnlocked
                        ? 'border-zinc-800 bg-zinc-950/60'
                        : 'border-zinc-900 bg-zinc-950/30 opacity-40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>{t.title}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {t.source}
                      </div>
                    </div>

                    {isEquipped ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        Kuşanıldı
                      </span>
                    ) : t.isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquipTitle(t.title)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 shrink-0 transition"
                      >
                        Kuşan
                      </button>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

