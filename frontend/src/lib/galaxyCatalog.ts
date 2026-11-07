export interface GalaxyDebris {
  metal: number;
  crystal: number;
}

export interface GalaxySlot {
  slot: number;
  planetId: string | null;
  planetName: string | null;
  playerId: string | null;
  playerName: string | null;
  playerPoints?: number | null;
  allianceTag: string | null;
  hasMoon: boolean;
  moonId?: string | null;
  moonDiameter?: number | null;
  debrisField: GalaxyDebris | null;
  activity: string | null;
  moonActivity?: string | null;
  playerStatusFlags: string[];
  isDestroyedPlanet?: boolean;
}

export interface GalaxySystemView {
  galaxy: number;
  system: number;
  slots: GalaxySlot[];
}

export type PlanetBiome = "desert" | "jungle" | "ocean" | "ice" | "gas";

export function getPlanetBiome(slot: number): PlanetBiome {
  if (slot >= 1 && slot <= 3) return "desert"; // Hot scorched planets
  if (slot >= 4 && slot <= 6) return "jungle"; // Tropical planets
  if (slot >= 7 && slot <= 9) return "ocean";  // Temperate / Ocean planets
  if (slot >= 10 && slot <= 12) return "ice";  // Cold tundra / Ice planets
  return "gas"; // Distant outer frozen/gas giants
}

export function formatDebrisTotal(debris: GalaxyDebris | null): string {
  if (!debris || (debris.metal <= 0 && debris.crystal <= 0)) return "0";
  const total = debris.metal + debris.crystal;
  return `${Math.round(total).toLocaleString()} (${Math.round(debris.metal).toLocaleString()} M / ${Math.round(debris.crystal).toLocaleString()} K)`;
}

export function parsePlayerStatus(flags: string[]): {
  isNoob: boolean;
  isStrong: boolean;
  isInactive7: boolean;
  isInactive28: boolean;
  isVacation: boolean;
  isHonorable: boolean;
  isBandit: boolean;
  isEmperor: boolean;
  colorClass: string;
  badgeText: string;
} {
  const isNoob = flags.includes("(n)") || flags.includes("(z)");
  const isStrong = flags.includes("(s)") || flags.includes("(g)");
  const isInactive28 = flags.includes("(iI)");
  const isInactive7 = flags.includes("(i)") && !isInactive28;
  const isVacation = flags.includes("(v)");
  const isBandit = flags.includes("(b)");
  const isEmperor = flags.includes("(e)");
  const isHonorable = flags.includes("(hp)");

  let colorClass = "text-zinc-100 hover:text-cyan-300";
  let badgeText = "";

  if (isVacation) {
    colorClass = "text-blue-400";
    badgeText = "(t)"; // Tatil modu (v/t)
  } else if (isInactive28) {
    colorClass = "text-zinc-500 line-through";
    badgeText = "(uU)"; // Uzun inaktif (iI/uU)
  } else if (isInactive7) {
    colorClass = "text-zinc-400";
    badgeText = "(u)"; // İnaktif (i/u)
  } else if (isBandit) {
    colorClass = "text-red-500 font-bold";
    badgeText = "(b)"; // Haydut (Bandit)
  } else if (isHonorable) {
    colorClass = "text-yellow-400 font-semibold";
    badgeText = "(hp)"; // Onurlu hedef (Honorable)
  } else if (isNoob) {
    colorClass = "text-emerald-400";
    badgeText = "(z)"; // Zayıf koruma (noob/z)
  } else if (isStrong) {
    colorClass = "text-rose-400";
    badgeText = "(g)"; // Güçlü koruma (strong/g)
  } else if (isEmperor) {
    colorClass = "text-amber-300 font-semibold";
    badgeText = "(e)"; // İmparator / Yıldız Lordu
  }

  return {
    isNoob,
    isStrong,
    isInactive7,
    isInactive28,
    isVacation,
    isHonorable,
    isBandit,
    isEmperor,
    colorClass,
    badgeText,
  };
}

