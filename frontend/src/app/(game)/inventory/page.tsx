"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  InventoryItemEntry,
  ActivePlanetBooster,
  ActiveUserBuff,
  QUALITY_TIER_CONFIG,
} from "@/lib/shopFullCatalog";
import {
  ItemPurchaseModal,
  ModalMode,
} from "@/components/shop/ItemPurchaseModal";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  Package,
  Sparkles,
  Boxes,
  Clock,
  Shield,
  FlaskConical,
  Compass,
  Coins,
  Globe,
  Moon,
  Zap,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function InventoryPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [inventoryItems, setInventoryItems] = useState<InventoryItemEntry[]>([]);
  const [activeBoosters, setActiveBoosters] = useState<ActivePlanetBooster[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<ActiveUserBuff[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [modalItem, setModalItem] = useState<InventoryItemEntry | null>(null);

  const currentPlanet = useMemo(() => {
    const found = planets.find((p) => p.id === selectedPlanetId);
    return found
      ? { id: found.id, name: found.name, isMoon: found.isMoon ?? false }
      : null;
  }, [planets, selectedPlanetId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const invUrl = userId
        ? `${API_BASE_URL}/api/inventory/items?userId=${userId}`
        : `${API_BASE_URL}/api/inventory/items`;

      const boosterUrl = selectedPlanetId
        ? `${API_BASE_URL}/api/shop/active-boosters?planetId=${selectedPlanetId}`
        : null;

      const buffUrl = userId
        ? `${API_BASE_URL}/api/shop/active-buffs?userId=${userId}`
        : `${API_BASE_URL}/api/shop/active-buffs`;

      const reqs: Promise<Response>[] = [fetch(invUrl)];
      if (boosterUrl) reqs.push(fetch(boosterUrl));
      reqs.push(fetch(buffUrl));

      const [invRes, boosterRes, buffRes] = await Promise.all(reqs);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData.items || []);
      }

      if (boosterRes && boosterRes.ok) {
        const bData = await boosterRes.json();
        setActiveBoosters(bData.boosters || []);
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
    if (activeCategory === "all") return inventoryItems;
    return inventoryItems.filter(
      (i) => i.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [inventoryItems, activeCategory]);

  const totalCount = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [inventoryItems]);

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="relative rounded-2xl border border-cyan-500/25 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Galaktik Kasa & Eşya Deposu
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Oyuncu <span className="text-cyan-300">Envanteri</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Satın aldığınız veya ödül olarak kazandığınız tüm inşaat, tersane,
            araştırma ve hammadde güçlendiricileri burada saklanır. Eşyalar
            kullanılana kadar silinmez ve süresi başlamaz.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <Link
              href="/shop/items"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Dükkana Git (71+ Eşya)</span>
            </Link>
          </div>
        </div>

        {/* Target Planet & Dark Matter */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0e1420] border border-zinc-800 text-right shadow-md">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Karanlık Madde
            </div>
            <div className="text-base font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5 mt-0.5">
              <Coins className="h-4 w-4 text-purple-400" />
              <span>{darkMatter.toLocaleString("tr-TR")} KM</span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-right shadow-md">
            <div className="text-[10px] font-mono uppercase text-cyan-400">
              Toplam Eşya
            </div>
            <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
              {totalCount} Adet
            </div>
          </div>
        </div>
      </div>

      {/* Target Planet Context Banner */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0a0f19] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {currentPlanet?.isMoon ? (
            <Moon className="w-4 h-4 text-amber-300" />
          ) : (
            <Globe className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-xs text-zinc-400">Aktif Gezegen:</span>
          <span className="text-sm font-bold text-zinc-100">
            {currentPlanet?.name || "Bilinmiyor"}{" "}
            <span className="text-xs text-zinc-500 font-normal">
              ({currentPlanet?.isMoon ? "Ay" : "Gezegen"})
            </span>
          </span>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          Eşya kullanımı bu hedef konum üzerinde gerçekleşecektir.
        </span>
      </div>

      {/* Feedback Banner */}
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Tümü", icon: "Sparkles" },
          { id: "resource", label: "Hammadde", icon: "Boxes" },
          { id: "construction", label: "İnşaat", icon: "Clock" },
          { id: "shipyard", label: "Tersane", icon: "Shield" },
          { id: "research", label: "Araştırma", icon: "FlaskConical" },
          { id: "special", label: "Özel", icon: "Compass" },
        ].map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat.id === "all" && <Sparkles className="w-3.5 h-3.5" />}
              {cat.id === "resource" && <Boxes className="w-3.5 h-3.5" />}
              {cat.id === "construction" && <Clock className="w-3.5 h-3.5" />}
              {cat.id === "shipyard" && <Shield className="w-3.5 h-3.5" />}
              {cat.id === "research" && <FlaskConical className="w-3.5 h-3.5" />}
              {cat.id === "special" && <Compass className="w-3.5 h-3.5" />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Inventory Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#0a0f19] p-16 text-center space-y-3">
          <Package className="w-12 h-12 text-zinc-600 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-zinc-300">
            Envanterinizde Bu Kategoride Eşya Yok
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Dükkandan yeni hızlandırıcılar veya hammadde maden güçlendiricileri
            satın alarak envanterinize ekleyebilirsiniz.
          </p>
          <div className="pt-2">
            <Link
              href="/shop/items"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-black transition shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Dükkana Git</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((invItem) => {
            const tierConf =
              QUALITY_TIER_CONFIG[invItem.tier] || QUALITY_TIER_CONFIG.Bronze;

            return (
              <div
                key={invItem.id}
                className={`rounded-2xl border ${tierConf.border} ${tierConf.cardBg} ${tierConf.glow} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner group-hover:scale-105 transition-transform">
                      {getItemIcon(invItem.category, invItem.itemKey)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${tierConf.badgeBg} ${tierConf.badgeText}`}
                      >
                        {tierConf.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                        Adet: {invItem.quantity}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                      {invItem.name}
                    </h3>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 border border-zinc-700/60 text-cyan-300">
                        {invItem.targetSummary}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                      {invItem.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setModalItem(invItem)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/60 text-cyan-300 transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Eşyayı Kullan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activation Modal */}
      {modalItem && (
        <ItemPurchaseModal
          item={modalItem}
          mode="activateOwned"
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

