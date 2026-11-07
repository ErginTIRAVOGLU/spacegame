"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import {
  type PlanetSummary,
  useGameStore,
} from "@/store/useGameStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  CoordinateType,
  FleetMissionType,
  FLEET_MISSIONS,
  calculateSpatialDistance,
  calculateFlightDurationSeconds,
  calculateSlowestSpeed,
  calculateTotalCargoCapacity,
  calculateFuelConsumption,
  isMissionAvailable,
  formatFlightDuration,
  formatFlightDate,
} from "@/lib/fleetCatalog";
import { validateFleetCargo } from "@/services/fleetValidationService";
import {
  Compass,
  Crosshair,
  Truck,
  Anchor,
  Eye,
  Recycle,
  Globe2,
  ShieldCheck,
  Skull,
  Swords,
  Package,
  Clock,
  Fuel,
  Gauge,
  Boxes,
  Gem,
  Droplets,
  Apple,
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Star,
  Bookmark,
} from "lucide-react";

interface FleetTargetAndMissionProps {
  originPlanet: PlanetSummary;
  selectedShips: Record<number, number>;
  onBack: () => void;
  onDispatchSuccess: (notice: string) => void;
  initialGalaxy?: number;
  initialSystem?: number;
  initialSlot?: number;
  initialMission?: FleetMissionType;
}

const MISSION_ICONS: Record<string, ReactNode> = {
  crosshair: <Crosshair className="h-4 w-4 text-red-400" />,
  truck: <Truck className="h-4 w-4 text-amber-400" />,
  anchor: <Anchor className="h-4 w-4 text-cyan-400" />,
  eye: <Eye className="h-4 w-4 text-sky-400" />,
  recycle: <Recycle className="h-4 w-4 text-emerald-400" />,
  compass: <Compass className="h-4 w-4 text-indigo-400" />,
  swords: <Swords className="h-4 w-4 text-orange-400" />,
  shieldCheck: <ShieldCheck className="h-4 w-4 text-teal-400" />,
  globe: <Globe2 className="h-4 w-4 text-blue-400" />,
  skull: <Skull className="h-4 w-4 text-fuchsia-400" />,
};

