'use client';

import React, { useState } from 'react';
import { AllianceDataDto } from '@/lib/allianceCatalog';
import { API_BASE_URL } from '@/store/useGameStore';
import { Send, Check, ShieldAlert, Eye, MailCheck } from 'lucide-react';

interface AllianceCommunicationTabProps {
  alliance: AllianceDataDto;
}

export function AllianceCommunicationTab({ alliance }: AllianceCommunicationTabProps) {
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'leaders'>('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const canSendCircular = alliance.userRole >= 2; // General or Founder
  const MAX_CHARS = 2000;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setErrorMsg('Lütfen konu ve mesaj içeriği giriniz.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = userStr ? JSON.parse(userStr).id : null;

      const res = await fetch(`${API_BASE_URL}/api/alliances/${alliance.id}/circular-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: userId,
          subject: subject.trim(),
          body: body.trim(),
          targetRole: recipientFilter === 'leaders' ? 2 : 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'Sirküler mesaj başarıyla tüm üyelere ulaştırıldı.');
        setSubject('');
        setBody('');
      } else {
        const err = await res.json();
        setErrorMsg(err.message || 'Mesaj gönderilemedi.');
      }
    } catch {
      setErrorMsg('Bağlantı hatası.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <MailCheck className="w-5 h-5 text-cyan-400" />
          Sirküler Mesaj Sistemi (Genel Yayın)
        </h2>
        <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
          İttifak içi seferberlik, savaş çağrısı veya strateji duyurularını tek tıkla tüm üyelerin gelen kutusuna özel ittifak damgasıyla iletin.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-4">
        {/* Recipient Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Alıcı Grubu
          </label>
          <select
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value as any)}
            className="w-full md:w-64 px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">[Tüm İttifak Üyeleri] ({alliance.members.length} oyuncu)</option>
            <option value="leaders">[Yöneticiler ve Generaller]</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Duyuru Konusu
          </label>
          <input
            type="text"
            required
            maxLength={100}
            placeholder="Örn: 3. Galaksi Ortak Seferberlik Çağrısı"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Mesaj Metni
            </label>
            <span className={`text-[11px] ${body.length > MAX_CHARS ? 'text-rose-400 font-bold' : 'text-zinc-500'}`}>
              {body.length} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            required
            rows={7}
            maxLength={MAX_CHARS}
            placeholder="Tüm müttefiklerimizin dikkatine: Filo konuşlandırmalarınızı tamamlayın..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-4 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            disabled={!body.trim()}
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <Eye className="w-3.5 h-3.5" />
            Önizle
          </button>

          <button
            type="submit"
            disabled={!canSendCircular || isSending || !body.trim() || !subject.trim()}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Gönderiliyor...' : 'Sirküler Mesajı Yayınla'}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-zinc-200 text-sm">
                Sirküler Mesaj Önizlemesi
              </h4>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Gönderen:</span> [{alliance.tag}] Komuta Kademesi
              </div>
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Konu:</span> <strong className="text-zinc-200">{subject || '(Konu Yok)'}</strong>
              </div>
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Hedef:</span> {recipientFilter === 'all' ? 'Tüm İttifak' : 'Yöneticiler'}
              </div>
              <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {body}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

