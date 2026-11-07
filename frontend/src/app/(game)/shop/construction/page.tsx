"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShopConstructionItem,
  UserInventoryItemDto,
  ShopItemCategory,
  CATEGORY_FILTERS,
  TIER_CONFIG,
} from "@/lib/constructionShopCatalog";
import {
  ItemPurchaseModal,
  ModalMode,
} from "@/components/shop/ItemPurchaseModal";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  ShoppingBag,
  Sparkles,
  Hammer,
  Clock,
  Maximize2,
  Dna,
  Coins,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Moon,
  Globe,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  Tag,
  CalendarDays,
  User,
} from "lucide-react";

export default function ShopConstructionPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [activeCategory, setActiveCategory] = useState<ShopItemCategory>("all");
  const [shopItems, setShopItems] = useState<ShopConstructionItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<UserInventoryItemDto[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal State
  const [modalItem, setModalItem] = useState<
    ShopConstructionItem | UserInventoryItemDto | null
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
      const shopUrl = `${API_BASE_URL}/api/shop/items?category=construction${urlUserId}`;
      const invUrl = userId
        ? `${API_BASE_URL}/api/inventory/items?userId=${userId}`
        : `${API_BASE_URL}/api/inventory/items`;

      const [shopRes, invRes] = await Promise.all([
        fetch(shopUrl),
        fetch(invUrl),
      ]);

      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShopItems(shopData.items || []);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData.items || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return shopItems;
    return shopItems.filter((i) => i.category === activeCategory);
  }, [shopItems, activeCategory]);

  const totalInventoryCount = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [inventoryItems]);

  const openModal = (
    item: ShopConstructionItem | UserInventoryItemDto,
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

  const getItemIcon = (category: string, isMoon: boolean = false) => {
    switch (category) {
      case "construction":
        return <Clock className="w-5 h-5 text-amber-400" />;
      case "field":
        return isMoon ? (
          <Moon className="w-5 h-5 text-yellow-300" />
        ) : (
          <Maximize2 className="w-5 h-5 text-emerald-400" />
        );
      case "lifeform":
        return <Dna className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Shop Main Header & Sub-Category Navigation */}
      <div
        className="relative rounded-xl border border-cyan-500/25 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Galaktik Dükkan • Altyapı & Hızlandırıcılar
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Dükkan - <span className="text-cyan-300">İnşa Ürünleri</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Kraken inşaat hızlandırıcıları, gezegen/ay alan genişleticileri ve
            canlı türü Detroid hızlandırıcıları ile imparatorluğunuzun altyapısını
            ışık hızına taşıyın.
          </p>

          {/* Sub-Category Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Link
              href="/shop/classes"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sınıf Değişimi</span>
            </Link>
            <Link
              href="/shop/construction"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
            >
              <Hammer className="w-3.5 h-3.5 text-cyan-400" />
              <span>İnşa Ürünleri</span>
            </Link>
            <Link
              href="/shop/items"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tüm Eşyalar (71+)</span>
            </Link>
            <Link
              href="/shop/boosters-30d"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
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

        {/* Currency & Active Planet Bar */}
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
        </div>
      </div>

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

      {/* Quick Inventory Drawer */}
      <div className="rounded-xl border border-zinc-800 bg-[#0a0e17] overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsInventoryOpen((o) => !o)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-zinc-950/60 hover:bg-zinc-900/60 transition border-b border-zinc-800/80"
        >
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200">
              Envanterim ({totalInventoryCount} Eşya)
            </span>
            {currentPlanet && (
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 ml-2">
                • Hedef:{" "}
                <span className="text-cyan-300 font-semibold">
                  {currentPlanet.name} ({currentPlanet.isMoon ? "Ay" : "Gezegen"})
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <span>{isInventoryOpen ? "Gizle" : "Göster"}</span>
            {isInventoryOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isInventoryOpen && (
          <div className="p-4 bg-[#080c14]">
            {inventoryItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                Henüz envanterinizde inşaat hızlandırıcısı veya alan eşyası
                bulunmuyor. Aşağıdaki ürünlerden dilediğinizi satın alabilirsiniz.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {inventoryItems.map((invItem) => {
                  const tierConf =
                    TIER_CONFIG[invItem.tier] || TIER_CONFIG.Bronze;
                  const isMoon = invItem.itemKey.toLowerCase().includes("moon");
                  return (
                    <div
                      key={invItem.id}
                      className={`p-3.5 rounded-xl border ${tierConf.border} ${tierConf.cardBg} flex items-center justify-between gap-3 shadow-sm`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 shrink-0">
                          {getItemIcon(invItem.category, isMoon)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-200 truncate">
                            {invItem.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono truncate">
                            {invItem.targetSummary}
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-cyan-400 mt-0.5">
                            Adet: {invItem.quantity}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openModal(invItem, "activateOwned")}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 shrink-0 transition"
                      >
                        Kullan
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              {cat.id === "all" && <Sparkles className="w-3.5 h-3.5" />}
              {cat.id === "construction" && <Clock className="w-3.5 h-3.5" />}
              {cat.id === "field" && <Maximize2 className="w-3.5 h-3.5" />}
              {cat.id === "lifeform" && <Dna className="w-3.5 h-3.5" />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const tierConf = TIER_CONFIG[item.tier] || TIER_CONFIG.Bronze;
          const isMoon = item.itemKey.toLowerCase().includes("moon");
          const owned = item.ownedQuantity ?? 0;

          return (
            <div
              key={item.itemKey}
              className={`rounded-2xl border ${tierConf.border} ${tierConf.cardBg} ${tierConf.glow} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group`}
            >
              {/* Card Top: Icon & Tier Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner group-hover:scale-105 transition-transform">
                    {getItemIcon(item.category, isMoon)}
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

              {/* Card Bottom: Price & Actions */}
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

      {/* Modal Dialog */}
      {modalItem && (
        <ItemPurchaseModal
          item={modalItem}
          mode={modalMode}
          currentPlanet={currentPlanet}
          userDarkMatter={darkMatter}
          onClose={() => setModalItem(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}

