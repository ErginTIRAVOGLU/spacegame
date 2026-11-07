'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCategory,
  FleetSubTab,
  CommunicationSubTab,
  MessagesHubResponse
} from '@/lib/messagesCatalog';
import { FleetTab } from '@/components/messages/FleetTab';
import { CommunicationTab } from '@/components/messages/CommunicationTab';
import { OGameTab } from '@/components/messages/OGameTab';
import { API_BASE_URL, useGameStore } from '@/store/useGameStore';
import {
  Send,
  MessageSquare,
  Coins,
  Globe2,
  Trophy,
  Star,
  CheckCheck,
  Trash2,
  Loader2,
  Filter,
  Check,
  Users,
  UserPlus,
  X
} from 'lucide-react';

function MessagesPageContent() {
  const storeUserId = useGameStore((s) => s.userId);
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<MessageCategory>('fleet');
  const [fleetSubTab, setFleetSubTab] = useState<FleetSubTab>('espionage');
  const [commSubTab, setCommSubTab] = useState<CommunicationSubTab>('reports');
  const [data, setData] = useState<MessagesHubResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Task 05AM: Add Friend Modal & Friends Tab Support
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [isSendingFriend, setIsSendingFriend] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');
    if (tabParam === 'friends' || actionParam === 'add-friend') {
      setIsAddFriendModalOpen(true);
      setCategory('communication');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleGlobalModal = (e: Event) => {
      const custom = e as CustomEvent<{ modalId: string }>;
      if (custom.detail?.modalId === 'ADD_FRIEND_MODAL') {
        setIsAddFriendModalOpen(true);
        setCategory('communication');
      }
    };
    window.addEventListener('open-game-modal', handleGlobalModal);
    return () => window.removeEventListener('open-game-modal', handleGlobalModal);
  }, []);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;

    setIsSendingFriend(true);
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : undefined);

      await fetch(`${API_BASE_URL}/api/tutorial/directive-2/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'friend_request_sent',
          unitId: friendInput.trim(),
          userId,
        }),
      });

      setFeedback(`İmparator "${friendInput.trim()}" için arkadaşlık isteği başarıyla iletildi!`);
      setIsAddFriendModalOpen(false);
      setFriendInput('');
    } catch {
      setFeedback('Arkadaşlık isteği gönderilirken hata oluştu.');
    } finally {
      setIsSendingFriend(false);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/messages?category=${category}&userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [category, storeUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: isFav })
      });
      if (res.ok) {
        setFeedback(isFav ? 'Mesaj favorilere eklendi.' : 'Mesaj favorilerden kaldırıldı.');
        fetchMessages();
      }
    } catch {}
  };

  const handleShareReport = async (id: string, type: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/share-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: type, reportId: id, targetChannel: 'alliance' })
      });
      if (res.ok) {
        setFeedback('Rapor ittifak iletişim akışına başarıyla aktarıldı!');
      }
    } catch {}
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/batch`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: selectedIds })
      });
      if (res.ok) {
        setFeedback(`${selectedIds.length} mesaj silindi.`);
        setSelectedIds([]);
        fetchMessages();
      }
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm text-zinc-400 font-medium">Haber akışı ve raporlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Haber Akışı & Raporlar (Messaging Hub)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gelen filo casusluk taramaları, savaş simülasyonları, keşif raporları ve komutan mesajları.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFeedback('Tüm mesajlar okundu olarak işaretlendi.');
            }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            Okundu İşaretle
          </button>
          <button
            onClick={() => setIsAddFriendModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Arkadaş Ekle
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={handleBatchDelete}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Seçilenleri Sil ({selectedIds.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Main 6 Category Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setCategory('fleet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'fleet'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Send className="w-4 h-4" />
          Filo
        </button>

        <button
          onClick={() => setCategory('communication')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'communication'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          İletişim
        </button>

        <button
          onClick={() => setCategory('economy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'economy'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Coins className="w-4 h-4" />
          Ekonomi
        </button>

        <button
          onClick={() => setCategory('universe')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'universe'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          Oyun Dünyası
        </button>

        <button
          onClick={() => setCategory('ogame')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'ogame'
              ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Trophy className="w-4 h-4" />
          OGame
        </button>

        <button
          onClick={() => setCategory('favorites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all ${
            category === 'favorites'
              ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Star className="w-4 h-4" />
          Favoriler ({data?.bookmarks?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {category === 'fleet' && (
          <FleetTab
            subTab={fleetSubTab}
            onSubTabChange={setFleetSubTab}
            espionageReports={data?.espionageReports ?? []}
            combatReports={data?.combatReports ?? []}
            expeditionReports={data?.expeditionReports ?? []}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleFavorite={handleToggleFavorite}
            onShareReport={handleShareReport}
          />
        )}

        {category === 'communication' && (
          <CommunicationTab
            subTab={commSubTab}
            onSubTabChange={setCommSubTab}
            playerMessages={data?.playerMessages ?? []}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {category === 'economy' && (
          <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
            <Coins className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-bold text-zinc-200 text-sm">Ekonomi & Ticaret Akışı</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Tüccar takasları, açık artırma teklif bildirimleri ve hurda geri dönüşüm faturaları burada arşivlenir.
            </p>
          </div>
        )}

        {category === 'universe' && (
          <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
            <Globe2 className="w-8 h-8 text-cyan-400 mx-auto" />
            <h3 className="font-bold text-zinc-200 text-sm">Oyun Dünyası & Etkinlikler</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Evren geneli etkinlik duyuruları, süpernovalar, tatil modu bildirimleri ve galaktik konsey güncellemeleri.
            </p>
          </div>
        )}

        {category === 'ogame' && <OGameTab />}

        {category === 'favorites' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Yıldızlanan / Favori Raporlar & Mesajlar ({data?.bookmarks?.length || 0})
            </h3>
            {data?.bookmarks?.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Henüz favorilere eklenmiş bir rapor veya mesaj bulunmuyor.
              </div>
            ) : (
              <div className="grid gap-2">
                {data?.combatReports.filter((r) => r.isFavorite).map((cr) => (
                  <div key={cr.id} className="p-3 bg-zinc-900 border border-amber-500/30 rounded-lg flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-bold text-zinc-200">Savaş Raporu: {cr.attackerName} vs {cr.defenderName}</span>
                      <span className="text-zinc-500 ml-2 font-mono">{cr.coordinates}</span>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(cr.id, false)}
                      className="text-amber-400 hover:text-zinc-400"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task 05AM: ADD_FRIEND_MODAL Dialog */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-indigo-500/40 bg-[#090d18] p-6 shadow-[0_0_40px_rgba(99,102,241,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-zinc-100 font-mono">
                  Arkadaş Ekle • İmparator Arama
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFriendModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Evrende müttefik kurmak için başka bir imparatorun adını veya koordinatını girin. Karşı tarafa anında bir dostluk bildirimi iletilecektir.
            </p>

            <form onSubmit={handleSendFriendRequest} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Hedef İmparator Adı veya Koordinatı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Komutan_Nova veya [1:24:6]"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSendingFriend || !friendInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSendingFriend ? 'Gönderiliyor...' : 'İstek Gönder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent />
    </Suspense>
  );
}

