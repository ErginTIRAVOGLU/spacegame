"use client";

import Link from "next/link";
import {
  type EmpirePlanetDto,
  type EmpireRowItem,
  EMPIRE_MINES,
  EMPIRE_FACILITIES,
  EMPIRE_DEFENSES,
  EMPIRE_SHIPS,
  EMPIRE_RESEARCHES,
  EMPIRE_LIFEFORM_BUILDINGS,
  EMPIRE_LIFEFORM_TECHS,
} from "@/lib/empireCatalog";
import {
  Globe2,
  Boxes,
  Gem,
  Droplets,
  Zap,
  Sparkles,
  Swords,
  Shield,
  Plane,
  Building2,
  Atom,
  Dna,
  Package,
} from "lucide-react";

interface EmpireTableSectionsProps {
  planets: EmpirePlanetDto[];
  researches: Record<number, number>;
  onSelectPlanet: (planetId: string) => void;
}

export function EmpireTableSections({
  planets,
  researches,
  onSelectPlanet,
}: EmpireTableSectionsProps) {
  // Helper to calculate total value across planets
  const sumUnits = (typeId: number) => {
    return planets.reduce((sum, p) => sum + (p.units?.[typeId] ?? 0), 0);
  };

  const maxBuildingLevel = (typeId: number) => {
    return planets.reduce((max, p) => Math.max(max, p.buildings?.[typeId] ?? 0), 0);
  };

  // Helper row renderer for numeric item per planet
  const renderDataRow = (
    label: string,
    getValue: (p: EmpirePlanetDto) => number | string,
    totalValue: number | string,
    href?: string,
    highlightZero = false,
    formatNumber = true,
    rowKey?: string
  ) => {
    return (
      <tr
        key={rowKey ?? label}
        className="hover:bg-zinc-900/60 border-b border-zinc-800/40 transition-colors"
      >
        {/* Sticky Label Column */}
        <td className="sticky left-0 z-20 bg-[#0d1017] py-2.5 px-4 font-semibold text-zinc-300 border-r border-zinc-800 flex items-center justify-between min-w-[220px]">
          {href ? (
            <Link
              href={href}
              className="hover:text-cyan-300 hover:underline transition-colors truncate"
            >
              {label}
            </Link>
          ) : (
            <span className="truncate">{label}</span>
          )}
        </td>

        {/* Planet Columns */}
        {planets.map((p) => {
          const val = getValue(p);
          const isNum = typeof val === "number";
          const isZero = isNum && val === 0;

          return (
            <td
              key={p.id}
              className={`py-2.5 px-3 text-center font-mono border-r border-zinc-800/60 min-w-[130px] ${
                isZero && highlightZero
                  ? "text-zinc-600"
                  : isNum && val > 0
                  ? "text-zinc-100 font-bold"
                  : "text-zinc-300"
              }`}
            >
              {isNum && formatNumber ? val.toLocaleString() : val}
            </td>
          );
        })}

        {/* Toplam Column */}
        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300 bg-amber-950/10 min-w-[130px]">
          {typeof totalValue === "number" && formatNumber
            ? totalValue.toLocaleString()
            : totalValue}
        </td>
      </tr>
    );
  };

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* SECTION A: Planet Identity & Orbital Stats */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Globe2 className="h-4 w-4 text-cyan-400" />
          <span>A. Gezegen Kimliği & Yörünge Bilgileri</span>
        </td>
      </tr>

      {/* Planet Coordinates */}
      {renderDataRow(
        "Koordinat",
        (p) => p.coords,
        "—",
        undefined,
        false,
        false
      )}

      {/* Field capacity */}
      {renderDataRow(
        "Alan Kapasitesi",
        (p) => `${p.fieldsUsed} / ${p.maxFields}`,
        `${planets.reduce((s, p) => s + p.fieldsUsed, 0)} / ${planets.reduce((s, p) => s + p.maxFields, 0)}`,
        undefined,
        false,
        false
      )}

      {/* Temperature range */}
      {renderDataRow(
        "Sıcaklık Aralığı",
        (p) => `${p.tempMin}°C - ${p.tempMax}°C`,
        "—",
        undefined,
        false,
        false
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION B: Fleet Activity Summary */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-amber-300 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Plane className="h-4 w-4 text-amber-400" />
          <span>B. Filo Hareketleri & Rotalar</span>
        </td>
      </tr>

      {renderDataRow(
        "Aktif Filo Görevleri",
        (p) => p.activeMissionsCount,
        planets.reduce((s, p) => s + p.activeMissionsCount, 0),
        "/fleet",
        true
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION C: Resources & Storages */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Boxes className="h-4 w-4 text-emerald-400" />
          <span>C. Hammaddeler & Depo Kapasiteleri</span>
        </td>
      </tr>

      {renderDataRow(
        "Metal Rezervi",
        (p) => p.resources.metal,
        planets.reduce((s, p) => s + p.resources.metal, 0),
        "/resources"
      )}

      {renderDataRow(
        "Metal Üretimi (Saatlik)",
        (p) => `+${p.resources.metalPerHour.toLocaleString()}`,
        `+${planets.reduce((s, p) => s + p.resources.metalPerHour, 0).toLocaleString()}`,
        "/resources",
        false,
        false
      )}

      {renderDataRow(
        "Kristal Rezervi",
        (p) => p.resources.crystal,
        planets.reduce((s, p) => s + p.resources.crystal, 0),
        "/resources"
      )}

      {renderDataRow(
        "Kristal Üretimi (Saatlik)",
        (p) => `+${p.resources.crystalPerHour.toLocaleString()}`,
        `+${planets.reduce((s, p) => s + p.resources.crystalPerHour, 0).toLocaleString()}`,
        "/resources",
        false,
        false
      )}

      {renderDataRow(
        "Döteryum Rezervi",
        (p) => p.resources.deuterium,
        planets.reduce((s, p) => s + p.resources.deuterium, 0),
        "/resources"
      )}

      {renderDataRow(
        "Döteryum Üretimi (Saatlik)",
        (p) => `+${p.resources.deuteriumPerHour.toLocaleString()}`,
        `+${planets.reduce((s, p) => s + p.resources.deuteriumPerHour, 0).toLocaleString()}`,
        "/resources",
        false,
        false
      )}

      {renderDataRow(
        "Net Enerji Dengesi",
        (p) => p.resources.netEnergy,
        planets.reduce((s, p) => s + p.resources.netEnergy, 0),
        "/resources"
      )}

      {/* Storage Capacities */}
      {renderDataRow(
        "Metal Depo Kapasitesi",
        (p) => p.storages.metalCapacity,
        planets.reduce((s, p) => s + p.storages.metalCapacity, 0),
        "/resources"
      )}

      {renderDataRow(
        "Kristal Depo Kapasitesi",
        (p) => p.storages.crystalCapacity,
        planets.reduce((s, p) => s + p.storages.crystalCapacity, 0),
        "/resources"
      )}

      {renderDataRow(
        "Döteryum Tank Kapasitesi",
        (p) => p.storages.deuteriumCapacity,
        planets.reduce((s, p) => s + p.storages.deuteriumCapacity, 0),
        "/resources"
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION D: Production Buildings & Facilities */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-cyan-300 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Building2 className="h-4 w-4 text-cyan-400" />
          <span>D. Binalar & Üretim Tesisleri</span>
        </td>
      </tr>

      {/* Mines */}
      {EMPIRE_MINES.map((b) =>
        renderDataRow(
          b.name,
          (p) => p.buildings?.[b.typeId ?? 0] ?? 0,
          maxBuildingLevel(b.typeId ?? 0),
          "/resources",
          true,
          true,
          b.id
        )
      )}

      {/* Facilities */}
      {EMPIRE_FACILITIES.map((b) =>
        renderDataRow(
          b.name,
          (p) => p.buildings?.[b.typeId ?? 0] ?? 0,
          maxBuildingLevel(b.typeId ?? 0),
          "/facilities",
          true,
          true,
          b.id
        )
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION E: Stationed Defenses */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-red-400 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Shield className="h-4 w-4 text-red-400" />
          <span>E. Konuşlu Gezegen Savunması</span>
        </td>
      </tr>

      {EMPIRE_DEFENSES.map((d) =>
        renderDataRow(
          d.name,
          (p) => p.units?.[d.typeId ?? 0] ?? 0,
          sumUnits(d.typeId ?? 0),
          "/defenses",
          true,
          true,
          d.id
        )
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION F: Researches (Account-Wide) */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-indigo-300 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Atom className="h-4 w-4 text-indigo-400" />
          <span>F. Bilimsel Araştırmalar (Hesap Geneli)</span>
        </td>
      </tr>

      {EMPIRE_RESEARCHES.map((r) => {
        const lvl = researches[r.typeId ?? 0] ?? 0;
        return (
          <tr
            key={r.id}
            className="hover:bg-zinc-900/60 border-b border-zinc-800/40 transition-colors"
          >
            <td className="sticky left-0 z-20 bg-[#0d1017] py-2.5 px-4 font-semibold text-zinc-300 border-r border-zinc-800 min-w-[220px]">
              <Link
                href="/research"
                className="hover:text-indigo-300 hover:underline transition-colors truncate"
              >
                {r.name}
              </Link>
            </td>

            {planets.map((p) => (
              <td
                key={p.id}
                className="py-2.5 px-3 text-center font-mono font-bold text-indigo-300 border-r border-zinc-800/60 min-w-[130px]"
              >
                {lvl}
              </td>
            ))}

            <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-200 bg-indigo-950/20 min-w-[130px]">
              Seviye {lvl}
            </td>
          </tr>
        );
      })}

      {/* ---------------------------------------------------- */}
      {/* SECTION G: Stationed Fleet */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Swords className="h-4 w-4 text-amber-400" />
          <span>G. Konuşlu Donanma Gemileri</span>
        </td>
      </tr>

      {EMPIRE_SHIPS.map((s) =>
        renderDataRow(
          s.name,
          (p) => p.units?.[s.typeId ?? 0] ?? 0,
          sumUnits(s.typeId ?? 0),
          "/shipyard",
          true,
          true,
          s.id
        )
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION H: Lifeform Buildings & Researches */}
      {/* ---------------------------------------------------- */}
      <tr className="bg-[#090d14] text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-zinc-800">
        <td
          colSpan={planets.length + 2}
          className="sticky left-0 py-2.5 px-4 flex items-center gap-2"
        >
          <Dna className="h-4 w-4 text-teal-400" />
          <span>H. Canlı Formu Binaları & Teknolojileri</span>
        </td>
      </tr>

      {EMPIRE_LIFEFORM_BUILDINGS.map((lf) =>
        renderDataRow(
          lf.name,
          () => 0,
          0,
          "/lifeforms",
          true,
          true,
          lf.id
        )
      )}

      {EMPIRE_LIFEFORM_TECHS.map((tech) =>
        renderDataRow(
          tech.name,
          () => 0,
          0,
          "/lifeforms/tech-tree",
          true,
          true,
          tech.id
        )
      )}
    </>
  );
}

