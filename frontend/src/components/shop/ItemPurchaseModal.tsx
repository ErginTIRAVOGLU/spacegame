"use client";

import React, { useState } from "react";
import {
  FullShopItem,
  InventoryItemEntry,
  QUALITY_TIER_CONFIG,
  ActivePlanetBooster,
} from "@/lib/shopFullCatalog";
import {
  ShopConstructionItem,
  UserInventoryItemDto,
} from "@/lib/constructionShopCatalog";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  X,
  Coins,
  Clock,
  Maximize2,
  Dna,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Loader2,
  Globe,
  Moon,
  Package,
  Boxes,
  Shield,
  FlaskConical,
  Compass,
  Zap,
} from "lucide-react";

export type ModalMode = "buy" | "buyAndActivate" | "activateOwned";

interface ItemPurchaseModalProps {
  item:
    | FullShopItem
    | InventoryItemEntry
    | ShopConstructionItem
    | UserInventoryItemDto;
  mode: ModalMode;
  currentPlanet: { id: string; name: string; isMoon: boolean } | null;
  userDarkMatter: number;
  activeBoosters?: ActivePlanetBooster[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ItemPurchaseModal({
  item,
  mode,
  currentPlanet,
  userDarkMatter,
  activeBoosters = [],
  onClose,
  onSuccess,
}: ItemPurchaseModalProps) {
  const userId = useGameStore((s) => s.userId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tier = (item.tier || "Bronze") as keyof typeof QUALITY_TIER_CONFIG;
  const tierConfig = QUALITY_TIER_CONFIG[tier] || QUALITY_TIER_CONFIG.Bronze;

  // Cost calculation
  const isShopItem = "effectiveCostDarkMatter" in item;
  const unitCost = isShopItem ? item.effectiveCostDarkMatter : 0;
  const totalCost = unitCost * quantity;
  const hasEnoughKm = mode === "activateOwned" || userDarkMatter >= totalCost;

  // Resource booster conflict detection
  const isResourceItem = item.category === "resource";
  let resourceType: "Metal" | "Crystal" | "Deuterium" | null = null;
  if (isResourceItem) {
    if (item.itemKey.includes("metal")) resourceType = "Metal";
    else if (item.itemKey.includes("crystal")) resourceType = "Crystal";
    else if (item.itemKey.includes("deut")) resourceType = "Deuterium";
  }

  const existingBooster = isResourceItem && resourceType
    ? activeBoosters.find((b) => b.resourceType.toLowerCase() === resourceType!.toLowerCase())
    : null;

  // Moon & Target constraints
  const isMoon = currentPlanet?.isMoon ?? false;
  const isMoonFieldItem = item.itemKey.toLowerCase().includes("moon");
  const isFieldItem = item.category === "field";

  let invalidTargetWarning: string | null = null;
  if ((mode === "buyAndActivate" || mode === "activateOwned") && currentPlanet) {
    if (isResourceItem && isMoon) {
      invalidTargetWarning = "Hammadde güçlendiricileri Aylarda kullanılamaz. Lütfen bir Gezegen seçin.";
    } else if (isFieldItem) {
      if (isMoonFieldItem && !isMoon) {
        invalidTargetWarning = "Ay Alanı İtemı yalnızca Aylarda kullanılabilir. Lütfen bir Ay seçin.";
      } else if (!isMoonFieldItem && isMoon) {
        invalidTargetWarning = "Gezegen Alanı İtemı Aylarda kullanılamaz. Yalnızca Gezegenlerde kullanılabilir.";
      }
    } else if (item.category === "lifeform" && isMoon) {
      invalidTargetWarning = "Canlı türü binaları Aylarda bulunmaz.";
    }
  }

  const getItemIcon = () => {
    switch (item.category) {
      case "resource":
        return <Boxes className="w-8 h-8 text-amber-400" />;
      case "construction":
        return <Clock className="w-8 h-8 text-yellow-400" />;
      case "shipyard":
        return <Shield className="w-8 h-8 text-cyan-400" />;
      case "research":
        return <FlaskConical className="w-8 h-8 text-emerald-400" />;
      case "special":
        return <Compass className="w-8 h-8 text-purple-400" />;
      case "field":
        return isMoonFieldItem ? (
          <Moon className="w-8 h-8 text-yellow-300" />
        ) : (
          <Maximize2 className="w-8 h-8 text-emerald-400" />
        );
      case "lifeform":
        return <Dna className="w-8 h-8 text-cyan-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-cyan-400" />;
    }
  };

  const handleConfirm = async () => {
    if (invalidTargetWarning) {
      setErrorMessage(invalidTargetWarning);
      return;
    }

    if (!hasEnoughKm) {
      setErrorMessage("Yetersiz Karanlık Madde bakiyesi!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "buy") {
        const res = await fetch(`${API_BASE_URL}/api/shop/items/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || undefined,
            itemKey: item.itemKey,
            quantity,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Satın alma işlemi başarısız oldu.");
        }

        await fetchBootstrap();
        onSuccess(data.message || `${item.name} envantere eklendi!`);
        onClose();
      } else if (mode === "buyAndActivate") {
        if (!currentPlanet) {
          throw new Error("Lütfen önce bir hedef gezegen seçin.");
        }

        const res = await fetch(`${API_BASE_URL}/api/shop/items/buy-and-activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || undefined,
            itemKey: item.itemKey,
            planetId: currentPlanet.id,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Doğrudan uygulama işlemi başarısız oldu.");
        }

        await fetchBootstrap();
        onSuccess(data.message || `${item.name} başarıyla uygulandı!`);
        onClose();
      } else if (mode === "activateOwned") {
        if (!currentPlanet) {
          throw new Error("Lütfen önce bir hedef gezegen seçin.");
        }

        const res = await fetch(`${API_BASE_URL}/api/inventory/items/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || undefined,
            inventoryItemId: "id" in item ? item.id : undefined,
            itemKey: item.itemKey,
            planetId: currentPlanet.id,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Envanter eşyası kullanımı başarısız oldu.");
        }

        await fetchBootstrap();
        onSuccess(data.message || `${item.name} başarıyla kullanıldı!`);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-2xl border ${tierConfig.border} bg-[#0b0f17] shadow-2xl overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider ${tierConfig.badgeBg} ${tierConfig.badgeText}`}
            >
              {tierConfig.name} Kalite
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {mode === "buy"
                ? "Envantere Satın Al"
                : mode === "buyAndActivate"
                ? "Doğrudan Kullanım"
                : "Envanterden Kullan"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Item Highlight Card */}
          <div
            className={`p-4 rounded-xl border border-zinc-800/80 ${tierConfig.cardBg} flex items-center gap-4`}
          >
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-700/60 shrink-0 shadow-inner">
              {getItemIcon()}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base font-bold text-zinc-100 truncate">
                {item.name}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {item.description}
              </p>
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-950/70 border border-cyan-800/60 text-cyan-300">
                  {item.targetSummary}
                </span>
                {mode === "activateOwned" && "quantity" in item && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Mevcut: {item.quantity} adet</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mode: Buy Quantity Selector */}
          {mode === "buy" && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e131d] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-300">Adet Seçimi</div>
                <div className="text-[11px] text-zinc-500">
                  Satın alınan eşyalar envanterinizde depolanır ve süresiz bekler.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={quantity <= 1 || isSubmitting}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold flex items-center justify-center transition"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-zinc-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= 99 || isSubmitting}
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Target Planet Info (for activation modes) */}
          {(mode === "buyAndActivate" || mode === "activateOwned") && (
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0e131d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isMoon ? (
                  <Moon className="w-4 h-4 text-amber-300" />
                ) : (
                  <Globe className="w-4 h-4 text-cyan-400" />
                )}
                <div>
                  <div className="text-xs text-zinc-400 font-mono">Hedef Konum</div>
                  <div className="text-sm font-semibold text-zinc-100">
                    {currentPlanet?.name || "Bilinmeyen Konum"}{" "}
                    <span className="text-xs text-zinc-500 font-normal">
                      ({isMoon ? "Ay" : "Gezegen"})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">
                  Uygulama
                </div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Anında Etki</span>
                </div>
              </div>
            </div>
          )}

          {/* Overwrite Warning for Resource Booster */}
          {(mode === "buyAndActivate" || mode === "activateOwned") && existingBooster && (
            <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/30 flex items-start gap-2.5 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Mevcut Güçlendirici Değiştirilecek:</span> Bu gezegende halen aktif bir %{existingBooster.percent} {resourceType} güçlendirici bulunuyor. Yeni eşyayı kullandığınızda mevcut güçlendirici sıfırlanarak yenisi ile güncellenecektir.
              </div>
            </div>
          )}

          {/* Validation Warning if target mismatch */}
          {invalidTargetWarning && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 flex items-start gap-2.5 text-xs text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{invalidTargetWarning}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 flex items-start gap-2.5 text-xs text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pricing & Dark Matter Balance */}
          {mode !== "activateOwned" && (
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/70 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Birim Fiyat</span>
                <span className="font-mono text-zinc-300">
                  {unitCost.toLocaleString("tr-TR")} KM
                </span>
              </div>
              {quantity > 1 && (
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Adet</span>
                  <span className="font-mono text-zinc-300">{quantity}</span>
                </div>
              )}
              <div className="h-px bg-zinc-800" />
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-zinc-200">Toplam Tutar</span>
                <span className="text-purple-300 font-mono flex items-center gap-1">
                  <Coins className="w-4 h-4 text-purple-400" />
                  {totalCost.toLocaleString("tr-TR")} KM
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>Mevcut Bakiye:</span>
                <span
                  className={`font-mono ${
                    hasEnoughKm ? "text-zinc-300" : "text-red-400 font-bold"
                  }`}
                >
                  {userDarkMatter.toLocaleString("tr-TR")} KM
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !hasEnoughKm || !!invalidTargetWarning}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:pointer-events-none transition flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : mode === "buy" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Satın Al ({totalCost.toLocaleString("tr-TR")} KM)</span>
              </>
            ) : mode === "buyAndActivate" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kullan ({totalCost.toLocaleString("tr-TR")} KM)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Eşyayı Kullan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
