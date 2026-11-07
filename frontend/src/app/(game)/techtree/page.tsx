"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  TECH_TREE_DATA,
  TECH_ID_TO_METADATA,
  evaluateNodePrerequisites,
  getDependentNodes,
  type TechTreeNode,
  type EvaluatedTechNode,
} from "@/config/techtreePrerequisites";
import {
  Network,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  ArrowRight,
  ExternalLink,
  Layers,
  Pickaxe,
  Factory,
  FlaskConical,
  Rocket,
  ShieldAlert,
  Bomb,
  ChevronRight,
  Sparkles,
  Info,
  X,
} from "lucide-react";

type CategoryFilter = "all" | "buildings" | "research" | "ships" | "defense" | "missiles";
type StatusFilter = "all" | "unlocked" | "locked";

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: typeof Network }[] = [
  { id: "all", label: "Tümü", icon: Network },
  { id: "buildings", label: "Binalar & Tesisler", icon: Factory },
  { id: "research", label: "Araştırma", icon: FlaskConical },
  { id: "ships", label: "Gemiler", icon: Rocket },
  { id: "defense", label: "Savunma", icon: ShieldAlert },
  { id: "missiles", label: "Roketler", icon: Bomb },
];

function TechTreeContent() {
  const searchParams = useSearchParams();
  const initialFocus = searchParams.get("focus")?.toLowerCase() ?? "";

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialFocus || null);

  // Auto focus node if query param present
  useEffect(() => {
    if (initialFocus) {
      const match = TECH_TREE_DATA.find(
        (n) => n.id.toLowerCase() === initialFocus || n.name.toLowerCase().includes(initialFocus)
      );
      if (match) {
        setSelectedNodeId(match.id);
      }
    }
  }, [initialFocus]);

  // Evaluate all tech tree nodes against current planet & researches
  const evaluatedNodes: EvaluatedTechNode[] = useMemo(() => {
    return TECH_TREE_DATA.map((node) =>
      evaluateNodePrerequisites(node, planet, researches)
    );
  }, [planet, researches]);

  // Counts for summary bar
  const stats = useMemo(() => {
    const total = evaluatedNodes.length;
    const unlocked = evaluatedNodes.filter((n) => n.isUnlocked).length;
    const locked = total - unlocked;
    return { total, unlocked, locked };
  }, [evaluatedNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return evaluatedNodes.filter((node) => {
      // Category filter
      if (activeCategory !== "all" && node.category !== activeCategory) {
        return false;
      }

      // Status filter
      if (activeStatus === "unlocked" && !node.isUnlocked) return false;
      if (activeStatus === "locked" && node.isUnlocked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = node.name.toLowerCase().includes(q);
        const matchesId = node.id.toLowerCase().includes(q);
        const matchesReq = node.requirements.some((r) =>
          r.name.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesId && !matchesReq) return false;
      }

      return true;
    });
  }, [evaluatedNodes, activeCategory, activeStatus, searchQuery]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return evaluatedNodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [evaluatedNodes, selectedNodeId]);

  const dependentNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    return getDependentNodes(selectedNodeId);
  }, [selectedNodeId]);

  const getCategoryIcon = (category: TechTreeNode["category"]) => {
    switch (category) {
      case "buildings":
        return <Factory className="h-4 w-4 text-amber-400" />;
      case "research":
        return <FlaskConical className="h-4 w-4 text-cyan-400" />;
      case "ships":
        return <Rocket className="h-4 w-4 text-indigo-400" />;
      case "defense":
        return <ShieldAlert className="h-4 w-4 text-emerald-400" />;
      case "missiles":
        return <Bomb className="h-4 w-4 text-rose-400" />;
      default:
        return <Layers className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getCategoryLabel = (category: TechTreeNode["category"]) => {
    switch (category) {
      case "buildings":
        return "Bina & Tesis";
      case "research":
        return "Araştırma";
      case "ships":
        return "Gemi";
      case "defense":
        return "Savunma";
      case "missiles":
        return "Roket";
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Network className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">
                  Teknoloji Ağacı
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  Prerequisites Matrix
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bina, araştırma, filo ve savunma mekanizmalarının resmi OGame gelişim ve önkoşul hiyerarşisi
              </p>
            </div>
          </div>

          {/* Universe Progress Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Açık:</span>
              <strong className="text-emerald-200">{stats.unlocked}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 flex items-center gap-1.5 shadow-sm">
              <Lock className="h-3.5 w-3.5 text-rose-400" />
              <span>Kilitli:</span>
              <strong className="text-rose-200">{stats.locked}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 text-zinc-300 flex items-center gap-1.5 shadow-sm">
              <span>Toplam:</span>
              <strong className="text-zinc-100">{stats.total}</strong>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-cyan-600 text-zinc-950 shadow-[0_0_12px_rgba(34,211,238,0.3)] font-bold"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-zinc-950" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Status Select */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveStatus("all")}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  activeStatus === "all" ? "bg-zinc-800 text-zinc-100 font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus("unlocked")}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  activeStatus === "unlocked" ? "bg-emerald-950/60 text-emerald-300 font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Açık
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus("locked")}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  activeStatus === "locked" ? "bg-rose-950/60 text-rose-300 font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Kilitli
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-60">
              <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Teknoloji veya gereksinim ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Column Layout (Nodes Grid + Interactive Detail Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Nodes List (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-mono text-zinc-400 flex items-center justify-between pb-1 px-1">
            <span>Listelenen Teknolojiler ({filteredNodes.length})</span>
            <span className="text-[11px] text-zinc-500">Gezegen: {planet.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const hasReqs = node.requirements.length > 0;
              const isUnlocked = node.isUnlocked;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`rounded-xl border p-4 transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
                    isSelected
                      ? "bg-gradient-to-br from-[#121b28] via-[#0d141e] to-[#080d14] border-cyan-500/70 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30"
                      : isUnlocked
                      ? "bg-[#0c1017] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#101622]"
                      : "bg-[#0b0e14] border-zinc-800/50 hover:border-zinc-700 opacity-80"
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isUnlocked ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />

                  {/* Header: Name + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                        {getCategoryIcon(node.category)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-zinc-100 truncate group-hover:text-cyan-300 transition-colors">
                          {node.name}
                        </h3>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          {getCategoryLabel(node.category)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUnlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Açık</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Kilitli</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Level / Quantity */}
                  <div className="flex items-center justify-between text-xs font-mono py-1 border-t border-b border-zinc-800/60 my-2">
                    <span className="text-zinc-500 text-[11px]">Mevcut Durum:</span>
                    <span className="font-bold text-zinc-200">
                      {node.category === "ships" || node.category === "defense" || node.category === "missiles"
                        ? `${node.currentLevel.toLocaleString("tr-TR")} Adet`
                        : `Kademe ${node.currentLevel}`}
                    </span>
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-1 mt-2">
                    {!hasReqs ? (
                      <p className="text-[11px] text-zinc-500 italic">
                        Önkoşul yok (Doğrudan inşa edilebilir)
                      </p>
                    ) : (
                      node.evaluatedRequirements.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between text-[11px] font-mono"
                        >
                          <span
                            className={`truncate pr-2 ${
                              req.isMet ? "text-zinc-400" : "text-rose-300 font-medium"
                            }`}
                          >
                            • {req.name} (Kademe {req.requiredLevel})
                          </span>
                          <span
                            className={`shrink-0 font-bold ${
                              req.isMet ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {req.currentLevel}/{req.requiredLevel}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Action Link */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 group-hover:text-cyan-400 font-semibold transition-colors flex items-center gap-1">
                      <span>Detayları İncele</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>

                    <Link
                      href={node.href}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-cyan-950/80 border border-zinc-700 hover:border-cyan-500/50 text-[11px] font-bold text-cyan-300 transition-colors"
                    >
                      <span>Git</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNodes.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-8 text-center text-zinc-400 font-mono text-xs">
              Arama kriterlerine uygun teknoloji veya birim bulunamadı.
            </div>
          )}
        </div>

        {/* Selected Node Inspector Sidebar */}
        <div className="lg:col-span-1 sticky top-4 space-y-4">
          {selectedNode ? (
            <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700">
                    {getCategoryIcon(selectedNode.category)}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-zinc-100">
                      {selectedNode.name}
                    </h2>
                    <span className="text-xs font-mono text-zinc-500">
                      {getCategoryLabel(selectedNode.category)} • ID: {selectedNode.id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {selectedNode.isUnlocked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Açık
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      Kilitli
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Level Box */}
              <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Bu Gezegendeki Kademe:</span>
                  <span className="text-cyan-300 font-bold text-sm">
                    {selectedNode.currentLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Kullanılabilirlik:</span>
                  <span className={selectedNode.isUnlocked ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {selectedNode.isUnlocked ? "İnşa veya Üretim Mümkün" : "Önkoşullar Eksik"}
                  </span>
                </div>
              </div>

              {/* Prerequisites Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span>Gereksinimler ({selectedNode.requirements.length})</span>
                </h4>

                {selectedNode.requirements.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                    Bu birimin veya yapının herhangi bir teknolojik önkoşulu bulunmuyor.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedNode.evaluatedRequirements.map((req) => (
                      <div
                        key={req.id}
                        className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 ${
                          req.isMet
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                            : "bg-rose-950/20 border-rose-500/30 text-rose-200"
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            {req.isMet ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                            )}
                            <span>{req.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            Gereken: <strong className="text-zinc-200">Kademe {req.requiredLevel}</strong> • Mevcut:{" "}
                            <strong className={req.isMet ? "text-emerald-300" : "text-rose-400"}>
                              {req.currentLevel}
                            </strong>
                          </div>
                        </div>

                        <Link
                          href={req.href}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-cyan-300 transition-colors shrink-0"
                        >
                          Yükselt &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dependent Technologies (What does this unlock?) */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Açtığı Teknolojiler ({dependentNodes.length})</span>
                </h4>

                {dependentNodes.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    Bu teknoloji diğer birimler için doğrudan önkoşul olarak aranmamaktadır.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {dependentNodes.map((dep) => (
                      <button
                        key={dep.id}
                        type="button"
                        onClick={() => setSelectedNodeId(dep.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-cyan-500/50 text-[11px] font-mono text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{dep.name}</span>
                        <ChevronRight className="h-3 w-3 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-3 border-t border-zinc-800">
                <Link
                  href={selectedNode.href}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-cyan-500/30 transition-all"
                >
                  <span>Geliştirme Sayfasına Git</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-6 text-center text-zinc-400 font-mono text-xs space-y-2">
              <Info className="h-6 w-6 text-cyan-400 mx-auto" />
              <p className="font-bold text-zinc-200">Teknoloji Seçin</p>
              <p className="text-zinc-500 text-[11px]">
                Soldaki listeden bir birim veya teknolojiye tıklayarak tam önkoşul ağacını ve açtığı diğer teknolojileri inceleyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TechTreePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-xs font-mono text-cyan-400">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 animate-spin" />
            <span>Teknoloji Ağacı Yükleniyor...</span>
          </div>
        </div>
      }
    >
      <TechTreeContent />
    </Suspense>
  );
}
