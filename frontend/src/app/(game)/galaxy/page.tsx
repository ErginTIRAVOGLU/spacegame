"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { useResourceStore } from "@/store/useResourceStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import { type GalaxySlot } from "@/lib/galaxyCatalog";
import { GalaxyHeader } from "@/components/galaxy/GalaxyHeader";
import { GalaxyTable } from "@/components/galaxy/GalaxyTable";
import { ExpeditionSlot } from "@/components/galaxy/ExpeditionSlot";
import { MissileAttackModal } from "@/components/galaxy/MissileAttackModal";
import { PlayerMessageModal } from "@/components/galaxy/PlayerMessageModal";
import { PlayerProfileModal } from "@/components/galaxy/PlayerProfileModal";
import { RelocateModal } from "@/components/galaxy/RelocateModal";
import { PhalanxScanModal } from "@/components/galaxy/PhalanxScanModal";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { triggerQuestEvaluation } from "@/services/questEvaluationService";
import {
  Globe2,
  CheckCircle2,
  AlertTriangle,
  X,
  Radar,
  Radio,
  Star,
  Lock,
} from "lucide-react";

function GalaxyPageContent() {
  const userId = useGameStore((s) => s.userId);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const dispatchFleet = useGameStore((s) => s.dispatchFleet);
  const settings = useGameStore((s) => s.settings);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  // Alliance Class State
  const [allianceClass, setAllianceClass] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAllianceClass = localStorage.getItem("ogame_alliance_class");
      if (savedAllianceClass) setAllianceClass(savedAllianceClass);
    }
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/alliances/user/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.inAlliance && data?.alliance?.allianceClass) {
          setAllianceClass(data.alliance.allianceClass);
        }
      })
      .catch(() => {});
  }, [userId]);

  // Quest focus highlight (Directive 6 Step 5)
  const searchParams = useSearchParams();
  const rawFocus = searchParams.get("focus")?.toLowerCase();
  const { highlightedKey } = useQuestFocusHighlight({ paramName: "focus" });
  const isLifeformDiscoveryFocused =
    highlightedKey === "lifeform-discover" || rawFocus === "lifeform-discover";

  // Lifeform research state: Galaksiler Arası Elçiler (Slot 1 in techLevels)
  const lfState = useResourceStore((s) => s.getPlanetLifeformState(planet.id));
  const hasIntergalacticEnvoys = (lfState?.techLevels?.[1] ?? 0) >= 1;

  // Galaxy & System coordinates
  const [galaxy, setGalaxy] = useState<number>(planet.galaxy || 1);
  const [system, setSystem] = useState<number>(planet.system || 1);
  const [slots, setSlots] = useState<GalaxySlot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Notice & alerts
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Fleets & Expeditions from backend
  const [activeFleetsCount, setActiveFleetsCount] = useState<number>(0);
  const [activeExpeditionsCount, setActiveExpeditionsCount] = useState<number>(0);
  const [returningFleetsCount, setReturningFleetsCount] = useState<number>(0);

  // Quick Spy loading state
  const [isSpyingSlot, setIsSpyingSlot] = useState<number | null>(null);
  const [isScanningSystem, setIsScanningSystem] = useState<boolean>(false);
  const [isDispatchingExpedition, setIsDispatchingExpedition] = useState<boolean>(false);

  // Modals state
  const [missileModalSlot, setMissileModalSlot] = useState<{
    slot: number;
    planetName?: string;
  } | null>(null);

  const [messageRecipient, setMessageRecipient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [profileModalUser, setProfileModalUser] = useState<{
    id: string;
    name: string;
    points?: number | null;
    allianceTag?: string | null;
  } | null>(null);

  const [phalanxScanSlot, setPhalanxScanSlot] = useState<number | null>(null);
  const [relocateSlot, setRelocateSlot] = useState<number | null>(null);

  // Officer bonuses & bookmarks
  const bonuses = useOfficerStore((s) => s.bonuses);
  const officersStatus = useOfficerStore((s) => s.officersStatus);
  const favoriteCoordinates = useOfficerStore((s) => s.favoriteCoordinates);
  const addFavoriteCoordinate = useOfficerStore((s) => s.addFavoriteCoordinate);
  const removeFavoriteCoordinate = useOfficerStore((s) => s.removeFavoriteCoordinate);

  // Hydration safety for local-storage persisted officer bookmarks
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const effectiveCommander = hasMounted ? officersStatus.commander : false;
  const effectiveFavorites = hasMounted ? favoriteCoordinates : [];

  // Technology & fleet capacities
  const computerTechLevel = researches[108] ?? 0;
  const maxFleets = 1 + computerTechLevel + bonuses.extraFleetSlots;

  const astroLevel = researches[124] ?? 0;
  const maxExpeditions = Math.floor(Math.sqrt(astroLevel)) + bonuses.extraExpeditionSlots;
  const maxColonizedCount = 1 + Math.floor(astroLevel / 2);

  const impulseDriveLevel = researches[117] ?? 0;
  const ipmRange = impulseDriveLevel > 0 ? impulseDriveLevel * 2 - 1 : 0;

  // Stationed quantities on current planet
  const probeCount = planet.units?.find((u) => u.unitType === 210)?.count ?? 0;
  const ipmCount = planet.units?.find((u) => u.unitType === 503)?.count ?? 0;
  const recyclerCount = planet.units?.find((u) => u.unitType === 209)?.count ?? 0;
  const colonyShipCount = planet.units?.find((u) => u.unitType === 208)?.count ?? 0;
  const colonizedCount = planets.filter((p) => !p.isMoon).length;

  // Fetch active fleets telemetry
  const fetchActiveFleets = useCallback(async () => {
    try {
      const url = userId
        ? `${API_BASE_URL}/api/fleets/active?userId=${userId}`
        : `${API_BASE_URL}/api/fleets/active`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActiveFleetsCount(data.activeFleets ?? 0);
        setActiveExpeditionsCount(data.activeExpeditions ?? 0);
        const returning =
          data.missions?.filter((m: { statusName: string }) => m.statusName === "Returning")
            ?.length ?? 0;
        setReturningFleetsCount(returning);
      }
    } catch {
      // Ignore
    }
  }, [userId]);

  // Fetch system slots
  const fetchGalaxySystem = useCallback(
    async (targetGalaxy: number, targetSystem: number) => {
      setIsLoading(true);
      try {
        const query = userId ? `?viewerUserId=${userId}` : "";
        const res = await fetch(
          `${API_BASE_URL}/api/galaxy/${targetGalaxy}/${targetSystem}${query}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        }
      } catch {
        setNotice({
          type: "error",
          text: `[${targetGalaxy}:${targetSystem}] sistemi taranırken ağ hatası oluştu.`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchGalaxySystem(galaxy, system);
    fetchActiveFleets();
  }, [galaxy, system, fetchGalaxySystem, fetchActiveFleets]);

  // 1-Click Quick Espionage
  const handleQuickSpy = async (slot: number) => {
    if (probeCount <= 0) {
      setNotice({
        type: "error",
        text: "Casusluk olanağı yok: Bu gezegende casus sondası bulunmuyor.",
      });
      return;
    }

    setIsSpyingSlot(slot);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleets/quick-spy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          originPlanetId: planet.id,
          targetGalaxy: galaxy,
          targetSystem: system,
          targetSlot: slot,
          probeCount: 1,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({
          type: "error",
          text: data?.message ?? "Casus sondası gönderilemedi.",
        });
        return;
      }

      await fetchBootstrap();
      await fetchActiveFleets();
      setNotice({
        type: "success",
        text:
          data?.message ??
          `[${galaxy}:${system}:${slot}] hedefine 1 casus sondası başarıyla sevk edildi.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Casus sondası sevk edilirken ağ bağlantı hatası oluştu.",
      });
    } finally {
      setIsSpyingSlot(null);
    }
  };

  // 1-Click System Espionage (all populated planets in system)
  const handleSystemEspionage = async () => {
    // Check Commander officer or Warrior alliance class
    const hasCommanderPrivilege = bonuses.hasCommander || officersStatus.commander;
    const isWarriorAlliance = allianceClass === "warrior";

    if (!hasCommanderPrivilege && !isWarriorAlliance) {
      setNotice({
        type: "error",
        text: "Sistem casusluğu için Commander subayı veya Savaşçı (Warrior) ittifak sınıfı gereklidir.",
      });
      return;
    }

    const populated = slots.filter((s) => !!s.planetName && s.playerId !== userId);
    if (populated.length === 0) {
      setNotice({
        type: "error",
        text: "Bu sistemde hedeflenebilecek başka oyuncu gezegeni bulunmuyor.",
      });
      return;
    }

    const probesPerTarget = Math.max(1, Math.min(10, settings?.spyProbeCount ?? 1));
    const totalNeeded = populated.length * probesPerTarget;

    if (probeCount < totalNeeded) {
      setNotice({
        type: "error",
        text: `Yetersiz Casus Sondası: Sistemdeki ${populated.length} gezegen için hedef başına ${probesPerTarget} olmak üzere en az ${totalNeeded} sonda gereklidir (Mevcut: ${probeCount}).`,
      });
      return;
    }

    setIsScanningSystem(true);
    let successCount = 0;

    for (const target of populated) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fleets/quick-spy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            originPlanetId: planet.id,
            targetGalaxy: galaxy,
            targetSystem: system,
            targetSlot: target.slot,
            probeCount: probesPerTarget,
          }),
        });
        if (res.ok) successCount++;
      } catch {
        // Continue with remaining
      }
    }

    await fetchBootstrap();
    await fetchActiveFleets();
    setIsScanningSystem(false);

    setNotice({
      type: "success",
      text: `Sistem Casusluğu Tamamlandı: [${galaxy}:${system}] sistemindeki ${successCount}/${populated.length} gezegene ${probesPerTarget}'er casus sondası sevk edildi.`,
    });
  };

  // Sensor Phalanx Scan Trigger
  const handleSystemPhalanx = (targetSlot: number = 1) => {
    // Check if current body is a Moon with Sensor Phalanx
    const isStationedOnMoon = !!planet.isMoon;
    const phalanxLevel =
      planet.buildings.find(
        (b) => b.buildingType === 42 || (b.key as string) === "sensorPhalanx"
      )?.level ?? 0;

    if (!isStationedOnMoon || phalanxLevel <= 0) {
      setNotice({
        type: "error",
        text: "Sensör Falanksı Taraması: Bu işlemi gerçekleştirmek için Sensör Falanksı kurulmuş bir Ay üzerinde bulunmalısınız.",
      });
      return;
    }

    const isResearcherAlliance = allianceClass === "researcher";
    const hasCommanderPrivilege = bonuses.hasCommander || officersStatus.commander;
    if (!isResearcherAlliance && !hasCommanderPrivilege) {
      setNotice({
        type: "error",
        text: "Sistem falanks taraması için Araştırmacı (Researcher) ittifak sınıfı veya Commander subayı gereklidir.",
      });
      return;
    }

    setPhalanxScanSlot(targetSlot);
  };

  // 1-Click Harvest Debris
  const handleHarvestDebris = async (slot: number) => {
    if (recyclerCount <= 0) {
      setNotice({
        type: "error",
        text: "Enkaz toplamak için bu gezegende en az 1 Geri Dönüşümcü veya Azrail bulunmalıdır.",
      });
      return;
    }

    const result = await dispatchFleet({
      originPlanetId: planet.id,
      targetGalaxy: galaxy,
      targetSystem: system,
      targetSlot: slot,
      targetType: 2, // Debris
      missionType: 8, // Recycle
      ships: { 209: Math.min(recyclerCount, 5) },
      speedFactor: 1.0,
    });

    if (result.success) {
      await fetchBootstrap();
      await fetchActiveFleets();
      setNotice({
        type: "success",
        text: `[${galaxy}:${system}:${slot}] harabe alanına geri dönüşüm filosu sevk edildi.`,
      });
    } else {
      setNotice({
        type: "error",
        text: result.message,
      });
    }
  };

  // Slot 16 Expedition Dispatch
  const handleDispatchExpedition = async (template: string) => {
    setIsDispatchingExpedition(true);

    let templateShips: Record<number, number> = { 203: 5, 204: 2 };
    if (template === "scout") {
      templateShips = { 210: 1, 205: 1 };
    } else if (template === "heavy") {
      templateShips = { 203: 20, 206: 10, 219: 1 };
    }

    // Verify player actually has the ships
    const missing = Object.entries(templateShips).some(([unitTypeStr, count]) => {
      const stationed =
        planet.units?.find((u) => u.unitType === Number(unitTypeStr))?.count ?? 0;
      return stationed < count;
    });

    if (missing) {
      // Fallback to sending available probes or small cargos
      const availableProbes = planet.units?.find((u) => u.unitType === 210)?.count ?? 0;
      if (availableProbes > 0) {
        templateShips = { 210: 1 };
      } else {
        setIsDispatchingExpedition(false);
        setNotice({
          type: "error",
          text: "Gezegende seçilen keşif şablonuna uygun gemi bulunmuyor.",
        });
        return;
      }
    }

    const result = await dispatchFleet({
      originPlanetId: planet.id,
      targetGalaxy: galaxy,
      targetSystem: system,
      targetSlot: 16,
      targetType: 1,
      missionType: 15, // Expedition
      ships: templateShips,
      speedFactor: 1.0,
      holdHours: 1,
    });

    setIsDispatchingExpedition(false);

    if (result.success) {
      await fetchBootstrap();
      await fetchActiveFleets();
      setNotice({
        type: "success",
        text: `[${galaxy}:${system}:16] derin uzay sektörüne araştırma filosu başarıyla sevk edildi.`,
      });
    } else {
      setNotice({
        type: "error",
        text: result.message,
      });
    }
  };

  // Lifeform Discovery Fleet Dispatch (DNA Icon in Galaxy Table - Mor DNA görevi)
  const handleDispatchLifeformDiscovery = async (slot: number) => {
    try {
      // 1. Dispatch dedicated Mor DNA Lifeform Discovery mission (no ships required, 5k M, 1k K, 500 D)
      const res = await fetch(`${API_BASE_URL}/api/lifeforms/planet/${planet.id}/discovery/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galaxy,
          system,
          slot,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setNotice({
          type: "error",
          text: errorData.message || "Canlı türü keşif görevi sevk edilemedi.",
        });
        return;
      }

      // 2. Evaluate Directive 6 Quest 5 client-side & sync tutorial progression
      await triggerQuestEvaluation("LIFEFORM_DISCOVERY_DISPATCHED");

      await fetchBootstrap();
      await fetchActiveFleets();

      setNotice({
        type: "success",
        text: `[${galaxy}:${system}:${slot}] sektörüne canlı türü keşif görevi (Mor DNA) başarıyla sevk edildi. (Maliyet: 5.000 Metal, 1.000 Kristal, 500 Deuterium)`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Canlı türü keşif filosu sevk edilirken hata oluştu.",
      });
    }
  };

  // IPM Range Check
  const isTargetWithinIpmRange = useMemo(() => {
    if (planet.galaxy !== galaxy || ipmRange <= 0) return false;
    const systemDist = Math.abs(planet.system - system);
    return systemDist <= ipmRange;
  }, [planet.galaxy, planet.system, galaxy, system, ipmRange]);

  // Bookmark / Favorite coordinate handler (Commander)
  const handleToggleFavorite = (slot: number, planetName?: string | null) => {
    if (!officersStatus.commander) {
      setNotice({
        type: "error",
        text: "Favori koordinatlar özelliği Commander yetkisidir. Subaylar menüsünden Commander'ı etkinleştirebilirsiniz.",
      });
      return;
    }

    const isBookmarked = favoriteCoordinates.some(
      (c) => c.galaxy === galaxy && c.system === system && c.slot === slot
    );

    if (isBookmarked) {
      removeFavoriteCoordinate({ galaxy, system, slot });
      setNotice({
        type: "success",
        text: `[${galaxy}:${system}:${slot}] favori koordinatlardan kaldırıldı.`,
      });
    } else {
      const added = addFavoriteCoordinate({
        galaxy,
        system,
        slot,
        label: planetName || `Sistem [${galaxy}:${system}:${slot}]`,
      });
      if (added) {
        setNotice({
          type: "success",
          text: `[${galaxy}:${system}:${slot}] favori koordinatlara eklendi.`,
        });
      } else {
        setNotice({
          type: "error",
          text: "Maksimum 40 favori koordinat sınırına ulaşıldı.",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-lg ${
            notice.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/30 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Galaxy Navigation Header */}
      <GalaxyHeader
        galaxy={galaxy}
        system={system}
        onGalaxyChange={setGalaxy}
        onSystemChange={setSystem}
        onNavigate={() => fetchGalaxySystem(galaxy, system)}
        probeCount={probeCount}
        ipmCount={ipmCount}
        returningFleetsCount={returningFleetsCount}
        activeFleets={activeFleetsCount}
        maxFleets={maxFleets}
        activeExpeditions={activeExpeditionsCount}
        maxExpeditions={maxExpeditions}
        extraFleetSlots={bonuses.extraFleetSlots}
        extraExpeditionSlots={bonuses.extraExpeditionSlots}
        onSystemEspionage={handleSystemEspionage}
        onSystemPhalanx={handleSystemPhalanx}
        isScanningSystem={isScanningSystem}
      />

      {/* Commander Bookmarks Drawer / Quick Selector */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-3 text-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-zinc-200">Favori Koordinatlar</span>
            <span
              className="text-[11px] text-zinc-500 font-mono"
              suppressHydrationWarning
            >
              ({effectiveFavorites.length}/40)
            </span>
            {effectiveCommander ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                Commander Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] font-semibold border border-zinc-700">
                <Lock className="h-3 w-3" />
                Commander Kilidi
              </span>
            )}
          </div>

          {effectiveCommander ? (
            <button
              type="button"
              onClick={() => handleToggleFavorite(1, `Sistem [${galaxy}:${system}]`)}
              className="text-[11px] px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              <span>★ [ {galaxy}:{system}:1 ] Favorilere Ekle</span>
            </button>
          ) : (
            <Link
              href="/officers"
              className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Commander ile 40 koordinat saklayın &rarr;</span>
            </Link>
          )}
        </div>

        {effectiveCommander ? (
          effectiveFavorites.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
              {effectiveFavorites.map((c) => {
                const isCurrent = c.galaxy === galaxy && c.system === system;
                return (
                  <div
                    key={`${c.galaxy}:${c.system}:${c.slot}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono shrink-0 transition-colors ${
                      isCurrent
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold"
                        : "bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGalaxy(c.galaxy);
                        setSystem(c.system);
                      }}
                      className="cursor-pointer hover:text-amber-300"
                      title="Bu koordinata git"
                    >
                      [{c.galaxy}:{c.system}:{c.slot}] {c.label ? `• ${c.label}` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteCoordinate(c);
                      }}
                      title="Favorilerden Çıkar"
                      className="text-zinc-500 hover:text-red-400 ml-0.5 p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-[11px] italic">
              Henüz kayıtlı favori koordinat yok. Aşağıdaki galaksi tablosundaki ★ butonuna basarak koordinat ekleyebilirsiniz.
            </p>
          )
        ) : (
          <p className="text-zinc-500 text-[11px]">
            Commander yetkisi ile 40 adede kadar favori galaksi koordinatını kaydedebilir ve aralarında tek tıkla geçiş yapabilirsiniz.
          </p>
        )}
      </div>

      {/* Planetary Orbit Matrix (Slots 1 - 15) */}
      <GalaxyTable
        galaxy={galaxy}
        system={system}
        slots={slots}
        probeCount={probeCount}
        ipmCount={ipmCount}
        colonyShipCount={colonyShipCount}
        colonizedCount={colonizedCount}
        maxColonizedCount={maxColonizedCount}
        currentUserId={userId}
        onQuickSpy={handleQuickSpy}
        onOpenMessage={(id, name) => setMessageRecipient({ id, name })}
        onAddFriend={(id, name) =>
          setNotice({
            type: "success",
            text: `${name} adlı komutana arkadaşlık isteği gönderildi.`,
          })
        }
        onBlockUser={(id, name) =>
          setNotice({
            type: "success",
            text: `${name} adlı oyuncu engellendi.`,
          })
        }
        onShowProfile={(id, name) => {
          const slot = slots.find((s) => s.playerId === id);
          setProfileModalUser({
            id,
            name,
            points: slot?.playerPoints,
            allianceTag: slot?.allianceTag,
          });
        }}
        onOpenMissileModal={(slot, planetName) =>
          setMissileModalSlot({ slot, planetName })
        }
        onHarvestDebris={handleHarvestDebris}
        isSpyingSlot={isSpyingSlot}
        isCommanderActive={effectiveCommander}
        isSlotBookmarked={(slot) =>
          effectiveFavorites.some(
            (c) => c.galaxy === galaxy && c.system === system && c.slot === slot
          )
        }
        onToggleFavorite={handleToggleFavorite}
        hasIntergalacticEnvoys={hasIntergalacticEnvoys}
        isLifeformDiscoveryFocused={isLifeformDiscoveryFocused}
        onDispatchLifeformDiscovery={handleDispatchLifeformDiscovery}
        onOpenRelocateModal={(targetSlot) => setRelocateSlot(targetSlot)}
        onOpenPhalanxModal={handleSystemPhalanx}
      />

      {/* Slot 16: Deep Space Expedition */}
      <ExpeditionSlot
        galaxy={galaxy}
        system={system}
        onDispatchExpedition={handleDispatchExpedition}
        colonizedCount={planets.length}
        maxColonizedCount={maxColonizedCount}
        astroLevel={astroLevel}
        isDispatching={isDispatchingExpedition}
      />

      {/* Missile Strike Modal */}
      {missileModalSlot && (
        <MissileAttackModal
          originPlanetId={planet.id}
          originCoords={planet.coords}
          targetGalaxy={galaxy}
          targetSystem={system}
          targetSlot={missileModalSlot.slot}
          targetPlanetName={missileModalSlot.planetName}
          ipmCount={ipmCount}
          ipmRange={ipmRange}
          isWithinRange={isTargetWithinIpmRange}
          onClose={() => setMissileModalSlot(null)}
          onSuccess={(msg) => setNotice({ type: "success", text: msg })}
        />
      )}

      {/* Player Direct Message Modal */}
      {messageRecipient && (
        <PlayerMessageModal
          recipientId={messageRecipient.id}
          recipientName={messageRecipient.name}
          onClose={() => setMessageRecipient(null)}
          onSent={(msg) => setNotice({ type: "success", text: msg })}
        />
      )}

      {/* Player Profile Modal */}
      {profileModalUser && (
        <PlayerProfileModal
          playerId={profileModalUser.id}
          playerName={profileModalUser.name}
          playerPoints={profileModalUser.points}
          allianceTag={profileModalUser.allianceTag}
          onClose={() => setProfileModalUser(null)}
          onSendMessage={() =>
            setMessageRecipient({
              id: profileModalUser.id,
              name: profileModalUser.name,
            })
          }
        />
      )}

      {/* Planet Relocation Modal */}
      {relocateSlot !== null && (
        <RelocateModal
          originPlanetId={planet.id}
          originPlanetName={planet.name}
          originCoords={planet.coords}
          targetGalaxy={galaxy}
          targetSystem={system}
          targetSlot={relocateSlot}
          onClose={() => setRelocateSlot(null)}
          onSuccess={(msg) => setNotice({ type: "success", text: msg })}
        />
      )}

      {/* Sensor Phalanx Scan Modal */}
      {phalanxScanSlot !== null && (
        <PhalanxScanModal
          isOpen={phalanxScanSlot !== null}
          onClose={() => setPhalanxScanSlot(null)}
          scannerUserId={userId ?? ""}
          originMoonId={planet.id}
          targetGalaxy={galaxy}
          targetSystem={system}
          targetSlot={phalanxScanSlot}
          phalanxLevel={
            planet.buildings.find(
              (b) => b.buildingType === 42 || (b.key as string) === "sensorPhalanx"
            )?.level ?? 0
          }
          originCoords={planet.coords}
        />
      )}
    </div>
  );
}

export default function GalaxyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-zinc-500 font-mono text-xs">
          Galaksi Haritası Yükleniyor...
        </div>
      }
    >
      <GalaxyPageContent />
    </Suspense>
  );
}
