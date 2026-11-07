export interface CosmeticAvatarItem {
  id: string;
  name: string;
  costDarkMatter: number;
  isDefault: boolean;
  description: string;
  iconKey: string;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface CosmeticTitleItem {
  id: string;
  name: string;
  costDarkMatter: number;
  isDefault: boolean;
  description: string;
  iconKey: string;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface PlanetRelocationInfo {
  planetId: string | null;
  isRelocating: boolean;
  targetGalaxy: number | null;
  targetSystem: number | null;
  targetSlot: number | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  remainingSeconds: number;
  costDarkMatter: number;
  isCooldownActive: boolean;
  cooldownUntilUtc: string | null;
  cooldownRemainingSeconds: number;
}

export interface ProfileShopData {
  userId: string;
  username: string;
  email: string;
  darkMatter: number;
  totalPoints: number;
  playerClass: string;
  activeAvatar: string;
  activeTitle: string;
  avatars: CosmeticAvatarItem[];
  titles: CosmeticTitleItem[];
  relocation: PlanetRelocationInfo;
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Tamamlandı";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours} Saat ${mins} Dk`;
  }
  return `${mins} Dk ${secs} Sn`;
}

