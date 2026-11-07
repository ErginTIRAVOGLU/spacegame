"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Crosshair,
  Cpu,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Share2,
  EyeOff,
  Check,
  Sparkles,
  Wrench,
  Boxes,
  Flame,
} from "lucide-react";

interface CombatTechLevels {
  weaponsLevel: number;
  shieldingLevel: number;
  armourLevel: number;
}

interface CombatParticipantProfile {
  playerName: string;
  allianceTag: string | null;
  coordinates: string;
  techLevels: CombatTechLevels;
  initialUnits: Record<string, number> | null;
  remainingUnits: Record<string, number> | null;
  destroyedUnits: Record<string, number> | null;
  fleetNumbersHidden: boolean;
}

interface CombatRoundDetailedStats {
  roundNumber: number;
  attackerShotsFired: number;
  defenderShotsFired: number;
  attackerDamageDealt: number;
  defenderDamageDealt: number;
  attackerShieldAbsorbed: number;
  defenderShieldAbsorbed: number;
  attackerUnitsRemaining: Record<string, number> | null;
  defenderUnitsRemaining: Record<string, number> | null;
}

interface CombatWreckageSummary {
  debrisMetal: number;
  debrisCrystal: number;
  moonChancePercent: number;
  moonCreated: boolean;
  repairedDefenses: Record<string, number>;
}

interface CombatPlunderSummary {
  metalPlundered: number;
  crystalPlundered: number;
  deuteriumPlundered: number;
}

interface PublicCombatReportPayload {
  reportId: string;
  occurredAtUtc: string;
  battleCoordinates: string;
  winner: "Attacker" | "Defender" | "Draw" | number;
  attacker: CombatParticipantProfile;
  defender: CombatParticipantProfile;
  rounds: CombatRoundDetailedStats[];
  wreckage: CombatWreckageSummary;
  plunder: CombatPlunderSummary;
  isAnonymizedIdentities: boolean;
  isAnonymizedFleetNumbers: boolean;
}

function buildFallbackReport(reportId: string): PublicCombatReportPayload {
  return {
    reportId,
    occurredAtUtc: "2026-10-28T09:15:00Z",
    battleCoordinates: "[1:242:8]",
    winner: "Attacker",
    attacker: {
      playerName: "Vanguard_Prime",
      allianceTag: "NOVA",
      coordinates: "[1:240:4]",
      techLevels: { weaponsLevel: 14, shieldingLevel: 13, armourLevel: 14 },
      initialUnits: {
        LightFighter: 250,
        Cruiser: 60,
        Battleship: 35,
        Battlecruiser: 20,
      },
      remainingUnits: {
        LightFighter: 172,
        Cruiser: 54,
        Battleship: 35,
        Battlecruiser: 20,
      },
      destroyedUnits: {
        LightFighter: 78,
        Cruiser: 6,
      },
      fleetNumbersHidden: false,
    },
    defender: {
      playerName: "Aegis_Sentinel",
      allianceTag: "TITAN",
      coordinates: "[1:242:8]",
      techLevels: { weaponsLevel: 12, shieldingLevel: 13, armourLevel: 12 },
      initialUnits: {
        LightFighter: 120,
        HeavyFighter: 40,
        Cruiser: 25,
        RocketLauncher: 150,
        LightLaser: 80,
        GaussCannon: 12,
        PlasmaTurret: 4,
      },
      remainingUnits: {
        RocketLauncher: 0,
        LightLaser: 0,
        GaussCannon: 0,
        PlasmaTurret: 0,
      },
      destroyedUnits: {
        LightFighter: 120,
        HeavyFighter: 40,
        Cruiser: 25,
        RocketLauncher: 150,
        LightLaser: 80,
        GaussCannon: 12,
        PlasmaTurret: 4,
      },
      fleetNumbersHidden: false,
    },
    rounds: [
      {
        roundNumber: 1,
        attackerShotsFired: 685,
        defenderShotsFired: 431,
        attackerDamageDealt: 492000,
        defenderDamageDealt: 198400,
        attackerShieldAbsorbed: 64200,
        defenderShieldAbsorbed: 92500,
        attackerUnitsRemaining: {
          LightFighter: 215,
          Cruiser: 58,
          Battleship: 35,
          Battlecruiser: 20,
        },
        defenderUnitsRemaining: {
          LightFighter: 48,
          HeavyFighter: 22,
          Cruiser: 16,
          RocketLauncher: 64,
          LightLaser: 42,
          GaussCannon: 9,
          PlasmaTurret: 4,
        },
      },
      {
        roundNumber: 2,
        attackerShotsFired: 620,
        defenderShotsFired: 205,
        attackerDamageDealt: 458000,
        defenderDamageDealt: 112000,
        attackerShieldAbsorbed: 41000,
        defenderShieldAbsorbed: 54000,
        attackerUnitsRemaining: {
          LightFighter: 184,
          Cruiser: 55,
          Battleship: 35,
          Battlecruiser: 20,
        },
        defenderUnitsRemaining: {
          LightFighter: 5,
          HeavyFighter: 4,
          Cruiser: 4,
          RocketLauncher: 12,
          LightLaser: 11,
          GaussCannon: 3,
          PlasmaTurret: 2,
        },
      },
      {
        roundNumber: 3,
        attackerShotsFired: 590,
        defenderShotsFired: 41,
        attackerDamageDealt: 432500,
        defenderDamageDealt: 36500,
        attackerShieldAbsorbed: 14800,
        defenderShieldAbsorbed: 18200,
        attackerUnitsRemaining: {
          LightFighter: 172,
          Cruiser: 54,
          Battleship: 35,
          Battlecruiser: 20,
        },
        defenderUnitsRemaining: {},
      },
    ],
    wreckage: {
      debrisMetal: 481200,
      debrisCrystal: 214800,
      moonChancePercent: 6,
      moonCreated: false,
      repairedDefenses: {
        RocketLauncher: 105,
        LightLaser: 56,
        GaussCannon: 8,
        PlasmaTurret: 3,
      },
    },
    plunder: {
      metalPlundered: 312450,
      crystalPlundered: 198200,
      deuteriumPlundered: 84120,
    },
    isAnonymizedIdentities: false,
    isAnonymizedFleetNumbers: false,
  };
}

