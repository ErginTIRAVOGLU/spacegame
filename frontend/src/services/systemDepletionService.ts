/**
 * System Depletion Service (Sonsuz Uzaklar / 16. Pozisyon Sistem Tükenme Takibi)
 *
 * Sidian OGame Wiki kurallarına göre:
 * - Her güneş sistemi [G:S:16] için keşif sayısını (depletionCount) takip eder.
 * - Her 2.4 saatte bir 1 adet azalır (24 saatte 10 keşif yenilenir).
 * - Tükenme seviyeleri:
 *   - 0 – 10: "Bölge henüz tükenmemiş" (Normal olasılıklar)
 *   - 11 – 25: "Bölge biraz tükenmiş" (Olumlu bulguların %15'i Boş Dönüş'e kayar)
 *   - 25+: "Bölge tamamen tükenmiş" (Olumlu bulguların %40'ı Boş Dönüş'e kayar)
 */

export type DepletionLevel = 'Undepleted' | 'SlightlyDepleted' | 'CompletelyDepleted';

export interface SystemDepletionRecord {
  galaxy: number;
  system: number;
  count: number;
  lastUpdated: number; // Unix timestamp in ms
}

export interface DepletionStatus {
  level: DepletionLevel;
  effectiveCount: number;
  message: string;
  shiftRatio: number;
}

export const HOURS_PER_DEPLETION_DECAY = 2.4;
const STORAGE_KEY_PREFIX = 'ogame_system_depletion_';

/**
 * Calculates decayed depletion count given elapsed time (1 reduction every 2.4 hours).
 */
export function calculateDecayedDepletion(
  count: number,
  lastUpdatedMs: number,
  nowMs: number = Date.now()
): number {
  if (count <= 0) return 0;
  const elapsedHours = Math.max(0, (nowMs - lastUpdatedMs) / (1000 * 60 * 60));
  const decay = Math.floor((elapsedHours + 1e-7) / HOURS_PER_DEPLETION_DECAY);
  return Math.max(0, count - decay);
}

/**
 * Returns the depletion tier and the exact status message shown in espionage probe reports.
 */
export function getDepletionStatus(effectiveCount: number): DepletionStatus {
  if (effectiveCount <= 10) {
    return {
      level: 'Undepleted',
      effectiveCount,
      message: 'Bölge henüz tükenmemiş',
      shiftRatio: 0.0,
    };
  }

  if (effectiveCount <= 25) {
    return {
      level: 'SlightlyDepleted',
      effectiveCount,
      message: 'Bölge biraz tükenmiş',
      shiftRatio: 0.15,
    };
  }

  return {
    level: 'CompletelyDepleted',
    effectiveCount,
    message: 'Bölge tamamen tükenmiş',
    shiftRatio: 0.40,
  };
}

/**
 * In-memory fallback map for systems when localStorage is not available (e.g. SSR or testing).
 */
const inMemoryDepletionMap = new Map<string, SystemDepletionRecord>();

function getStorageKey(galaxy: number, system: number): string {
  return `${STORAGE_KEY_PREFIX}${galaxy}_${system}`;
}

/**
 * Retrieves the current depletion record for a given system, factoring in decay.
 */
export function getSystemDepletion(
  galaxy: number,
  system: number,
  nowMs: number = Date.now()
): DepletionStatus {
  const key = getStorageKey(galaxy, system);
  let record: SystemDepletionRecord | null = null;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        record = JSON.parse(stored);
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  if (!record) {
    record = inMemoryDepletionMap.get(key) ?? null;
  }

  if (!record) {
    return getDepletionStatus(0);
  }

  const effectiveCount = calculateDecayedDepletion(record.count, record.lastUpdated, nowMs);
  return getDepletionStatus(effectiveCount);
}

/**
 * Records an expedition sent to position 16 of the specified galaxy and system,
 * updating the decayed count and incrementing by +1.
 */
export function recordSystemExpedition(
  galaxy: number,
  system: number,
  nowMs: number = Date.now()
): DepletionStatus {
  const current = getSystemDepletion(galaxy, system, nowMs);
  const newCount = current.effectiveCount + 1;

  const record: SystemDepletionRecord = {
    galaxy,
    system,
    count: newCount,
    lastUpdated: nowMs,
  };

  const key = getStorageKey(galaxy, system);
  inMemoryDepletionMap.set(key, record);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(record));
    }
  } catch {
    // Ignore storage quota errors
  }

  return getDepletionStatus(newCount);
}

