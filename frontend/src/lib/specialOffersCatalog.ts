export interface LadderBoosterItem {
  itemCode: string;
  name: string;
  tier: string;
  durationDays: number;
  percent: number;
  basePrice: number;
  discountPercent: number;
  salePrice: number;
  description: string;
}

export interface CompositeBundleItem {
  bundleId: string;
  name: string;
  originalValueDarkMatter: number;
  bundlePriceDarkMatter: number;
  discountPercent: number;
  description: string;
  itemsIncluded: string[];
}

export interface SpecialOffersResponse {
  eventTitle: string;
  eventPromoBadge: string;
  eventRemainingSeconds: number;
  userDarkMatter: number;
  userId: string | null;
  planetId: string | null;
  classChangePromo: {
    basePrice: number;
    salePrice: number;
    discountPercent: number;
    savings: number;
  };
  relocationPromo: {
    basePrice: number;
    salePrice: number;
    discountPercent: number;
    savings: number;
  };
  resourcePackPromo: {
    basePrice: number;
    salePrice: number;
    discountPercent: number;
    savings: number;
  };
  speedupPromo: {
    minBasePrice: number;
    minSalePrice: number;
    discountPercent: number;
  };
  ladderBoosters: LadderBoosterItem[];
  bundles: CompositeBundleItem[];
}

export function formatEventRemaining(seconds: number): string {
  if (seconds <= 0) return "Etkinlik sona erdi";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}g ${hours}s ${mins}dk`;
  }
  return `${hours}s ${mins}dk`;
}

