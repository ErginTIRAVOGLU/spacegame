/**
 * HighscoresPage.tsx - /highscores
 *
 * Full Universe Leaderboard:
 * - Oyuncular | İttifaklar selection
 * - Categories:
 *   1. Puanlar (Genel)
 *   2. Ekonomi
 *   3. Araştırma
 *   4. Askeri (İnşa Edilen, Yok Edilen, Kaybedilen, Onur Puanı + Rozetler)
 *   5. Canlı Türleri (Genel, Ekonomi, Araştırma, Keşifler & XP)
 * - Row details: Sıra, Sıra Değişimi (+X/-Y), Oyuncu Adı, Onur Rozeti, İttifak Etiketi, Hızlı Aksiyonlar
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore, API_BASE_URL } from '@/store/useGameStore';
import {
  Trophy,
  Users,
  Shield,
  Pickaxe,
  FlaskConical,
  Swords,
  Dna,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Mail,
  UserPlus,
  Orbit,
  Award,
  Crown,
  Search,
  Flame,
} from 'lucide-react';

export type MainCategory = 'points' | 'economy' | 'research' | 'military' | 'lifeforms';
export type MilitarySubTab = 'built' | 'destroyed' | 'lost' | 'honor';
export type LifeformSubTab = 'general' | 'economy' | 'research' | 'expeditions';

interface LeaderboardEntry {
  rank: number;
  rankDelta: number;
  username: string;
  allianceTag?: string;
  points: number;
  coords: string;
  honorRank?: 'grand_emperor' | 'emperor' | 'star_lord' | 'neutral' | 'bandit';
  honorPoints?: number;
  species?: string;
  isSelf?: boolean;
}

const MOCK_PLAYERS_DATA: LeaderboardEntry[] = [
  { rank: 1, rankDelta: 0, username: 'Consul Pegasus', allianceTag: 'AETH', points: 1450280, coords: '1:105:4', honorRank: 'grand_emperor', honorPoints: 2450, species: 'Humans', isSelf: true },
  { rank: 2, rankDelta: 1, username: 'NovaVanguard', allianceTag: 'NOVA', points: 1290450, coords: '1:142:8', honorRank: 'emperor', honorPoints: 1120, species: 'Mechas' },
  { rank: 3, rankDelta: -1, username: 'DarkNebula', allianceTag: 'CSYN', points: 1180200, coords: '1:210:8', honorRank: 'bandit', honorPoints: -850, species: 'Rocktal' },
  { rank: 4, rankDelta: 2, username: 'StarCrusher', allianceTag: 'WAR', points: 985400, coords: '2:15:3', honorRank: 'star_lord', honorPoints: 480, species: 'Kaelesh' },
  { rank: 5, rankDelta: 0, username: 'Ironclad', allianceTag: 'ROCK', points: 850100, coords: '2:88:5', honorRank: 'neutral', honorPoints: 120, species: 'Rocktal' },
  { rank: 6, rankDelta: -2, username: 'Astraea', allianceTag: 'SFED', points: 742000, coords: '3:12:3', honorRank: 'star_lord', honorPoints: 340, species: 'Humans' },
  { rank: 7, rankDelta: 3, username: 'VortexOverlord', allianceTag: 'CSYN', points: 680900, coords: '2:45:12', honorRank: 'bandit', honorPoints: -1400, species: 'Kaelesh' },
  { rank: 8, rankDelta: 0, username: 'Chronos', allianceTag: 'AETH', points: 590000, coords: '2:310:7', honorRank: 'emperor', honorPoints: 950, species: 'Mechas' },
  { rank: 9, rankDelta: 1, username: 'Solaris', points: 480200, coords: '1:300:6', honorRank: 'neutral', honorPoints: 60, species: 'Humans' },
  { rank: 10, rankDelta: -1, username: 'BlackHoleVoyager', allianceTag: 'WAR', points: 410500, coords: '3:400:15', honorRank: 'bandit', honorPoints: -620, species: 'Kaelesh' },
];

export default function HighscoresPage() {
  const [scope, setScope] = useState<'players' | 'alliances'>('players');
  const [category, setCategory] = useState<MainCategory>('points');
  const [militaryTab, setMilitaryTab] = useState<MilitarySubTab>('honor');
  const [lifeformTab, setLifeformTab] = useState<LifeformSubTab>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_PLAYERS_DATA);

  const setIsBuddiesOpen = useGameStore((s) => s.setIsBuddiesOpen);

  // Fetch from backend highscore API if available
  useEffect(() => {
    const fetchHighscores = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/highscores?topCount=100`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLeaderboard(
              data.map((item: any, idx: number) => ({
                rank: item.rank ?? idx + 1,
                rankDelta: item.rankDelta ?? 0,
                username: item.username ?? `Player ${idx + 1}`,
                allianceTag: item.allianceTag,
                points: item.totalPoints ?? item.points ?? 100000,
                coords: item.coords ?? `1:${idx + 10}:4`,
                honorRank: item.honorPoints >= 1000 ? 'grand_emperor' : item.honorPoints < 0 ? 'bandit' : 'neutral',
                honorPoints: item.honorPoints ?? 0,
              }))
            );
          }
        }
      } catch {
        // Fallback to mock data
      }
    };
    fetchHighscores();
  }, []);

  const getHonorBadge = (rank?: string, points: number = 0) => {
    switch (rank) {
      case 'grand_emperor':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-400" />
            <span>Büyük İmparator (+{points})</span>
          </span>
        );
      case 'emperor':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center gap-1">
            <Award className="h-3 w-3 text-cyan-400" />
            <span>İmparator (+{points})</span>
          </span>
        );
      case 'star_lord':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Yıldız Lordu (+{points})</span>
          </span>
        );
      case 'bandit':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500 text-rose-300 flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Haydut ({points})</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-zinc-800">
            Nötr ({points >= 0 ? `+${points}` : points})
          </span>
        );
    }
  };

  const filteredList = leaderboard.filter((entry) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.username.toLowerCase().includes(q) ||
      (entry.allianceTag && entry.allianceTag.toLowerCase().includes(q)) ||
      entry.coords.includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="rounded-xl border border-cyan-500/30 bg-[#080c14] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            Galaktik Liderlik Tablosu
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span>Evren Sıralaması (Highscores)</span>
          </h1>
        </div>

        {/* Players vs Alliances Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
          <button
            type="button"
            onClick={() => setScope('players')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
              scope === 'players'
                ? 'bg-cyan-600 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Oyuncular
          </button>
          <button
            type="button"
            onClick={() => setScope('alliances')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
              scope === 'alliances'
                ? 'bg-cyan-600 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            İttifaklar
          </button>
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setCategory('points')}
          className={`p-3 rounded-lg border text-left transition flex items-center gap-2 ${
            category === 'points'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow'
              : 'border-zinc-800 bg-[#090d14] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
          <span>1. Puanlar (Genel)</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('economy')}
          className={`p-3 rounded-lg border text-left transition flex items-center gap-2 ${
            category === 'economy'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow'
              : 'border-zinc-800 bg-[#090d14] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Pickaxe className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>2. Ekonomi</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('research')}
          className={`p-3 rounded-lg border text-left transition flex items-center gap-2 ${
            category === 'research'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow'
              : 'border-zinc-800 bg-[#090d14] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FlaskConical className="h-4 w-4 text-purple-400 shrink-0" />
          <span>3. Araştırma</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('military')}
          className={`p-3 rounded-lg border text-left transition flex items-center gap-2 ${
            category === 'military'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow'
              : 'border-zinc-800 bg-[#090d14] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Swords className="h-4 w-4 text-rose-400 shrink-0" />
          <span>4. Askeri</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('lifeforms')}
          className={`p-3 rounded-lg border text-left transition flex items-center gap-2 ${
            category === 'lifeforms'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow'
              : 'border-zinc-800 bg-[#090d14] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dna className="h-4 w-4 text-teal-400 shrink-0" />
          <span>5. Canlı Türleri</span>
        </button>
      </div>

      {/* Sub-tabs for Military & Lifeforms */}
      {category === 'military' && (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold overflow-x-auto">
          {[
            { key: 'built', label: 'İnşa Edilen Askeri' },
            { key: 'destroyed', label: 'Yok Edilen Puanlar' },
            { key: 'lost', label: 'Kaybedilen Puanlar' },
            { key: 'honor', label: 'Onur Puanı & Rütbeler' },
          ].map((sub) => (
            <button
              key={sub.key}
              type="button"
              onClick={() => setMilitaryTab(sub.key as MilitarySubTab)}
              className={`px-3 py-1.5 rounded-md transition shrink-0 ${
                militaryTab === sub.key
                  ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {category === 'lifeforms' && (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold overflow-x-auto">
          {[
            { key: 'general', label: 'Toplam Canlı Türü Puanı' },
            { key: 'economy', label: 'Canlı Türü Binaları' },
            { key: 'research', label: 'Canlı Türü Teknolojileri' },
            { key: 'expeditions', label: 'Mor DNA Keşifler & XP' },
          ].map((sub) => (
            <button
              key={sub.key}
              type="button"
              onClick={() => setLifeformTab(sub.key as LifeformSubTab)}
              className={`px-3 py-1.5 rounded-md transition shrink-0 ${
                lifeformTab === sub.key
                  ? 'bg-teal-950/80 border border-teal-500/50 text-teal-200 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#090d14] p-3 rounded-lg border border-zinc-800 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Oyuncu veya ittifak ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
        <div className="text-zinc-400 font-mono text-[11px]">
          Görüntülenen: <strong className="text-zinc-200">{filteredList.length}</strong> kayıt
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d14] overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#121a26] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3 px-3 w-16 text-center">Sıra</th>
              <th className="py-3 px-2 w-14 text-center">Değişim</th>
              <th className="py-3 px-4">Oyuncu</th>
              <th className="py-3 px-3">İttifak</th>
              <th className="py-3 px-3">Onur / Statü</th>
              <th className="py-3 px-4 text-right">Puan</th>
              <th className="py-3 px-4 text-center w-28">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filteredList.map((entry) => {
              const isPositive = entry.rankDelta > 0;
              const isNegative = entry.rankDelta < 0;

              return (
                <tr
                  key={entry.rank}
                  className={`hover:bg-[#0e1624] transition ${
                    entry.isSelf ? 'bg-cyan-950/20 font-bold border-l-2 border-l-cyan-400' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-bold text-zinc-200">
                    {entry.rank === 1 ? (
                      <span className="text-amber-400 flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5" /> #1
                      </span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </td>

                  {/* Rank Delta */}
                  <td className="py-3 px-2 text-center">
                    {isPositive ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-0.5 font-bold">
                        <ArrowUpRight className="h-3 w-3" /> +{entry.rankDelta}
                      </span>
                    ) : isNegative ? (
                      <span className="text-rose-400 flex items-center justify-center gap-0.5 font-bold">
                        <ArrowDownRight className="h-3 w-3" /> {entry.rankDelta}
                      </span>
                    ) : (
                      <span className="text-zinc-600 flex items-center justify-center">
                        <Minus className="h-3 w-3" />
                      </span>
                    )}
                  </td>

                  {/* Username */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-100 font-bold">{entry.username}</span>
                      {entry.isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                          Sen
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500">{entry.coords}</div>
                  </td>

                  {/* Alliance Tag */}
                  <td className="py-3 px-3">
                    {entry.allianceTag ? (
                      <Link
                        href="/alliance"
                        className="px-1.5 py-0.5 rounded text-[11px] bg-zinc-900 border border-zinc-700 text-cyan-300 hover:border-cyan-400"
                      >
                        [{entry.allianceTag}]
                      </Link>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>

                  {/* Honor Badge */}
                  <td className="py-3 px-3">
                    {getHonorBadge(entry.honorRank, entry.honorPoints ?? 0)}
                  </td>

                  {/* Points */}
                  <td className="py-3 px-4 text-right font-bold text-zinc-100">
                    {entry.points.toLocaleString()}
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/galaxy?coords=${entry.coords}`}
                        title="Galakside Gör"
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700"
                      >
                        <Orbit className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={`/messages?compose=${entry.username}`}
                        title="Mesaj Gönder"
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setIsBuddiesOpen(true)}
                        title="Arkadaş Ekle"
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 border border-zinc-700"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

