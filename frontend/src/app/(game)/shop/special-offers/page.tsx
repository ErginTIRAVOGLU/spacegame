"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  SpecialOffersResponse,
  CompositeBundleItem,
  LadderBoosterItem,
  formatEventRemaining,
} from "@/lib/specialOffersCatalog";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  ShoppingBag,
  Sparkles,
  Hammer,
  Tag,
  Clock,
  Coins,
  Crown,
  Shield,
  Zap,
  Pickaxe,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Globe,
  Flame,
  ArrowRight,
  Info,
  CalendarDays,
  User,
  Percent,
  Timer,
  Package,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function ShopSpecialOffersPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [data, setData] = useState<SpecialOffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(403200);

  // Submitting States
  const [submittingBundleId, setSubmittingBundleId] = useState<string | null>(null);
  const [isResourcePackSubmitting, setIsResourcePackSubmitting] = useState(false);

  // Feedback Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const selectedPlanet = useMemo(() => {
    return (
      planets.find((p) => p.id === selectedPlanetId) ||
      planets[0] || {
        id: selectedPlanetId || "",
        name: "Ana Gezegen",
        galaxy: 1,
        system: 1,
        slot: 1,
        isMoon: false,
      }
    );
  }, [planets, selectedPlanetId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/api/shop/special-offers?planetId=${selectedPlanet?.id || ""}${
        userId ? `&userId=${userId}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const json: SpecialOffersResponse = await res.json();
        setData(json);
        setRemainingSeconds(json.eventRemainingSeconds);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlanet?.id, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Purchase Bundle
  const handleBuyBundle = async (bundle: CompositeBundleItem) => {
    if (!selectedPlanet?.id) return;
    try {
      setSubmittingBundleId(bundle.bundleId);
      const res = await fetch(`${API_BASE_URL}/api/shop/special-offers/buy-bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.bundleId,
          planetId: selectedPlanet.id,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: resData.message || "Satın alma başarısız.", type: "error" });
      } else {
        setFeedbackMessage({ text: resData.message, type: "success" });
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setSubmittingBundleId(null);
    }
  };

  // Purchase 1-Day Resource Pack
  const handleBuyResourcePack = async () => {
    if (!selectedPlanet?.id) return;
    try {
      setIsResourcePackSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/shop/special-offers/buy-resource-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId: selectedPlanet.id,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: resData.message || "Hammadde yüklenemedi.", type: "error" });
      } else {
        setFeedbackMessage({ text: resData.message, type: "success" });
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsResourcePackSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* EVENT BANNER HEADER */}
      <div
        className="relative rounded-2xl border border-rose-500/40 bg-[#090b14] p-6 overflow-hidden shadow-[0_8px_30px_rgba(244,63,94,0.18)]"
        style={{
          backgroundImage:
            "radial-gradient(100% 150% at 90% 0%, rgba(244,63,94,0.2) 0%, rgba(168,85,247,0.12) 45%, rgba(9,11,20,0.98) 100%)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-500/60 bg-rose-950/80 text-rose-300 animate-pulse flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                CANLI ETKİNLİK
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-500/50 bg-amber-950/70 text-amber-300">
                {data?.eventPromoBadge || "%10 ila %50 İndirim"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-2 flex items-center gap-2">
              {data?.eventTitle || "Platin İtem Haftası & Gezegen Taşıma Şenliği"}
            </h1>

            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Sınırlı süre boyunca kademeli güçlendirici indirimleri, %50 Gezegen Taşıma indirimi,
              %20 Sınıf Değiştirme fırsatı ve süper kompozit başlangıç paketleri devrede!
            </p>

            {/* Sub-Category Navigation Tabs (7 tabs) */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Link
                href="/shop/classes"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span>Sınıf Değişimi</span>
              </Link>
              <Link
                href="/shop/construction"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <Hammer className="w-3.5 h-3.5 text-zinc-500" />
                <span>İnşa Ürünleri</span>
              </Link>
              <Link
                href="/shop/items"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tüm Eşyalar (71+)</span>
              </Link>
              <Link
                href="/shop/boosters-30d"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>30 Günlük Paketler</span>
              </Link>
              <Link
                href="/shop/boosters-90d"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                <span>90 Günlük Paketler</span>
              </Link>
              <Link
                href="/shop/profile"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Profil & Özelleştirme</span>
              </Link>
              <Link
                href="/shop/special-offers"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-rose-950/80 border border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Özel İndirimler</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500 text-black font-extrabold ml-1">
                  SALE
                </span>
              </Link>
            </div>
          </div>

          {/* Event Timer & Balance Widget */}
          <div className="flex flex-col sm:items-end gap-3">
            <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/40 text-right shadow-md">
              <span className="text-[10px] font-mono uppercase text-rose-300/80 flex items-center justify-end gap-1">
                <Timer className="w-3.5 h-3.5 text-rose-400" />
                Etkinlik Kalan Süre
              </span>
              <div className="text-base font-mono font-bold text-white mt-0.5 tracking-wider">
                {formatEventRemaining(remainingSeconds)}
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-[#0e1420] border border-zinc-800 text-right">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Karanlık Madde Bakiyesi
              </span>
              <div className="text-sm font-mono font-bold text-purple-300 flex items-center justify-end gap-1 mt-0.5">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                <span>{darkMatter.toLocaleString("tr-TR")} KM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/50 border-rose-500/50 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 text-xs underline ml-4"
          >
            Kapat
          </button>
        </div>
      )}

      {/* SECTION 1: FLASH DISCOUNTS (FLASH SALES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flash 1: Relocation 50% */}
        <div className="p-4 rounded-xl border border-rose-500/50 bg-gradient-to-b from-rose-950/30 to-[#0a0f19] flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
            %50 Mega İndirim
          </div>
          <div>
            <div className="flex items-center gap-2 text-rose-300">
              <Globe className="w-5 h-5" />
              <h3 className="font-bold text-sm text-zinc-100">Gezegen Taşıma</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-snug">
              240.000 KM yerine sadece 120.000 KM karşılığı boş bir koordinata intikal.
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xs text-zinc-500 line-through font-mono">
                240.000 KM
              </span>
              <span className="text-base font-mono font-bold text-rose-300">
                120.000 KM
              </span>
            </div>
          </div>
          <Link
            href="/shop/profile"
            className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider text-center transition"
          >
            Gezegen Taşı (Profil)
          </Link>
        </div>

        {/* Flash 2: Class Change 20% */}
        <div className="p-4 rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-[#0a0f19] flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-600 text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
            %20 İndirim
          </div>
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm text-zinc-100">Sınıf Değiştirme</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-snug">
              Kolektör, General veya Kaşif sınıfı geçiş jetonlarında 100.000 KM indirim fırsatı.
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xs text-zinc-500 line-through font-mono">
                500.000 KM
              </span>
              <span className="text-base font-mono font-bold text-amber-300">
                400.000 KM
              </span>
            </div>
          </div>
          <Link
            href="/shop/classes"
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider text-center transition"
          >
            Sınıf Değiştir
          </Link>
        </div>

        {/* Flash 3: 1-Day Full Resource Pack 30% */}
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-[#0a0f19] flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
            %30 İndirim
          </div>
          <div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Boxes className="w-5 h-5" />
              <h3 className="font-bold text-sm text-zinc-100">Tam Hammadde Paketi</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-snug">
              Seçili gezegeninize anında 24 saatlik maden üretimi (Metal, Kristal, Deut).
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xs text-zinc-500 line-through font-mono">
                120.000 KM
              </span>
              <span className="text-base font-mono font-bold text-emerald-300">
                84.000 KM
              </span>
            </div>
          </div>
          <button
            onClick={handleBuyResourcePack}
            disabled={isResourcePackSubmitting || darkMatter < 84000}
            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              darkMatter >= 84000 && !isResourcePackSubmitting
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isResourcePackSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto block" />
            ) : (
              "Hemen Doldur (84k KM)"
            )}
          </button>
        </div>

        {/* Flash 4: Speedup Base Discount 25% */}
        <div className="p-4 rounded-xl border border-cyan-500/50 bg-gradient-to-b from-cyan-950/30 to-[#0a0f19] flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
            %25 İndirim
          </div>
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Zap className="w-5 h-5" />
              <h3 className="font-bold text-sm text-zinc-100">Hızlandırma İndirimi</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-snug">
              Bina, araştırma ve tersane yarıya indirme taban bedelleri 750 KM yerine 562 KM!
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xs text-zinc-500 line-through font-mono">
                750 KM
              </span>
              <span className="text-base font-mono font-bold text-cyan-300">
                562 KM (Taban)
              </span>
            </div>
          </div>
          <div className="py-2 text-center text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/50 rounded-lg border border-cyan-800/40">
            Tüm Sayfalarda Aktif
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPOSITE BUNDLES */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Özel Kombinasyon Paketleri (Composite Bundles)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Birlikte alındığında %25 ila %32 oranında net Karanlık Madde tasarrufu sunan özel küratörlü paketler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.bundles.map((bundle) => {
            const isSubmitting = submittingBundleId === bundle.bundleId;
            const canAfford = darkMatter >= bundle.bundlePriceDarkMatter;
            const savings = bundle.originalValueDarkMatter - bundle.bundlePriceDarkMatter;

            return (
              <div
                key={bundle.bundleId}
                className="rounded-2xl border border-zinc-700/80 bg-[#0a0f19] p-5 flex flex-col justify-between shadow-xl relative overflow-hidden hover:border-amber-500/60 transition"
              >
                {/* Savings Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black">
                    %{bundle.discountPercent} İNDİRİM
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {savings.toLocaleString("tr-TR")} KM TASARRUF
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-zinc-100 text-base">{bundle.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{bundle.description}</p>

                  {/* Included Items */}
                  <div className="mt-4 p-3 rounded-xl border border-zinc-800 bg-[#070b13] space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                      Paket İçeriği:
                    </span>
                    {bundle.itemsIncluded.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-zinc-300">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Action */}
                <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 line-through font-mono block">
                      {bundle.originalValueDarkMatter.toLocaleString("tr-TR")} KM
                    </span>
                    <div className="text-base font-mono font-bold text-purple-300 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-purple-400" />
                      <span>{bundle.bundlePriceDarkMatter.toLocaleString("tr-TR")} KM</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyBundle(bundle)}
                    disabled={!canAfford || isSubmitting}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                      canAfford && !isSubmitting
                        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Satın Al</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: LADDER BOOSTER SALES */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            Kademeli Booster ve Platin İndirimleri (Ladder Sale)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Platin hafta etkinlik indirimleri ile 90 günlük maden çarpanlarını %20 tasarrufla edinin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.ladderBoosters.map((booster) => {
            return (
              <div
                key={booster.itemCode}
                className="p-4 rounded-xl border border-cyan-500/40 bg-[#0a0f19] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                      +{booster.percent}% Üretim
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold">
                      -%{booster.discountPercent}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-100 text-sm mt-3">{booster.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{booster.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 line-through font-mono block">
                      {booster.basePrice.toLocaleString("tr-TR")} KM
                    </span>
                    <span className="text-sm font-mono font-bold text-purple-300">
                      {booster.salePrice.toLocaleString("tr-TR")} KM
                    </span>
                  </div>

                  <Link
                    href="/shop/boosters-90d"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase transition flex items-center gap-1"
                  >
                    <span>İncele</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

