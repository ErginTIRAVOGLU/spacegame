"use client";

import { useState, Suspense } from "react";
import { PlanetHeroCard } from "@/components/overview/PlanetHeroCard";
import { QueueStatusGrid } from "@/components/overview/QueueStatusGrid";
import { ProductionOverviewTab } from "@/components/overview/ProductionOverviewTab";
import { ActiveFleetBanner } from "@/components/overview/ActiveFleetBanner";
import { useOfficerStore } from "@/store/useOfficerStore";
import { Globe, Layers, Crown } from "lucide-react";

export default function OverviewPage() {
  const [activeTab, setActiveTab] = useState<"planet" | "production">("planet");
  const bonuses = useOfficerStore((s) => s.bonuses);

  return (
    <div className="space-y-4">
      {/* Top View Tab Switcher: Gezegen Görünümü / Üretim Genel Görünümü */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("planet")}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeTab === "planet"
                ? "bg-gradient-to-b from-cyan-900/60 to-[#0d1826] border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.18)]"
                : "bg-[#0c121b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gezegen Görünümü</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("production")}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              activeTab === "production"
                ? "bg-gradient-to-b from-cyan-900/60 to-[#0d1826] border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.18)]"
                : "bg-[#0c121b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Üretim Genel Görünümü</span>
            {bonuses.hasCommander && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30 flex items-center gap-1">
                <Crown className="h-2.5 w-2.5 text-amber-400" />
                Commander
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Fleet Movement Banner (only shown if active mission exists in DB) */}
      <ActiveFleetBanner />

      {activeTab === "planet" ? (
        <div className="space-y-4">
          <Suspense fallback={null}>
            <PlanetHeroCard />
          </Suspense>
          <QueueStatusGrid />
        </div>
      ) : (
        <ProductionOverviewTab />
      )}
    </div>
  );
}

