import { API_BASE_URL } from "@/store/useGameStore";
import { canRelocateToSlot } from "./planetGenerationService";

export const RELOCATION_COST_DARK_MATTER = 240_000;
export const RELOCATION_PREPARATION_HOURS = 24;

export { canRelocateToSlot };

export function validateRelocationRules(
  fromSlot: number,
  toSlot: number,
  userDarkMatter: number
): { valid: boolean; message?: string } {
  if (toSlot < 1 || toSlot > 15) {
    return { valid: false, message: "Hedef pozisyon (slot) 1 ile 15 arasında olmalıdır." };
  }

  if (fromSlot === toSlot) {
    return { valid: false, message: "Hedef pozisyon mevcut pozisyonla aynı olamaz." };
  }

  if (!canRelocateToSlot(fromSlot, toSlot)) {
    return {
      valid: false,
      message:
        "4–12 arasındaki gezegenler yalnızca 4–12 arasındaki pozisyonlara taşınabilir (Slot 1–3 ve 13–15 arasına taşınamaz).",
    };
  }

  if (userDarkMatter < RELOCATION_COST_DARK_MATTER) {
    return {
      valid: false,
      message: `Yetersiz Karanlık Madde! Gezegen taşımak için ${RELOCATION_COST_DARK_MATTER.toLocaleString("tr-TR")} KM gereklidir.`,
    };
  }

  return { valid: true };
}

export async function startPlanetRelocation(params: {
  planetId: string;
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
  userId?: string;
}): Promise<{ success: boolean; message: string; remainingDarkMatter?: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/relocation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? "Gezegen taşıma başlatılamadı.",
      };
    }
    return {
      success: true,
      message: data.message ?? "Taşıma hazırlığı başlatıldı.",
      remainingDarkMatter: data.remainingDarkMatter,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ağ hatası oluştu.",
    };
  }
}

export async function cancelPlanetRelocation(
  planetId: string,
  userId?: string
): Promise<{ success: boolean; message: string; remainingDarkMatter?: number }> {
  try {
    const url = new URL(`${API_BASE_URL}/api/shop/relocation/cancel`);
    url.searchParams.set("planetId", planetId);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? "Gezegen taşıma iptal edilemedi.",
      };
    }
    return {
      success: true,
      message: data.message ?? "Gezegen taşıma iptal edildi.",
      remainingDarkMatter: data.remainingDarkMatter,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ağ hatası oluştu.",
    };
  }
}

export async function completePlanetRelocation(
  planetId: string,
  forceInstant: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/relocation/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planetId, forceInstant }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? "Gezegen taşıma tamamlanamadı.",
      };
    }
    return {
      success: true,
      message: data.message ?? "Gezegen taşıma başarıyla tamamlandı.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ağ hatası oluştu.",
    };
  }
}

