"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FullShopItem,
  InventoryItemEntry,
  ActivePlanetBooster,
  ActiveUserBuff,
  ShopCatalogCategory,
  ShopQualityTier,
  SHOP_CATEGORY_TABS,
  TIER_FILTER_PILLS,
  QUALITY_TIER_CONFIG,
} from "@/lib/shopFullCatalog";
import {
  ItemPurchaseModal,
  ModalMode,
} from "@/components/shop/ItemPurchaseModal";
import { InventoryDrawer } from "@/components/shop/InventoryDrawer";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  ShoppingBag,
  Sparkles,
  Hammer,
  Boxes,
  Clock,
  Shield,
  FlaskConical,
  Compass,
  Coins,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Moon,
  Globe,
  Flame,
  Zap,
  Tag,
  CalendarDays,
  User,
} from "lucide-react";

export default function ShopItemsPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [activeCategory, setActiveCategory] =
    useState<ShopCatalogCategory>("all");
  const [activeTier, setActiveTier] = useState<ShopQualityTier>("all");
  const [shopItems, setShopItems] = useState<FullShopItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemEntry[]>([]);
  const [activeBoosters, setActiveBoosters] = useState<ActivePlanetBooster[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<ActiveUserBuff[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal State
  const [modalItem, setModalItem] = useState<
    FullShopItem | InventoryItemEntry | null
  >(null);
  const [modalMode, setModalMode] = useState<ModalMode>("buy");

  const currentPlanet = useMemo(() => {
    const found = planets.find((p) => p.id === selectedPlanetId);
    return found
      ? { id: found.id, name: found.name, isMoon: found.isMoon ?? false }
      : null;
  }, [planets, selectedPlanetId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const urlUserId = userId ? `&userId=${userId}` : "";
      const shopUrl = `${API_BASE_URL}/api/shop/items?category=all${urlUserId}`;
      const invUrl = userId
        ? `${API_BASE_URL}/api/inventory/items?userId=${userId}`
        : `${API_BASE_URL}/api/inventory/items`;

      const boosterUrl = selectedPlanetId
        ? `${API_BASE_URL}/api/shop/active-boosters?planetId=${selectedPlanetId}`
        : null;

      const buffUrl = userId
        ? `${API_BASE_URL}/api/shop/active-buffs?userId=${userId}`
        : `${API_BASE_URL}/api/shop/active-buffs`;

      const requests: Promise<Response>[] = [fetch(shopUrl), fetch(invUrl)];
      if (boosterUrl) requests.push(fetch(boosterUrl));
      requests.push(fetch(buffUrl));

      const [shopRes, invRes, boosterRes, buffRes] = await Promise.all(requests);

      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShopItems(shopData.items || []);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData.items || []);
      }

      if (boosterRes && boosterRes.ok) {
        const boosterData = await boosterRes.json();
        setActiveBoosters(boosterData.boosters || []);
      }

      if (buffRes && buffRes.ok) {
        const buffData = await buffRes.json();
        setActiveBuffs(buffData.buffs || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedPlanetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    return shopItems.filter((i) => {
      const matchCat =
        activeCategory === "all" ||
        i.category.toLowerCase() === activeCategory.toLowerCase();
      const matchTier =
        activeTier === "all" ||
        i.tier.toLowerCase() === activeTier.toLowerCase();
      return matchCat && matchTier;
    });
  }, [shopItems, activeCategory, activeTier]);

  const totalInventoryCount = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [inventoryItems]);

  const openModal = (
    item: FullShopItem | InventoryItemEntry,
    mode: ModalMode
  ) => {
    setModalItem(item);
    setModalMode(mode);
  };

  const handleActionSuccess = (msg: string) => {
    setFeedbackMessage({ text: msg, type: "success" });
    loadData();
    fetchBootstrap();
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 6000);
  };

  const getItemIcon = (category: string, itemKey: string) => {
    switch (category) {
      case "resource":
        return <Boxes className="w-5 h-5 text-amber-400" />;
      case "construction":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "shipyard":
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case "research":
        return <FlaskConical className="w-5 h-5 text-emerald-400" />;
      case "special":
        return <Compass className="w-5 h-5 text-purple-400" />;
      case "field":
        return itemKey.includes("moon") ? (
          <Moon className="w-5 h-5 text-yellow-300" />
        ) : (
          <Sparkles className="w-5 h-5 text-emerald-400" />
        );
      default:
        return <Package className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatRemainingTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days} Gün ${hours} Saat`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours} Saat ${mins} Dk`;
  };

  return (
    <div className="space-y-6">
      {/* Shop Main Header & Sub-Category Navigation */}
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
            Galaktik Dükkan • 71+ Kanonik Katalog & Envanter
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Dükkan - <span className="text-cyan-300">Tüm Eşyalar</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Hammadde madeni çarpanları, Kraken inşaat, Detroid tersane, Newtron
            araştırma hızlandırıcıları ve özel keşif/hurdacı/yaşam formu
            öğeleriyle imparatorluğunuzu güçlendirin.
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-rose-300 hover:text-rose-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Özel İndirimler</span>
            </Link>
          </div>
        </div>

        {/* Currency & Floating Inventory Toggle */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0e1420] border border-zinc-800 text-right shadow-md">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Karanlık Madde Bakiyesi
            </div>
            <div className="text-base font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5 mt-0.5">
              <Coins className="h-4 w-4 text-purple-400" />
              <span>{darkMatter.toLocaleString("tr-TR")} KM</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-3 rounded-xl bg-cyan-950/70 border border-cyan-400/60 hover:bg-cyan-900/80 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)] transition flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider"
          >
            <Package className="w-4 h-4 text-cyan-400" />
            <span>Envanterim</span>
            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono bg-cyan-400 text-black">
              {totalInventoryCount}
            </span>
          </button>
        </div>
      </div>

      {/* Active Boosters & Buffs Bar */}
      {(activeBoosters.length > 0 || activeBuffs.length > 0) && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0a0f19] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Aktif Güçlendiriciler & Hesap Destekleri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {activeBoosters.map((b) => (
              <div
                key={b.id}
                className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-950/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-amber-300">
                      +%{b.percent} {b.resourceType}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Kalan: {formatRemainingTime(b.remainingSeconds)}
                    </div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-700 text-amber-400">
                  {b.tier}
                </span>
              </div>
            ))}

            {activeBuffs.map((buff) => (
              <div
                key={buff.id}
                className="p-2.5 rounded-lg border border-purple-500/40 bg-purple-950/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold text-purple-300">
                      {buff.buffType === "ExpeditionSlots"
                        ? `+${buff.value} Keşif Slotu`
                        : buff.buffType === "ExpeditionTurbo"
                        ? "%50 Keşif Hızı"
                        : buff.buffType === "ExpeditionResource"
                        ? "+%30 Keşif Ganimeti"
                        : "%75 Hurda Oranı"}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Kalan: {formatRemainingTime(buff.remainingSeconds)}
                    </div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-700 text-purple-300">
                  Hesap Geneli
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">
              {feedbackMessage.text}
            </span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SHOP_CATEGORY_TABS.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              {cat.id === "all" && <Sparkles className="w-3.5 h-3.5" />}
              {cat.id === "resource" && <Boxes className="w-3.5 h-3.5" />}
              {cat.id === "construction" && <Clock className="w-3.5 h-3.5" />}
              {cat.id === "shipyard" && <Shield className="w-3.5 h-3.5" />}
              {cat.id === "research" && <FlaskConical className="w-3.5 h-3.5" />}
              {cat.id === "special" && <Compass className="w-3.5 h-3.5" />}
              <span>{cat.label}</span>
              {cat.countLabel && (
                <span className="text-[10px] opacity-70 font-mono">
                  ({cat.countLabel})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quality Tier Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
          Kalite:
        </span>
        {TIER_FILTER_PILLS.map((tp) => {
          const isActive = activeTier === tp.id;
          return (
            <button
              key={tp.id}
              onClick={() => setActiveTier(tp.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                isActive
                  ? "bg-zinc-100 text-black font-bold shadow-md"
                  : "bg-zinc-900/70 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tp.label}
            </button>
          );
        })}
        <span className="text-xs font-mono text-zinc-500 ml-auto">
          {filteredItems.length} ürün listeleniyor
        </span>
      </div>

      {/* Catalog Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const tierConf =
            QUALITY_TIER_CONFIG[item.tier] || QUALITY_TIER_CONFIG.Bronze;
          const owned = item.ownedQuantity ?? 0;

          return (
            <div
              key={item.itemKey}
              className={`rounded-2xl border ${tierConf.border} ${tierConf.cardBg} ${tierConf.glow} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group`}
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner group-hover:scale-105 transition-transform">
                    {getItemIcon(item.category, item.itemKey)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${tierConf.badgeBg} ${tierConf.badgeText}`}
                    >
                      {tierConf.name}
                    </span>
                    {owned > 0 && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                        Envanterde: {owned}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </h3>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 border border-zinc-700/60 text-cyan-300">
                      {item.targetSummary}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    Maliyet
                  </div>
                  <div className="text-sm font-mono font-bold text-purple-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {item.effectiveCostDarkMatter.toLocaleString("tr-TR")} KM
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(item, "buy")}
                    className="w-full py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-300 transition flex items-center justify-center gap-1"
                    title="Envantere depolamak için satın al"
                  >
                    <Package className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Satın Al</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal(item, "buyAndActivate")}
                    className="w-full py-2 px-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/60 text-cyan-300 transition flex items-center justify-center gap-1 shadow-sm"
                    title="Doğrudan mevcut gezegende kullan"
                  >
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kullan</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Inventory Drawer */}
      <InventoryDrawer
        isOpen={isDrawerOpen}
        items={inventoryItems}
        currentPlanet={currentPlanet}
        onClose={() => setIsDrawerOpen(false)}
        onActivateItem={(invItem) => openModal(invItem, "activateOwned")}
      />

      {/* Item Purchase & Activation Modal */}
      {modalItem && (
        <ItemPurchaseModal
          item={modalItem}
          mode={modalMode}
          currentPlanet={currentPlanet}
          userDarkMatter={darkMatter}
          activeBoosters={activeBoosters}
          onClose={() => setModalItem(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}

