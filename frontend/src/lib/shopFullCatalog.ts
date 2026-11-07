export type ShopCatalogCategory =
  | "all"
  | "resource"
  | "construction"
  | "shipyard"
  | "research"
  | "special";

export type ShopQualityTier = "all" | "Bronze" | "Silver" | "Gold" | "Platinum";

export interface FullShopItem {
  itemKey: string;
  name: string;
  category: "resource" | "construction" | "shipyard" | "research" | "special" | "field" | "lifeform";
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  durationDays?: number;
  effectValue: number;
  baseCostDarkMatter: number;
  discountCostDarkMatter: number;
  isDiscountActive: boolean;
  effectiveCostDarkMatter: number;
  description: string;
  targetSummary: string;
  ownedQuantity?: number;
}

export interface InventoryItemEntry {
  id: string;
  itemKey: string;
  name: string;
  category: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  effectValue: number;
  durationDays: number;
  quantity: number;
  description: string;
  targetSummary: string;
  createdAtUtc: string;
}

export interface ActivePlanetBooster {
  id: string;
  planetId: string;
  resourceType: "Metal" | "Crystal" | "Deuterium";
  multiplier: number;
  percent: number;
  tier: string;
  itemKey: string;
  expiresAtUtc: string;
  remainingSeconds: number;
}

export interface ActiveUserBuff {
  id: string;
  userId: string;
  buffType: string;
  value: number;
  tier: string;
  itemKey: string;
  expiresAtUtc: string;
  remainingSeconds: number;
}

export const SHOP_CATEGORY_TABS: { id: ShopCatalogCategory; label: string; countLabel?: string; icon: string }[] = [
  { id: "all", label: "Tümü", countLabel: "71+ Ürün", icon: "Sparkles" },
  { id: "resource", label: "Hammadde Güçlendiricileri", countLabel: "36 Ürün", icon: "Boxes" },
  { id: "construction", label: "İnşaat (Kraken)", countLabel: "12 Ürün", icon: "Clock" },
  { id: "shipyard", label: "Tersane (Detroid)", countLabel: "12 Ürün", icon: "ShieldAlert" },
  { id: "research", label: "Araştırma (Newtron)", countLabel: "12 Ürün", icon: "FlaskConical" },
  { id: "special", label: "Özel / Keşif & Yaşam Formu", countLabel: "7 Ürün", icon: "Compass" },
];

export const TIER_FILTER_PILLS: { id: ShopQualityTier; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "Bronze", label: "Bronz" },
  { id: "Silver", label: "Gümüş" },
  { id: "Gold", label: "Altın" },
  { id: "Platinum", label: "Platin" },
];

export const QUALITY_TIER_CONFIG = {
  Bronze: {
    name: "Bronz",
    border: "border-amber-700/50 hover:border-amber-600/90",
    badgeBg: "bg-amber-950/80 border border-amber-700/60",
    badgeText: "text-amber-400",
    cardBg: "bg-gradient-to-b from-[#14100c] to-[#0c0a08]",
    glow: "shadow-[0_4px_20px_rgba(180,83,9,0.12)]",
    accent: "text-amber-400",
  },
  Silver: {
    name: "Gümüş",
    border: "border-slate-400/50 hover:border-slate-300/90",
    badgeBg: "bg-slate-900/80 border border-slate-500/60",
    badgeText: "text-slate-200",
    cardBg: "bg-gradient-to-b from-[#10141a] to-[#0a0d12]",
    glow: "shadow-[0_4px_20px_rgba(148,163,184,0.15)]",
    accent: "text-slate-300",
  },
  Gold: {
    name: "Altın",
    border: "border-yellow-500/50 hover:border-yellow-400/90",
    badgeBg: "bg-yellow-950/80 border border-yellow-500/60",
    badgeText: "text-yellow-300",
    cardBg: "bg-gradient-to-b from-[#191507] to-[#0d0c05]",
    glow: "shadow-[0_4px_20px_rgba(234,179,8,0.2)]",
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
