"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  MonthlyBoosterItem,
  MonthlyOfficerItem,
  Boosters30dResponse,
  TIER_CONFIG,
  RESOURCE_CONFIG,
  formatBoosterDuration,
} from "@/lib/monthlyBoostersCatalog";
import { BoosterOverwriteModal } from "@/components/shop/BoosterOverwriteModal";
import { OfficerPurchaseModal } from "@/components/shop/OfficerPurchaseModal";
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
  GraduationCap,
  Boxes,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Globe,
  Flame,
  ArrowRight,
  Info,
  CalendarDays,
  User,
} from "lucide-react";

export default function Shop30DayBoostersPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [boosters, setBoosters] = useState<MonthlyBoosterItem[]>([]);
  const [officers, setOfficers] = useState<MonthlyOfficerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [selectedBooster, setSelectedBooster] =
    useState<MonthlyBoosterItem | null>(null);
  const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);
  const [isBoosterSubmitting, setIsBoosterSubmitting] = useState(false);

  const [selectedOfficer, setSelectedOfficer] =
    useState<MonthlyOfficerItem | null>(null);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [isOfficerSubmitting, setIsOfficerSubmitting] = useState(false);

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
    if (!selectedPlanet?.id) return;
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/api/shop/boosters-30d?planetId=${selectedPlanet.id}${
        userId ? `&userId=${userId}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data: Boosters30dResponse = await res.json();
        setBoosters(data.boosters || []);
        setOfficers(data.officers || []);
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

  // Booster click handler
  const handleBoosterClick = (booster: MonthlyBoosterItem) => {
    setSelectedBooster(booster);
    setIsBoosterModalOpen(true);
  };

  const handleBoosterConfirm = async () => {
    if (!selectedBooster || !selectedPlanet?.id) return;
    try {
      setIsBoosterSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/api/shop/boosters/purchase-and-activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemCode: selectedBooster.itemCode,
            planetId: selectedPlanet.id,
            userId: userId || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({
          text: data.message || "Güçlendirici aktifleştirilemedi.",
          type: "error",
        });
      } else {
        setFeedbackMessage({
          text:
            data.message ||
            `${selectedBooster.name} başarıyla gezegeninize tanımlandı.`,
          type: "success",
        });
        setIsBoosterModalOpen(false);
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({
        text: "Bağlantı hatası oluştu.",
        type: "error",
      });
    } finally {
      setIsBoosterSubmitting(false);
    }
  };

  // Officer click handler
  const handleOfficerClick = (officer: MonthlyOfficerItem) => {
    setSelectedOfficer(officer);
    setIsOfficerModalOpen(true);
  };

  const handleOfficerConfirm = async () => {
    if (!selectedOfficer) return;
    try {
      setIsOfficerSubmitting(true);
      const res = await fetch(
        `${API_BASE_URL}/api/shop/officers/purchase-monthly`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            officerType: selectedOfficer.officerKey,
            userId: userId || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({
          text: data.message || "Subay sözleşmesi uzatılamadı.",
          type: "error",
        });
      } else {
        setFeedbackMessage({
          text:
            data.message ||
            `${selectedOfficer.name} sözleşmesi 30 gün boyunca aktif edildi.`,
          type: "success",
        });
        setIsOfficerModalOpen(false);
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({
        text: "Bağlantı hatası oluştu.",
        type: "error",
      });
    } finally {
      setIsOfficerSubmitting(false);
    }
  };

  const getOfficerIcon = (key: string) => {
    switch (key) {
      case "Commander":
        return <Crown className="w-5 h-5 text-amber-400" />;
      case "Admiral":
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case "Engineer":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "Geologist":
        return <Pickaxe className="w-5 h-5 text-emerald-400" />;
      case "Technocrat":
        return <GraduationCap className="w-5 h-5 text-purple-400" />;
      case "Staff":
        return <Sparkles className="w-5 h-5 text-yellow-300" />;
      default:
        return <Crown className="w-5 h-5 text-cyan-400" />;
    }
  };

  // Group boosters by resource
  const metalBoosters = boosters.filter((b) => b.resourceType === "Metal");
  const crystalBoosters = boosters.filter((b) => b.resourceType === "Crystal");
  const deuteriumBoosters = boosters.filter(
    (b) => b.resourceType === "Deuterium"
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Category Navigation */}
      <div
        className="relative rounded-2xl border border-cyan-500/25 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Galaktik Dükkan • 30 Günlük Güçlendiriciler & Subaylar
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Dükkan -{" "}
            <span className="text-cyan-300">30 Günlük Uzun Süreli Paketler</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Aylık maden üretim çarpanları (%20, %30, %40) ve 30 günlük Subay
            Kadrosu paketleri ile imparatorluğunuzun kaynak akışını ve stratejik
            yönetimini kalıcı üstünlüğe taşıyın.
          </p>

          {/* Sub-Category Navigation Tabs */}
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>30 Günlük Paketler</span>
            </Link>
            <Link
              href="/shop/boosters-90d"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
              <span>90 Günlük Paketler</span>
            </Link>
            <Link
              href="/shop/profile"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Profil & Özelleştirme</span>
            </Link>
            <Link
              href="/shop/special-offers"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-rose-300 hover:text-rose-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Özel İndirimler</span>
            </Link>
          </div>
        </div>

        {/* Currency & Planet Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0e1420] border border-zinc-800 text-right shadow-md">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Karanlık Madde Bakiyesi
            </div>
            <div className="text-base font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5 mt-0.5">
              <Coins className="w-4 h-4 text-purple-400" />
              <span>{darkMatter.toLocaleString("tr-TR")} KM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Planet & Rules Notice */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-[#0a0f19] flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">
              Seçili Gezegen (Güçlendiriciler Buraya Tanımlanır)
            </span>
            <div className="font-semibold text-zinc-100 flex items-center gap-2 mt-0.5">
              <span>{selectedPlanet.name}</span>
              <span className="font-mono text-cyan-400">
                [{selectedPlanet.galaxy}:{selectedPlanet.system}:
                {selectedPlanet.slot}]
              </span>
              {selectedPlanet.isMoon && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-500/40 font-mono">
                  AY
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 max-w-md">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-zinc-200">Kural:</strong> Maden
            güçlendiricileri seçili gezegene uygulanır ve tekil booster kuralı
            geçerlidir (üzerine yazılır). Subay sözleşmeleri ise tüm hesabınızda
            geçerli olup süreleri üst üste eklenir (stacking).
          </p>
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

      {/* SECTION 1: 30-DAY MINE BOOSTERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              30 Günlük Maden Üretim Güçlendiricileri (9 Paket)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Metal, Kristal ve Döteryum madenleri için Gümüş (+%20), Altın
              (+%30) ve Platin (+%40) 30 günlük kalıcı üretim çarpanları.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metal Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  Metal Madeni Güçlendiricileri
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  3 Kademe
                </span>
              </div>
              <div className="space-y-3">
                {metalBoosters.map((b) => (
                  <BoosterCard
                    key={b.itemCode}
                    booster={b}
                    onSelect={() => handleBoosterClick(b)}
                  />
                ))}
              </div>
            </div>

            {/* Crystal Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs font-semibold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  Kristal Madeni Güçlendiricileri
                </span>
                <span className="text-[10px] font-mono text-cyan-500 uppercase">
                  3 Kademe
                </span>
              </div>
              <div className="space-y-3">
                {crystalBoosters.map((b) => (
                  <BoosterCard
                    key={b.itemCode}
                    booster={b}
                    onSelect={() => handleBoosterClick(b)}
                  />
                ))}
              </div>
            </div>

            {/* Deuterium Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Döteryum Sentezleyicisi Güçlendiricileri
                </span>
                <span className="text-[10px] font-mono text-emerald-500 uppercase">
                  3 Kademe
                </span>
              </div>
              <div className="space-y-3">
                {deuteriumBoosters.map((b) => (
                  <BoosterCard
                    key={b.itemCode}
                    booster={b}
                    onSelect={() => handleBoosterClick(b)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: 30-DAY OFFICERS */}
      <div className="space-y-4 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              30 Günlük Subay Kadrosu ve Komutanlık (Aylık Abonelik)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hesabınızdaki tüm gezegenleri ve filoları kapsayan 30 günlük subay
              görevlendirmeleri. Süreler birikimli olarak üst üste eklenir.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Subay kadrosu yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officers.map((officer) => {
              const isStaff = officer.officerKey === "Staff";
              return (
                <div
                  key={officer.officerKey}
                  className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 overflow-hidden ${
                    isStaff
                      ? "border-amber-500/50 bg-gradient-to-b from-amber-950/30 via-[#0d131f] to-[#080d16] shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:border-amber-400"
                      : "border-zinc-800 bg-[#0b101a] hover:border-zinc-700 shadow-md"
                  }`}
                >
                  {isStaff && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-bl-lg shadow">
                      %55 İndirimli Paket
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isStaff
                            ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                            : "bg-zinc-900 border-zinc-700/80 text-cyan-300"
                        }`}
                      >
                        {getOfficerIcon(officer.officerKey)}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                          {officer.name}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Sözleşme: 30 Gün (720 Saat)
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                      {officer.description}
                    </p>

                    {/* Active Status Badge */}
                    <div className="mt-3">
                      {officer.isActive ? (
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Hizmette
                          </span>
                          <span className="font-mono text-[11px]">
                            {formatBoosterDuration(officer.remainingSeconds)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                          <span>Şu an aktif değil</span>
                        </div>
                      )}
                    </div>

                    {/* Perks List */}
                    <div className="mt-3.5 pt-3 border-t border-zinc-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Sağladığı Ayrıcalıklar:
                      </span>
                      {officer.perksSummary.map((perk, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-zinc-300"
                        >
                          <span className="text-cyan-400 font-bold shrink-0">
                            •
                          </span>
                          <span className="leading-tight">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Action */}
                  <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                        30 Günlük Bedel
                      </span>
                      <div className="text-sm font-mono font-bold text-purple-300 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          {officer.costDarkMatter.toLocaleString("tr-TR")} KM
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOfficerClick(officer)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow ${
                        isStaff
                          ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                          : officer.isActive
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
                      }`}
                    >
                      {officer.isActive ? (
                        <>
                          <span>Uzat (+30G)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Başlat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overwrite Confirmation Modal */}
      <BoosterOverwriteModal
        isOpen={isBoosterModalOpen}
        booster={selectedBooster}
        planetName={selectedPlanet.name}
        currentDarkMatter={darkMatter}
        onClose={() => setIsBoosterModalOpen(false)}
        onConfirm={handleBoosterConfirm}
        isSubmitting={isBoosterSubmitting}
      />

      {/* Officer Purchase Modal */}
      <OfficerPurchaseModal
        isOpen={isOfficerModalOpen}
        officer={selectedOfficer}
        currentDarkMatter={darkMatter}
        onClose={() => setIsOfficerModalOpen(false)}
        onConfirm={handleOfficerConfirm}
        isSubmitting={isOfficerSubmitting}
      />
    </div>
  );
}

