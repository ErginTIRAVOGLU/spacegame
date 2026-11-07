/**
 * BuddiesModal.tsx
 *
 * Friends and Buddy List management modal with:
 * - Arkadaş Listesi (online status, rank, coords, delete, message action)
 * - Gelen İstekler (Accept / Reject)
 * - Gönderilen İstekler (Cancel)
 * - Send buddy request form
 * - Persisted in localStorage
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/useGameStore';
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Trash2,
  Check,
  X,
  Mail,
  Send,
  Orbit,
} from 'lucide-react';

export interface BuddyItem {
  id: string;
  username: string;
  rank: number;
  coords: string;
  allianceTag?: string;
  isOnline: boolean;
  addedAt: number;
}

export interface BuddyRequest {
  id: string;
  sender: string;
  receiver: string;
  type: 'incoming' | 'outgoing';
  coords: string;
  timestamp: number;
}

const BUDDIES_STORAGE_KEY = 'ogame_player_buddies';
const REQUESTS_STORAGE_KEY = 'ogame_player_buddy_requests';

export function BuddiesModal() {
  const isBuddiesOpen = useGameStore((s) => s.isBuddiesOpen);
  const setIsBuddiesOpen = useGameStore((s) => s.setIsBuddiesOpen);

  const [activeTab, setActiveTab] = useState<'buddies' | 'incoming' | 'outgoing'>('buddies');
  const [buddies, setBuddies] = useState<BuddyItem[]>([]);
  const [requests, setRequests] = useState<BuddyRequest[]>([]);
  const [newBuddyName, setNewBuddyName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedBuddies = localStorage.getItem(BUDDIES_STORAGE_KEY);
      if (storedBuddies) {
        setBuddies(JSON.parse(storedBuddies));
      } else {
        // Initial sample buddies
        const defaultBuddies: BuddyItem[] = [
          {
            id: 'b1',
            username: 'Admiral Zephyr',
            rank: 14,
            coords: '1:142:8',
            allianceTag: 'NOVA',
            isOnline: true,
            addedAt: Date.now() - 86400000 * 5,
          },
          {
            id: 'b2',
            username: 'ShadowRider',
            rank: 42,
            coords: '2:88:5',
            allianceTag: 'DARK',
            isOnline: false,
            addedAt: Date.now() - 86400000 * 12,
          },
          {
            id: 'b3',
            username: 'Starlight',
            rank: 67,
            coords: '1:305:12',
            isOnline: true,
            addedAt: Date.now() - 86400000 * 2,
          },
        ];
        setBuddies(defaultBuddies);
      }

      const storedReqs = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (storedReqs) {
        setRequests(JSON.parse(storedReqs));
      } else {
        const defaultReqs: BuddyRequest[] = [
          {
            id: 'r1',
            sender: 'GalacticMiner',
            receiver: 'Commander',
            type: 'incoming',
            coords: '1:210:4',
            timestamp: Date.now() - 3600000 * 4,
          },
        ];
        setRequests(defaultReqs);
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveBuddies = (updated: BuddyItem[]) => {
    setBuddies(updated);
    try {
      localStorage.setItem(BUDDIES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const saveRequests = (updated: BuddyRequest[]) => {
    setRequests(updated);
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  if (!isBuddiesOpen) return null;

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuddyName.trim()) return;

    const target = newBuddyName.trim();
    if (buddies.some((b) => b.username.toLowerCase() === target.toLowerCase())) {
      setFeedback('Bu oyuncu zaten arkadaş listenizde.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const newReq: BuddyRequest = {
      id: Date.now().toString(),
      sender: 'Commander',
      receiver: target,
      type: 'outgoing',
      coords: '1:100:1',
      timestamp: Date.now(),
    };

    saveRequests([...requests, newReq]);
    setNewBuddyName('');
    setFeedback(`${target} oyuncusuna arkadaşlık isteği gönderildi!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAcceptRequest = (req: BuddyRequest) => {
    const newBuddy: BuddyItem = {
      id: Date.now().toString(),
      username: req.sender,
      rank: Math.floor(Math.random() * 80) + 10,
      coords: req.coords,
      isOnline: true,
      addedAt: Date.now(),
    };
    saveBuddies([...buddies, newBuddy]);
    saveRequests(requests.filter((r) => r.id !== req.id));
  };

  const handleRejectRequest = (id: string) => {
    saveRequests(requests.filter((r) => r.id !== id));
  };

  const handleCancelRequest = (id: string) => {
    saveRequests(requests.filter((r) => r.id !== id));
  };

  const handleDeleteBuddy = (id: string) => {
    saveBuddies(buddies.filter((b) => b.id !== id));
  };

  const incomingRequests = requests.filter((r) => r.type === 'incoming');
  const outgoingRequests = requests.filter((r) => r.type === 'outgoing');

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
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Arkadaşlar & İletişim
            </h2>
            <span className="text-xs font-mono text-zinc-400">({buddies.length})</span>
          </div>

          <button
            type="button"
            onClick={() => setIsBuddiesOpen(false)}
            aria-label="Kapat"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-800 bg-[#090d14] px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('buddies')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'buddies'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Arkadaş Listesi ({buddies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'incoming'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Gelen İstekler ({incomingRequests.length})</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-zinc-950 text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'outgoing'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Gönderilen İstekler ({outgoingRequests.length})</span>
          </button>
        </div>

        {/* Send Request Form */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-[#0c121d]">
          <form onSubmit={handleSendRequest} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Arkadaşlık isteği göndermek için oyuncu adı yazın..."
              value={newBuddyName}
              onChange={(e) => setNewBuddyName(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>İstek Gönder</span>
            </button>
          </form>
          {feedback && (
            <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg animate-in fade-in">
              {feedback}
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'buddies' && (
            buddies.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Arkadaş listeniz henüz boş. Yukarıdaki formu kullanarak arkadaşlık isteği gönderebilirsiniz.
              </div>
            ) : (
              <div className="space-y-2">
                {buddies.map((buddy) => (
                  <div
                    key={buddy.id}
                    className="p-3 rounded-lg border border-zinc-800/90 bg-[#0d131e]/90 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          buddy.isOnline
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                            : 'bg-zinc-600'
                        }`}
                        title={buddy.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {buddy.username}
                          </span>
                          {buddy.allianceTag && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                              [{buddy.allianceTag}]
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          Sıra: #{buddy.rank} • Koordinat: {buddy.coords}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/galaxy?coords=${buddy.coords}`}
                        onClick={() => setIsBuddiesOpen(false)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition"
                        title="Galakside Görüntüle"
                      >
                        <Orbit className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={`/messages?compose=${buddy.username}`}
                        onClick={() => setIsBuddiesOpen(false)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition"
                        title="Mesaj Gönder"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteBuddy(buddy.id)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition"
                        title="Arkadaşlıktan Çıkar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'incoming' && (
            incomingRequests.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Bekleyen gelen arkadaşlık isteği bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-[#0d131e] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{req.sender}</div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        Koordinat: {req.coords} • {new Date(req.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Kabul Et</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'outgoing' && (
            outgoingRequests.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Bekleyen giden arkadaşlık isteğiniz yok.
              </div>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-[#0d131e] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{req.receiver}</div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        Gönderildi: {new Date(req.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 font-semibold text-xs border border-zinc-700 transition"
                    >
                      İsteği İptal Et
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

