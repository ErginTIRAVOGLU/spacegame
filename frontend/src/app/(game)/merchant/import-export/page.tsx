"use client";

import { useEffect, useState } from "react";
import { useGameStore, type MerchantStatus } from "@/store/useGameStore";
import { MerchantNavigation } from "@/components/merchant/MerchantNavigation";
import {
  PackageSearch,
  Gift,
  Boxes,
  Gem,
  Droplets,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";

export default function ImportExportPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchMerchantStatus = useGameStore((s) => s.fetchMerchantStatus);
  const buyImportExportContainer = useGameStore((s) => s.buyImportExportContainer);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [metalPay, setMetalPay] = useState<number>(0);
  const [crystalPay, setCrystalPay] = useState<number>(0);
  const [deutPay, setDeutPay] = useState<number>(0);
  const [wonReward, setWonReward] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStatus = async () => {
    const data = await fetchMerchantStatus(planet.id);
    if (data) {
      setStatus(data);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [planet.id]);

  const requiredValuation = status?.importExport.requiredValuation ?? 75000;
  const alreadyPurchasedToday = status?.importExport.alreadyPurchasedToday ?? false;

  // Paid valuation = (Metal * 1) + (Crystal * 1.5) + (Deut * 3)
  const paidValuation = Math.floor(
    (metalPay * 1.0) + (crystalPay * 1.5) + (deutPay * 3.0)
  );

  const isPaymentSufficient = paidValuation >= requiredValuation;

  const handlePurchase = async () => {
    if (!isPaymentSufficient) {
      setFeedback({
        type: "error",
        text: `Ödeme tutarı yetersiz. En az ${requiredValuation.toLocaleString()} değer puanı ödemelisiniz.`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await buyImportExportContainer(metalPay, crystalPay, deutPay);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setWonReward(res.wonReward ?? "Nadir Takviye Paketi");
      setMetalPay(0);
      setCrystalPay(0);
      setDeutPay(0);
      await loadStatus();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="space-y-4">
      <MerchantNavigation currentRoomTitle="İthalat / İhracat" />

      {/* Hero Header */}
      <div className="rounded-lg border border-purple-500/30 bg-gradient-to-r from-[#170e24] to-[#070b12] p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <PackageSearch className="h-3.5 w-3.5" />
            Galaktik İthalat & İhracat Deposu
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">
            İthalat / İhracat - <span className="text-purple-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Tüccarın getirdiği gizemli konteyneri maden karşılığında satın alın. Her gün (00:00 UTC) yeni bir konteyner teslim edilir.
          </p>
        </div>

        <div className="px-4 py-2 rounded-lg bg-[#0e1420] border border-purple-500/30 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center justify-end gap-1">
            <Clock className="h-3 w-3 text-purple-400" />
            <span>Günlük Durum</span>
          </div>
          <div className="text-xs font-mono font-bold mt-0.5">
            {alreadyPurchasedToday ? (
              <span className="text-amber-400">Bugün Satın Alındı</span>
            ) : (
              <span className="text-emerald-400">1 Konteyner Mevcut</span>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/50 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mystery Container Visual Card */}
        <div className="md:col-span-1 rounded-xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 via-[#130f1c] to-[#080a12] p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-lg">
          <div className="relative">
            <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-purple-600/30 to-amber-600/20 border-2 border-purple-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              {wonReward ? (
                <Gift className="h-14 w-14 text-amber-400 animate-bounce" />
              ) : (
                <PackageSearch className="h-14 w-14 text-purple-300" />
              )}
            </div>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold shadow">
              Günün Ürünü
            </span>
          </div>

          <div>
            <h2 className="text-base font-bold text-zinc-100">
              {status?.importExport.itemName ?? "Gizemli Konteyner"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              İçeriği açılana kadar gizlidir: Maden üretim takviyeleri, bina/tersane krakenleri veya doğrudan Karanlık Madde hediyeleri çıkabilir.
            </p>
          </div>

          {wonReward && (
            <div className="w-full p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-center animate-fade-in">
              <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                Kazanılan Ödül:
              </div>
              <div className="text-xs font-bold text-zinc-100 mt-1">
                {wonReward}
              </div>
            </div>
          )}

          <div className="w-full pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Gereken Değer:</span>
            <span className="text-amber-400 font-bold">
              {requiredValuation.toLocaleString("en-US")} Puan
            </span>
          </div>
        </div>

        {/* Payment Calculator & Action */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800/90 bg-[#090d14]/95 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Ödeme Hesabı (Maden Karışımı)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Konteyner bedelini Metal (x1), Kristal (x1.5) veya Deuterium (x3) birleştirerek ödeyebilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metal Pay */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#0b1018]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                    Metal (x1)
                  </span>
                  <span className="text-zinc-400">Mevcut: {Math.floor(planet.metal).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.floor(planet.metal)}
                    value={metalPay || ""}
                    onChange={(e) => setMetalPay(Math.max(0, Math.min(Math.floor(planet.metal), Number(e.target.value))))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMetalPay(Math.floor(planet.metal))}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Crystal Pay */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#0b1018]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <Gem className="h-3.5 w-3.5 text-cyan-400" />
                    Kristal (x1.5)
                  </span>
                  <span className="text-zinc-400">Mevcut: {Math.floor(planet.crystal).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.floor(planet.crystal)}
                    value={crystalPay || ""}
                    onChange={(e) => setCrystalPay(Math.max(0, Math.min(Math.floor(planet.crystal), Number(e.target.value))))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCrystalPay(Math.floor(planet.crystal))}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Deuterium Pay */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#0b1018]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                    Deuterium (x3)
                  </span>
                  <span className="text-zinc-400">Mevcut: {Math.floor(planet.deuterium).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.floor(planet.deuterium)}
                    value={deutPay || ""}
                    onChange={(e) => setDeutPay(Math.max(0, Math.min(Math.floor(planet.deuterium), Number(e.target.value))))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDeutPay(Math.floor(planet.deuterium))}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Fill Helper */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMetalPay(requiredValuation);
                  setCrystalPay(0);
                  setDeutPay(0);
                }}
                className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-zinc-300"
              >
                Metal ile Doldur ({requiredValuation.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetalPay(0);
                  setCrystalPay(Math.ceil(requiredValuation / 1.5));
                  setDeutPay(0);
                }}
                className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-cyan-300"
              >
                Kristal ile Doldur ({Math.ceil(requiredValuation / 1.5).toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetalPay(0);
                  setCrystalPay(0);
                  setDeutPay(Math.ceil(requiredValuation / 3.0));
                }}
                className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-emerald-300"
              >
                Deut ile Doldur ({Math.ceil(requiredValuation / 3.0).toLocaleString()})
              </button>
            </div>
          </div>

          {/* Output & Purchase Action */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#170e24] to-[#080d16] border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase text-zinc-400">
                Toplam Ödenen Değerleme:
              </div>
              <div className="text-2xl font-mono font-bold text-purple-300 mt-0.5 flex items-center gap-2">
                <span>{paidValuation.toLocaleString("en-US")} Puan</span>
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${isPaymentSufficient ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300" : "bg-zinc-900 border border-zinc-800 text-zinc-400"}`}>
                  {isPaymentSufficient ? "Yeterli Değer" : `Kalan: ${(requiredValuation - paidValuation).toLocaleString()}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !isPaymentSufficient || alreadyPurchasedToday}
              onClick={handlePurchase}
              className="px-6 py-2.5 rounded-md bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.35)] transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {alreadyPurchasedToday
                  ? "Bugünlük Satın Alındı"
                  : !isPaymentSufficient
                  ? "Yetersiz Ödeme"
                  : "Öde ve Aç"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

