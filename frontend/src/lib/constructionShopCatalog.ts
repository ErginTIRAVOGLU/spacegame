export type ShopItemCategory = "all" | "construction" | "field" | "lifeform";
export type ShopItemTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface ShopConstructionItem {
  itemKey: string;
  name: string;
  category: "construction" | "field" | "lifeform";
  tier: ShopItemTier;
  effectValue: number;
  baseCostDarkMatter: number;
  discountCostDarkMatter: number;
  isDiscountActive: boolean;
  effectiveCostDarkMatter: number;
  description: string;
  targetSummary: string;
  ownedQuantity?: number;
}

export interface UserInventoryItemDto {
  id: string;
  itemKey: string;
  name: string;
  category: "construction" | "field" | "lifeform";
  tier: ShopItemTier;
  effectValue: number;
  quantity: number;
  description: string;
  targetSummary: string;
  createdAtUtc: string;
}

export const TIER_CONFIG: Record<
  ShopItemTier,
  {
    name: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    glow: string;
    accent: string;
  }
> = {
  Bronze: {
    name: "Bronz",
    border: "border-amber-700/50 hover:border-amber-600/80",
    badgeBg: "bg-amber-950/80 border border-amber-700/60",
    badgeText: "text-amber-400",
    cardBg: "bg-gradient-to-b from-[#14100c] to-[#0c0a08]",
    glow: "shadow-[0_4px_20px_rgba(180,83,9,0.12)]",
    accent: "text-amber-400",
  },
  Silver: {
    name: "Gümüş",
    border: "border-slate-400/50 hover:border-slate-300/80",
    badgeBg: "bg-slate-900/80 border border-slate-500/60",
    badgeText: "text-slate-200",
    cardBg: "bg-gradient-to-b from-[#10141a] to-[#0a0d12]",
    glow: "shadow-[0_4px_20px_rgba(148,163,184,0.15)]",
    accent: "text-slate-300",
  },
  Gold: {
    name: "Altın",
    border: "border-yellow-500/50 hover:border-yellow-400/80",
    badgeBg: "bg-yellow-950/80 border border-yellow-500/60",
    badgeText: "text-yellow-300",
    cardBg: "bg-gradient-to-b from-[#191507] to-[#0d0c05]",
    glow: "shadow-[0_4px_20px_rgba(234,179,8,0.18)]",
    accent: "text-yellow-400",
  },
  Platinum: {
    name: "Platin",
    border: "border-cyan-400/60 hover:border-cyan-300/90",
    badgeBg: "bg-cyan-950/80 border border-cyan-400/70",
    badgeText: "text-cyan-300",
    cardBg: "bg-gradient-to-b from-[#09151e] to-[#050c12]",
    glow: "shadow-[0_4px_25px_rgba(34,211,238,0.25)]",
    accent: "text-cyan-400",
  },
};

export const CATEGORY_FILTERS = [
  { id: "all" as ShopItemCategory, label: "Tümü", icon: "Sparkles" },
  {
    id: "construction" as ShopItemCategory,
    label: "Kraken (Hızlandırıcılar)",
    icon: "Clock",
  },
  {
    id: "field" as ShopItemCategory,
    label: "Alan Genişletme",
    icon: "Maximize2",
  },
  {
    id: "lifeform" as ShopItemCategory,
    label: "Yaşam Formu",
    icon: "Dna",
  },
];

