'use client';

import React from 'react';
import Link from 'next/link';
import { CommunicationSubTab, PlayerMessageItem } from '@/lib/messagesCatalog';
import { MessageSquare, Shield, Users, Mail, Info, Share2, Star, ExternalLink, Swords } from 'lucide-react';

interface CommunicationTabProps {
  subTab: CommunicationSubTab;
  onSubTabChange: (tab: CommunicationSubTab) => void;
  playerMessages: PlayerMessageItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
}

export function CommunicationTab({
  subTab,
  onSubTabChange,
  playerMessages,
  selectedIds,
  onToggleSelect,
  onToggleFavorite
}: CommunicationTabProps) {
  const formatAge = (mins: number) => {
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  };

  const renderMessageContent = (content: string) => {
    if (!content) return <span className="text-zinc-500 italic">Mesaj içeriği bulunmuyor.</span>;
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string') return <span>{parsed}</span>;
        if (parsed.text) return <span>{String(parsed.text)}</span>;
        if (parsed.message) return <span>{String(parsed.message)}</span>;
        if (parsed.content) return <span>{String(parsed.content)}</span>;

        // Combat report JSON payload
        if (parsed.rounds && (parsed.attacker || parsed.defender)) {
          const winnerText = parsed.winner === 1 ? 'Saldırgan' : 'Savunan';
          return (
            <div className="space-y-1.5 py-1">
              <div className="text-zinc-300 font-sans">
                Savaş Simülasyonu [{parsed.battleCoordinates ?? 'Bilinmeyen'}] &mdash; Kazanan:{' '}
                <span className="text-amber-400 font-bold">{winnerText}</span>. Harabe Alanı:{' '}
                <span className="text-cyan-300 font-mono font-semibold">
                  {(parsed.wreckage?.debrisMetal ?? 0).toLocaleString()} Metal,{' '}
                  {(parsed.wreckage?.debrisCrystal ?? 0).toLocaleString()} Kristal
                </span>
                .
              </div>
              {parsed.reportId && (
                <div>
                  <Link
                    href={`/reports/combat/${parsed.reportId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 underline font-semibold mt-1"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Detaylı Savaş Raporunu İncele</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        }
      } catch {
        // Fallback to plain text
      }
    }

    return <span>{content}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex border-b border-zinc-800 gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onSubTabChange('reports')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'reports'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Oyuncu Mesajları ({playerMessages.length})
        </button>

        <button
          onClick={() => onSubTabChange('info')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'info'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Bilgiler & Sistem
        </button>

        <button
          onClick={() => onSubTabChange('shared_combat')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'shared_combat'
              ? 'bg-zinc-800 text-rose-400 border-t-2 border-rose-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Paylaşılan Savaş Raporları
        </button>

        <button
          onClick={() => onSubTabChange('shared_spy')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'shared_spy'
              ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Paylaşılan Casusluk Raporları
        </button>
      </div>

      {/* Messages Feed */}
      {subTab === 'reports' && (
        <div className="space-y-3">
          {playerMessages.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Gelen kutunuzda okunmamış özel oyuncu mesajı bulunmuyor.
            </div>
          ) : (
            playerMessages.map((msg) => {
              const isSelected = selectedIds.includes(msg.id);
              return (
                <div
                  key={msg.id}
                  className={`p-4 bg-zinc-900/60 border rounded-xl shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isSelected ? 'border-cyan-500/80 bg-cyan-950/10' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(msg.id)}
                      className="mt-1 rounded border-zinc-700 text-cyan-600 focus:ring-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm">{msg.subject}</span>
                        <span className="text-xs text-zinc-400 font-medium">
                          Gönderen: <strong className="text-cyan-400">{msg.senderName}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        {renderMessageContent(msg.contentJson)}
                      </div>
                      <span className="text-[11px] text-zinc-500 block">
                        Gönderim: {formatAge(msg.ageMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onToggleFavorite(msg.id, !msg.isFavorite)}
                      title={msg.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      className={`p-1.5 rounded hover:bg-zinc-800 ${
                        msg.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bilgiler & Sistem Sub-tab */}
      {subTab === 'info' && (
        <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs space-y-1">
          <p className="text-zinc-300 font-semibold flex items-center justify-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Bilgiler & Sistem Bildirimleri</span>
          </p>
          <p className="text-zinc-400 text-[11px]">
            Gezegen terk bildirimleri, filo varış uyarıları ve evren duyuruları bu sekmede arşivlenir.
          </p>
        </div>
      )}

      {/* Shared Reports Feed */}
      {(subTab === 'shared_combat' || subTab === 'shared_spy') && (
        <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs space-y-1">
          <p className="text-zinc-300 font-semibold">İttifak Paylaşım Havuzu</p>
          <p className="text-zinc-400 text-[11px]">
            İttifak üyelerinizin paylaştığı radar ve filo istihbaratları anlık olarak burada listelenir.
          </p>
        </div>
      )}
    </div>
  );
}

