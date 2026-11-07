"use client";

import React, { useState } from "react";
import {
  LIFEFORMS_CATALOG,
  type LifeformId,
  type LifeformSpeciesConfig,
  normalizeSpeciesId,
} from "@/lib/lifeformsCatalog";
import {
  Users,
  Pickaxe,
  Cpu,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  X,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";

interface SpeciesSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpeciesId: string;
  unlockedSpecies?: string[];
  onSelectSpecies: (speciesId: LifeformId) => Promise<void>;
  planetName: string;
}

const SPECIES_ICONS: Record<LifeformId, React.ReactNode> = {
  humans: <Users className="h-6 w-6 text-cyan-400" />,
  rocktal: <Pickaxe className="h-6 w-6 text-amber-400" />,
  mechas: <Cpu className="h-6 w-6 text-sky-400" />,
  kaelesh: <Compass className="h-6 w-6 text-emerald-400" />,
};

const SPECIES_THEMES: Record<
  LifeformId,
  {
    border: string;
    bgGlow: string;
    badgeBg: string;
    badgeText: string;
    buttonClass: string;
  }
> = {
  humans: {
    border: "border-cyan-500/50 hover:border-cyan-400",
    bgGlow: "from-cyan-950/40 via-slate-900/90 to-[#070b13]",
    badgeBg: "bg-cyan-950/70 border-cyan-500/40",
    badgeText: "text-cyan-300",
    buttonClass: "bg-cyan-600 hover:bg-cyan-500 text-white",
  },
  rocktal: {
    border: "border-amber-500/50 hover:border-amber-400",
    bgGlow: "from-amber-950/40 via-slate-900/90 to-[#070b13]",
    badgeBg: "bg-amber-950/70 border-amber-500/40",
    badgeText: "text-amber-300",
    buttonClass: "bg-amber-600 hover:bg-amber-500 text-white",
  },
  mechas: {
    border: "border-sky-500/50 hover:border-sky-400",
    bgGlow: "from-sky-950/40 via-slate-900/90 to-[#070b13]",
    badgeBg: "bg-sky-950/70 border-sky-500/40",
    badgeText: "text-sky-300",
    buttonClass: "bg-sky-600 hover:bg-sky-500 text-white",
  },
  kaelesh: {
    border: "border-emerald-500/50 hover:border-emerald-400",
    bgGlow: "from-emerald-950/40 via-slate-900/90 to-[#070b13]",
    badgeBg: "bg-emerald-950/70 border-emerald-500/40",
    badgeText: "text-emerald-300",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
  },
};

const RATING_COLORS: Record<string, string> = {
  "Çok iyi": "text-emerald-400 bg-emerald-950/60 border-emerald-500/40",
  "İyi": "text-cyan-400 bg-cyan-950/60 border-cyan-500/40",
  "Orta": "text-amber-400 bg-amber-950/60 border-amber-500/40",
  "Düşük": "text-zinc-400 bg-zinc-900 border-zinc-700/40",
};

export function SpeciesSelectionModal({
  isOpen,
  onClose,
  activeSpeciesId,
  unlockedSpecies = ["humans"],
  onSelectSpecies,
  planetName,
}: SpeciesSelectionModalProps) {
  const [selectedPendingId, setSelectedPendingId] = useState<LifeformId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isNone =
    !activeSpeciesId ||
    activeSpeciesId === "none" ||
    activeSpeciesId === "Durduruldu";
  const currentNormalized = isNone ? null : normalizeSpeciesId(activeSpeciesId);
  const speciesList: LifeformSpeciesConfig[] = Object.values(LIFEFORMS_CATALOG);

  const handleConfirmSwitch = async (speciesId: LifeformId) => {
    setIsSubmitting(true);
    try {
      await onSelectSpecies(speciesId);
      setSelectedPendingId(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-zinc-800 bg-[#090d14] p-5 sm:p-6 shadow-2xl my-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              OGame Canlı Türleri İskele Yönetimi
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
              Canlı Türü Seçimi - <span className="text-cyan-400">{planetName}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* State Preservation Info Box */}
        <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3.5 text-xs text-purple-200/90 flex items-start gap-3">
          <Layers className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-purple-200">
              Gezegen Bazlı İlerleme Koruma Güvencesi:
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Her gezegende farklı bir canlı türü aktif edilebilir. Bir gezegende canlı türü değiştirildiğinde,
              mevcut türün <strong className="text-zinc-200">12 binası ve tüm teknoloji kademeleri asla silinmez</strong>.
              Veritabanında pasif olarak korunur ve bu türe geri dönüldüğünde kaldığı seviyeden anında devam eder.
            </p>
          </div>
        </div>

        {/* Species 4-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speciesList.map((species) => {
            const isCurrent = currentNormalized === species.id;
            const isUnlocked =
              species.id === "humans" ||
              unlockedSpecies.some((s) => s.toLowerCase() === species.id.toLowerCase() || s.toLowerCase().includes(species.id));
            const theme = SPECIES_THEMES[species.id];

            return (
              <div
                key={species.id}
                className={`relative rounded-xl border p-4.5 transition-all flex flex-col justify-between bg-gradient-to-b ${theme.bgGlow} ${
                  isCurrent
                    ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    : theme.border
                }`}
              >
                {/* Header row */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800">
                        {SPECIES_ICONS[species.id]}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">
                          {species.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          {species.tagline}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Aktif Tür
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                        Seçilebilir
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Kilitli
                      </span>
                    )}
                  </div>

                  {/* Playstyle */}
                  <p className="text-xs text-zinc-300/90 italic bg-black/30 p-2 rounded-lg border border-zinc-800/60 mb-3">
                    &ldquo;{species.playstyle}&rdquo;
                  </p>

                  {/* Ratings Matrix */}
                  <div className="mb-3 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Uzmanlık Puanlaması:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Metal:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.metal]}`}>
                          {species.ratings.metal}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Kristal:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.crystal]}`}>
                          {species.ratings.crystal}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Deut:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.deuterium]}`}>
                          {species.ratings.deuterium}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Araştırma:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.research]}`}>
                          {species.ratings.research}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Askerî:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.military]}`}>
                          {species.ratings.military}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-400">Sefer:</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${RATING_COLORS[species.ratings.expedition]}`}>
                          {species.ratings.expedition}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Bonuses */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1 block">
                      Temel Avantajlar:
                    </span>
                    <ul className="text-xs text-zinc-300 space-y-1">
                      {species.coreBonuses.map((bonus, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 shrink-0 font-bold">•</span>
                          <span>{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Selection Button */}
                <div className="pt-2 border-t border-zinc-800/80">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-800/70 text-zinc-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Bu Gezegende Şu An Yerleşik
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleConfirmSwitch(species.id)}
                      disabled={isSubmitting}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${theme.buttonClass}`}
                    >
                      <span>{isNone ? "Bu Canlı Türünü Ata" : "Bu Türe Geçiş Yap"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        <span>Kilitli Canlı Türü</span>
                      </button>
                      <p className="text-[10px] text-zinc-400 font-mono text-center leading-tight">
                        Galaksi ekranından Mor DNA keşif görevleri göndererek bu türü keşfedin (Önkoşul: Galaksiler Arası Elçiler Kademe 1)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