// Subcomponent: BoosterCard
function BoosterCard({
  booster,
  onSelect,
}: {
  booster: MonthlyBoosterItem;
  onSelect: () => void;
}) {
  const tierCfg = TIER_CONFIG[booster.tier] || TIER_CONFIG.Silver;

  return (
    <div
      className={`rounded-xl border p-4 bg-[#0a0f18] transition-all duration-200 flex flex-col justify-between hover:border-zinc-600 ${
        booster.isActive
          ? "border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          : booster.activeDifferentTier
          ? "border-amber-500/40"
          : tierCfg.borderClass
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold ${tierCfg.badgeClass}`}
          >
            {tierCfg.label}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            30 Gün (720 Saat)
          </span>
        </div>

        <h3 className="font-bold text-zinc-100 text-sm mt-2">{booster.name}</h3>
        <p className="text-xs text-zinc-400 mt-1 leading-snug">
          {booster.description}
        </p>

        {/* Status Badge */}
        <div className="mt-3">
          {booster.isActive ? (
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Bu Gezegende Aktif
              </span>
              <span className="font-mono text-[11px]">
                {formatBoosterDuration(booster.activeRemainingSeconds)}
              </span>
            </div>
          ) : booster.activeDifferentTier ? (
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Farklı Kademe (%{booster.activeDifferentTierPercent}) Aktif
              </span>
              <span className="font-mono text-[10px]">Üzerine Yazılır</span>
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-[11px] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Gezegende aktif güçlendirici yok</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Action */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono text-zinc-500 block">
            Maliyet
          </span>
          <div className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span>{booster.costDarkMatter.toLocaleString("tr-TR")} KM</span>
          </div>
        </div>

        <button
          onClick={onSelect}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 shadow ${
            booster.isActive
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              : booster.activeDifferentTier
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
              : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
          }`}
        >
          {booster.isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yenile (30G)</span>
            </>
          ) : booster.activeDifferentTier ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Üzerine Yaz</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aktif Et</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

