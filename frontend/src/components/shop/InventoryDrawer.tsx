"use client";

import React, { useState, useMemo } from "react";
import {
  InventoryItemEntry,
  QUALITY_TIER_CONFIG,
} from "@/lib/shopFullCatalog";
import {
  Package,
  X,
  Boxes,
  Clock,
  Shield,
  FlaskConical,
  Compass,
  Sparkles,
  Zap,
  Globe,
  Moon,
} from "lucide-react";

interface InventoryDrawerProps {
  isOpen: boolean;
  items: InventoryItemEntry[];
  currentPlanet: { id: string; name: string; isMoon: boolean } | null;
  onClose: () => void;
  onActivateItem: (item: InventoryItemEntry) => void;
}

export function InventoryDrawer({
  isOpen,
  items,
  currentPlanet,
  onClose,
  onActivateItem,
}: InventoryDrawerProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const totalCount = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterCategory === "all") return items;
    return items.filter((i) => i.category.toLowerCase() === filterCategory.toLowerCase());
  }, [items, filterCategory]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#080d15] border-l border-cyan-500/30 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Envanterim</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-950 border border-cyan-700 text-cyan-300">
                  {totalCount}
                </span>
              </h2>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                {currentPlanet ? (
                  <>
                    <span>Hedef:</span>
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">
                      {currentPlanet.isMoon ? <Moon className="w-3 h-3 text-amber-300" /> : <Globe className="w-3 h-3 text-cyan-400" />}
                      {currentPlanet.name} ({currentPlanet.isMoon ? "Ay" : "Gezegen"})
                    </span>
                  </>
                ) : (
                  <span>Lütfen bir gezegen seçin</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-3 border-b border-zinc-800/60 bg-[#0a0f19] flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "all", label: "Tümü" },
            { id: "resource", label: "Hammadde" },
            { id: "construction", label: "İnşaat" },
            { id: "shipyard", label: "Tersane" },
            { id: "research", label: "Araştırma" },
            { id: "special", label: "Özel" },
          ].map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold"
                    : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono space-y-2">
              <Package className="w-10 h-10 text-zinc-600 mx-auto opacity-50" />
              <div>Bu kategoride envanterinizde eşya bulunmamaktadır.</div>
            </div>
          ) : (
            filteredItems.map((invItem) => {
              const tierConf =
                QUALITY_TIER_CONFIG[invItem.tier] || QUALITY_TIER_CONFIG.Bronze;
              return (
                <div
                  key={invItem.id}
                  className={`p-3.5 rounded-xl border ${tierConf.border} ${tierConf.cardBg} flex items-center justify-between gap-3 shadow-md group transition hover:border-cyan-400/60`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shrink-0">
                      {getItemIcon(invItem.category, invItem.itemKey)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-100 truncate">
                        {invItem.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {invItem.targetSummary}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${tierConf.badgeBg} ${tierConf.badgeText}`}
                        >
                          {tierConf.name}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-cyan-300">
                          Adet: {invItem.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onActivateItem(invItem)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/60 text-cyan-300 shrink-0 transition flex items-center gap-1 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Kullan</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

