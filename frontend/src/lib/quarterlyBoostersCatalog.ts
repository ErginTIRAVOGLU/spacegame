export interface QuarterlyBoosterItem {
  itemCode: string;
  name: string;
  resourceType: "Metal" | "Crystal" | "Deuterium";
  tier: "Silver" | "Gold" | "Platinum";
  multiplier: number;
  percent: number;
  durationDays: number;
  costDarkMatter: number;
  savingsDarkMatter: number;
  description: string;
  targetSummary: string;
  isActive: boolean;
  activeDifferentTier: boolean;
  activeDifferentTierPercent: number;
  activeRemainingSeconds: number;
  activeExpiresAtUtc: string | null;
}

export interface QuarterlyOfficerItem {
  officerKey: "Commander" | "Admiral" | "Engineer" | "Geologist" | "Technocrat" | "Staff";
  name: string;
  durationDays: number;
  costDarkMatter: number;
  description: string;
  perksSummary: string[];
  isActive: boolean;
  expiresAtUtc: string | null;
  remainingSeconds: number;
}

export interface Boosters90dResponse {
  darkMatter: number;
  userId: string | null;
  planetId: string | null;
  boosters: QuarterlyBoosterItem[];
  officers: QuarterlyOfficerItem[];
}

export const QUARTERLY_TIER_CONFIG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string; bgClass: string; glowClass: string }
> = {
  Silver: {
    label: "Gümüş (+20%)",
    badgeClass: "bg-slate-700/80 text-slate-200 border-slate-500/60",
    borderClass: "border-slate-500/50 hover:border-slate-400",
    bgClass: "from-slate-900/80 to-[#0c121e]",
    glowClass: "shadow-[0_0_15px_rgba(148,163,184,0.15)]",
  },
  Gold: {
    label: "Altın (+30%)",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500/60",
    borderClass: "border-amber-500/50 hover:border-amber-400",
    bgClass: "from-amber-950/40 to-[#0c121e]",
    glowClass: "shadow-[0_0_18px_rgba(245,158,11,0.2)]",
  },
  Platinum: {
    label: "Platin (+40%)",
    badgeClass: "bg-cyan-950/80 text-cyan-200 border-cyan-400/60",
    borderClass: "border-cyan-400/50 hover:border-cyan-300",
    bgClass: "from-cyan-950/40 to-[#0c121e]",
    glowClass: "shadow-[0_0_22px_rgba(6,182,212,0.25)]",
  },
};

export const QUARTERLY_RESOURCE_CONFIG: Record<
  string,
  { nameTr: string; colorClass: string; textClass: string; borderClass: string; bgBadge: string }
> = {
  Metal: {
    nameTr: "Metal",
    colorClass: "text-zinc-300",
    textClass: "text-zinc-200",
    borderClass: "border-zinc-600/40",
    bgBadge: "bg-zinc-800/80 text-zinc-300 border-zinc-600",
  },
  Crystal: {
    nameTr: "Kristal",
    colorClass: "text-cyan-400",
    textClass: "text-cyan-300",
    borderClass: "border-cyan-500/40",
    bgBadge: "bg-cyan-950/80 text-cyan-300 border-cyan-600",
  },
  Deuterium: {
    nameTr: "Döteryum",
    colorClass: "text-emerald-400",
    textClass: "text-emerald-300",
    borderClass: "border-emerald-500/40",
    bgBadge: "bg-emerald-950/80 text-emerald-300 border-emerald-600",
  },
};

export function formatQuarterlyDuration(seconds: number): string {
  if (seconds <= 0) return "Süresi doldu";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) {
    return `${days} Gün ${hours} Saat`;
  }
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} Saat ${mins} Dk`;
}

