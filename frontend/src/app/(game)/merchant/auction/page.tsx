"use client";

import { useEffect, useState } from "react";
import { useGameStore, type MerchantStatus } from "@/store/useGameStore";
import { MerchantNavigation } from "@/components/merchant/MerchantNavigation";
import { useCountdown } from "@/hooks/useCountdown";
import {
  Gavel,
  Clock,
  User,
  Boxes,
  Gem,
  Droplets,
  Trophy,
  History,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
} from "lucide-react";

export default function AuctioneerPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const honorPoints = useGameStore((s) => s.honorPoints);
  const fetchMerchantStatus = useGameStore((s) => s.fetchMerchantStatus);
  const submitAuctionBid = useGameStore((s) => s.submitAuctionBid);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [metalBid, setMetalBid] = useState<number>(0);
  const [crystalBid, setCrystalBid] = useState<number>(0);
  const [deutBid, setDeutBid] = useState<number>(0);
  const [honorBid, setHonorBid] = useState<number>(0);
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
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [planet.id]);

  const countdown = useCountdown(status?.auction.endTimeUtc, undefined, {
    referenceUtc: planet.serverTimeUtc,
    onComplete: () => {
      loadStatus();
    },
  });

  // Effective bid sum: TotalBid = (Metal * 1) + (Crystal * 1.5) + (Deut * 3) + (HonorPoints * 100)
  const effectiveBid = Math.floor(
    (metalBid * 1.0) + (crystalBid * 1.5) + (deutBid * 3.0) + (Math.max(0, honorBid) * 100.0)
  );

  const currentHighest = status?.auction.highestBid ?? 45000;
  const isBidHigher = effectiveBid > currentHighest;

  const handleBid = async () => {
    if (!isBidHigher) {
      setFeedback({
        type: "error",
        text: `Teklifiniz en yüksek tekliften (${currentHighest.toLocaleString()}) büyük olmalıdır.`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await submitAuctionBid(metalBid, crystalBid, deutBid, honorBid);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setMetalBid(0);
      setCrystalBid(0);
      setDeutBid(0);
      setHonorBid(0);
      await loadStatus();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="space-y-4">
      <MerchantNavigation currentRoomTitle="Müzayedeci" />

      {/* Hero Header */}
      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-[#1c120c] to-[#070b12] p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Gavel className="h-3.5 w-3.5" />
            Galaktik Açık Artırma Salonu
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">
            Müzayedeci - <span className="text-amber-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Tüm evrendeki komutanlar nadir eşyalar için maden teklifleriyle yarışıyor. Teklifler anında tahsil edilir ve iade edilmez!
          </p>
        </div>

        <div className="px-4 py-2 rounded-lg bg-[#0e1420] border border-amber-500/30 text-right">
          <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center justify-end gap-1">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>Kalan Süre</span>
          </div>
          <div
            suppressHydrationWarning
            className="text-base font-mono font-bold text-amber-400 mt-0.5 tabular-nums"
          >
            {countdown.formattedTr}
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

      {/* Active Auction Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Item Card */}
        <div className="md:col-span-2 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#141019] to-[#070a10] p-5 flex flex-col justify-between shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                Aktif Müzayede Ürünü
              </span>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[11px] font-mono text-amber-300">
                Açık Artırma Canlı
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {status?.auction.itemName ?? "Bronz Metal Güçlendirici (+%10 / 7 Gün)"}
              </h2>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {status?.auction.description ??
                  "7 gün boyunca gezegenin metal madeni temel üretimini %10 artırır."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#070b12] border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  En Yüksek Teklif
                </div>
                <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                  {currentHighest.toLocaleString("en-US")} Değer Puanı
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#070b12] border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>En Yüksek Teklif Sahibi</span>
                </div>
                <div className="text-base font-bold text-cyan-300 mt-0.5 truncate">
                  {status?.auction.highestBidder ?? "Amiral Vance"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] font-mono text-amber-300/80">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Müzayede süresi bittiğinde en yüksek teklifi veren komutan ürünü anında envanterine alır.</span>
          </div>
        </div>

        {/* Multiplier Formula Card */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/95 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>Teklif Çarpanları</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Müzayedede verilen her maden aşağıdaki katsayılarla çarpılarak toplam teklif değerinizi oluşturur:
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#0b1018] border border-zinc-800">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                  1 Metal
                </span>
                <span className="text-zinc-200 font-bold">= 1.0 Değer</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0b1018] border border-zinc-800">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Gem className="h-3.5 w-3.5 text-cyan-400" />
                  1 Kristal
                </span>
                <span className="text-cyan-300 font-bold">= 1.5 Değer</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0b1018] border border-zinc-800">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                  1 Deuterium
                </span>
                <span className="text-emerald-300 font-bold">= 3.0 Değer</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0b1018] border border-zinc-800">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Award className="h-3.5 w-3.5 text-yellow-400" />
                  1 Onur Puanı (HP)
                </span>
                <span className="text-yellow-400 font-bold">= 100.0 Değer</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 mt-3 pt-2 border-t border-zinc-800">
            Formül: (Metal × 1) + (Kristal × 1.5) + (Deut × 3) + (Onur Puanı × 100)
          </div>
        </div>
      </div>

      {/* Multiplier Bidding Calculator & Action */}
      <div className="rounded-xl border border-zinc-800/90 bg-[#090d14]/95 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Yeni Teklif Ver
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Mevcut gezegen madenlerinizden teklif miktarını belirleyin. Teklif geri iade edilmez!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metal Bid Input */}
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
                value={metalBid || ""}
                onChange={(e) => setMetalBid(Math.max(0, Math.min(Math.floor(planet.metal), Number(e.target.value))))}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setMetalBid(Math.floor(planet.metal))}
                className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
              >
                Max
              </button>
            </div>
          </div>

          {/* Crystal Bid Input */}
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
                value={crystalBid || ""}
                onChange={(e) => setCrystalBid(Math.max(0, Math.min(Math.floor(planet.crystal), Number(e.target.value))))}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setCrystalBid(Math.floor(planet.crystal))}
                className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
              >
                Max
              </button>
            </div>
          </div>

          {/* Deuterium Bid Input */}
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
                value={deutBid || ""}
                onChange={(e) => setDeutBid(Math.max(0, Math.min(Math.floor(planet.deuterium), Number(e.target.value))))}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setDeutBid(Math.floor(planet.deuterium))}
                className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-cyan-300 font-bold"
              >
                Max
              </button>
            </div>
          </div>

          {/* Honor Points Bid Input */}
          <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#0b1018]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-yellow-400" />
                Onur Puanı (x100)
              </span>
              <span className="text-zinc-400">Mevcut: {Math.max(0, honorPoints).toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={Math.max(0, honorPoints)}
                value={honorBid || ""}
                onChange={(e) => setHonorBid(Math.max(0, Math.min(Math.max(0, honorPoints), Number(e.target.value))))}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setHonorBid(Math.max(0, honorPoints))}
                className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-yellow-400 font-bold"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Calculation Bar & Teklif Ver Action */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-[#18110b] to-[#070b12] border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase text-zinc-400">
              Oluşturulan Efektif Teklif Tutarı:
            </div>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-0.5 flex items-center gap-2">
              <span>{effectiveBid.toLocaleString("en-US")} Değer Puanı</span>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${isBidHigher ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300" : "bg-rose-950 border border-rose-500/50 text-rose-300"}`}>
                {isBidHigher ? "Geçerli Teklif" : `En az ${(currentHighest + 1).toLocaleString()} gerekli`}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting || !isBidHigher}
            onClick={handleBid}
            className="px-6 py-2.5 rounded-md bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition"
          >
            <Gavel className="h-4 w-4" />
            <span>Teklif Ver</span>
          </button>
        </div>
      </div>

      {/* Son Müzayedeler Table */}
      <div className="rounded-xl border border-zinc-800/90 bg-[#090d14]/95 p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Son Tamamlanan Müzayedeler (Geçmiş 5 İhale)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-500">
                <th className="py-2 px-3">Kazanılan Ürün</th>
                <th className="py-2 px-3">Kazanan Komutan</th>
                <th className="py-2 px-3">Kapanış Teklifi</th>
                <th className="py-2 px-3 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(status?.auction.recentAuctions ?? []).map((entry, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-zinc-200">
                    {entry.itemName}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300">
                    {entry.winnerName}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">
                    {entry.winningBid.toLocaleString("en-US")} Değer
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 text-right">
                    {new Date(entry.wonAtUtc).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

