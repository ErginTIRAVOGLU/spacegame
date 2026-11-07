"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { API_BASE_URL } from "@/store/useGameStore";

interface DarkMatterTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (newDarkMatter: number) => void;
}

const DM_PACKAGES = [
  { amount: 30000, bonus: 0, label: "30.000 KM", price: "₺89,90", tag: "Temel" },
  { amount: 100000, bonus: 10000, label: "100.000 KM", price: "₺249,90", tag: "+10K Bonus" },
  { amount: 250000, bonus: 35000, label: "250.000 KM", price: "₺549,90", tag: "+35K Bonus", popular: true },
  { amount: 500000, bonus: 100000, label: "500.000 KM", price: "₺999,90", tag: "+100K Mega" },
  { amount: 1000000, bonus: 250000, label: "1.000.000 KM", price: "₺1.799,90", tag: "+250K VIP", epic: true },
];

export function DarkMatterTopupModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: DarkMatterTopupModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(DM_PACKAGES[2]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTopup = async () => {
    if (isSubmitting || !userId) return;
    setIsSubmitting(true);
    setStatusMsg(null);

    const totalDm = selectedPackage.amount + selectedPackage.bonus;
    try {
      const res = await fetch(`${API_BASE_URL}/api/officers/topup?userId=${userId}&amount=${totalDm}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`${totalDm.toLocaleString("tr-TR")} KM başarıyla hesabınıza aktarıldı!`);
        if (typeof data.darkMatter === "number") {
          onSuccess(data.darkMatter);
        }
        setTimeout(() => {
          setStatusMsg(null);
          onClose();
        }, 1500);
      } else {
        setStatusMsg("İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.");
      }
    } catch {
      setStatusMsg("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-600/60 bg-gradient-to-b from-[#0a1612] via-[#08100d] to-[#040806] p-6 shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/60 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300">
                Karanlık Madde Temin Et
              </h2>
              <p className="text-xs text-zinc-400">
                Galaktik ticaret ağından anında güvenli ikmal sağlayın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Package Grid */}
        <div className="my-5 space-y-2.5">
          {DM_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.amount === pkg.amount;
            return (
              <div
                key={pkg.amount}
                onClick={() => setSelectedPackage(pkg)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-emerald-400 bg-emerald-500" : "border-zinc-600 bg-zinc-900"}`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-zinc-950" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">
                        {pkg.label}
                      </span>
                      {pkg.tag && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          pkg.epic
                            ? "bg-cyan-950 border border-cyan-500 text-cyan-300"
                            : pkg.popular
                            ? "bg-amber-950 border border-amber-500 text-amber-300"
                            : "bg-emerald-950 border border-emerald-600 text-emerald-300"
                        }`}>
                          {pkg.tag}
                        </span>
                      )}
                    </div>
                    {pkg.bonus > 0 && (
                      <p className="text-[11px] text-emerald-400 font-medium">
                        Toplam Teslimat: {(pkg.amount + pkg.bonus).toLocaleString("tr-TR")} KM
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-100">
                    {pkg.price}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {statusMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-emerald-950/50 p-2.5 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Footer / CTA */}
        <div className="flex items-center justify-between border-t border-emerald-900/40 pt-4">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>256-bit Galaktik Güvenlik Doğrulaması</span>
          </div>

          <button
            onClick={handleTopup}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg border border-emerald-500 bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Yükleniyor...</span>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" />
                <span>Hemen Temin Et ({selectedPackage.price})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
