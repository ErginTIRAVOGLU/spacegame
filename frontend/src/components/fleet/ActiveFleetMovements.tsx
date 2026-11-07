"use client";

import { useState } from "react";
import { Plane, Undo2, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { FleetTimeDisplay } from "@/components/fleet/FleetTimeDisplay";

export interface ActiveFleetMissionItem {
  id: string;
  originPlanetId?: string;
  originCoordinates: string;
  targetCoordinates: string;
  missionType: number;
  missionTypeName: string;
  status: number;
  statusName: string;
  fuelConsumed?: number;
  departureUtc: string;
  arrivalUtc: string;
  returnUtc: string | null;
  isReturning?: boolean;
  ships: { unitType: number; count: number }[];
}

interface ActiveFleetMovementsProps {
  missions: ActiveFleetMissionItem[];
  onRecall: (missionId: string) => Promise<void>;
  recallingId?: string | null;
}

export function ActiveFleetMovements({
  missions,
  onRecall,
  recallingId,
}: ActiveFleetMovementsProps) {
  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
  });

  if (!missions || missions.length === 0) {
    return null;
  }

  return (
    <div
      id="active-fleet-movements"
      className="rounded-xl border border-zinc-800 bg-[#0d1017] p-4 lg:p-5 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
          <Plane className="h-4 w-4 text-cyan-400" />
          Seyir Halindeki Filolar ({missions.length})
        </h3>
        <span className="text-[11px] font-mono text-zinc-400">
          Gerçek Zamanlı Uçuş Takibi & Filo Emri
        </span>
      </div>

      <div className="space-y-2.5">
        {missions.map((m) => {
          const shipTotal = m.ships.reduce((s, u) => s + u.count, 0);
          const isReturning =
            m.isReturning ??
            (m.status === 3 || m.status === 6 || m.statusName === "Returning" || m.statusName === "Recalled");
          const isRecallingThis = recallingId === m.id;
          const isRowFocused = isHighlighted("fleet-recall-btn") || isHighlighted("active-fleet-movements");

          return (
            <div
              key={m.id}
              id={`fleet-mission-${m.id}`}
              className={`p-3.5 rounded-xl border transition-all ${
                isRowFocused && !isReturning
                  ? highlightClass
                  : "border-zinc-800/90 bg-[#090d14]"
              } flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono`}
            >
              {/* Mission Type, Route & Ship Count */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    isReturning
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                  }`}
                >
                  {isReturning ? "Dönüş Seferi" : m.missionTypeName}
                </span>

                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400 text-[11px]">Rota:</span>
                  <strong className="text-cyan-300 font-bold">{m.originCoordinates}</strong>
                  <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />
                  <strong className="text-amber-300 font-bold">{m.targetCoordinates}</strong>
                </div>

                <span className="px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 text-[11px]">
                  {shipTotal.toLocaleString()} Gemi
                </span>
              </div>

              {/* Timing & Recall Action */}
              <div className="flex items-center gap-3.5 self-end md:self-auto shrink-0 flex-wrap">
                <FleetTimeDisplay
                  targetTimestamp={m.arrivalUtc}
                  returnTimestamp={m.returnUtc}
                  isReturning={isReturning}
                />

                {/* Recall Button or Status Badge */}
                {!isReturning ? (
                  <button
                    type="button"
                    id="fleet-recall-btn"
                    data-mission-id={m.id}
                    onClick={() => onRecall(m.id)}
                    disabled={isRecallingThis}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-semibold text-xs shadow-[0_0_10px_rgba(244,63,94,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Filoyu Geri Çağır"
                  >
                    {isRecallingThis ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Çağrılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Geri Çağır</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    <Undo2 className="h-3 w-3 text-amber-400" />
                    <span>Geri Dönüyor</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
