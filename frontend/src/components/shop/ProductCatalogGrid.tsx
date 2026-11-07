"use client";

import React from "react";
import {
  ShopMasterItem,
  TIER_THEME,
  formatDarkMatterBadge,
} from "@/lib/shopMasterCatalog";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Shield,
  Layers,
  Sparkles,
  Flame,
} from "lucide-react";

interface ProductCatalogGridProps {
  items: ShopMasterItem[];
  selectedItem: ShopMasterItem | null;
  onSelectItem: (item: ShopMasterItem) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function ProductCatalogGrid({
  items,
  selectedItem,
  onSelectItem,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: ProductCatalogGridProps) {
  // Generate pagination pages window (e.g. 1 2 3 4 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col space-y-4">
      {/* 3x3 Catalog Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="flex h-36 flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 animate-pulse"
              >
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-10 w-10 self-center rounded-lg bg-zinc-800/80" />
                <div className="h-6 w-1/2 self-center rounded-full bg-zinc-800" />
              </div>
            ))
          : items.map((item) => {
              const isSelected = selectedItem?.itemKey === item.itemKey;
              const tierStyle =
                TIER_THEME[item.tier as keyof typeof TIER_THEME] ||
                TIER_THEME.Bronze;

              return (
                <div
                  key={item.itemKey}
                  onClick={() => onSelectItem(item)}
                  className={`group relative flex h-40 cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 select-none ${
                    isSelected
                      ? "border-amber-400 ring-2 ring-amber-500/50 bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                      : `${tierStyle.border} bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-black hover:border-zinc-500 hover:bg-zinc-900/90`
                  }`}
                >
                  {/* Top Row: Quality Indicator & Owned Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${tierStyle.text}`}
                    >
                      {item.tier}
                    </span>
                    {(item.ownedQuantity ?? 0) > 0 && (
                      <span className="flex items-center gap-1 rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-zinc-700">
                        x{item.ownedQuantity}
                      </span>
                    )}
                    {item.isDiscountActive && (
                      <span className="flex items-center gap-0.5 rounded bg-rose-950/80 border border-rose-800 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                        <Flame className="h-2.5 w-2.5 text-rose-400" />
                        İNDİRİM
                      </span>
                    )}
                  </div>

                  {/* Center Content: Icon & Title */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="relative mb-1.5 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-950 group-hover:scale-105 transition-transform">
                      {item.categories.includes("classes") ? (
                        <Shield className={`h-5 w-5 ${tierStyle.text}`} />
                      ) : item.categories.includes("construction") ? (
                        <Layers className={`h-5 w-5 ${tierStyle.text}`} />
                      ) : item.isDiscountActive ? (
                        <Sparkles className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Package className={`h-5 w-5 ${tierStyle.text}`} />
                      )}
                    </div>
                    <span className="line-clamp-2 text-xs font-bold leading-tight text-zinc-200 group-hover:text-amber-300 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Bottom Row: Dark Gold KM Cost Badge */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1 rounded-full border border-amber-600/60 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 px-3 py-0.5 text-[11px] font-extrabold text-amber-300 shadow-md transition-all group-hover:border-amber-400 group-hover:text-amber-200">
                      <span>{formatDarkMatterBadge(item.effectiveCostDarkMatter)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Multi-Page Pagination Bar */}
      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2 border-t border-zinc-800/80 pt-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Önceki Sayfa"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                disabled={isLoading}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border border-amber-500 bg-amber-500 text-zinc-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                    : "border border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            aria-label="Sonraki Sayfa"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

