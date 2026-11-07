"use client";

import { useEffect, useState } from "react";
import { useGameStore, type MerchantStatus } from "@/store/useGameStore";
import { MerchantNavigation } from "@/components/merchant/MerchantNavigation";
import {
  Recycle,
  Sparkles,
  Rocket,
  Shield,
  Boxes,
  Gem,
  Droplets,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const UNIT_CATALOG: Record<
  number,
  { name: string; category: "ship" | "defense"; metal: number; crystal: number; deut: number }
> = {
  // Ships
  202: { name: "Küçük Nakliye", category: "ship", metal: 2000, crystal: 2000, deut: 0 },
  203: { name: "Büyük Nakliye", category: "ship", metal: 6000, crystal: 6000, deut: 0 },
  204: { name: "Hafif Avcı", category: "ship", metal: 3000, crystal: 1000, deut: 0 },
  205: { name: "Ağır Avcı", category: "ship", metal: 6000, crystal: 4000, deut: 0 },
  206: { name: "Kruvazör", category: "ship", metal: 20000, crystal: 7000, deut: 2000 },
  207: { name: "Komuta Gemisi", category: "ship", metal: 45000, crystal: 15000, deut: 0 },
  208: { name: "Koloni Gemisi", category: "ship", metal: 10000, crystal: 20000, deut: 10000 },
  209: { name: "Geri Dönüşümcü", category: "ship", metal: 10000, crystal: 6000, deut: 2000 },
  210: { name: "Casus Sondası", category: "ship", metal: 0, crystal: 1000, deut: 0 },
  211: { name: "Bombardıman Gemisi", category: "ship", metal: 50000, crystal: 25000, deut: 15000 },
  212: { name: "Solar Uydu", category: "ship", metal: 0, crystal: 2000, deut: 500 },
  213: { name: "Muhrip", category: "ship", metal: 60000, crystal: 50000, deut: 15000 },
  214: { name: "Ölüm Yıldızı", category: "ship", metal: 5000000, crystal: 4000000, deut: 1000000 },
  215: { name: "Fırkateyn (Battlecruiser)", category: "ship", metal: 30000, crystal: 40000, deut: 15000 },

  // Defenses
  401: { name: "Roketatar", category: "defense", metal: 2000, crystal: 0, deut: 0 },
  402: { name: "Hafif Lazer", category: "defense", metal: 1500, crystal: 500, deut: 0 },
  403: { name: "Ağır Lazer", category: "defense", metal: 6000, crystal: 2000, deut: 0 },
  404: { name: "Gaus Topu", category: "defense", metal: 20000, crystal: 15000, deut: 2000 },
  405: { name: "İyon Topu", category: "defense", metal: 2000, crystal: 6000, deut: 0 },
  406: { name: "Plazma Atıcı", category: "defense", metal: 50000, crystal: 50000, deut: 30000 },
  407: { name: "Küçük Kalkan Kubbesi", category: "defense", metal: 10000, crystal: 10000, deut: 0 },
  408: { name: "Büyük Kalkan Kubbesi", category: "defense", metal: 50000, crystal: 50000, deut: 0 },
  502: { name: "Yakalıyıcı Roket", category: "defense", metal: 8000, crystal: 0, deut: 2000 },
  503: { name: "Gezegenlerarası Roket", category: "defense", metal: 12500, crystal: 2500, deut: 10000 },
};

export default function ScrapperPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const fetchMerchantStatus = useGameStore((s) => s.fetchMerchantStatus);
  const scrapperBargain = useGameStore((s) => s.scrapperBargain);
  const scrapperRecycle = useGameStore((s) => s.scrapperRecycle);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"ship" | "defense">("ship");
  const [selectedCounts, setSelectedCounts] = useState<Record<number, number>>({});
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

  const scrapRate = status?.scrapper.scrapRatePercent ?? 35;
  const rateMultiplier = scrapRate / 100.0;

  // Filter stationed units on current planet matching active category
  const stationedUnits = planet.units
    .filter((u) => {
      const meta = UNIT_CATALOG[u.unitType];
      return meta && meta.category === activeTab && u.count > 0;
    });

  // Calculate total yielded scrap resources
  let totalYieldMetal = 0;
  let totalYieldCrystal = 0;
  let totalYieldDeut = 0;

  for (const [unitTypeIdStr, count] of Object.entries(selectedCounts)) {
    const unitTypeId = Number(unitTypeIdStr);
    const meta = UNIT_CATALOG[unitTypeId];
    if (meta && count > 0) {
      totalYieldMetal += meta.metal * count * rateMultiplier;
      totalYieldCrystal += meta.crystal * count * rateMultiplier;
      totalYieldDeut += meta.deut * count * rateMultiplier;
    }
  }

  const hasSelectedUnits = Object.values(selectedCounts).some((c) => c > 0);

  const handleBargain = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const res = await scrapperBargain();
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      await loadStatus();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleRecycle = async () => {
    if (!hasSelectedUnits) {
      setFeedback({ type: "error", text: "Lütfen hurdaya çevirmek için en az bir ünite seçin." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    const res = await scrapperRecycle(selectedCounts);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setSelectedCounts({});
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="space-y-4">
      <MerchantNavigation currentRoomTitle="Hurdacı" />

      {/* Hero Header */}
      <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-[#0d1e16] to-[#070b12] p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Recycle className="h-3.5 w-3.5" />
            Galaktik Filo & Savunma Geri Dönüşümü
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">
            Hurdacı - <span className="text-emerald-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            İhtiyaç duymadığınız filoları ve savunma taretlerini hurdaya verip madene dönüştürün. Karanlık Madde ile pazarlık ederek oranı %75'e kadar yükseltebilirsiniz.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/90 border border-zinc-800 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ship");
              setSelectedCounts({});
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "ship"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Rocket className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gemiler</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("defense");
              setSelectedCounts({});
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "defense"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>Savunma Binaları</span>
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

      {/* Main Layout: Left Bargaining & Yield Panel, Right Unit Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Scrapper Portrait & Bargaining Card */}
        <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-b from-[#0f1d16]/95 via-[#0a1410]/95 to-[#070a0e]/95 p-5 flex flex-col justify-between shadow-md space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Recycle className="h-4 w-4" />
                Hurdacı İstasyonu
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-xs font-mono font-bold text-emerald-300">
                %{scrapRate} Geri Dönüşüm
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Hurdacı, hurdaya çıkarılan birimlerin maliyetinin{" "}
              <strong className="text-emerald-300">%{scrapRate}</strong> kadarını hammadde olarak geri öder.
            </p>

            {/* Bargain Action Box */}
            <div className="p-3.5 rounded-lg bg-[#070b10] border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Pazarlık Ücreti:</span>
                <span className="text-purple-300 font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  2.000 KM
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Pazarlık ederek hurda oranını anında %75&apos;e kadar yükseltebilirsiniz.
              </p>
              <button
                type="button"
                disabled={isSubmitting || darkMatter < 2000 || scrapRate >= 75}
                onClick={handleBargain}
                className="w-full py-2 rounded bg-gradient-to-r from-purple-600/30 via-purple-500/25 to-amber-600/30 hover:from-purple-500/40 hover:to-amber-500/40 border border-purple-400/50 text-xs font-mono font-semibold text-purple-200 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                <span>
                  {scrapRate >= 75 ? "Maksimum Orana (%75) Ulaşıldı" : "Pazarlık Et (+%KM)"}
                </span>
              </button>
            </div>

            {/* Total Yielded Scrap Resources Preview */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Geri Kazanılacak Madenler:
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-[#070b10] border border-zinc-800/80">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-zinc-400" />
                    Metal:
                  </span>
                  <span className="text-zinc-100 font-bold">
                    +{Math.floor(totalYieldMetal).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#070b10] border border-zinc-800/80">
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <Gem className="h-3.5 w-3.5 text-cyan-400" />
                    Kristal:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    +{Math.floor(totalYieldCrystal).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#070b10] border border-zinc-800/80">
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                    Deuterium:
                  </span>
                  <span className="text-emerald-300 font-bold">
                    +{Math.floor(totalYieldDeut).toLocaleString("en-US")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recycle Submit Button */}
          <button
            type="button"
            disabled={isSubmitting || !hasSelectedUnits}
            onClick={handleRecycle}
            className="w-full py-3 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
          >
            <Recycle className="h-4 w-4" />
            <span>Hurdaya Çevir</span>
          </button>
        </div>

        {/* Right: Stationed Unit Selection Grid */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800/90 bg-[#090d14]/95 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Gezegende Konuşlu {activeTab === "ship" ? "Filolar" : "Savunma Üniteleri"}
              </h2>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                Hurdaya çevrilecek adetleri girin veya &quot;&gt;&gt; Max&quot; ile tümünü seçin.
              </p>
            </div>
          </div>

          {stationedUnits.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500 space-y-1">
              <div>Bu gezegende konuşlu {activeTab === "ship" ? "gemi" : "savunma ünitesi"} bulunmuyor.</div>
              <div className="text-[11px] text-zinc-600">Tersaneden yeni birimler inşa edebilirsiniz.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stationedUnits.map((u) => {
                const meta = UNIT_CATALOG[u.unitType];
                const selected = selectedCounts[u.unitType] ?? 0;
                return (
                  <div
                    key={u.unitType}
                    className="p-3 rounded-lg border border-zinc-800/90 bg-[#0b1018] flex flex-col justify-between space-y-2 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {meta.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {u.count.toLocaleString()} Adet
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={u.count}
                        value={selected || ""}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(u.count, Number(e.target.value)));
                          setSelectedCounts((prev) => ({ ...prev, [u.unitType]: val }));
                        }}
                        placeholder="0"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCounts((prev) => ({ ...prev, [u.unitType]: u.count }))
                        }
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-[11px] font-mono text-emerald-300 font-bold whitespace-nowrap"
                      >
                        &gt;&gt; Max
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                      <span>Birim maliyeti:</span>
                      {meta.metal > 0 && <span>{meta.metal} Met</span>}
                      {meta.crystal > 0 && <span>{meta.crystal} Kri</span>}
                      {meta.deut > 0 && <span>{meta.deut} Deut</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

