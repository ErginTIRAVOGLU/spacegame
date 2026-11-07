"use client";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useFleetStore } from "@/store/useFleetStore";
import { FleetTimeDisplay } from "@/components/fleet/FleetTimeDisplay";
import {
  AlertTriangle,
  Plane,
  ChevronDown,
  ChevronUp,
  Undo2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

export function ActiveFleetBanner() {
  const incomingFleets = useGameStore((s) => s.incomingFleets);
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [recallingId, setRecallingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!incomingFleets || incomingFleets.length === 0) return null;

  // Primary banner fleet (nearest arrival)
  const primaryFleet = incomingFleets[0];
  const totalFleetCount = incomingFleets.length;

  const isPrimaryReturning =
    primaryFleet.isReturning ??
    primaryFleet.missionType.toLowerCase().includes("returning");

  const handleRecallFleet = async (fleetId: string) => {
    setRecallingId(fleetId);
    setNotice(null);
    try {
      const result = await useFleetStore.getState().recallFleet(fleetId);
      setRecallingId(null);
      if (result.success) {
        setNotice(result.message);
        await fetchBootstrap();
      } else {
        setNotice(`Geri çağırma hatası: ${result.message}`);
      }
    } catch {
      setRecallingId(null);
      setNotice("Filo geri çağrılırken bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-2">
      {/* Notice alert */}
      {notice && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-xs text-emerald-300 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Single-Line Banner */}
      <div
        className={`rounded-lg border p-3.5 transition-all ${
          primaryFleet.isHostile
            ? "border-amber-500/60 bg-amber-950/30 shadow-[0_0_25px_rgba(251,191,36,0.15)]"
            : "border-cyan-500/60 bg-cyan-950/30 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Summary Telemetry */}
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle
              className={`h-5 w-5 animate-pulse shrink-0 ${
                primaryFleet.isHostile ? "text-amber-400" : "text-cyan-400"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-xs font-bold uppercase tracking-wider ${
                    primaryFleet.isHostile ? "text-amber-300" : "text-cyan-300"
                  }`}
                >
                  {primaryFleet.isHostile
                    ? "Düşman Filo Yaklaşıyor"
                    : "Aktif Filo Hareketi"}
                </h2>
                {isPrimaryReturning && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Geri Dönüyor
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 truncate">
                Görev:{" "}
                <span className="font-mono text-amber-400 font-semibold">
                  {primaryFleet.missionTypeName || primaryFleet.missionType}
                </span>{" "}
                • Çıkış:{" "}
                <span className="font-mono text-cyan-300">
                  {primaryFleet.originCoords}
                </span>{" "}
                → Hedef:{" "}
                <span className="font-mono text-cyan-300">
                  {primaryFleet.targetCoords}
                </span>{" "}
                ({primaryFleet.shipCount} gemi)
              </p>
            </div>
          </div>

          {/* Right: Countdown, Recall Action & Accordion Trigger */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <FleetTimeDisplay
              targetTimestamp={primaryFleet.arrivalUtc}
              isReturning={isPrimaryReturning}
              referenceUtc={planet?.serverTimeUtc}
              onComplete={fetchBootstrap}
              boxed
            />

            {/* Recall Button on Primary Banner (if not hostile and not already returning) */}
            {!primaryFleet.isHostile && !isPrimaryReturning && (
              <button
                type="button"
                id="overview-fleet-recall-btn"
                onClick={() => handleRecallFleet(primaryFleet.id)}
                disabled={recallingId === primaryFleet.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-semibold text-xs font-mono shadow-[0_0_10px_rgba(244,63,94,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Filoyu Geri Çağır"
              >
                {recallingId === primaryFleet.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Çağrılıyor...</span>
                  </>
                ) : (
                  <>
                    <Undo2 className="h-3 w-3" />
                    <span>Geri Çağır</span>
                  </>
                )}
              </button>
            )}

            {/* Accordion Toggle Button */}
            <button
              type="button"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 text-xs font-mono font-medium transition-colors"
              title={isAccordionOpen ? "Filo listesini gizle" : "Tüm filoları göster"}
            >
              <span>Filolar ({totalFleetCount})</span>
              {isAccordionOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Accordion Drawer */}
      {isAccordionOpen && (
        <div className="rounded-xl border border-zinc-800 bg-[#090d14] p-3 sm:p-4 space-y-2.5 shadow-[0_6px_25px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
              <Plane className="h-3.5 w-3.5" />
              Seyir Halindeki Filolar Detay Listesi ({incomingFleets.length})
            </span>
            <span className="text-zinc-500">Canlı Telemetri & Geri Çağırma</span>
          </div>

          <div className="space-y-2">
            {incomingFleets.map((m) => {
              const isReturning =
                m.isReturning ??
                m.missionType.toLowerCase().includes("returning");
              const isRecallingThis = recallingId === m.id;

              return (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-zinc-800/80 bg-[#0d121c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-colors hover:border-zinc-700"
                >
                  {/* Left: Mission badge, coordinates & ship count */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        m.isHostile
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : isReturning
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                      }`}
                    >
                      {m.isHostile
                        ? "Saldırı"
                        : isReturning
                        ? "Dönüş"
                        : m.missionTypeName || m.missionType}
                    </span>

                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <strong className="text-cyan-300">{m.originCoords}</strong>
                      <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />
                      <strong className="text-amber-300">{m.targetCoords}</strong>
                    </div>

                    {/* Ship Composition Tooltip */}
                    <div
                      className="px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 text-[11px] relative group cursor-help"
                      title={
                        m.ships && m.ships.length > 0
                          ? m.ships
                              .map(
                                (s) =>
                                  `${s.shipName}: ${s.displayCount || s.exactCount}`
                              )
                              .join(", ")
                          : `${m.shipCount} gemi`
                      }
                    >
                      <span>{m.shipCount} Gemi</span>
                    </div>
                  </div>

                  {/* Right: Clock & Action */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto flex-wrap">
                    <FleetTimeDisplay
                      targetTimestamp={m.arrivalUtc}
                      isReturning={isReturning}
                      referenceUtc={planet?.serverTimeUtc}
                      onComplete={fetchBootstrap}
                      boxed
                    />

                    {!m.isHostile && !isReturning ? (
                      <button
                        type="button"
                        onClick={() => handleRecallFleet(m.id)}
                        disabled={isRecallingThis}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-semibold text-xs shadow-[0_0_10px_rgba(244,63,94,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Filoyu Geri Çağır"
                      >
                        {isRecallingThis ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Çağrılıyor...</span>
                          </>
                        ) : (
                          <>
                            <Undo2 className="h-3 w-3" />
                            <span>Geri Çağır</span>
                          </>
                        )}
                      </button>
                    ) : isReturning ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        <Undo2 className="h-3 w-3 text-amber-400" />
                        <span>Dönüyor</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

