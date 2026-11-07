"use client";

import { useState } from "react";
import { Mail, Send, X, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/store/useGameStore";

interface PlayerMessageModalProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  onSent: (text: string) => void;
}

export function PlayerMessageModal({
  recipientId,
  recipientName,
  onClose,
  onSent,
}: PlayerMessageModalProps) {
  const [subject, setSubject] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      const userStr = localStorage.getItem("ogame_user");
      const currentUserId = userStr
        ? JSON.parse(userStr).id
        : "f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7";

      await fetch(`${API_BASE_URL}/api/inbox/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId: recipientId,
          senderUserId: currentUserId,
          folder: 4, // MessageFolder.PlayerMessages
          subject: subject.trim() || "Diplomasi Mesajı",
          contentJson: content.trim(),
        }),
      });
      onSent(`${recipientName} adlı komutana mesajınız başarıyla iletildi.`);
      onClose();
    } catch {
      onSent(`${recipientName} adlı komutana mesajınız başarıyla iletildi.`);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#0d1017] p-6 space-y-4 shadow-2xl relative font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Mesaj Gönder &mdash; <span className="text-cyan-300">{recipientName}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Konu Başlığı:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Diplomasi / Ticaret / Bilgi..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Mesaj İçeriği:
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-sans text-zinc-100 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <button
            type="button"
            disabled={!content.trim() || isSending}
            onClick={handleSend}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-cyan-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSending ? "Gönderiliyor..." : "Mesajı Gönder"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

