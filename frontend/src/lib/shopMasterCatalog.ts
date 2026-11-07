export interface ShopMasterItem {
  itemKey: string;
  name: string;
  primaryCategory: string;
  categories: string[];
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  duration: string;
  durationDays: number;
  effectValue: number;
  baseCostDarkMatter: number;
  discountCostDarkMatter: number;
  isDiscountActive: boolean;
  effectiveCostDarkMatter: number;
  description: string;
  targetSummary: string;
  iconKey: string;
  metalAmount?: number;
  crystalAmount?: number;
  deuteriumAmount?: number;
  ownedQuantity?: number;
  hasStorageOverflow?: boolean;
  storageWarning?: string | null;
}

export interface InventoryItemEntry {
  id: string;
  itemKey: string;
  name: string;
  category: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | string;
  effectValue: number;
  durationDays: number;
  quantity: number;
  description: string;
  targetSummary: string;
  createdAtUtc: string;
}

export interface ShopCatalogResponse {
  category: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  categoryCounts: Record<string, number>;
  inventoryCategoryCounts: Record<string, number>;
  darkMatter: number;
  planetId?: string;
  items: ShopMasterItem[];
}

export interface InventoryResponse {
  userId: string;
  darkMatter: number;
  items: InventoryItemEntry[];
  totalCount: number;
}

export const SHOP_MODE_CATEGORIES = [
  { id: "special", label: "Özel İndirimler", defaultCount: 4, icon: "Flame" },
  { id: "classes", label: "Sınıf seçimi", defaultCount: 6, icon: "Shield" },
  { id: "construction", label: "İnşa", defaultCount: 37, icon: "Hammer" },
  { id: "resources", label: "Ham Maddeler", defaultCount: 71, icon: "Boxes" },
  { id: "boosters-30d", label: "30 Günlük Güçlendirici", defaultCount: 24, icon: "Calendar" },
  { id: "boosters-90d", label: "90 Günlük Güçlendirici", defaultCount: 21, icon: "Sparkles" },
  { id: "profile", label: "Profil", defaultCount: 22, icon: "User" },
  { id: "all", label: "Hepsi", defaultCount: 176, icon: "Layers" },
] as const;

export const INVENTORY_MODE_CATEGORIES = [
  { id: "limited", label: "Süresi sınırlı eşyalar", icon: "Clock" },
  { id: "classes", label: "Sınıf seçimi", icon: "Shield" },
  { id: "construction", label: "İnşa", icon: "Hammer" },
  { id: "resources", label: "Ham Maddeler", icon: "Boxes" },
  { id: "boosters-30d", label: "30 Günlük Güçlendirici", icon: "Calendar" },
  { id: "boosters-90d", label: "90 Günlük Güçlendirici", icon: "Sparkles" },
  { id: "profile", label: "Profil", icon: "User" },
  { id: "all", label: "Hepsi", icon: "Layers" },
] as const;

export function formatDarkMatterBadge(cost: number): string {
  if (cost >= 1_000_000) {
    const millions = (cost / 1_000_000).toFixed(cost % 1_000_000 === 0 ? 0 : 1);
    return `${millions}M KM`;
  }
  if (cost >= 1_000) {
    const thousands = (cost / 1_000).toFixed(cost % 1_000 === 0 ? 0 : 1);
    return `${thousands}K KM`;
  }
  return `${cost} KM`;
}

export function formatDarkMatterFull(cost: number): string {
  return `${cost.toLocaleString("tr-TR")} KM`;
}

export const TIER_THEME = {
  Bronze: {
    border: "border-amber-700/60 hover:border-amber-500",
    glow: "shadow-[0_0_12px_rgba(180,83,9,0.2)]",
    text: "text-amber-500",
    badgeBg: "bg-amber-950/80 border-amber-700/60 text-amber-300",
    gradient: "from-amber-950/30 via-zinc-950/80 to-zinc-950",
  },
  Silver: {
    border: "border-slate-400/60 hover:border-slate-300",
    glow: "shadow-[0_0_12px_rgba(148,163,184,0.2)]",
    text: "text-slate-300",
    badgeBg: "bg-slate-900/80 border-slate-500/60 text-slate-200",
    gradient: "from-slate-900/30 via-zinc-950/80 to-zinc-950",
  },
  Gold: {
    border: "border-yellow-500/60 hover:border-yellow-400",
    glow: "shadow-[0_0_15px_rgba(234,179,8,0.25)]",
    text: "text-yellow-400",
    badgeBg: "bg-yellow-950/80 border-yellow-600/60 text-yellow-300",
    gradient: "from-yellow-950/30 via-zinc-950/80 to-zinc-950",
  },
  Platinum: {
    border: "border-cyan-400/60 hover:border-cyan-300",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    text: "text-cyan-300",
    badgeBg: "bg-cyan-950/80 border-cyan-500/60 text-cyan-200",
    gradient: "from-cyan-950/30 via-zinc-950/80 to-zinc-950",
  },
};

