/**
 * GlobalSearchModal.tsx
 *
 * Universal Search modal with:
 * - Oyuncu İsimleri (Player search)
 * - İttifak / TAG (Alliance search)
 * - Gezegen İsimleri (Planet search)
 * - Quick actions: Casusluk, Mesaj, Arkadaşlık, Başvuru
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/useGameStore';
import {
  Search,
  Users,
  Shield,
  Globe2,
  X,
  Mail,
  Orbit,
  Eye,
  UserPlus,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  name: string;
  coords: string;
  rank: number;
  alliance?: string;
  allianceTag?: string;
  type: 'player' | 'alliance' | 'planet';
}

const MOCK_PLAYERS: SearchResultItem[] = [
  { id: 'p1', name: 'Commander Nova', coords: '1:105:4', rank: 1, alliance: 'Aethelgard Prime', allianceTag: 'AETH', type: 'player' },
  { id: 'p2', name: 'DarkNebula', coords: '1:210:8', rank: 8, alliance: 'Cosmic Syndicate', allianceTag: 'CSYN', type: 'player' },
  { id: 'p3', name: 'VortexLord', coords: '2:45:12', rank: 19, alliance: 'Rocktal Brotherhood', allianceTag: 'ROCK', type: 'player' },
  { id: 'p4', name: 'Astraeus', coords: '3:12:3', rank: 34, alliance: 'Solar Federation', allianceTag: 'SFED', type: 'player' },
  { id: 'p5', name: 'Chronos', coords: '2:310:7', rank: 55, alliance: 'Aethelgard Prime', allianceTag: 'AETH', type: 'player' },
];

const MOCK_ALLIANCES: SearchResultItem[] = [
  { id: 'a1', name: 'Aethelgard Prime', coords: '1:1:1', rank: 1, allianceTag: 'AETH', type: 'alliance' },
  { id: 'a2', name: 'Cosmic Syndicate', coords: '1:200:1', rank: 3, allianceTag: 'CSYN', type: 'alliance' },
  { id: 'a3', name: 'Rocktal Brotherhood', coords: '2:1:1', rank: 5, allianceTag: 'ROCK', type: 'alliance' },
  { id: 'a4', name: 'Solar Federation', coords: '3:10:1', rank: 9, allianceTag: 'SFED', type: 'alliance' },
];

const MOCK_PLANETS: SearchResultItem[] = [
  { id: 'pl1', name: 'Aethelgard Prime', coords: '1:105:4', rank: 1, alliance: 'Commander Nova', allianceTag: 'AETH', type: 'planet' },
  { id: 'pl2', name: 'Colony Aurelia', coords: '1:105:7', rank: 1, alliance: 'Commander Nova', allianceTag: 'AETH', type: 'planet' },
  { id: 'pl3', name: 'Black Sun Fortress', coords: '1:210:8', rank: 8, alliance: 'DarkNebula', allianceTag: 'CSYN', type: 'planet' },
  { id: 'pl4', name: 'Magma Core', coords: '2:45:12', rank: 19, alliance: 'VortexLord', allianceTag: 'ROCK', type: 'planet' },
];

export function GlobalSearchModal() {
  const isSearchOpen = useGameStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useGameStore((s) => s.setIsSearchOpen);
  const setIsBuddiesOpen = useGameStore((s) => s.setIsBuddiesOpen);

  const [activeTab, setActiveTab] = useState<'player' | 'alliance' | 'planet'>('player');
  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const currentDataset =
    activeTab === 'player'
      ? MOCK_PLAYERS
      : activeTab === 'alliance'
      ? MOCK_ALLIANCES
      : MOCK_PLANETS;

  const filteredResults = currentDataset.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.allianceTag && item.allianceTag.toLowerCase().includes(q)) ||
      item.coords.includes(q)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-cyan-500/40 bg-gradient-to-b from-[#0f1726] via-[#0b1018] to-[#06090e] shadow-[0_0_35px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#121c2c] shrink-0">
          <div className="flex items-center gap-2.5">
            <Search className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Evrensel Arama
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Kapat"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-zinc-800 bg-[#090d14] px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('player')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'player'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Oyuncu İsimleri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alliance')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'alliance'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>İttifak / TAG</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planet')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'planet'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Gezegen İsimleri</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-[#0c121d] border-b border-zinc-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'player'
                  ? 'Oyuncu adı veya rumuz ara...'
                  : activeTab === 'alliance'
                  ? 'İttifak adı veya [TAG] ara...'
                  : 'Gezegen adı ara...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Eşleşen sonuç bulunamadı.
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-zinc-800/90 bg-[#0d131e]/90 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">{item.name}</span>
                    {item.allianceTag && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        [{item.allianceTag}]
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    Sıra: #{item.rank} • Koordinat: {item.coords}
                    {item.alliance && activeTab === 'planet' && ` • Sahibi: ${item.alliance}`}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Galaxy View */}
                  <Link
                    href={`/galaxy?coords=${item.coords}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition"
                    title="Galakside Görüntüle"
                  >
                    <Orbit className="h-3.5 w-3.5" />
                  </Link>

                  {/* Espionage Shortcut */}
                  <Link
                    href={`/fleet?mission=espionage&coords=${item.coords}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition"
                    title="Casusluk Gönder"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>

                  {/* Message */}
                  <Link
                    href={`/messages?compose=${item.name}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition"
                    title="Mesaj Gönder"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </Link>

                  {/* Buddy Request */}
                  {item.type === 'player' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setIsBuddiesOpen(true);
                      }}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 border border-zinc-700 transition"
                      title="Arkadaş Ekle"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

