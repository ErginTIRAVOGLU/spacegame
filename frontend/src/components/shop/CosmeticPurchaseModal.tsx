"use client";

import React from "react";
import {
  CosmeticAvatarItem,
  CosmeticTitleItem,
} from "@/lib/profileShopCatalog";
import {
  Coins,
  CheckCircle2,
  X,
  Sparkles,
  User,
  Compass,
  Pickaxe,
  Shield,
  Cpu,
  Globe,
  Skull,
  Crown,
  Flame,
  Zap,
} from "lucide-react";

interface CosmeticPurchaseModalProps {
  isOpen: boolean;
  item: CosmeticAvatarItem | CosmeticTitleItem | null;
  type: "avatar" | "title";
  currentDarkMatter: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function CosmeticPurchaseModal({
  isOpen,
  item,
  type,
  currentDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: CosmeticPurchaseModalProps) {
  if (!isOpen || !item) return null;

  const canAfford = currentDarkMatter >= item.costDarkMatter;

  const renderIcon = (key: string) => {
    switch (key) {
      case "User":
        return <User className="w-8 h-8 text-cyan-400" />;
      case "Compass":
        return <Compass className="w-8 h-8 text-cyan-400" />;
      case "Pickaxe":
        return <Pickaxe className="w-8 h-8 text-amber-400" />;
      case "Shield":
        return <Shield className="w-8 h-8 text-cyan-400" />;
      case "Cpu":
        return <Cpu className="w-8 h-8 text-purple-400" />;
      case "Globe":
        return <Globe className="w-8 h-8 text-emerald-400" />;
      case "Skull":
        return <Skull className="w-8 h-8 text-rose-400" />;
      case "Crown":
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case "Flame":
        return <Flame className="w-8 h-8 text-amber-400" />;
      case "Zap":
        return <Zap className="w-8 h-8 text-cyan-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-[#0d121c] p-6 shadow-2xl overflow-hidden shadow-[0_0_35px_rgba(34,211,238,0.2)]">
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl border border-zinc-700 bg-zinc-900/90 shadow-inner">
            {renderIcon(item.iconKey)}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              {type === "avatar" ? "Özel Portre" : "Prestij Unvanı"}
            </span>
            <h3 className="text-lg font-bold text-zinc-100">{item.name}</h3>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3.5 rounded-xl border border-zinc-800 bg-[#070b13] text-xs text-zinc-300 leading-relaxed">
          {item.description}
        </div>

        {/* Price & Balance */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block">Kilit Açma Bedeli:</span>
            <span className="font-mono font-bold text-purple-300 text-sm flex items-center gap-1">
              <Coins className="w-4 h-4 text-purple-400" />
              {item.costDarkMatter.toLocaleString("tr-TR")} KM
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
            Yetersiz Karanlık Madde! Bu kozmetik için en az {item.costDarkMatter.toLocaleString("tr-TR")} KM gereklidir.
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
            onClick={onConfirm}
            disabled={!canAfford || isSubmitting}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              canAfford && !isSubmitting
                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kilidi Aç ve Satın Al</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

