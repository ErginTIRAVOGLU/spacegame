"use client";

import React, { useState, useEffect, useCallback, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  ShopMasterItem,
  ShopCatalogResponse,
  InventoryItemEntry,
  InventoryResponse,
  SHOP_MODE_CATEGORIES,
  INVENTORY_MODE_CATEGORIES,
  formatDarkMatterFull,
  TIER_THEME,
} from "@/lib/shopMasterCatalog";
import { ProductInspectorCard } from "@/components/shop/ProductInspectorCard";
import { ProductCatalogGrid } from "@/components/shop/ProductCatalogGrid";
import { DarkMatterTopupModal } from "@/components/shop/DarkMatterTopupModal";
import {
  Sparkles,
  ShoppingBag,
  Package,
  Boxes,
  Zap,
  Flame,
  Shield,
  Hammer,
  Calendar,
  User,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Warehouse,
} from "lucide-react";

function ShopContent() {
  const searchParams = useSearchParams();
  const userId = useGameStore((s) => s.userId);
  const globalDarkMatter = useGameStore((s) => s.darkMatter);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  // Mode: "shop" or "inventory"
  const initialMode = searchParams.get("mode") === "inventory" ? "inventory" : "shop";
  const [activeMode, setActiveMode] = useState<"shop" | "inventory">(initialMode);

  // Category selection
  const initialCat = searchParams.get("category") || (initialMode === "shop" ? "all" : "all");
  const [activeCategory, setActiveCategory] = useState<string>(initialCat);

  // Shop Pagination & Catalog State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [catalogData, setCatalogData] = useState<ShopCatalogResponse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopMasterItem | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<InventoryItemEntry[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState<boolean>(false);
  const [inventoryActionStatus, setInventoryActionStatus] = useState<string | null>(null);

  // Dark Matter Top-up Modal State
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [localDarkMatter, setLocalDarkMatter] = useState<number>(globalDarkMatter);

  const [, startTransition] = useTransition();

  useEffect(() => {
    setLocalDarkMatter(globalDarkMatter);
  }, [globalDarkMatter]);

  // Fetch Shop Catalog
  const fetchShopCatalog = useCallback(
    async (cat: string, page: number) => {
      setIsCatalogLoading(true);
      try {
        const queryParams = new URLSearchParams({
          category: cat,
          page: page.toString(),
          pageSize: "9",
        });
        if (selectedPlanetId) queryParams.append("planetId", selectedPlanetId);
        if (userId) queryParams.append("userId", userId);

        const res = await fetch(`${API_BASE_URL}/api/shop/catalog?${queryParams.toString()}`);
        if (res.ok) {
          const data: ShopCatalogResponse = await res.json();
          setCatalogData(data);
          if (typeof data.darkMatter === "number") {
            setLocalDarkMatter(data.darkMatter);
          }
          // Default selection to first item of page if no item selected or current item not in page
          if (!selectedProduct && data.items.length > 0) {
            setSelectedProduct(data.items[0]);
          } else if (selectedProduct) {
            const currentStillThere = data.items.find((i) => i.itemKey === selectedProduct.itemKey);
            if (currentStillThere) {
              setSelectedProduct(currentStillThere);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch shop catalog:", err);
      } finally {
        setIsCatalogLoading(false);
      }
    },
    [selectedPlanetId, userId, selectedProduct]
  );

  // Fetch Inventory Items
  const fetchInventoryItems = useCallback(
    async (cat: string) => {
      setIsInventoryLoading(true);
      try {
        const queryParams = new URLSearchParams({
          category: cat,
        });
        if (userId) queryParams.append("userId", userId);

        const res = await fetch(`${API_BASE_URL}/api/inventory/items?${queryParams.toString()}`);
        if (res.ok) {
          const data: InventoryResponse = await res.json();
          setInventoryItems(data.items || []);
          if (typeof data.darkMatter === "number") {
            setLocalDarkMatter(data.darkMatter);
          }
        }
      } catch (err) {
        console.error("Failed to fetch inventory items:", err);
      } finally {
        setIsInventoryLoading(false);
      }
    },
    [userId]
  );

  // Trigger data fetch when activeMode, activeCategory, or currentPage changes
  useEffect(() => {
    if (activeMode === "shop") {
      fetchShopCatalog(activeCategory, currentPage);
    } else {
      fetchInventoryItems(activeCategory);
    }
  }, [activeMode, activeCategory, currentPage, fetchShopCatalog, fetchInventoryItems]);

  // Handle Category Switch
  const handleCategorySelect = (catId: string) => {
    startTransition(() => {
      setActiveCategory(catId);
      setCurrentPage(1);
    });
  };

  // Buy and Activate from Shop Inspector
  const handleBuyAndActivate = async (item: ShopMasterItem): Promise<boolean> => {
    if (!selectedPlanetId) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/buy-and-activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemKey: item.itemKey,
          planetId: selectedPlanetId,
          userId: userId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.remainingDarkMatter === "number") {
          setLocalDarkMatter(data.remainingDarkMatter);
        }
        await fetchBootstrap();
        await fetchShopCatalog(activeCategory, currentPage);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Activate directly from Inventory Vault
  const handleActivateInventoryItem = async (invItem: InventoryItemEntry) => {
    if (!selectedPlanetId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/items/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: invItem.id,
          itemKey: invItem.itemKey,
          planetId: selectedPlanetId,
          userId: userId,
        }),
      });

      if (res.ok) {
        setInventoryActionStatus(`${invItem.name} başarıyla gezegene uygulandı!`);
        await fetchBootstrap();
        await fetchInventoryItems(activeCategory);
        setTimeout(() => setInventoryActionStatus(null), 4000);
      } else {
        const err = await res.json();
        setInventoryActionStatus(err.message || "Eşya uygulanamadı.");
      }
    } catch {
      setInventoryActionStatus("Bağlantı hatası oluştu.");
    }
  };

  // Category Icon Resolver
  const renderCategoryIcon = (icon: string) => {
    switch (icon) {
      case "Flame":
        return <Flame className="h-4 w-4 text-rose-400" />;
      case "Shield":
        return <Shield className="h-4 w-4 text-cyan-400" />;
      case "Hammer":
        return <Hammer className="h-4 w-4 text-amber-400" />;
      case "Boxes":
        return <Boxes className="h-4 w-4 text-emerald-400" />;
      case "Calendar":
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case "User":
        return <User className="h-4 w-4 text-yellow-400" />;
      case "Clock":
        return <Clock className="h-4 w-4 text-teal-400" />;
      case "Layers":
      default:
        return <Layers className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">
      {/* 1. Header & Dual-Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-600/40 bg-gradient-to-br from-amber-950/80 to-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            {activeMode === "shop" ? (
              <ShoppingBag className="h-6 w-6 text-amber-400" />
            ) : (
              <Warehouse className="h-6 w-6 text-cyan-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-zinc-100">
              {activeMode === "shop" ? "Galaktik Dükkan" : "Kişisel Envanter"}
            </h1>
            <p className="text-xs text-zinc-400">
              {activeMode === "shop"
                ? "Taktiksel güçlendiriciler, hızlandırıcılar ve özel imtiyazlar."
                : "Kullanıma hazır mühimmat, hızlandırıcılar ve envanter kasası."}
            </p>
          </div>
        </div>

        {/* Dual Mode Tab Switcher & Live Dark Matter Balance */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 shadow-inner">
            <button
              onClick={() => {
                setActiveMode("shop");
                setActiveCategory("all");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeMode === "shop"
                  ? "border border-amber-500/80 bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Dükkan</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("inventory");
                setActiveCategory("all");
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeMode === "inventory"
                  ? "border border-cyan-500/80 bg-gradient-to-r from-cyan-600 to-cyan-500 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Envanter</span>
            </button>
          </div>

          {/* Dark Matter Live Counter */}
          <div
            onClick={() => setIsTopupModalOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-2 text-xs font-extrabold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400 hover:brightness-110 transition-all select-none"
            title="Karanlık Madde Temin Et"
          >
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>{formatDarkMatterFull(localDarkMatter)}</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200 border border-amber-500/40">
              +
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Viewport: Left Sidebar Navigation + Right Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Categories with Exact Counters & Bottom Persistent Green CTAs */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl lg:col-span-4 xl:col-span-3">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-2">
              Kategoriler ({activeMode === "shop" ? "Dükkan" : "Envanter"})
            </h2>

            {/* Category Navigation Menu */}
            <nav className="flex flex-col space-y-1">
              {activeMode === "shop"
                ? SHOP_MODE_CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.id;
                    const dynamicCount =
                      catalogData?.categoryCounts[cat.id] ?? cat.defaultCount;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                          isSelected
                            ? "border border-amber-500/60 bg-gradient-to-r from-amber-950/60 to-zinc-900 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : "border border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderCategoryIcon(cat.icon)}
                          <span>{cat.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            isSelected
                              ? "bg-amber-500 text-zinc-950"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          ({dynamicCount})
                        </span>
                      </button>
                    );
                  })
                : INVENTORY_MODE_CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.id;
                    const invCount =
                      catalogData?.inventoryCategoryCounts[cat.id] ??
                      (cat.id === "all" ? inventoryItems.reduce((acc, cur) => acc + cur.quantity, 0) : 0);

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-left ${
                          isSelected
                            ? "border border-cyan-500/60 bg-gradient-to-r from-cyan-950/60 to-zinc-900 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                            : "border border-transparent text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderCategoryIcon(cat.icon)}
                          <span>{cat.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            isSelected
                              ? "bg-cyan-500 text-zinc-950"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          ({invCount})
                        </span>
                      </button>
                    );
                  })}
            </nav>
          </div>

          {/* Persistent Bottom Green CTAs */}
          <div className="mt-8 space-y-2.5 border-t border-zinc-800/80 pt-4">
            {/* Green CTA 1: Kaynak al */}
            <button
              onClick={() => {
                setActiveMode("shop");
                handleCategorySelect("resources");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/80 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 py-2.5 text-xs font-extrabold text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Boxes className="h-4 w-4 fill-current" />
              <span>Kaynak al</span>
            </button>

            {/* Green CTA 2: Karanlık madde temin et */}
            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-950/80 py-2.5 text-xs font-extrabold text-emerald-300 shadow-inner hover:border-emerald-400 hover:bg-emerald-900/60 active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4 text-emerald-400 fill-current" />
              <span>Karanlık madde temin et</span>
            </button>
          </div>
        </div>

        {/* Right Viewport: Shop Mode OR Inventory Mode */}
        <div className="space-y-6 lg:col-span-8 xl:col-span-9">
          {activeMode === "shop" ? (
            /* SHOP MODE VIEWPORT */
            <>
              {/* Product Inspector Card (Above Grid) */}
              {selectedProduct ? (
                <ProductInspectorCard
                  item={selectedProduct}
                  onClose={() => setSelectedProduct(null)}
                  onBuyAndActivate={handleBuyAndActivate}
                  userDarkMatter={localDarkMatter}
                />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
                  <span>İncelemek ve satın almak için aşağıdaki ürünlerden birine tıklayın.</span>
                  <ShoppingBag className="h-4 w-4 text-zinc-500" />
                </div>
              )}

              {/* 3x3 Product Catalog Grid & Pagination */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Ürün Kataloğu (3x3 Izgara)
                  </h3>
                  <span className="text-xs font-semibold text-zinc-500">
                    Toplam {catalogData?.totalCount ?? 0} Eşya
                  </span>
                </div>

                <ProductCatalogGrid
                  items={catalogData?.items || []}
                  selectedItem={selectedProduct}
                  onSelectItem={(item) => setSelectedProduct(item)}
                  currentPage={currentPage}
                  totalPages={catalogData?.totalPages || 1}
                  onPageChange={(p) => setCurrentPage(p)}
                  isLoading={isCatalogLoading}
                />
              </div>
            </>
          ) : (
            /* INVENTORY MODE VIEWPORT */
            <div className="space-y-6">
              {/* Futuristic Cantina/Hangar Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-cyan-600/40 bg-gradient-to-r from-[#0a1824] via-[#06121c] to-[#03090f] p-6 shadow-2xl">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-60" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                      <Warehouse className="h-4 w-4" />
                      <span>Galaktik Kasa & Envanter</span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-wide">
                      Kişisel Envanter & Eşya Kasası
                    </h2>
                    <p className="max-w-xl text-xs leading-relaxed text-zinc-300">
                      Deponuzdaki kullanılmaya hazır taktiksel materyaller, bina hızlandırıcıları, tersane jetonları ve hammadde takviyeleri. Eşyaları seçtiğiniz aktif gezegende anında etkinleştirebilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 py-3 shadow-inner">
                    <Package className="h-6 w-6 text-cyan-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-cyan-300">
                        Toplam Envanter
                      </p>
                      <p className="text-lg font-black text-white">
                        {inventoryItems.reduce((acc, cur) => acc + cur.quantity, 0)} Adet Eşya
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Alert */}
              {inventoryActionStatus && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/50 p-3 text-xs font-semibold text-emerald-300 shadow-md">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{inventoryActionStatus}</span>
                </div>
              )}

              {/* Inventory Items Grid */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xl">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Sahip Olunan Eşyalar
                </h3>

                {isInventoryLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`inv-skel-${idx}`}
                        className="h-36 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 animate-pulse"
                      />
                    ))}
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 py-12 text-center">
                    <Package className="mb-3 h-12 w-12 text-zinc-600" />
                    <p className="text-sm font-bold text-zinc-300">
                      Bu kategoride hiç eşyanız bulunmuyor.
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Dükkandan yeni materyaller satın alabilir veya görevlerden ödül kazanabilirsiniz.
                    </p>
                    <button
                      onClick={() => setActiveMode("shop")}
                      className="mt-4 rounded-lg border border-amber-500/60 bg-amber-600/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-600/30 transition-colors"
                    >
                      Dükkana Git
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {inventoryItems.map((invItem) => {
                      const tierStyle =
                        TIER_THEME[invItem.tier as keyof typeof TIER_THEME] ||
                        TIER_THEME.Bronze;

                      return (
                        <div
                          key={invItem.id}
                          className={`flex flex-col justify-between rounded-xl border p-4 shadow-lg transition-all ${tierStyle.border} ${tierStyle.gradient} bg-zinc-950`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold uppercase ${tierStyle.text}`}>
                                {invItem.tier}
                              </span>
                              <span className="flex items-center gap-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-xs font-extrabold text-amber-300">
                                x{invItem.quantity}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white mb-1">
                              {invItem.name}
                            </h4>
                            <p className="line-clamp-2 text-xs text-zinc-400 mb-2">
                              {invItem.description || invItem.targetSummary}
                            </p>
                          </div>

                          <div className="mt-4 border-t border-zinc-800/80 pt-3">
                            <button
                              onClick={() => handleActivateInventoryItem(invItem)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/60 bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 text-xs font-bold text-zinc-950 shadow-md hover:brightness-110 active:scale-95 transition-all"
                            >
                              <Zap className="h-3.5 w-3.5 fill-current" />
                              <span>Etkinleştir</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dark Matter Top-up Gateway Modal */}
      <DarkMatterTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        userId={userId || ""}
        onSuccess={(newDm) => {
          setLocalDarkMatter(newDm);
          fetchBootstrap();
        }}
      />
    </div>
  );
}

export default function ShopMasterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm font-bold">Galaktik Dükkan yükleniyor...</span>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