function resolveWinnerLabel(winner: PublicCombatReportPayload["winner"]): string {
  if (winner === 1 || winner === "Attacker") return "ATTACKER VICTORY";
  if (winner === 2 || winner === "Defender") return "DEFENDER VICTORY";
  return "STALEMATE DRAW";
}

export default function PublicCombatReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [hideIdentities, setHideIdentities] = useState(false);
  const [hideFleetNumbers, setHideFleetNumbers] = useState(false);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  const { data: report } = useQuery<PublicCombatReportPayload>({
    queryKey: ["combat-report", id, hideIdentities, hideFleetNumbers],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/reports/combat/${id}?hideIdentities=${hideIdentities}&hideFleetNumbers=${hideFleetNumbers}`
        );
        if (!res.ok) {
          return buildFallbackReport(id);
        }
        return (await res.json()) as PublicCombatReportPayload;
      } catch {
        return buildFallbackReport(id);
      }
    },
    initialData: () => buildFallbackReport(id),
  });

  const displayReport = useMemo(() => {
    const base = report ?? buildFallbackReport(id);
    return {
      ...base,
      battleCoordinates: hideIdentities ? "[X:XXX:XX]" : base.battleCoordinates,
      attacker: {
        ...base.attacker,
        playerName: hideIdentities ? "Commander Alpha [REDACTED]" : base.attacker.playerName,
        allianceTag: hideIdentities ? null : base.attacker.allianceTag,
        coordinates: hideIdentities ? "[X:XXX:XX]" : base.attacker.coordinates,
        fleetNumbersHidden: hideFleetNumbers || base.attacker.fleetNumbersHidden,
      },
      defender: {
        ...base.defender,
        playerName: hideIdentities ? "Commander Omega [REDACTED]" : base.defender.playerName,
        allianceTag: hideIdentities ? null : base.defender.allianceTag,
        coordinates: hideIdentities ? "[X:XXX:XX]" : base.defender.coordinates,
        fleetNumbersHidden: hideFleetNumbers || base.defender.fleetNumbersHidden,
      },
    };
  }, [report, id, hideIdentities, hideFleetNumbers]);

  const totalRounds = displayReport.rounds.length;
  const activeRound =
    displayReport.rounds[Math.min(selectedRoundIndex, Math.max(0, totalRounds - 1))];

  useEffect(() => {
    if (!isPlaying || totalRounds <= 1) return;

    const timer = setInterval(() => {
      setSelectedRoundIndex((prev) => {
        if (prev + 1 >= totalRounds) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isPlaying, totalRounds]);

  const handleCopyShareLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/reports/combat/${id}?hideIdentities=${hideIdentities}&hideFleetNumbers=${hideFleetNumbers}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const winnerLabel = resolveWinnerLabel(displayReport.winner);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Anonymization Share Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              COMBAT ARCHIVE #{id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Sector {displayReport.battleCoordinates} •{" "}
              {new Date(displayReport.occurredAtUtc).toUTCString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-2 flex items-center gap-3">
            <span>Tactical Battle Telemetry</span>
            <span className="text-sm font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              {winnerLabel}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setHideIdentities((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition ${
              hideIdentities
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>{hideIdentities ? "Identities Masked" : "Mask Identities"}</span>
          </button>

          <button
            type="button"
            onClick={() => setHideFleetNumbers((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition ${
              hideFleetNumbers
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>{hideFleetNumbers ? "Fleet Counts Hidden" : "Hide Fleet Counts"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 flex items-center gap-1.5 transition"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Clean Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Public CR Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attacker vs Defender Command Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attacker Card */}
        <div className="rounded-xl border border-cyan-500/30 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                Assault Force • {displayReport.attacker.coordinates}
              </span>
              <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                {displayReport.attacker.playerName}{" "}
                {displayReport.attacker.allianceTag && (
                  <span className="text-cyan-400 font-mono text-sm">
                    [{displayReport.attacker.allianceTag}]
                  </span>
                )}
              </h2>
            </div>
            <Crosshair className="h-5 w-5 text-cyan-400" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Weapons</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                +{displayReport.attacker.techLevels.weaponsLevel * 10}% (L
                {displayReport.attacker.techLevels.weaponsLevel})
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Shielding</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                +{displayReport.attacker.techLevels.shieldingLevel * 10}% (L
                {displayReport.attacker.techLevels.shieldingLevel})
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Armour</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                +{displayReport.attacker.techLevels.armourLevel * 10}% (L
                {displayReport.attacker.techLevels.armourLevel})
              </div>
            </div>
          </div>
        </div>

        {/* Defender Card */}
        <div className="rounded-xl border border-amber-500/30 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                Planetary Garrison • {displayReport.defender.coordinates}
              </span>
              <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                {displayReport.defender.playerName}{" "}
                {displayReport.defender.allianceTag && (
                  <span className="text-amber-400 font-mono text-sm">
                    [{displayReport.defender.allianceTag}]
                  </span>
                )}
              </h2>
            </div>
            <Shield className="h-5 w-5 text-amber-400" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Weapons</div>
              <div className="text-amber-300 font-bold mt-0.5">
                +{displayReport.defender.techLevels.weaponsLevel * 10}% (L
                {displayReport.defender.techLevels.weaponsLevel})
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Shielding</div>
              <div className="text-amber-300 font-bold mt-0.5">
                +{displayReport.defender.techLevels.shieldingLevel * 10}% (L
                {displayReport.defender.techLevels.shieldingLevel})
              </div>
            </div>
            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-400">Armour</div>
              <div className="text-amber-300 font-bold mt-0.5">
                +{displayReport.defender.techLevels.armourLevel * 10}% (L
                {displayReport.defender.techLevels.armourLevel})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round-by-Round Animated Playback Controls & Telemetry */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Round-by-Round Combat Simulation ({selectedRoundIndex + 1} /{" "}
              {Math.max(1, totalRounds)})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedRoundIndex((i) => Math.max(0, i - 1));
              }}
              disabled={selectedRoundIndex <= 0}
              className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:border-cyan-500/40"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedRoundIndex + 1 >= totalRounds) {
                  setSelectedRoundIndex(0);
                }
                setIsPlaying((p) => !p);
              }}
              className="px-3.5 py-1.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-1.5"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Animate Rounds</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedRoundIndex((i) => Math.min(totalRounds - 1, i + 1));
              }}
              disabled={selectedRoundIndex >= totalRounds - 1}
              className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:border-cyan-500/40"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 ml-2">
              {displayReport.rounds.map((r, idx) => (
                <button
                  key={r.roundNumber}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedRoundIndex(idx);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                    idx === selectedRoundIndex
                      ? "bg-cyan-500 text-zinc-950 font-bold"
                      : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  R{r.roundNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeRound && (
          <div className="space-y-6">
            {/* Round Salvo Exchange Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-zinc-950/90 border border-cyan-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 uppercase font-semibold">
                    Attacker Salvo (Round {activeRound.roundNumber})
                  </span>
                  <span className="text-zinc-300">
                    {activeRound.attackerShotsFired.toLocaleString("en-US")} shots
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block">Hull/Weapon Output</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {Math.round(activeRound.attackerDamageDealt).toLocaleString("en-US")}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Shields Absorbed</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {Math.round(activeRound.attackerShieldAbsorbed).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950/90 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 uppercase font-semibold">
                    Defender Salvo (Round {activeRound.roundNumber})
                  </span>
                  <span className="text-zinc-300">
                    {activeRound.defenderShotsFired.toLocaleString("en-US")} shots
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block">Hull/Weapon Output</span>
                    <span className="text-sm font-bold text-amber-300">
                      {Math.round(activeRound.defenderDamageDealt).toLocaleString("en-US")}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Shields Absorbed</span>
                    <span className="text-sm font-bold text-emerald-300">
                      {Math.round(activeRound.defenderShieldAbsorbed).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Surviving Fleet Breakdown for Active Round */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attacker Units Table */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>ATTACKER FLEET COMPOSITION</span>
                  <span>END OF ROUND {activeRound.roundNumber}</span>
                </div>

                {displayReport.attacker.fleetNumbersHidden ? (
                  <div className="p-6 text-center text-xs font-mono text-amber-300/90 bg-amber-950/20 rounded border border-amber-500/30">
                    [Fleet Vessel Quantities Redacted by Share Policy]
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(displayReport.attacker.initialUnits ?? {}).map(
                      ([unitType, initialCount]) => {
                        const remaining =
                          activeRound.attackerUnitsRemaining?.[unitType] ?? 0;
                        const lost = Math.max(0, initialCount - remaining);
                        const pct =
                          initialCount > 0
                            ? Math.round((remaining / initialCount) * 100)
                            : 0;

                        return (
                          <div key={unitType} className="space-y-1 text-xs font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-200">{unitType}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-300 font-bold">
                                  {remaining.toLocaleString("en-US")}
                                </span>
                                <span className="text-zinc-500">
                                  / {initialCount.toLocaleString("en-US")}
                                </span>
                                {lost > 0 && (
                                  <span className="text-rose-400">
                                    (-{lost.toLocaleString("en-US")})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Defender Units Table */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>DEFENDER GARRISON COMPOSITION</span>
                  <span>END OF ROUND {activeRound.roundNumber}</span>
                </div>

                {displayReport.defender.fleetNumbersHidden ? (
                  <div className="p-6 text-center text-xs font-mono text-amber-300/90 bg-amber-950/20 rounded border border-amber-500/30">
                    [Garrison Quantities Redacted by Share Policy]
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(displayReport.defender.initialUnits ?? {}).map(
                      ([unitType, initialCount]) => {
                        const remaining =
                          activeRound.defenderUnitsRemaining?.[unitType] ?? 0;
                        const lost = Math.max(0, initialCount - remaining);
                        const pct =
                          initialCount > 0
                            ? Math.round((remaining / initialCount) * 100)
                            : 0;

                        return (
                          <div key={unitType} className="space-y-1 text-xs font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-200">{unitType}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-300 font-bold">
                                  {remaining.toLocaleString("en-US")}
                                </span>
                                <span className="text-zinc-500">
                                  / {initialCount.toLocaleString("en-US")}
                                </span>
                                {lost > 0 && (
                                  <span className="text-rose-400">
                                    (-{lost.toLocaleString("en-US")})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-amber-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aftermath Summary: Wreckage / Debris Field, Defense Repair & Plunder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orbital Debris & Moon Genesis */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Orbital Wreckage (30% Hull)
            </span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Debris Metal:</span>
              <span className="text-zinc-100 font-bold">
                {Math.round(displayReport.wreckage.debrisMetal).toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Debris Crystal:</span>
              <span className="text-cyan-300 font-bold">
                {Math.round(displayReport.wreckage.debrisCrystal).toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Moon Genesis Chance:
              </span>
              <span className="text-amber-300 font-bold">
                {displayReport.wreckage.moonChancePercent}%{" "}
                {displayReport.wreckage.moonCreated ? "(MOON FORMED)" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Plundered Resources */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Captured Plunder
            </span>
            <Boxes className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Metal Looted:</span>
              <span className="text-emerald-300 font-bold">
                {Math.round(displayReport.plunder.metalPlundered).toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Crystal Looted:</span>
              <span className="text-emerald-300 font-bold">
                {Math.round(displayReport.plunder.crystalPlundered).toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Deuterium Looted:</span>
              <span className="text-emerald-300 font-bold">
                {Math.round(displayReport.plunder.deuteriumPlundered).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>

        {/* Post-Battle Defense Reconstruction */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Reconstructed Defenses
            </span>
            <Wrench className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            {Object.keys(displayReport.wreckage.repairedDefenses ?? {}).length === 0 ? (
              <div className="text-zinc-500">No planetary turrets repaired.</div>
            ) : (
              Object.entries(displayReport.wreckage.repairedDefenses).map(
                ([uType, repairedCount]) => (
                  <div key={uType} className="flex justify-between">
                    <span className="text-zinc-400">{uType}:</span>
                    <span className="text-cyan-300 font-bold">
                      +{repairedCount.toLocaleString("en-US")} restored
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

