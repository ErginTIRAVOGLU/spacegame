"use client";

import React from "react";
import {
  QuarterlyOfficerItem,
  formatQuarterlyDuration,
} from "@/lib/quarterlyBoostersCatalog";
import {
  Crown,
  Shield,
  Zap,
  Pickaxe,
  GraduationCap,
  Sparkles,
  Coins,
  CheckCircle2,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";

interface QuarterlyOfficerModalProps {
  isOpen: boolean;
  officer: QuarterlyOfficerItem | null;
  currentDarkMatter: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function QuarterlyOfficerModal({
  isOpen,
  officer,
  currentDarkMatter,
  onClose,
  onConfirm,
  isSubmitting,
}: QuarterlyOfficerModalProps) {
  if (!isOpen || !officer) return null;

  const canAfford = currentDarkMatter >= officer.costDarkMatter;
  const isStaff = officer.officerKey === "Staff";

  const getOfficerIcon = (key: string) => {
    switch (key) {
      case "Commander":
        return <Crown className="w-6 h-6 text-amber-400" />;
      case "Admiral":
        return <Shield className="w-6 h-6 text-cyan-400" />;
      case "Engineer":
        return <Zap className="w-6 h-6 text-yellow-400" />;
      case "Geologist":
        return <Pickaxe className="w-6 h-6 text-emerald-400" />;
      case "Technocrat":
        return <GraduationCap className="w-6 h-6 text-purple-400" />;
      case "Staff":
        return <Sparkles className="w-6 h-6 text-yellow-300" />;
      default:
        return <Crown className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getCalculatedNewDuration = () => {
    if (!officer.isActive || officer.remainingSeconds <= 0) {
      return "90 Gün (2.160 Saat)";
    }
    const currentDays = Math.floor(officer.remainingSeconds / 86400);
    const newDays = currentDays + 90;
    return `~${newDays} Gün (+90 Gün Eklendi)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#0c111a] p-6 shadow-2xl overflow-hidden"
        style={{
          boxShadow: isStaff
            ? "0 0 45px rgba(234, 179, 8, 0.3)"
            : "0 0 35px rgba(168, 85, 247, 0.25)",
        }}
      >
        {/* Glow Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
            isStaff
              ? "from-amber-400 via-yellow-300 to-amber-500"
              : "from-purple-500 via-cyan-400 to-purple-500"
          }`}
        />

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
          <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-900/90 shadow-md">
            {getOfficerIcon(officer.officerKey)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              {officer.name}
              {isStaff && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/50 bg-yellow-950/70 text-yellow-300 font-mono">
                  Tam Kadro (3 Ay)
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              {officer.isActive
                ? "Mevcut Görev Süresini +90 Gün Uzat"
                : "90 Günlük Görev Sözleşmesi Başlat"}
            </p>
          </div>
        </div>

        {/* Staff Super Discount Banner */}
        {isStaff && (
          <div className="mt-4 p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs flex items-center justify-between">
            <span className="font-semibold text-amber-300">
              Tek Tek Alım: 362.500 KM
            </span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
              150.000 KM Tasarruf
            </span>
          </div>
        )}

        {/* Officer Perks */}
        <div className="mt-4 p-3.5 rounded-xl border border-zinc-800 bg-[#070b13] space-y-2">
          <p className="text-xs text-zinc-300 font-medium">{officer.description}</p>
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              90 Gün Boyunca Sağlanan Haklar:
            </span>
            {officer.perksSummary.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacking Rule Duration Preview */}
        <div className="mt-4 p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              Mevcut Durum:
            </span>
            <span className="font-semibold text-zinc-200">
              {officer.isActive ? (
                <span className="text-emerald-400">
                  Aktif ({formatQuarterlyDuration(officer.remainingSeconds)})
                </span>
              ) : (
                <span className="text-zinc-500">Aktif Değil</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-purple-500/20">
            <span className="text-zinc-400">Satın Alma Sonrası Süre:</span>
            <span className="font-mono font-bold text-cyan-300">
              {getCalculatedNewDuration()}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal pt-1">
            {officer.isActive
              ? "Subay sözleşmeleri süre olarak birikimlidir. Kalan sürenizin üzerine tam 90 gün (2.160 saat) ilave edilir."
              : "Subayınız satın alma anından itibaren tam 90 gün boyunca tüm gezegenleriniz ve filolarınız için devrede kalır."}
          </p>
        </div>

        {/* Price & Balance */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block">Maliyet:</span>
            <span className="font-mono font-bold text-purple-300 text-sm flex items-center gap-1">
              <Coins className="w-4 h-4 text-purple-400" />
              {officer.costDarkMatter.toLocaleString("tr-TR")} KM
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
            Yetersiz Karanlık Madde! Bu işlem için en az{" "}
            {officer.costDarkMatter.toLocaleString("tr-TR")} KM gereklidir.
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
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {officer.isActive ? "Süreyi Uzat (+90 Gün)" : "Abonelik Başlat (90 Gün)"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

