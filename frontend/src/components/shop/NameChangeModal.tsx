"use client";

import React, { useState } from "react";
import {
  User,
  Coins,
  CheckCircle2,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface NameChangeModalProps {
  isOpen: boolean;
  currentUsername: string;
  currentDarkMatter: number;
  costDarkMatter: number;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
  isSubmitting: boolean;
}

export function NameChangeModal({
  isOpen,
  currentUsername,
  currentDarkMatter,
  costDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: NameChangeModalProps) {
  const [newName, setNewName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const canAfford = currentDarkMatter >= costDarkMatter;
  const trimmed = newName.trim();

  const handleValidateAndSubmit = async () => {
    if (!trimmed) {
      setErrorMsg("Lütfen yeni bir kullanıcı adı girin.");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 20) {
      setErrorMsg("Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.");
      return;
    }
    const validRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!validRegex.test(trimmed)) {
      setErrorMsg("Yalnızca harf, rakam, alt çizgi (_) ve tire (-) kullanabilirsiniz.");
      return;
    }
    if (trimmed.toLowerCase() === currentUsername.toLowerCase()) {
      setErrorMsg("Yeni kullanıcı adı mevcut adınız ile aynı olamaz.");
      return;
    }

    setErrorMsg(null);
    await onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-[#0d121c] p-6 shadow-2xl overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.25)]">
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-950/50 text-purple-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              Oyuncu Adı Değişikliği
            </h3>
            <p className="text-xs text-zinc-400">
              Mevcut Ad: <span className="font-semibold text-zinc-200">{currentUsername}</span>
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
            Yeni Oyuncu Adı:
          </label>
          <input
            type="text"
            maxLength={20}
            placeholder="Örn: GalaksiKomutani_99"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
          />
          <p className="text-[11px] text-zinc-500">
            3-20 karakter, harf, rakam, tire (-) veya alt çizgi (_).
          </p>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Price & Balance */}
        <div className="mt-5 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block">İşlem Bedeli:</span>
            <span className="font-mono font-bold text-purple-300 text-sm flex items-center gap-1">
              <Coins className="w-4 h-4 text-purple-400" />
              {costDarkMatter.toLocaleString("tr-TR")} KM
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 block">Karanlık Madde Bakiyeniz:</span>
            <span
              className={`font-mono font-bold text-sm ${
                canAfford ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {currentDarkMatter.toLocaleString("tr-TR")} KM
            </span>
          </div>
        </div>

        {!canAfford && (
          <p className="text-xs text-rose-400 text-center mt-2 font-medium">
            Yetersiz Karanlık Madde! İsim değişikliği için en az {costDarkMatter.toLocaleString("tr-TR")} KM gereklidir.
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition"
          >
            İptal
          </button>
          <button
            onClick={handleValidateAndSubmit}
            disabled={!canAfford || isSubmitting || trimmed.length < 3}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              canAfford && !isSubmitting && trimmed.length >= 3
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>İsmi Güncelle (25.000 KM)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

