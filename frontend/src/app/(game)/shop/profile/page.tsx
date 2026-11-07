"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ProfileShopData,
  CosmeticAvatarItem,
  CosmeticTitleItem,
  formatTimeRemaining,
} from "@/lib/profileShopCatalog";
import { RelocationModal } from "@/components/shop/RelocationModal";
import { NameChangeModal } from "@/components/shop/NameChangeModal";
import { CosmeticPurchaseModal } from "@/components/shop/CosmeticPurchaseModal";
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
  AlertTriangle,
  Globe,
  Flame,
  ArrowRight,
  Info,
  CalendarDays,
  User,
  Compass,
  Cpu,
  Skull,
  Award,
  Edit3,
  RotateCcw,
  Check,
  Percent,
} from "lucide-react";

export default function ShopProfilePage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [profileData, setProfileData] = useState<ProfileShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCosmeticTab, setActiveCosmeticTab] = useState<"avatars" | "titles">("avatars");

  // Modals
  const [isRelocationOpen, setIsRelocationOpen] = useState(false);
  const [isRelocationSubmitting, setIsRelocationSubmitting] = useState(false);

  const [isNameChangeOpen, setIsNameChangeOpen] = useState(false);
  const [isNameChangeSubmitting, setIsNameChangeSubmitting] = useState(false);

  const [cosmeticModalItem, setCosmeticModalItem] = useState<{
    item: CosmeticAvatarItem | CosmeticTitleItem;
    type: "avatar" | "title";
  } | null>(null);
  const [isCosmeticSubmitting, setIsCosmeticSubmitting] = useState(false);

  // Quick Planet Rename
  const [planetRenameInput, setPlanetRenameInput] = useState("");
  const [isPlanetRenaming, setIsPlanetRenaming] = useState(false);

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

  useEffect(() => {
    if (selectedPlanet?.name) {
      setPlanetRenameInput(selectedPlanet.name);
    }
  }, [selectedPlanet?.name]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/api/shop/profile?planetId=${selectedPlanet?.id || ""}${
        userId ? `&userId=${userId}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data: ProfileShopData = await res.json();
        setProfileData(data);
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

  // Planet Relocation Handlers
  const handleStartRelocation = async (targetGalaxy: number, targetSystem: number, targetSlot: number) => {
    if (!selectedPlanet?.id) return;
    try {
      setIsRelocationSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/shop/relocation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId: selectedPlanet.id,
          targetGalaxy,
          targetSystem,
          targetSlot,
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "Taşıma başlatılamadı.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        setIsRelocationOpen(false);
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsRelocationSubmitting(false);
    }
  };

  const handleCancelRelocation = async () => {
    if (!selectedPlanet?.id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shop/relocation/cancel?planetId=${selectedPlanet.id}${
          userId ? `&userId=${userId}` : ""
        }`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "İptal edilemedi.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    }
  };

  const handleCompleteRelocation = async () => {
    if (!selectedPlanet?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/relocation/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId: selectedPlanet.id,
          userId: userId || undefined,
          forceInstant: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "Taşıma tamamlanamadı.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    }
  };

  // Name Change Handler
  const handleNameChangeConfirm = async (newUsername: string) => {
    try {
      setIsNameChangeSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/shop/name-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newUsername,
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "İsim değiştirilemedi.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        setIsNameChangeOpen(false);
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsNameChangeSubmitting(false);
    }
  };

  // Quick Planet Rename Handler
  const handlePlanetRename = async () => {
    if (!selectedPlanet?.id || !planetRenameInput.trim()) return;
    try {
      setIsPlanetRenaming(true);
      const res = await fetch(`${API_BASE_URL}/api/planets/${selectedPlanet.id}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: planetRenameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "Gezegen adı değiştirilemedi.", type: "error" });
      } else {
        setFeedbackMessage({ text: `Gezegen adı '${data.name}' olarak güncellendi.`, type: "success" });
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsPlanetRenaming(false);
    }
  };

  // Cosmetics Buy & Equip Handlers
  const handleBuyCosmetic = async () => {
    if (!cosmeticModalItem) return;
    try {
      setIsCosmeticSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/shop/cosmetics/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cosmeticType: cosmeticModalItem.type,
          cosmeticId: cosmeticModalItem.item.id,
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "Satın alma başarısız.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        setCosmeticModalItem(null);
        loadData();
        fetchBootstrap();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    } finally {
      setIsCosmeticSubmitting(false);
    }
  };

  const handleEquipCosmetic = async (type: "avatar" | "title", id: string) => {
    try {
      const payload =
        type === "avatar"
          ? { activeAvatar: id, userId: userId || undefined }
          : { activeTitle: id, userId: userId || undefined };

      const res = await fetch(`${API_BASE_URL}/api/user/profile/cosmetics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMessage({ text: data.message || "Kuşanma başarısız.", type: "error" });
      } else {
        setFeedbackMessage({ text: data.message, type: "success" });
        loadData();
      }
    } catch {
      setFeedbackMessage({ text: "Bağlantı hatası oluştu.", type: "error" });
    }
  };

  const renderIcon = (key: string, className = "w-6 h-6") => {
    switch (key) {
      case "User":
        return <User className={className} />;
      case "Compass":
        return <Compass className={className} />;
      case "Pickaxe":
        return <Pickaxe className={className} />;
      case "Shield":
        return <Shield className={className} />;
      case "Cpu":
        return <Cpu className={className} />;
      case "Globe":
        return <Globe className={className} />;
      case "Skull":
        return <Skull className={className} />;
      case "Crown":
        return <Crown className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "Zap":
        return <Zap className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const activeAvatarDef = profileData?.avatars.find((a) => a.isEquipped);
  const activeTitleDef = profileData?.titles.find((t) => t.isEquipped);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Category Navigation */}
      <div
        className="relative rounded-2xl border border-cyan-500/25 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.18) 0%, rgba(168,85,247,0.12) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Galaktik Dükkan • Profil, Özelleştirme & Gezegen Taşıma
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Dükkan - <span className="text-cyan-300">Profil & Özelleştirme</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            240.000 KM Gezegen Taşıma (Relocation), 25.000 KM Oyuncu Adı Değiştirme,
            özel avatar portreleri, prestij unvanları ve sınıf rozetleri.
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Profil & Özelleştirme</span>
            </Link>
            <Link
              href="/shop/special-offers"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-200 hover:bg-rose-900/60 transition flex items-center gap-1.5 animate-pulse"
            >
              <Percent className="w-3.5 h-3.5 text-rose-400" />
              <span>Özel İndirimler</span>
            </Link>
          </div>
        </div>

        {/* Currency Display */}
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

      {/* ACCOUNT SUMMARY PROFILE HEADER CARD */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0f19] shadow-lg flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="relative p-3.5 rounded-2xl border border-cyan-500/50 bg-gradient-to-br from-cyan-950/60 via-zinc-900 to-black text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {renderIcon(activeAvatarDef?.iconKey || "User", "w-10 h-10")}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500 text-black">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">
                {profileData?.username || "Komutan"}
              </h2>
              {/* Title Badge */}
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/50 bg-purple-950/60 text-purple-300 shadow">
                {activeTitleDef?.name || "Komutan"}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
              <span>
                Sınıf:{" "}
                <strong className="text-amber-400 font-mono">
                  {profileData?.playerClass === "Collector"
                    ? "Kolektör"
                    : profileData?.playerClass === "General"
                    ? "General"
                    : profileData?.playerClass === "Discoverer"
                    ? "Kaşif"
                    : "Sınıf Seçilmedi"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Puan:{" "}
                <strong className="text-zinc-200 font-mono">
                  {profileData?.totalPoints?.toLocaleString("tr-TR") || "12.500"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Edit Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNameChangeOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:text-white hover:border-purple-400 transition flex items-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>İsim Değiştir (25.000 KM)</span>
          </button>
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

      {/* SECTION 1: PLANETARY RELOCATION */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0a0f19] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              1. Gezegen Taşıma (Planetary Relocation)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Seçili koloninizi ve varsa bağlı Ay'ını, üzerindeki tüm binalar, tersane birimleri ve savunmalarla birlikte boş bir koordinata taşıyın.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-500/40 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-purple-400" />
            Sabit Fiyat: 240.000 KM
          </span>
        </div>

        {/* Current Planet Status */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-[#070b13] flex items-center justify-between flex-wrap gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">
              Seçili Gezegen
            </span>
            <div className="font-semibold text-zinc-100 flex items-center gap-2 mt-0.5">
              <span>{selectedPlanet.name}</span>
              <span className="font-mono text-cyan-400">
                [{selectedPlanet.galaxy}:{selectedPlanet.system}:{selectedPlanet.slot}]
              </span>
            </div>
          </div>

          {/* Relocation Active or Cooldown */}
          {profileData?.relocation?.isRelocating ? (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-300">
                <span className="font-mono font-semibold block text-[11px]">
                  İntikal Hazırlığı: {formatTimeRemaining(profileData.relocation.remainingSeconds)}
                </span>
                <span className="text-[10px] text-amber-200/80 block">
                  Hedef: [{profileData.relocation.targetGalaxy}:{profileData.relocation.targetSystem}:{profileData.relocation.targetSlot}]
                </span>
              </div>
              <button
                onClick={handleCancelRelocation}
                className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold transition"
              >
                İptal Et (240k İade)
              </button>
              <button
                onClick={handleCompleteRelocation}
                className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold transition"
              >
                Hemen Tamamla
              </button>
            </div>
          ) : profileData?.relocation?.isCooldownActive ? (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400">
              <span className="font-mono text-[11px]">
                Bekleme Süresi: {formatTimeRemaining(profileData.relocation.cooldownRemainingSeconds)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsRelocationOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Gezegen Taşı (240.000 KM)</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: IDENTITY & NAME CHANGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Player Name Change */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0f19] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-purple-400" />
                Oyuncu Adı Değiştirme
              </h3>
              <span className="text-xs font-mono font-bold text-purple-300">
                25.000 KM
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              İmparatorluk adınızı tüm evrende geçerli olacak yeni bir kullanıcı adı ile güncelleyin.
            </p>

            <div className="mt-4 p-3 rounded-xl border border-zinc-800/80 bg-[#070b13] flex items-center justify-between text-xs">
              <span className="text-zinc-500">Şu Anki Ad:</span>
              <span className="font-bold text-zinc-200 font-mono">
                {profileData?.username || "Komutan"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsNameChangeOpen(true)}
            className="w-full py-2.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>İsim Değiştir (25.000 KM)</span>
          </button>
        </div>

        {/* Card B: Planet Rename Tool */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0f19] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-base">
                <Globe className="w-5 h-5 text-cyan-400" />
                Gezegen / Ay Adı Güncelleme
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400">
                0 KM (Ücretsiz)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Seçili koloninizin adını dilediğiniz zaman ücretsiz olarak özelleştirebilirsiniz.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                maxLength={32}
                value={planetRenameInput}
                onChange={(e) => setPlanetRenameInput(e.target.value)}
                placeholder="Gezegen Adı"
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handlePlanetRename}
                disabled={isPlanetRenaming || !planetRenameInput.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                {isPlanetRenaming ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: COSMETICS (AVATARS & TITLES) */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0f19] space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              3. Özel Avatarlar & Unvanlar (Kozmetik)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              İmparatorluk profilinizi temsil eden özel portreler ve galaksi sıralamasında görünen prestij unvanları.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveCosmeticTab("avatars")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeCosmeticTab === "avatars"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Özel Portreler ({profileData?.avatars.length || 8})
            </button>
            <button
              onClick={() => setActiveCosmeticTab("titles")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeCosmeticTab === "titles"
                  ? "bg-purple-950 text-purple-300 border border-purple-500/50 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Prestij Unvanları ({profileData?.titles.length || 6})
            </button>
          </div>
        </div>

        {/* Tab 1: Avatars Grid */}
        {activeCosmeticTab === "avatars" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {profileData?.avatars.map((avatar) => (
              <div
                key={avatar.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  avatar.isEquipped
                    ? "border-emerald-500/70 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : avatar.isUnlocked
                    ? "border-cyan-500/40 bg-[#080d15] hover:border-cyan-400"
                    : "border-zinc-800 bg-[#070a12] opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-900/80 text-cyan-300">
                      {renderIcon(avatar.iconKey)}
                    </div>
                    {avatar.isEquipped ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                        KULLANIMDA
                      </span>
                    ) : avatar.isUnlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                        AÇIK
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-purple-300">
                        {avatar.costDarkMatter.toLocaleString("tr-TR")} KM
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-zinc-100 text-sm mt-3">{avatar.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{avatar.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  {avatar.isEquipped ? (
                    <div className="text-center text-xs text-emerald-400 font-semibold py-1">
                      Aktif Profil Portresi
                    </div>
                  ) : avatar.isUnlocked ? (
                    <button
                      onClick={() => handleEquipCosmetic("avatar", avatar.id)}
                      className="w-full py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/60 text-xs font-semibold transition"
                    >
                      Kuşan
                    </button>
                  ) : (
                    <button
                      onClick={() => setCosmeticModalItem({ item: avatar, type: "avatar" })}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow"
                    >
                      Aç ({avatar.costDarkMatter.toLocaleString("tr-TR")} KM)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Titles Grid */}
        {activeCosmeticTab === "titles" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData?.titles.map((title) => (
              <div
                key={title.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  title.isEquipped
                    ? "border-emerald-500/70 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : title.isUnlocked
                    ? "border-purple-500/40 bg-[#080d15] hover:border-purple-400"
                    : "border-zinc-800 bg-[#070a12] opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 text-purple-300">
                      {renderIcon(title.iconKey)}
                    </div>
                    {title.isEquipped ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                        KULLANIMDA
                      </span>
                    ) : title.isUnlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-purple-300">
                        AÇIK
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-purple-300">
                        {title.costDarkMatter.toLocaleString("tr-TR")} KM
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-zinc-100 text-sm mt-3">{title.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{title.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  {title.isEquipped ? (
                    <div className="text-center text-xs text-emerald-400 font-semibold py-1">
                      Aktif Ünvan
                    </div>
                  ) : title.isUnlocked ? (
                    <button
                      onClick={() => handleEquipCosmetic("title", title.id)}
                      className="w-full py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/50 text-purple-200 hover:bg-purple-900/60 text-xs font-semibold transition"
                    >
                      Kuşan
                    </button>
                  ) : (
                    <button
                      onClick={() => setCosmeticModalItem({ item: title, type: "title" })}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow"
                    >
                      Aç ({title.costDarkMatter.toLocaleString("tr-TR")} KM)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: CLASS SELECTION BADGES */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0a0f19] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              4. Sınıf Seçimi Rozetleri (Class Badges)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              İmparatorluk sınıfınız profilinizde ve galaksi radarında diğer komutanlara prestij rozeti olarak yansır.
            </p>
          </div>

          <Link
            href="/shop/classes"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow"
          >
            <span>Sınıf Değiştir (500.000 KM)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Collector */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              profileData?.playerClass === "Collector"
                ? "border-amber-500/70 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "border-zinc-800 bg-[#070b13]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-sm">Kolektör Sınıfı</span>
                {profileData?.playerClass === "Collector" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                    AKTİF
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                +%25 Maden üretimi, +%10 Enerji, +%100 Yük gemisi hızı ve Paletli verimi.
              </p>
            </div>
          </div>

          {/* General */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              profileData?.playerClass === "General"
                ? "border-rose-500/70 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                : "border-zinc-800 bg-[#070b13]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300 text-sm">General Sınıfı</span>
                {profileData?.playerClass === "General" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold">
                    AKTİF
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                +%100 Muharebe gemisi hızı, -%25 Yakıt tüketimi, +2 Filo slotu ve Azrail enkaz geri dönüşümü.
              </p>
            </div>
          </div>

          {/* Discoverer */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              profileData?.playerClass === "Discoverer"
                ? "border-cyan-500/70 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "border-zinc-800 bg-[#070b13]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm">Kaşif Sınıfı</span>
                {profileData?.playerClass === "Discoverer" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                    AKTİF
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                -%50 Araştırma süresi, +2 Keşif slotu, +%75 Keşif ödülleri ve devasa karlı keşif seferleri.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <RelocationModal
        isOpen={isRelocationOpen}
        planetId={selectedPlanet.id}
        planetName={selectedPlanet.name}
        currentGalaxy={selectedPlanet.galaxy}
        currentSystem={selectedPlanet.system}
        currentSlot={selectedPlanet.slot}
        isMoon={selectedPlanet.isMoon}
        currentDarkMatter={darkMatter}
        costDarkMatter={240000}
        onClose={() => setIsRelocationOpen(false)}
        onConfirm={handleStartRelocation}
        isSubmitting={isRelocationSubmitting}
      />

      <NameChangeModal
        isOpen={isNameChangeOpen}
        currentUsername={profileData?.username || "Komutan"}
        currentDarkMatter={darkMatter}
        costDarkMatter={25000}
        onClose={() => setIsNameChangeOpen(false)}
        onConfirm={handleNameChangeConfirm}
        isSubmitting={isNameChangeSubmitting}
      />

      <CosmeticPurchaseModal
        isOpen={cosmeticModalItem !== null}
        item={cosmeticModalItem?.item || null}
        type={cosmeticModalItem?.type || "avatar"}
        currentDarkMatter={darkMatter}
        onClose={() => setCosmeticModalItem(null)}
        onConfirm={handleBuyCosmetic}
        isSubmitting={isCosmeticSubmitting}
      />
    </div>
  );
}

