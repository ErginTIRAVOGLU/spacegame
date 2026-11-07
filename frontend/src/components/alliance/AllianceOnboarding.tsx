'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, Users, PlusCircle, CheckCircle2 } from 'lucide-react';
import { AllianceSearchResult } from '@/lib/allianceCatalog';
import { API_BASE_URL, useGameStore } from '@/store/useGameStore';

interface AllianceOnboardingProps {
  onAllianceCreatedOrJoined: () => void;
}

export function AllianceOnboarding({ onAllianceCreatedOrJoined }: AllianceOnboardingProps) {
  const storeUserId = useGameStore((s) => s.userId);
  const [tab, setTab] = useState<'search' | 'create'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AllianceSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Create state
  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alliances/search?query=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleApply = async (allianceId: string) => {
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/alliances/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceId,
          userId,
          message: applyMessage || 'İttifakınıza katılmak istiyorum.'
        })
      });

      if (res.ok) {
        setApplySuccess('Başvurunuz ittifak liderine iletildi!');
        setApplyingTo(null);
        setApplyMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (createName.trim().length < 3 || createName.trim().length > 30) {
      setCreateError('İttifak ismi 3 ile 30 karakter arasında olmalıdır.');
      return;
    }
    if (createTag.trim().length < 3 || createTag.trim().length > 8) {
      setCreateError('İttifak TAG kısaltması 3 ile 8 karakter arasında olmalıdır.');
      return;
    }

    setIsCreating(true);
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/alliances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderUserId: userId,
          name: createName.trim(),
          tag: createTag.trim().toUpperCase()
        })
      });

      if (res.ok) {
        // Update local storage user tag if present
        if (userStr) {
          const u = JSON.parse(userStr);
          u.allianceTag = createTag.trim().toUpperCase();
          localStorage.setItem('ogame_user', JSON.stringify(u));
        }
        onAllianceCreatedOrJoined();
      } else {
        const err = await res.json();
        setCreateError(err.message || 'İttifak oluşturulurken hata oluştu.');
      }
    } catch {
      setCreateError('Bağlantı hatası.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-900/20 to-zinc-900/60 border border-cyan-800/40 rounded-xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-zinc-100 uppercase">
            İttifak Karargahı
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-1">
            Galakside tek başına hayatta kalmak zordur. Güçlü bir ittifaka katılarak filo koruması, ortak maden bonusları ve teknoloji desteği elde edin veya kendi imparatorluk federasyonunuzu kurun.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setTab('search')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-lg transition-all ${
            tab === 'search'
              ? 'bg-zinc-800/80 text-cyan-400 border-t-2 border-x border-zinc-700 border-t-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Search className="w-4 h-4" />
          İttifak Ara & Katıl
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-lg transition-all ${
            tab === 'create'
              ? 'bg-zinc-800/80 text-cyan-400 border-t-2 border-x border-zinc-700 border-t-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Kendi İttifakını Kur
        </button>
      </div>

      {applySuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{applySuccess}</span>
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="İttifak Adı veya [TAG] kısaltması yazın (Örn: NOVA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </button>
          </form>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Arama Sonuçları ({searchResults.length})
              </h3>
              {searchResults.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
                  Girilen kriterlere uygun ittifak bulunamadı.
                </div>
              ) : (
                <div className="grid gap-3">
                  {searchResults.map((all) => (
                    <div
                      key={all.id}
                      className="p-4 bg-zinc-950/60 border border-zinc-800/90 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 rounded">
                            [{all.tag}]
                          </span>
                          <span className="font-semibold text-zinc-200 text-base">
                            {all.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span>Üye Sayısı: <strong className="text-zinc-200">{all.memberCount}</strong></span>
                          <span>Toplam Skor: <strong className="text-zinc-200">{all.score.toLocaleString()}</strong></span>
                          <span>Sıralama: <strong className="text-amber-400">#{all.rank}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {all.isOpen ? (
                          applyingTo === all.id ? (
                            <div className="flex flex-col gap-2 w-full md:w-64">
                              <textarea
                                placeholder="Başvuru mesajı yazın..."
                                value={applyMessage}
                                onChange={(e) => setApplyMessage(e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApply(all.id)}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                                >
                                  Gönder
                                </button>
                                <button
                                  onClick={() => setApplyingTo(null)}
                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                                >
                                  İptal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setApplyingTo(all.id)}
                              className="px-4 py-2 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded text-xs font-semibold tracking-wide transition-colors"
                            >
                              Başvur
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 px-3 py-1 rounded">
                            Başvurular Kapalı
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md max-w-xl mx-auto space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-zinc-200">Yeni İttifak Tescili</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Galaktik Konsey nezdinde yeni bir ittifak kurun ve kurucusu olun.
            </p>
          </div>

          {createError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                İttifak İsmi (Tam Ad)
              </label>
              <input
                type="text"
                placeholder="Örn: Galaktik Nova Muhafızları"
                value={createName}
                maxLength={30}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
              />
              <p className="text-[11px] text-zinc-500 mt-1">En fazla 30 karakter.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                İttifak Kısaltması (TAG)
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2.5 rounded-l-lg border border-r-0 border-zinc-700/80 bg-zinc-900 text-zinc-400 font-mono text-sm">
                  [
                </span>
                <input
                  type="text"
                  placeholder="NOVA"
                  value={createTag}
                  maxLength={8}
                  onChange={(e) => setCreateTag(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 text-zinc-200 uppercase font-mono font-bold tracking-widest placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
                />
                <span className="inline-flex items-center px-3 py-2.5 rounded-r-lg border border-l-0 border-zinc-700/80 bg-zinc-900 text-zinc-400 font-mono text-sm">
                  ]
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">3 ile 8 karakter arası (büyük harf).</p>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-sm tracking-wide uppercase shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50 mt-2"
            >
              {isCreating ? 'İttifak Kuruluyor...' : 'İttifakı Kur (Ücretsiz)'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

