/**
 * NotesModal.tsx
 *
 * Personal notes modal with:
 * - Priority levels (Red = Önemli, Yellow = Normal, Green = Önemsiz)
 * - Character count indicator (max 2,000 characters)
 * - Create, edit, and delete notes
 * - Persisted in localStorage
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

export type NotePriority = 'high' | 'normal' | 'low';

export interface PlayerNote {
  id: string;
  title: string;
  content: string;
  priority: NotePriority;
  updatedAt: number;
}

const STORAGE_KEY = 'ogame_player_notes';
const MAX_CHARS = 2000;

export function NotesModal() {
  const isNotesOpen = useGameStore((s) => s.isNotesOpen);
  const setIsNotesOpen = useGameStore((s) => s.setIsNotesOpen);

  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<NotePriority>('normal');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      } else {
        // Initial sample note
        setNotes([
          {
            id: '1',
            title: 'Filo Savunma Planı',
            content: 'Gece filoları [1:204:16] pozisyonuna konuşlandırma göreviyle gönderilecek. Harabe toplayıcılar sabah 08:00de hazır olsun.',
            priority: 'high',
            updatedAt: Date.now() - 3600000,
          },
          {
            id: '2',
            title: 'Maden Hedefleri',
            content: 'Metal Madeni 28 ve Kristal Madeni 24 seviyelerine odaklanılacak. Nanit Fabrikası Seviye 3 için hammadde biriktir.',
            priority: 'normal',
            updatedAt: Date.now() - 7200000,
          },
        ]);
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveNotes = (updated: PlayerNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  if (!isNotesOpen) return null;

  const handleStartCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setPriority('normal');
    setIsCreating(true);
  };

  const handleStartEdit = (note: PlayerNote) => {
    setIsCreating(false);
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setPriority(note.priority);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    if (isCreating) {
      const newNote: PlayerNote = {
        id: Date.now().toString(),
        title: title.trim() || 'Başlıksız Not',
        content: content.slice(0, MAX_CHARS),
        priority,
        updatedAt: Date.now(),
      };
      saveNotes([newNote, ...notes]);
      setIsCreating(false);
    } else if (editingId) {
      const updated = notes.map((n) =>
        n.id === editingId
          ? {
              ...n,
              title: title.trim() || 'Başlıksız Not',
              content: content.slice(0, MAX_CHARS),
              priority,
              updatedAt: Date.now(),
            }
          : n
      );
      saveNotes(updated);
      setEditingId(null);
    }

    setTitle('');
    setContent('');
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
    if (editingId === id) {
      setEditingId(null);
      setTitle('');
      setContent('');
    }
  };

  const getPriorityBadge = (p: NotePriority) => {
    switch (p) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Önemli
          </span>
        );
      case 'normal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Normal
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Önemsiz
          </span>
        );
    }
  };

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
            <FileText className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Kişisel Notlar
            </h2>
            <span className="text-xs font-mono text-zinc-400">({notes.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && !editingId && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Not</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsNotesOpen(false)}
              aria-label="Kapat"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form or Notes List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isCreating || editingId ? (
            <form onSubmit={handleSave} className="space-y-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Not Başlığı..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-400"
                />

                {/* Priority Selection */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                      priority === 'high'
                        ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Önemli
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                      priority === 'normal'
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                      priority === 'low'
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Önemsiz
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={6}
                  placeholder="Not içeriğini buraya yazın..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-1">
                  <span>Maksimum 2.000 karakter</span>
                  <span className={content.length >= MAX_CHARS ? 'text-rose-400' : 'text-zinc-400'}>
                    {content.length} / {MAX_CHARS}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isCreating ? 'Kaydet' : 'Güncelle'}</span>
                </button>
              </div>
            </form>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Henüz kayıtlı bir notunuz yok. Yukarıdaki &quot;Yeni Not&quot; butonuna tıklayarak oluşturabilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-zinc-800/90 bg-[#0d131e]/90 hover:border-zinc-700 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {getPriorityBadge(note.priority)}
                      <h3 className="text-sm font-bold text-zinc-100 truncate">
                        {note.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        aria-label="Düzenle"
                        className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        aria-label="Sil"
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

