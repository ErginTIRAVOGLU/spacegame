"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  FLEET_SHIPS,
  FleetMissionType,
  calculateFuelConsumption,
} from "@/lib/fleetCatalog";
import { FleetShipSelector } from "@/components/fleet/FleetShipSelector";
import { FleetTargetAndMission } from "@/components/fleet/FleetTargetAndMission";
import { ActiveFleetMovements, type ActiveFleetMissionItem } from "@/components/fleet/ActiveFleetMovements";
import { useFleetStore } from "@/store/useFleetStore";
import {
  Rocket,
  Compass,
  CheckCircle2,
  X,
  Clock,
  Shield,
  Plane,
  Radio,
  Send,
} from "lucide-react";

interface ActiveMissionInfo {
  id: string;
  originPlanetId: string;
  originCoordinates: string;
  targetCoordinates: string;
  missionType: number;
  missionTypeName: string;
  status: number;
  statusName: string;
  fuelConsumed: number;
  departureUtc: string;
  arrivalUtc: string;
  returnUtc: string | null;
  ships: { unitType: number; count: number }[];
}

function FleetPageContent() {
  const searchParams = useSearchParams();
  const missionParam = searchParams.get("mission");
  const slotParam =
    searchParams.get("slot") ??
    searchParams.get("position") ??
    searchParams.get("targetPosition");
  const shipParam = searchParams.get("ship");
  const focusParam = searchParams.get("focus");
  const isExpeditionRequested =
    missionParam === "expedition" ||
    slotParam === "16" ||
    focusParam === "expedition-fleet" ||
    focusParam === "expedition-dispatch";
  const isEspionageRequested =
    missionParam === "espionage" || shipParam === "espionage-probe";

  const userId = useGameStore((s) => s.userId);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);
  const incomingFleets = useGameStore((s) => s.incomingFleets);
  const playerClass = useGameStore((s) => s.playerClass);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  // Wizard state: 1 (Ship Selection) or 2 (Target, Mission & Cargo)
  const [phase, setPhase] = useState<1 | 2>(1);

  // Selected ships state: unitType -> count
  const [selectedShips, setSelectedShips] = useState<Record<number, number>>({});

  // Tactical retreat ratio radio: 0 (No retreat), 1 (1:1), 2 (1:2)
  const [tacticalRetreatRatio, setTacticalRetreatRatio] = useState<string>("%0");

  // Active fleets telemetries from backend
  const [activeFleetsCount, setActiveFleetsCount] = useState<number>(0);
  const [activeExpeditionsCount, setActiveExpeditionsCount] = useState<number>(0);
  const [activeMissions, setActiveMissions] = useState<ActiveMissionInfo[]>([]);

  // Notice alert banner
  const [notice, setNotice] = useState<string | null>(null);

  // Recalling fleet mission ID in progress
  const [recallingMissionId, setRecallingMissionId] = useState<string | null>(null);

  // Max slots from researches, player class bonuses, and active officers (Amiral & Komuta Heyeti)
  const bonuses = useOfficerStore((s) => s.bonuses);
  const computerTechLevel = researches[108] ?? 0;
  const maxFleets = 1 + computerTechLevel + (playerClass === "General" ? 2 : 0) + bonuses.extraFleetSlots;

  const astroLevel = researches[124] ?? 0;
  const maxExpeditions = Math.floor(Math.sqrt(astroLevel)) + (playerClass === "Discoverer" ? 2 : 0) + bonuses.extraExpeditionSlots;

  // Fetch active fleets from backend
  const fetchActiveFleets = async () => {
    try {
      const url = userId
        ? `${API_BASE_URL}/api/fleets/active?userId=${userId}`
        : `${API_BASE_URL}/api/fleets/active`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActiveFleetsCount(data.activeFleets ?? 0);
        setActiveExpeditionsCount(data.activeExpeditions ?? 0);
        setActiveMissions(data.missions ?? []);
      }
    } catch {
      // Ignore network errors on initial poll
    }
  };

  useEffect(() => {
    fetchActiveFleets();
  }, [userId, planet.id]);

  // Pre-select 1 espionage probe if arriving via espionage quest deep-link
  useEffect(() => {
    if (isEspionageRequested) {
      const probeStationed = planet.units?.find((u) => u.unitType === 210)?.count ?? 0;
      if (probeStationed > 0) {
        setSelectedShips((prev) => {
          if (!prev[210] || prev[210] === 0) {
            return { ...prev, 210: 1 };
          }
          return prev;
        });
      }
    }
  }, [isEspionageRequested, planet.units]);

  // Pre-select 1 small cargo or light fighter if arriving via expedition quest deep-link
  useEffect(() => {
    if (isExpeditionRequested) {
      const smallCargoStationed = planet.units?.find((u) => u.unitType === 202)?.count ?? 0;
      const lightFighterStationed = planet.units?.find((u) => u.unitType === 204)?.count ?? 0;
      const probeStationed = planet.units?.find((u) => u.unitType === 210)?.count ?? 0;

      setSelectedShips((prev) => {
        const hasSelection = Object.values(prev).some((c) => c > 0);
        if (hasSelection) return prev;

        if (smallCargoStationed > 0) {
          return { ...prev, 202: 1 };
        } else if (lightFighterStationed > 0) {
          return { ...prev, 204: 1 };
        } else if (probeStationed > 0) {
          return { ...prev, 210: 1 };
        }
        return prev;
      });
    }
  }, [isExpeditionRequested, planet.units]);

  // Selected ships count modifier
  const handleShipChange = (unitType: number, count: number) => {
    setSelectedShips((prev) => ({
      ...prev,
      [unitType]: count,
    }));
  };

  // Select all ships on origin planet
  const handleSelectAll = () => {
    const all: Record<number, number> = {};
    for (const ship of FLEET_SHIPS) {
      const stationed = planet.units?.find((u) => u.unitType === ship.unitType)?.count ?? 0;
      if (stationed > 0) {
        all[ship.unitType] = stationed;
      }
    }
    setSelectedShips(all);
  };

  // Clear all ship selections
  const handleClearAll = () => {
    setSelectedShips({});
  };

  // Calculate preview fuel consumption for tactical retreat preview
  const retreatFuelPreview = useMemo(() => {
    const totalShips = Object.values(selectedShips).reduce((sum, c) => sum + Math.max(0, c), 0);
    if (totalShips <= 0) return 0;
    const baseFuel = calculateFuelConsumption(selectedShips, 1000);
    if (tacticalRetreatRatio === "%1:1") return Math.round(baseFuel * 1.2);
    if (tacticalRetreatRatio === "%1:2") return Math.round(baseFuel * 1.5);
    return baseFuel;
  }, [selectedShips, tacticalRetreatRatio]);

  const handleDispatchSuccess = (message: string) => {
    setNotice(message);
    setSelectedShips({});
    setPhase(1);
    fetchActiveFleets();
  };

  const handleRecallFleet = async (missionId: string) => {
    setRecallingMissionId(missionId);
    const result = await useFleetStore.getState().recallFleet(missionId);
    setRecallingMissionId(null);
    if (result.success) {
      setNotice(result.message);
      fetchActiveFleets();
    } else {
      setNotice(`Geri çağırma hatası: ${result.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Cockpit Hero Banner */}
      <div
        className="relative rounded-xl border border-cyan-500/25 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(245,158,11,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Filo Komuta Merkezi • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            {phase === 1 ? "Filo Gönderimi 1/II" : "Filo Gönderimi II"} -{" "}
            <span className="text-cyan-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            {phase === 1
              ? "Sevk edilecek savaş ve sivil gemileri seçin. İkinci aşamada hedef koordinat, görev ve kaynak yüklemesi yapılacaktır."
              : "Hedef koordinatları doğrulayın, görev emrini atayın ve ambar kargo yükünü ayarlayın."}
          </p>
        </div>

        {/* Fleet Slots Summary & Tactical Retreat Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Filolar:</span>
              <span
                className={`font-bold ${
                  activeFleetsCount >= maxFleets ? "text-rose-400" : "text-amber-300"
                }`}
              >
                {activeFleetsCount} / {maxFleets}
                {bonuses.extraFleetSlots > 0 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold ml-1">
                    +{bonuses.extraFleetSlots} Amiral
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Keşifler:</span>
              <span
                className={`font-bold ${
                  activeExpeditionsCount >= maxExpeditions
                    ? "text-rose-400"
                    : "text-cyan-300"
                }`}
              >
                {activeExpeditionsCount} / {maxExpeditions}
                {bonuses.extraExpeditionSlots > 0 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold ml-1">
                    +{bonuses.extraExpeditionSlots} Amiral
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Tactical Retreat Radio Selector */}
          <div className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 font-mono text-xs space-y-1">
            <div className="text-[10px] uppercase text-zinc-400 font-bold">
              Taktiksel Geri Çekilme:
            </div>
            <div className="flex items-center gap-2.5">
              {["%0", "%1:1", "%1:2"].map((ratio) => (
                <label
                  key={ratio}
                  className="flex items-center gap-1 cursor-pointer text-xs text-zinc-300"
                >
                  <input
                    type="radio"
                    name="tacticalRetreat"
                    value={ratio}
                    checked={tacticalRetreatRatio === ratio}
                    onChange={(e) => setTacticalRetreatRatio(e.target.value)}
                    className="accent-amber-400 text-xs"
                  />
                  <span>{ratio}</span>
                </label>
              ))}
            </div>
            <div className="text-[10px] text-zinc-500">
              Yakıt Öngörüsü: ~{retreatFuelPreview.toLocaleString()} Deut
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-xs text-emerald-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{notice}</span>
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

      {/* Active Expedition Quest Hint Banner */}
      {isExpeditionRequested && (
        <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 text-xs font-mono text-indigo-200 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <div className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 text-indigo-400 animate-pulse shrink-0" />
            <span>
              <strong>Aktif Misyon Hedefi:</strong> 16. Pozisyona Keşif Seferi için filo hazırlayın. (16. Slot & Keşif Görevi önceden ayarlandı)
            </span>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-400/40 text-[10px] text-indigo-300">
            Slot 16
          </span>
        </div>
      )}

      {/* Active Espionage Quest Hint Banner */}
      {isEspionageRequested && (
        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-xs font-mono text-amber-200 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
            <span>
              <strong>Aktif Misyon Hedefi:</strong> Başka bir imparatorluğu gözetlemek için Casus Sondası hazırlayın. (Casusluk Misyonu önceden ayarlandı)
            </span>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded bg-amber-900/60 border border-amber-400/40 text-[10px] text-amber-300">
            Casusluk
          </span>
        </div>
      )}

      {/* Phase 1 or Phase 2 Component */}
      {phase === 1 ? (
        <FleetShipSelector
          stationedUnits={planet.units ?? []}
          selectedShips={selectedShips}
          onShipChange={handleShipChange}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onNext={() => setPhase(2)}
          activeFleets={activeFleetsCount}
          maxFleets={maxFleets}
        />
      ) : (
        <FleetTargetAndMission
          originPlanet={planet}
          selectedShips={selectedShips}
          onBack={() => setPhase(1)}
          onDispatchSuccess={handleDispatchSuccess}
          initialSlot={
            slotParam ? parseInt(slotParam, 10) : isExpeditionRequested ? 16 : undefined
          }
          initialMission={
            isExpeditionRequested
              ? FleetMissionType.Expedition
              : isEspionageRequested
              ? FleetMissionType.Espionage
              : undefined
          }
        />
      )}

      {/* In-Flight Active Missions List (Underneath) with Recall Action */}
      <ActiveFleetMovements
        missions={activeMissions}
        onRecall={handleRecallFleet}
        recallingId={recallingMissionId}
      />
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={null}>
      <FleetPageContent />
    </Suspense>
  );
}

