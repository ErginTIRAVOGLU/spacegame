"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { SHIPYARD_CATALOG } from "@/lib/shipyardCatalog";
import { DEFENSE_CATALOG } from "@/lib/defenseCatalog";
import { sendBrowserPushNotification } from "@/lib/pushNotifications";

function playSciFiToastChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay policy; ignore silently
  }
}

function isDefenseUnit(unitType: number): boolean {
  return unitType >= 400;
}

function getUnitName(unitType: number): string {
  const ship = SHIPYARD_CATALOG.find((s) => s.unitType === unitType);
  if (ship) return ship.name;
  const defense = DEFENSE_CATALOG.find((d) => d.unitType === unitType);
  if (defense) return defense.name;
  return `Birim #${unitType}`;
}

interface TrackedShipyardBatch {
  id: string;
  planetId: string;
  planetName: string;
  unitType: number;
  totalCount: number;
}

interface TrackedBuilding {
  id: string;
  planetId: string;
  planetName: string;
  buildingName: string;
  targetLevel: number;
  endTimeUtc: string;
}

interface TrackedResearch {
  id: string;
  researchName: string;
  targetLevel: number;
  endTimeUtc: string;
  originPlanetName?: string;
}

export function useGlobalQueueWatcher() {
  const planets = useGameStore((s) => s.planets);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const addToast = useGameStore((s) => s.addToast);
  const settings = useGameStore((s) => s.settings);

  // Set of completion event keys we have already notified for to avoid duplicates
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Track active items so when they disappear upon completion, we can notify immediately
  const trackedBatchesRef = useRef<Map<string, TrackedShipyardBatch>>(new Map());
  const trackedBuildingsRef = useRef<Map<string, TrackedBuilding>>(new Map());
  const trackedResearchRef = useRef<TrackedResearch | null>(null);
  const trackedLifeformsRef = useRef<Map<string, TrackedBuilding>>(new Map());

  // Record incoming active queues into tracking maps
  useEffect(() => {
    for (const planet of planets) {
      if (planet.shipyardQueue) {
        for (const batch of planet.shipyardQueue) {
          trackedBatchesRef.current.set(batch.id, {
            id: batch.id,
            planetId: planet.id,
            planetName: planet.name,
            unitType: batch.unitType,
            totalCount: batch.totalCount,
          });
        }
      }

      if (planet.activeBuildingQueue) {
        trackedBuildingsRef.current.set(planet.id, {
          id: `${planet.id}-${planet.activeBuildingQueue.buildingKey}-${planet.activeBuildingQueue.targetLevel}`,
          planetId: planet.id,
          planetName: planet.name,
          buildingName: planet.activeBuildingQueue.buildingName,
          targetLevel: planet.activeBuildingQueue.targetLevel,
          endTimeUtc: planet.activeBuildingQueue.endTimeUtc,
        });
      }

      if (planet.activeLifeformQueue) {
        trackedLifeformsRef.current.set(planet.id, {
          id: `${planet.id}-${planet.activeLifeformQueue.buildingKey}-${planet.activeLifeformQueue.targetLevel}`,
          planetId: planet.id,
          planetName: planet.name,
          buildingName: planet.activeLifeformQueue.buildingName,
          targetLevel: planet.activeLifeformQueue.targetLevel,
          endTimeUtc: planet.activeLifeformQueue.endTimeUtc,
        });
      }
    }

    if (activeResearchQueue) {
      const originPlanet = planets.find(
        (p) => p.id === activeResearchQueue.originPlanetId
      );
      trackedResearchRef.current = {
        id: activeResearchQueue.id,
        researchName: activeResearchQueue.researchName,
        targetLevel: activeResearchQueue.targetLevel,
        endTimeUtc: activeResearchQueue.endTimeUtc,
        originPlanetName: originPlanet?.name,
      };
    }
  }, [planets, activeResearchQueue]);

  useEffect(() => {
    const notifyCompletion = (params: {
      type: "building" | "shipyard" | "defense" | "research" | "lifeform";
      title: string;
      message: string;
      planetName?: string;
      key: string;
    }) => {
      // 1. In-game Toast notification
      if (settings.inGameToastsEnabled) {
        addToast({
          type: params.type,
          title: params.title,
          message: params.message,
          planetName: params.planetName,
        });
      }

      // 2. Sci-Fi Audio chime
      if (settings.soundEnabled) {
        playSciFiToastChime();
      }

      // 3. Desktop / Browser native push notification
      if (settings.browserPushEnabled) {
        sendBrowserPushNotification(params.title, {
          body: params.planetName
            ? `[${params.planetName}] ${params.message}`
            : params.message,
          tag: params.key,
        });
      }
    };

    const checkQueues = async () => {
      const now = Date.now();
      let needsRefresh = false;

      // ==========================================
      // 1. SHIPYARD & DEFENSE PRODUCTION CHECK
      // ==========================================
      // A) Check tracked batches: if batch was tracked and is now absent from planet's shipyardQueue, it completed!
      const allActiveBatchIds = new Set<string>();
      for (const planet of planets) {
        if (planet.shipyardQueue) {
          for (const batch of planet.shipyardQueue) {
            allActiveBatchIds.add(batch.id);
          }
        }
      }

      for (const [batchId, tracked] of Array.from(trackedBatchesRef.current.entries())) {
        if (!allActiveBatchIds.has(batchId)) {
          const key = `ship-batch-done-${batchId}`;
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            const isDefense = isDefenseUnit(tracked.unitType);
            notifyCompletion({
              type: isDefense ? "defense" : "shipyard",
              title: isDefense
                ? "Savunma Üretimi Tamamlandı"
                : "Gemi İnşaatı Tamamlandı",
              message: `${tracked.totalCount}x ${getUnitName(
                tracked.unitType
              )} üretimi tamamlandı.`,
              planetName: tracked.planetName,
              key,
            });
          }
          trackedBatchesRef.current.delete(batchId);
        }
      }

      // B) Check active batches reaching due time on client
      for (const planet of planets) {
        if (planet.shipyardQueue && planet.shipyardQueue.length > 0) {
          const activeBatch = planet.shipyardQueue[0];
          const nextFinishMs = new Date(activeBatch.nextUnitFinishUtc).getTime();

          if (now >= nextFinishMs) {
            const isBatchDone =
              activeBatch.completedCount + 1 >= activeBatch.totalCount;
            if (isBatchDone) {
              const key = `ship-batch-done-${activeBatch.id}`;
              if (!notifiedKeysRef.current.has(key)) {
                notifiedKeysRef.current.add(key);
                const isDefense = isDefenseUnit(activeBatch.unitType);
                notifyCompletion({
                  type: isDefense ? "defense" : "shipyard",
                  title: isDefense
                    ? "Savunma Üretimi Tamamlandı"
                    : "Gemi İnşaatı Tamamlandı",
                  message: `${activeBatch.totalCount}x ${getUnitName(
                    activeBatch.unitType
                  )} üretimi tamamlandı.`,
                  planetName: planet.name,
                  key,
                });
                trackedBatchesRef.current.delete(activeBatch.id);
              }
            }
            needsRefresh = true;
          }
        }

        // ==========================================
        // 2. BUILDING QUEUES CHECK
        // ==========================================
        if (planet.activeBuildingQueue) {
          const endMs = new Date(planet.activeBuildingQueue.endTimeUtc).getTime();
          const key = `bld-${planet.id}-${planet.activeBuildingQueue.buildingKey}-${planet.activeBuildingQueue.targetLevel}-${planet.activeBuildingQueue.endTimeUtc}`;

          if (now >= endMs && !notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            notifyCompletion({
              type: "building",
              title: "İnşaat Tamamlandı",
              message: `${planet.activeBuildingQueue.buildingName} (Kademe ${planet.activeBuildingQueue.targetLevel}) inşası tamamlandı.`,
              planetName: planet.name,
              key,
            });
            trackedBuildingsRef.current.delete(planet.id);
            needsRefresh = true;
          }
        } else if (trackedBuildingsRef.current.has(planet.id)) {
          // Building completed and cleared from queue
          const tracked = trackedBuildingsRef.current.get(planet.id)!;
          const endMs = new Date(tracked.endTimeUtc).getTime();
          const key = `bld-${tracked.planetId}-${tracked.id}-${tracked.endTimeUtc}`;
          if (now >= endMs - 3000 && !notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            notifyCompletion({
              type: "building",
              title: "İnşaat Tamamlandı",
              message: `${tracked.buildingName} (Kademe ${tracked.targetLevel}) inşası tamamlandı.`,
              planetName: tracked.planetName,
              key,
            });
          }
          trackedBuildingsRef.current.delete(planet.id);
        }

        // ==========================================
        // 3. LIFEFORM BUILDING QUEUES CHECK
        // ==========================================
        if (planet.activeLifeformQueue) {
          const endMs = new Date(planet.activeLifeformQueue.endTimeUtc).getTime();
          const key = `lf-${planet.id}-${planet.activeLifeformQueue.buildingKey}-${planet.activeLifeformQueue.targetLevel}-${planet.activeLifeformQueue.endTimeUtc}`;

          if (now >= endMs && !notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            notifyCompletion({
              type: "lifeform",
              title: "Canlı Türü İnşaatı Tamamlandı",
              message: `${planet.activeLifeformQueue.buildingName} (Kademe ${planet.activeLifeformQueue.targetLevel}) inşası tamamlandı.`,
              planetName: planet.name,
              key,
            });
            trackedLifeformsRef.current.delete(planet.id);
            needsRefresh = true;
          }
        } else if (trackedLifeformsRef.current.has(planet.id)) {
          const tracked = trackedLifeformsRef.current.get(planet.id)!;
          const endMs = new Date(tracked.endTimeUtc).getTime();
          const key = `lf-${tracked.planetId}-${tracked.id}-${tracked.endTimeUtc}`;
          if (now >= endMs - 3000 && !notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            notifyCompletion({
              type: "lifeform",
              title: "Canlı Türü İnşaatı Tamamlandı",
              message: `${tracked.buildingName} (Kademe ${tracked.targetLevel}) inşası tamamlandı.`,
              planetName: tracked.planetName,
              key,
            });
          }
          trackedLifeformsRef.current.delete(planet.id);
        }
      }

      // ==========================================
      // 4. RESEARCH QUEUES CHECK
      // ==========================================
      if (activeResearchQueue) {
        const endMs = new Date(activeResearchQueue.endTimeUtc).getTime();
        const key = `res-${activeResearchQueue.id}-${activeResearchQueue.targetLevel}-${activeResearchQueue.endTimeUtc}`;

        if (now >= endMs && !notifiedKeysRef.current.has(key)) {
          notifiedKeysRef.current.add(key);
          const originPlanet = planets.find(
            (p) => p.id === activeResearchQueue.originPlanetId
          );
          notifyCompletion({
            type: "research",
            title: "Araştırma Tamamlandı",
            message: `${activeResearchQueue.researchName} (Kademe ${activeResearchQueue.targetLevel}) araştırması tamamlandı.`,
            planetName: originPlanet?.name,
            key,
          });
          trackedResearchRef.current = null;
          needsRefresh = true;
        }
      } else if (trackedResearchRef.current) {
        const tracked = trackedResearchRef.current;
        const endMs = new Date(tracked.endTimeUtc).getTime();
        const key = `res-${tracked.id}-${tracked.targetLevel}-${tracked.endTimeUtc}`;
        if (now >= endMs - 3000 && !notifiedKeysRef.current.has(key)) {
          notifiedKeysRef.current.add(key);
          notifyCompletion({
            type: "research",
            title: "Araştırma Tamamlandı",
            message: `${tracked.researchName} (Kademe ${tracked.targetLevel}) araştırması tamamlandı.`,
            planetName: tracked.originPlanetName,
            key,
          });
        }
        trackedResearchRef.current = null;
      }

      if (needsRefresh) {
        await fetchBootstrap();
      }
    };

    const interval = setInterval(checkQueues, 1000);
    return () => clearInterval(interval);
  }, [planets, activeResearchQueue, fetchBootstrap, addToast, settings]);
}
