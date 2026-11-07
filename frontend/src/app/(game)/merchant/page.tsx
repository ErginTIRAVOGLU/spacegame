"use client";

import Link from "next/link";
import { useGameStore } from "@/store/useGameStore";
import { MerchantNavigation } from "@/components/merchant/MerchantNavigation";
import {
  Coins,
  Scale,
  Gavel,
  Recycle,
  PackageSearch,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function MerchantHubPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const darkMatter = useGameStore((s) => s.darkMatter);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const quadrants = [
    {
      title: "Ham Madde Pazarı",
      subtitle: "Kaynak Satın Alma & 3:2:1 Takas Sistemi",
      href: "/merchant/resources",
      icon: Scale,
      color: "from-cyan-950/80 via-[#0d1c2d] to-[#070d16]",
      border: "border-cyan-500/40 hover:border-cyan-400",
      accent: "text-cyan-300",
      description:
        "Gezegenin 1 günlük üretim paketlerini Karanlık Madde ile anında tedarik edin veya elinizdeki madenleri 3:2:1 galaktik kurlarla takas edin.",
      highlights: [
        "1 Günlük Üretim Paketleri",
        "Karanlık Madde ile Tedarik",
        "Anında Takas Oranı (3 Metal = 2 Kristal = 1 Deut)",
      ],
    },
    {
      title: "Müzayedeci",
      subtitle: "Galaktik Canlı Açık Artırma",
      href: "/merchant/auction",
      icon: Gavel,
      color: "from-amber-950/70 via-[#23170e] to-[#070d16]",
      border: "border-amber-500/40 hover:border-amber-400",
      accent: "text-amber-300",
      description:
        "Nadir güçlendiriciler, kraken/newtron hızlandırıcıları ve gezegen bonusları için diğer komutanlarla maden teklifleriyle yarışın.",
      highlights: [
        "Canlı Geri Sayımlı İhaleler",
        "Katlanmış Teklif Çarpanları (1x Metal, 1.5x Kristal, 3x Deut)",
        "Geri İadesiz Müzayede Formatı",
      ],
    },
    {
      title: "Hurdacı",
      subtitle: "Filo ve Savunma Geri Dönüşümü",
      href: "/merchant/scrapper",
      icon: Recycle,
      color: "from-emerald-950/70 via-[#0d2218] to-[#070d16]",
      border: "border-emerald-500/40 hover:border-emerald-400",
      accent: "text-emerald-300",
      description:
        "İhtiyaç duymadığınız savaş filolarını ve gezegen savunma ünitelerini hurdaya çevirip anında Metal, Kristal ve Deuterium'a dönüştürün.",
      highlights: [
        "Temel %35 Geri Dönüşüm Oranı",
        "KM ile %75'e Varan Pazarlık",
        "Anında Gezegen Rezervine Aktarım",
      ],
    },
    {
      title: "İthalat / İhracat",
      subtitle: "Günün Gizemli Konteyneri",
      href: "/merchant/import-export",
      icon: PackageSearch,
      color: "from-purple-950/75 via-[#1c1228] to-[#070d16]",
      border: "border-purple-500/40 hover:border-purple-400",
      accent: "text-purple-300",
      description:
        "Günde bir kez galaktik tüccarın getirdiği gizemli konteyneri maden puanlarıyla açın ve rastgele nadir ödülleri kazanın.",
      highlights: [
        "Günlük 1 Konteyner Hakkı (00:00 UTC Sıfırlanır)",
        "Maden Değerleme Puanı Ödemesi",
        "Kraken, KM ve Üretim Takviyeleri",
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className="relative rounded-lg border border-amber-500/30 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(245,158,11,0.18) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            Galaktik Ticaret ve Lojistik İstasyonu • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Tüccar Merkezi - <span className="text-amber-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            OGame evreninin 4 ana ticaret kanalı: kaynak satın alımı/takası, açık artırma salonu, filo hurdacısı ve günlük ithalat konteynerleri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-lg bg-[#0e1420] border border-zinc-800 text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Karanlık Madde
            </div>
            <div className="text-sm font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span>{darkMatter.toLocaleString("en-US")} KM</span>
            </div>
          </div>
        </div>
      </div>

      <MerchantNavigation />

      {/* 4-Quadrant Sci-Fi Hub Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className={`group relative rounded-xl border bg-gradient-to-br ${q.color} ${q.border} p-5 flex flex-col justify-between shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(0,0,0,0.8)]`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-amber-400/60 transition-colors">
                      <Icon className={`h-5 w-5 ${q.accent}`} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                        {q.title}
                      </h2>
                      <div className="text-[11px] font-mono text-zinc-400">
                        {q.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mt-3">
                  {q.description}
                </p>

                <div className="mt-4 space-y-1.5">
                  {q.highlights.map((h) => (
                    <div
                      key={h}
                      className="text-[11px] font-mono text-zinc-400 flex items-center gap-2"
                    >
                      <ShieldCheck className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Odaya Giriş Yap</span>
                <span className={`font-semibold flex items-center gap-1 ${q.accent}`}>
                  <span>İşlemleri Görüntüle</span>
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