export function FleetTargetAndMission({
  originPlanet,
  selectedShips,
  onBack,
  onDispatchSuccess,
  initialGalaxy,
  initialSystem,
  initialSlot,
  initialMission,
}: FleetTargetAndMissionProps) {
  const planets = useGameStore((s) => s.planets);
  const researches = useGameStore((s) => s.researches);
  const dispatchFleet = useGameStore((s) => s.dispatchFleet);
  const bonuses = useOfficerStore((s) => s.bonuses);
  const favoriteCoordinates = useOfficerStore((s) => s.favoriteCoordinates);
  const addFavoriteCoordinate = useOfficerStore((s) => s.addFavoriteCoordinate);
  const removeFavoriteCoordinate = useOfficerStore((s) => s.removeFavoriteCoordinate);

  const astroLevel = researches[124] ?? 0;

  // Target coordinates state
  const [targetGalaxy, setTargetGalaxy] = useState<number>(initialGalaxy ?? originPlanet.galaxy);
  const [targetSystem, setTargetSystem] = useState<number>(initialSystem ?? originPlanet.system);
  const [targetSlot, setTargetSlot] = useState<number>(
    initialSlot ?? (originPlanet.slot === 15 ? 14 : originPlanet.slot + 1)
  );
  const [targetType, setTargetType] = useState<CoordinateType>(CoordinateType.Planet);

  // Speed factor (0.1 to 1.0)
  const [speedPercent, setSpeedPercent] = useState<number>(100);

  // Tactical retreat & evasion options
  const [retreatOnFlee, setRetreatOnFlee] = useState<boolean>(true);
  const [foodPlunder, setFoodPlunder] = useState<boolean>(true);

  // Cargo loading state
  const [metalCargo, setMetalCargo] = useState<number>(0);
  const [crystalCargo, setCrystalCargo] = useState<number>(0);
  const [deuteriumCargo, setDeuteriumCargo] = useState<number>(0);
  const [foodCargo, setFoodCargo] = useState<number>(0);

  // Mission selection state
  const [selectedMission, setSelectedMission] = useState<FleetMissionType>(
    initialMission ?? FleetMissionType.Attack
  );

  // Status and submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if destination is one of player's own planets
  const isTargetOwnPlanet = useMemo(() => {
    return planets.some(
      (p) =>
        p.galaxy === targetGalaxy &&
        p.system === targetSystem &&
        p.slot === targetSlot &&
        ((targetType === CoordinateType.Moon && p.isMoon) ||
          (targetType === CoordinateType.Planet && !p.isMoon))
    );
  }, [planets, targetGalaxy, targetSystem, targetSlot, targetType]);

  // Telemetry & Calculations
  const distance = useMemo(() => {
    return calculateSpatialDistance(
      originPlanet.galaxy,
      originPlanet.system,
      originPlanet.slot,
      targetGalaxy,
      targetSystem,
      targetSlot
    );
  }, [originPlanet, targetGalaxy, targetSystem, targetSlot]);

  const slowestSpeed = useMemo(() => {
    return calculateSlowestSpeed(selectedShips);
  }, [selectedShips]);

  const durationSeconds = useMemo(() => {
    return calculateFlightDurationSeconds(distance, slowestSpeed, speedPercent / 100.0);
  }, [distance, slowestSpeed, speedPercent]);

  const totalCargoCapacity = useMemo(() => {
    return calculateTotalCargoCapacity(selectedShips);
  }, [selectedShips]);

  const fuelRequired = useMemo(() => {
    return calculateFuelConsumption(selectedShips, distance);
  }, [selectedShips, distance]);

  const fuelPercent = useMemo(() => {
    if (originPlanet.deuterium <= 0) return 100;
    return Math.min(100, Math.round((fuelRequired / originPlanet.deuterium) * 100));
  }, [fuelRequired, originPlanet.deuterium]);

  const currentTotalLoaded = metalCargo + crystalCargo + deuteriumCargo + foodCargo;
  const freeCargoSpace = Math.max(0, totalCargoCapacity - currentTotalLoaded);

  const isEspionageMission = selectedMission === FleetMissionType.Espionage;
  const isProbeOnlyFleet = useMemo(() => {
    return Object.entries(selectedShips).every(
      ([type, count]) => count <= 0 || Number(type) === 210
    );
  }, [selectedShips]);

  // Current departure and arrival dates
  const now = new Date();
  const arrivalDate = new Date(now.getTime() + durationSeconds * 1000);
  const returnDate = new Date(now.getTime() + durationSeconds * 2000);

  // Available missions evaluation
  const missionStatuses = useMemo(() => {
    return FLEET_MISSIONS.map((m) => {
      const status = isMissionAvailable(
        m.type,
        targetType,
        targetSlot,
        selectedShips,
        isTargetOwnPlanet,
        astroLevel
      );
      return {
        ...m,
        available: status.available,
        reason: status.reason,
      };
    });
  }, [targetType, targetSlot, selectedShips, isTargetOwnPlanet, astroLevel]);

  // Auto-switch mission if current one becomes unavailable
  useEffect(() => {
    const cur = missionStatuses.find((m) => m.type === selectedMission);
    if (!cur?.available) {
      const firstAvailable = missionStatuses.find((m) => m.available);
      if (firstAvailable) {
        setSelectedMission(firstAvailable.type);
      }
    }
  }, [missionStatuses, selectedMission]);

  // Load max all cargo handler
  const handleLoadMaxAll = () => {
    let remainingCapacity = totalCargoCapacity;
    const availableMetal = originPlanet.metal;
    const availableCrystal = originPlanet.crystal;
    const availableDeut = Math.max(0, originPlanet.deuterium - fuelRequired);

    const loadMetal = Math.min(availableMetal, remainingCapacity);
    remainingCapacity -= loadMetal;

    const loadCrystal = Math.min(availableCrystal, remainingCapacity);
    remainingCapacity -= loadCrystal;

    const loadDeut = Math.min(availableDeut, remainingCapacity);
    remainingCapacity -= loadDeut;

    setMetalCargo(loadMetal);
    setCrystalCargo(loadCrystal);
    setDeuteriumCargo(loadDeut);
  };

  const handleClearCargo = () => {
    setMetalCargo(0);
    setCrystalCargo(0);
    setDeuteriumCargo(0);
    setFoodCargo(0);
  };

  const handleDispatch = async () => {
    setErrorMessage(null);

    if (originPlanet.deuterium < fuelRequired + deuteriumCargo) {
      setErrorMessage(
        `Yetersiz Döteryum: Gerekli yakıt (${fuelRequired.toLocaleString()}) ve yük ambarı için gezegende yeterli döteryum bulunmuyor.`
      );
      return;
    }

    const cargoValidation = validateFleetCargo({
      missionType: selectedMission,
      ships: selectedShips,
      cargo: {
        metal: metalCargo,
        crystal: crystalCargo,
        deuterium: deuteriumCargo,
      },
      fuelRequired,
    });

    if (!cargoValidation.isValid) {
      setErrorMessage(cargoValidation.error ?? "Geçersiz kargo yüklemesi.");
      return;
    }

    if (currentTotalLoaded > totalCargoCapacity) {
      setErrorMessage("Yüklenen kaynak miktarı filo ambar kapasitesini aşıyor.");
      return;
    }

    setIsSubmitting(true);

    const result = await dispatchFleet({
      originPlanetId: originPlanet.id,
      targetGalaxy,
      targetSystem,
      targetSlot,
      targetType,
      missionType: selectedMission,
      ships: selectedShips,
      speedFactor: speedPercent / 100.0,
      metalCargo,
      crystalCargo,
      deuteriumCargo,
      holdHours: selectedMission === FleetMissionType.Expedition ? 1 : 0,
    });

    setIsSubmitting(false);

    if (result.success) {
      const missionName =
        FLEET_MISSIONS.find((m) => m.type === selectedMission)?.label ?? "Görev";
      onDispatchSuccess(
        `${missionName} görevi için [${targetGalaxy}:${targetSystem}:${targetSlot}] koordinatına filo başarıyla sevk edildi.`
      );
    } else {
      setErrorMessage(result.message);
    }
  };

  const activeMissionDef = FLEET_MISSIONS.find((m) => m.type === selectedMission);

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/30 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/50 bg-red-950/30 text-xs text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Target Coordinates & Shortcuts Card */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              Hedef Koordinatlar ve Tesis Türü
            </h2>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Kalkış: <strong className="text-zinc-200">{originPlanet.name}</strong>{" "}
              <span className="font-mono text-cyan-300">[{originPlanet.coords}]</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Mesafe:</span>
            <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 font-mono text-xs font-bold text-amber-300">
              {distance.toLocaleString()} Uzaklık
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Coordinates Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="target-galaxy"
                className="block text-[10px] uppercase font-mono text-zinc-400 mb-1"
              >
                Galaksi
              </label>
              <input
                id="target-galaxy"
                type="number"
                min={1}
                max={9}
                value={targetGalaxy}
                onChange={(e) => setTargetGalaxy(Number(e.target.value) || 1)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 text-center focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="target-system"
                className="block text-[10px] uppercase font-mono text-zinc-400 mb-1"
              >
                Sistem
              </label>
              <input
                id="target-system"
                type="number"
                min={1}
                max={499}
                value={targetSystem}
                onChange={(e) => setTargetSystem(Number(e.target.value) || 1)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 text-center focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="target-slot"
                className="block text-[10px] uppercase font-mono text-zinc-400 mb-1"
              >
                Yuva (Slot)
              </label>
              <input
                id="target-slot"
                type="number"
                min={1}
                max={16}
                value={targetSlot}
                onChange={(e) => setTargetSlot(Number(e.target.value) || 1)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 text-center focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Coordinate Type Selector */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
              Hedef Gövde Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType(CoordinateType.Planet)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  targetType === CoordinateType.Planet
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>Gezegen</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType(CoordinateType.Debris)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  targetType === CoordinateType.Debris
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Recycle className="h-3.5 w-3.5" />
                <span>Harabe</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType(CoordinateType.Moon)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  targetType === CoordinateType.Moon
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ay</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shortcuts for Player's Own Planets & Bookmarks Drawer (Task 05AP) */}
        <div className="pt-2 border-t border-zinc-800/60 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 text-[11px] font-mono shrink-0">Hızlı Hedef:</span>
              {planets
                .filter((p) => p.id !== originPlanet.id)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setTargetGalaxy(p.galaxy);
                      setTargetSystem(p.system);
                      setTargetSlot(p.slot);
                      setTargetType(p.isMoon ? CoordinateType.Moon : CoordinateType.Planet);
                    }}
                    className="px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-cyan-500/40 text-[11px] font-mono text-zinc-300 transition-colors"
                  >
                    {p.name} [{p.coords}]
                  </button>
                ))}

              <button
                type="button"
                onClick={() => {
                  setTargetSlot(16);
                  setTargetType(CoordinateType.Planet);
                  setSelectedMission(FleetMissionType.Expedition);
                }}
                className="px-2.5 py-1 rounded-md border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 text-[11px] font-mono text-indigo-300 transition-colors"
              >
                16. Yuva (Keşif)
              </button>
            </div>

            {/* Commander Favorilere Ekle Action */}
            {bonuses.hasCommander ? (
              <button
                type="button"
                onClick={() => {
                  const res = addFavoriteCoordinate({
                    galaxy: targetGalaxy,
                    system: targetSystem,
                    slot: targetSlot,
                  });
                  if (res.success) {
                    setSuccessMessage(res.message);
                  } else {
                    setErrorMessage(res.message);
                  }
                }}
                className="px-2.5 py-1 rounded-md border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                title="Mevcut koordinatı favorilere kaydet (Maksimum 40)"
              >
                <Star className="h-3 w-3 text-amber-400 fill-amber-400/40" />
                <span>★ Favorilere Ekle ({favoriteCoordinates.length}/40)</span>
              </button>
            ) : (
              <div
                title="Favori hedef kotası (+40) için Commander aktifleştirin"
                className="text-[10px] font-mono text-zinc-500 flex items-center gap-1"
              >
                <Star className="h-3 w-3 text-zinc-600" />
                <span>Favori Hedefler (Commander)</span>
              </div>
            )}
          </div>

          {/* Bookmarks Drawer: List of Saved Favorites */}
          {bonuses.hasCommander && favoriteCoordinates.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/40">
              <span className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                Kayıtlı Favoriler:
              </span>
              {favoriteCoordinates.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center rounded-md border border-amber-500/30 bg-amber-950/20 text-[11px] font-mono text-amber-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTargetGalaxy(fav.galaxy);
                      setTargetSystem(fav.system);
                      setTargetSlot(fav.slot);
                    }}
                    className="px-2 py-0.5 hover:bg-amber-500/20 transition-colors"
                  >
                    {fav.name} [{fav.galaxy}:{fav.system}:{fav.slot}]
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavoriteCoordinate(fav.id)}
                    className="px-1 py-0.5 hover:bg-rose-500/30 text-rose-400 border-l border-amber-500/30"
                    title="Favorilerden sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mission Type Selector */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-amber-400" />
            Görev Emri Seçimi (10 Görev)
          </h2>
          <span className="text-[11px] font-mono text-zinc-400">
            Seçili:{" "}
            <strong className="text-zinc-100">{activeMissionDef?.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {missionStatuses.map((m) => {
            const isSelected = selectedMission === m.type;
            const icon = MISSION_ICONS[m.iconName] ?? <Send className="h-4 w-4" />;

            return (
              <button
                key={m.key}
                type="button"
                disabled={!m.available}
                onClick={() => setSelectedMission(m.type)}
                title={m.reason}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                    : m.available
                    ? "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    : "bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{m.label}</span>
                  {icon}
                </div>
                {!m.available && m.reason && (
                  <span className="text-[9px] text-rose-400/80 line-clamp-1">
                    {m.reason}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Single-Line Mission Explanation */}
        <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 text-xs font-mono text-zinc-300 flex items-center gap-2">
          <span className="text-amber-400 font-bold shrink-0">
            Görev: {activeMissionDef?.label} &mdash;
          </span>
          <span className="text-zinc-400">{activeMissionDef?.description}</span>
        </div>
      </div>

      {/* Real-Time Flight Briefing (Left Card) & Cargo Loading Panel (Right Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Flight Briefing & Speed Controls */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-400" />
              Uçuş Brifingi & Hız Ayarı
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Sürat:{" "}
              <strong className="text-zinc-200">{slowestSpeed.toLocaleString()}</strong>
            </span>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Filo Hızı Çarpanı:</span>
              <span className="text-cyan-300 font-bold">%{speedPercent}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={speedPercent}
              onChange={(e) => setSpeedPercent(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>%10</span>
              <span>%50</span>
              <span>%100</span>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Uçuş Süresi (tek yön):
              </span>
              <span className="text-amber-300 font-bold">
                {formatFlightDuration(durationSeconds)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400">Varış (Arrival UTC):</span>
              <span className="text-zinc-200">{formatFlightDate(arrivalDate)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400">Geri Dönüş (Return UTC):</span>
              <span className="text-zinc-200">{formatFlightDate(returnDate)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Fuel className="h-3.5 w-3.5 text-teal-400" />
                Yakıt Tüketimi (Döteryum):
              </span>
              <span
                className={`font-bold ${
                  originPlanet.deuterium >= fuelRequired ? "text-teal-300" : "text-rose-400"
                }`}
              >
                {fuelRequired.toLocaleString()} [{fuelPercent}%]
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-cyan-400" />
                Boş Ambar / Toplam:
              </span>
              <span className="text-cyan-300 font-bold">
                {freeCargoSpace.toLocaleString()} / {totalCargoCapacity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tactical Retreat Checkbox */}
          <div className="pt-2 border-t border-zinc-800/80">
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={retreatOnFlee}
                onChange={(e) => setRetreatOnFlee(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
              />
              <span>Savunmacının kaçması durumunda geri çekil</span>
            </label>
          </div>
        </div>

        {/* Right Card: Cargo Loading Panel */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" />
              Kargo Yükleme Paneli
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadMaxAll}
                disabled={isEspionageMission && isProbeOnlyFleet}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/30 text-[11px] font-mono text-amber-300 transition-colors"
              >
                &gt;&gt; Tüm Hammaddeler
              </button>
              <button
                type="button"
                onClick={handleClearCargo}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-mono text-zinc-400 transition-colors"
              >
                0
              </button>
            </div>
          </div>

          {/* Espionage probe only warning */}
          {isEspionageMission && isProbeOnlyFleet && (
            <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-950/25 text-xs text-amber-300 flex items-center gap-2 font-mono">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Casus sondaları tek başına hammadde taşıyamaz. Kargo yüklemek için filoya nakliye gemisi ekleyin.</span>
            </div>
          )}

          {/* Resource Input Rows */}
          <div className="space-y-2.5">
            {/* Metal */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Boxes className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-200">Metal</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Depo: {originPlanet.metal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={originPlanet.metal}
                  value={metalCargo || ""}
                  placeholder="0"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMetalCargo(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-24 px-2 py-1 rounded border border-zinc-700 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-zinc-100 text-right focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onClick={() => {
                    const allowed = Math.min(
                      originPlanet.metal,
                      freeCargoSpace + metalCargo
                    );
                    setMetalCargo(allowed);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-mono text-cyan-300"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>

            {/* Crystal */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Gem className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-200">Kristal</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Depo: {originPlanet.crystal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={originPlanet.crystal}
                  value={crystalCargo || ""}
                  placeholder="0"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCrystalCargo(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-24 px-2 py-1 rounded border border-zinc-700 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-zinc-100 text-right focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onClick={() => {
                    const allowed = Math.min(
                      originPlanet.crystal,
                      freeCargoSpace + crystalCargo
                    );
                    setCrystalCargo(allowed);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-mono text-cyan-300"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>

            {/* Deuterium */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Droplets className="h-4 w-4 text-teal-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-200">Döteryum</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Depo: {originPlanet.deuterium.toLocaleString()}{" "}
                    <span className="text-teal-400">(-{fuelRequired.toLocaleString()} yakıt)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, originPlanet.deuterium - fuelRequired)}
                  value={deuteriumCargo || ""}
                  placeholder="0"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setDeuteriumCargo(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-24 px-2 py-1 rounded border border-zinc-700 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-zinc-100 text-right focus:border-teal-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onClick={() => {
                    const available = Math.max(0, originPlanet.deuterium - fuelRequired);
                    const allowed = Math.min(
                      available,
                      freeCargoSpace + deuteriumCargo
                    );
                    setDeuteriumCargo(allowed);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-mono text-cyan-300"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>

            {/* Food (Besin) */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Apple className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-200">Besin</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Canlı Formu Besin Kaynağı
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  value={foodCargo || ""}
                  placeholder="0"
                  disabled={isEspionageMission && isProbeOnlyFleet}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFoodCargo(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-24 px-2 py-1 rounded border border-zinc-700 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-zinc-100 text-right focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Cargo Gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Ambar Doluluk Oranı:</span>
              <span className="text-amber-300 font-bold">
                {currentTotalLoaded.toLocaleString()} / {totalCargoCapacity.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentTotalLoaded > totalCargoCapacity
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-amber-500 to-amber-300"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((currentTotalLoaded / Math.max(1, totalCargoCapacity)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Food Plundering Toggle */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-300">Besin Yağmala:</span>
            <button
              type="button"
              onClick={() => setFoodPlunder(!foodPlunder)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold border transition-colors ${
                foodPlunder
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}
            >
              {foodPlunder ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons: Geri & FİLO GÖNDER */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>GERİ</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting || currentTotalLoaded > totalCargoCapacity}
          onClick={handleDispatch}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-10 py-3 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-zinc-100 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Crosshair className="h-4 w-4" />
          <span>{isSubmitting ? "Filo Sevk Ediliyor..." : "FİLO GÖNDER"}</span>
        </button>
      </div>
    </div>
  );
}

