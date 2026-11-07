"use client";

import { useState } from "react";
import { Compass, Globe2, Send, ShieldAlert } from "lucide-react";

interface ExpeditionSlotProps {
  galaxy: number;
  system: number;
  onDispatchExpedition: (template: string) => void;
  colonizedCount: number;
  maxColonizedCount: number;
  astroLevel: number;
  isDispatching?: boolean;
}

export function ExpeditionSlot({
  galaxy,
  system,
  onDispatchExpedition,
  colonizedCount,
  maxColonizedCount,
  astroLevel,
  isDispatching,
}: ExpeditionSlotProps) {
  const [template, setTemplate] = useState<string>("standard");

  const canExpedition = astroLevel >= 1;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-[#0d1020] via-[#0b0e1b] to-[#070914] p-3.5 space-y-3 font-mono text-xs shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Slot Number & Deep Space label */}
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center">
            16
          </span>
          <div>
            <div className="font-bold text-zinc-100 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-400" />
              <span>sonsuz uzaklar:</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Koordinat: [{galaxy}:{system}:16] &bull; Derin Uzay Keşif Sektörü
            </div>
          </div>
        </div>

        {/* Fleet Template & Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">
            Keşif filosu
          </span>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            disabled={!canExpedition}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-400 disabled:opacity-40"
          >
            <option value="scout">Hafif Keşif (1 Sonda + 1 Ağır Avcı)</option>
            <option value="standard">Standart Keşif (5 Büyük Nakliye + 2 Hafif Avcı)</option>
            <option value="heavy">Ağır Keşif (20 Büyük Nakliye + 10 Kruvazör + 1 Öncü)</option>
          </select>

          <button
            type="button"
            disabled={!canExpedition || isDispatching}
            onClick={() => onDispatchExpedition(template)}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg border-2 border-blue-500 bg-blue-600/30 hover:bg-blue-600 text-blue-100 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-blue-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isDispatching ? "Sevk Ediliyor..." : "Keşif"}</span>
          </button>
        </div>
      </div>

      {!canExpedition && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px]">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>
            Keşif görevleri için en az 1. Seviye Astrofizik araştırması gereklidir.
          </span>
        </div>
      )}

      {/* Footer: Colonized planets counter */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-indigo-950">
        <span className="flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
          Gezegen Kolonizasyon Durumu:
        </span>
        <span className="font-bold text-cyan-300">
          {colonizedCount} / {maxColonizedCount} Gezegen Kolonileştirildi
        </span>
      </div>
    </div>
  );
}

