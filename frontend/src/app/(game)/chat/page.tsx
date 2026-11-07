'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessageItem } from '@/lib/messagesCatalog';
import { API_BASE_URL, useGameStore } from '@/store/useGameStore';
import {
  MessageSquare,
  Users,
  Search,
  Send,
  Sparkles,
  Shield,
  Circle,
  Hash,
  UserCheck
} from 'lucide-react';

export default function ChatPage() {
  const storeUserId = useGameStore((s) => s.userId);
  const storeUsername = useGameStore((s) => s.username);

  const [activeChannel, setActiveChannel] = useState<'alliance' | 'global' | 'direct'>('alliance');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages?channel=${activeChannel}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json);
        scrollToBottom();
      }
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling fallback alongside SignalR
    return () => clearInterval(interval);
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');
      const username = storeUsername || (userStr ? JSON.parse(userStr).username : 'Commander');

      const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: userId,
          senderUsername: username,
          channel: activeChannel,
          text: inputText.trim()
        })
      });

      if (res.ok) {
        setInputText('');
        fetchMessages();
      }
    } catch {
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[78vh]">
        {/* Left Pane (Active Conversation) */}
        <div className="flex-1 flex flex-col border-r border-zinc-800">
          {/* Chat Header */}
          <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  {activeChannel === 'alliance' ? 'İttifak Ana Kanalı' : activeChannel === 'global' ? 'Genel Evren Sohbeti' : 'Özel Mesaj'}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {activeChannel === 'alliance' ? 'Sadece ittifak üyelerine açık şifreli frekans' : 'Tüm evrene açık yayın'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/40">
            {messages.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">
                Bu kanalda henüz mesaj bulunmuyor. İlk mesajı siz gönderin!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderUsername === storeUsername || m.senderUsername === 'Commander';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-cyan-400">{m.senderUsername}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(m.sentAtUtc).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      {m.messageText}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950/90 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              placeholder="Mesajınızı yazın..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Gönder
            </button>
          </form>
        </div>

        {/* Right Pane (Channels & Friends Directory) */}
        <div className="w-full md:w-72 bg-zinc-950/90 flex flex-col">
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Kanallar & İletişim
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Oyuncu ara..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => setActiveChannel('alliance')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                activeChannel === 'alliance'
                  ? 'bg-cyan-950/60 border border-cyan-800/80 text-cyan-300'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>İttifak Kanalı</span>
              </div>
              <span className="text-[10px] bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-400 font-mono">
                [TR_NEW]
              </span>
            </button>

            <button
              onClick={() => setActiveChannel('global')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                activeChannel === 'global'
                  ? 'bg-cyan-950/60 border border-cyan-800/80 text-cyan-300'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Genel Evren Sohbeti</span>
              </div>
            </button>
          </div>

          {/* Friends & Contacts Mock */}
          <div className="p-3 border-t border-zinc-800/80 space-y-2 flex-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Çevrimiçi Komutanlar
            </span>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ViperX</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">#42</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>AegisOne</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">#18</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span>NovaCorsair</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono">çevrimdışı</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

