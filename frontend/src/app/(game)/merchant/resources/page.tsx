"use client";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { MerchantNavigation } from "@/components/merchant/MerchantNavigation";
import {
  Scale,
  ShoppingBag,
  ArrowRightLeft,
  Boxes,
  Gem,
  Droplets,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function ResourceMarketPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const buyResourcePack = useGameStore((s) => s.buyResourcePack);
  const executeMerchantTrade = useGameStore((s) => s.executeMerchantTrade);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [activeTab, setActiveTab] = useState<"buy" | "trade">("buy");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1-Day (24h) production amounts
  const dailyMetal = Math.max(50000, Math.round(planet.metalPerHour * 24));
  const dailyCrystal = Math.max(30000, Math.round(planet.crystalPerHour * 24));
  const dailyDeut = Math.max(10000, Math.round(planet.deuteriumPerHour * 24));

  // Trade state
  const [targetResource, setTargetResource] = useState<"metal" | "crystal" | "deuterium">("crystal");
  const [spentMetal, setSpentMetal] = useState<number>(0);
  const [spentCrystal, setSpentCrystal] = useState<number>(0);
  const [spentDeut, setSpentDeut] = useState<number>(0);

  // Calculate gained resource at standard 3 : 2 : 1 ratio
  // Value in Deuterium equivalents: Metal/3, Crystal/2, Deut/1
  const valueInDeut =
    (spentMetal / 3.0) + (spentCrystal / 2.0) + (spentDeut / 1.0);
  const gainedAmount = Math.floor(
    targetResource === "metal"
      ? valueInDeut * 3.0
      : targetResource === "crystal"
      ? valueInDeut * 2.0
      : valueInDeut * 1.0
  );

  const handleBuy = async (packType: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    const res = await buyResourcePack(packType);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleTrade = async () => {
    if (spentMetal <= 0 && spentCrystal <= 0 && spentDeut <= 0) {
      setFeedback({ type: "error", text: "Lütfen takas edilecek hammadde miktarı girin." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    const res = await executeMerchantTrade(targetResource, spentMetal, spentCrystal, spentDeut);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setSpentMetal(0);
      setSpentCrystal(0);
      setSpentDeut(0);
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="space-y-4">
      <MerchantNavigation currentRoomTitle="Ham Madde Pazarı" />

      {/* Hero Header */}
      <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-r from-[#0b1422] to-[#070b12] p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Galaktik Maden Borsası
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">
            Ham Madde Pazarı - <span className="text-cyan-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Karanlık Madde karşılığında anında 24 saatlik maden ikmali yapabilir veya elinizdeki madenleri standart 3:2:1 kurlarıyla takas edebilirsiniz.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/90 border border-zinc-800 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab("buy");
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "buy"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-cyan-400" />
            <span>Kaynak Al</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("trade");
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "trade"
                ? "bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400" />
            <span>Kaynak Takas Et</span>
          </button>
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

      {/* 1. Kaynak Al View */}
      {activeTab === "buy" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Metal Pack */}
            <div className="rounded-xl border border-zinc-800/90 bg-[#0a0f18]/90 p-5 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    1 Günlük Üretim
                  </span>
                  <Boxes className="h-5 w-5 text-zinc-300" />
                </div>
                <h3 className="text-base font-bold text-zinc-100 mt-2">
                  Metal Paketi
                </h3>
                <div className="text-xl font-mono font-bold text-zinc-200 mt-1">
                  +{dailyMetal.toLocaleString("en-US")}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Gezegenin 24 saatlik Metal Madeni üretimi kadar hammadde doğrudan rezervlere eklenir.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  5.000 KM
                </span>
                <button
                  type="button"
                  disabled={isSubmitting || darkMatter < 5000}
                  onClick={() => handleBuy("metal")}
                  className="px-3.5 py-1.5 rounded-md bg-gradient-to-b from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono transition"
                >
                  Satın Al
                </button>
              </div>
            </div>

            {/* Crystal Pack */}
            <div className="rounded-xl border border-cyan-500/30 bg-[#0a121c]/90 p-5 flex flex-col justify-between hover:border-cyan-400/60 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    1 Günlük Üretim
                  </span>
                  <Gem className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-base font-bold text-zinc-100 mt-2">
                  Kristal Paketi
                </h3>
                <div className="text-xl font-mono font-bold text-cyan-300 mt-1">
                  +{dailyCrystal.toLocaleString("en-US")}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Gezegenin 24 saatlik Kristal Madeni üretimi kadar hammadde doğrudan rezervlere eklenir.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  5.000 KM
                </span>
                <button
                  type="button"
                  disabled={isSubmitting || darkMatter < 5000}
                  onClick={() => handleBuy("crystal")}
                  className="px-3.5 py-1.5 rounded-md bg-gradient-to-b from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono transition"
                >
                  Satın Al
                </button>
              </div>
            </div>

            {/* Deuterium Pack */}
            <div className="rounded-xl border border-emerald-500/30 bg-[#0a1514]/90 p-5 flex flex-col justify-between hover:border-emerald-400/60 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                    1 Günlük Üretim
                  </span>
                  <Droplets className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="text-base font-bold text-zinc-100 mt-2">
                  Deuterium Paketi
                </h3>
                <div className="text-xl font-mono font-bold text-emerald-300 mt-1">
                  +{dailyDeut.toLocaleString("en-US")}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Gezegenin 24 saatlik Sentezleyici üretimi kadar hammadde doğrudan rezervlere eklenir.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  5.000 KM
                </span>
                <button
                  type="button"
                  disabled={isSubmitting || darkMatter < 5000}
                  onClick={() => handleBuy("deuterium")}
                  className="px-3.5 py-1.5 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono transition"
                >
                  Satın Al
                </button>
              </div>
            </div>
          </div>

          {/* All Resources Bundle */}
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#16141a] to-[#0d121c] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Avantajlı Paket • İndirimli Tedarik
              </span>
              <h3 className="text-lg font-bold text-zinc-100">
                Tüm Kaynakları Satın Al (1 Günlük Üretim Paketi)
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                Gezegenin tüm madenlerinin 24 saatlik üretimini tek seferde indirimli olarak satın alın: +{dailyMetal.toLocaleString()} Metal, +{dailyCrystal.toLocaleString()} Kristal, +{dailyDeut.toLocaleString()} Deuterium.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-mono font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-400" />
                12.000 KM
              </span>
              <button
                type="button"
                disabled={isSubmitting || darkMatter < 12000}
                onClick={() => handleBuy("all")}
                className="px-5 py-2.5 rounded-md bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono shadow-[0_0_15px_rgba(251,191,36,0.3)] transition"
              >
                Paketi Satın Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Kaynak Takas Et View */}
      {activeTab === "trade" && (
        <div className="rounded-xl border border-zinc-800/90 bg-[#090d14]/95 p-5 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              1. Hedef Kaynağı Seçin (Almak İstediğiniz Maden)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Standart Galaktik Takas Kurları: <strong className="text-cyan-300">3 Metal = 2 Kristal = 1 Deuterium</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "metal", label: "Metal", icon: Boxes, color: "text-zinc-300", border: "border-zinc-700" },
              { id: "crystal", label: "Kristal", icon: Gem, color: "text-cyan-300", border: "border-cyan-500" },
              { id: "deuterium", label: "Deuterium", icon: Droplets, color: "text-emerald-300", border: "border-emerald-500" },
            ].map((res) => {
              const Icon = res.icon;
              const isSelected = targetResource === res.id;
              return (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => {
                    setTargetResource(res.id as typeof targetResource);
                    if (res.id === "metal") setSpentMetal(0);
                    if (res.id === "crystal") setSpentCrystal(0);
                    if (res.id === "deuterium") setSpentDeut(0);
                  }}
                  className={`p-4 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? `bg-zinc-900 ${res.border} ring-1 ring-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.2)]`
                      : "bg-[#0c121d] border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${res.color}`} />
                    <div>
                      <div className="text-sm font-bold text-zinc-100">{res.label} Al</div>
                      <div className="text-[11px] font-mono text-zinc-400">Hedef Kaynak</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              2. Takas İçin Verilecek Hammaddeleri Girin
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gezegendeki mevcut madenlerinizden dilediğiniz miktarı seçin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Spend Metal */}
            <div className={`p-4 rounded-lg border bg-[#0b1018] ${targetResource === "metal" ? "opacity-40 pointer-events-none border-zinc-900" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                  Verilecek Metal
                </span>
                <span className="text-zinc-400">Mevcut: {Math.floor(planet.metal).toLocaleString()}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={Math.floor(planet.metal)}
                  value={spentMetal || ""}
                  onChange={(e) => setSpentMetal(Math.max(0, Math.min(Math.floor(planet.metal), Number(e.target.value))))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setSpentMetal(Math.floor(planet.metal))}
                  className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-[11px] font-mono text-cyan-300 font-bold"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Spend Crystal */}
            <div className={`p-4 rounded-lg border bg-[#0b1018] ${targetResource === "crystal" ? "opacity-40 pointer-events-none border-zinc-900" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Gem className="h-3.5 w-3.5 text-cyan-400" />
                  Verilecek Kristal
                </span>
                <span className="text-zinc-400">Mevcut: {Math.floor(planet.crystal).toLocaleString()}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={Math.floor(planet.crystal)}
                  value={spentCrystal || ""}
                  onChange={(e) => setSpentCrystal(Math.max(0, Math.min(Math.floor(planet.crystal), Number(e.target.value))))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setSpentCrystal(Math.floor(planet.crystal))}
                  className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-[11px] font-mono text-cyan-300 font-bold"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Spend Deuterium */}
            <div className={`p-4 rounded-lg border bg-[#0b1018] ${targetResource === "deuterium" ? "opacity-40 pointer-events-none border-zinc-900" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                  Verilecek Deuterium
                </span>
                <span className="text-zinc-400">Mevcut: {Math.floor(planet.deuterium).toLocaleString()}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={Math.floor(planet.deuterium)}
                  value={spentDeut || ""}
                  onChange={(e) => setSpentDeut(Math.max(0, Math.min(Math.floor(planet.deuterium), Number(e.target.value))))}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setSpentDeut(Math.floor(planet.deuterium))}
                  className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-[11px] font-mono text-cyan-300 font-bold"
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          {/* Trade Output Calculation Summary & Execute Button */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#0d1624] to-[#080d16] border border-cyan-500/35 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase text-zinc-400">
                Elde Edilecek Hedef Kaynak:
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-0.5 flex items-center gap-2">
                <span>+{gainedAmount.toLocaleString("en-US")}</span>
                <span className="text-sm font-sans font-normal text-zinc-300 capitalize">
                  {targetResource}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || gainedAmount <= 0}
              onClick={handleTrade}
              className="px-6 py-2.5 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Takası Gerçekleştir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

