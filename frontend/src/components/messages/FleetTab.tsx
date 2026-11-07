'use client';

import React, { useState } from 'react';
import {
  FleetSubTab,
  EspionageReportItem,
  CombatReportItem,
  ExpeditionReportItem
} from '@/lib/messagesCatalog';
import Link from 'next/link';
import {
  Radar,
  Swords,
  Compass,
  Truck,
  FileText,
  Star,
  Trash2,
  Share2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';

interface FleetTabProps {
  subTab: FleetSubTab;
  onSubTabChange: (tab: FleetSubTab) => void;
  espionageReports: EspionageReportItem[];
  combatReports: CombatReportItem[];
  expeditionReports: ExpeditionReportItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onShareReport: (id: string, type: string) => void;
}

export function FleetTab({
  subTab,
  onSubTabChange,
  espionageReports,
  combatReports,
  expeditionReports,
  selectedIds,
  onToggleSelect,
  onToggleFavorite,
  onShareReport
}: FleetTabProps) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  const formatAge = (mins: number) => {
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex border-b border-zinc-800 gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onSubTabChange('espionage')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'espionage'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Radar className="w-3.5 h-3.5" />
          Casusluk ({espionageReports.length})
        </button>

        <button
          onClick={() => onSubTabChange('combat')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'combat'
              ? 'bg-zinc-800 text-rose-400 border-t-2 border-rose-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          Savaş Raporları ({combatReports.length})
        </button>

        <button
          onClick={() => onSubTabChange('expeditions')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'expeditions'
              ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Keşifler ({expeditionReports.length})
        </button>

        <button
          onClick={() => onSubTabChange('transport')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'transport'
              ? 'bg-zinc-800 text-emerald-400 border-t-2 border-emerald-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Birlikler / Nakliyat
        </button>

        <button
          onClick={() => onSubTabChange('other')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition-all ${
            subTab === 'other'
              ? 'bg-zinc-800 text-zinc-200 border-t-2 border-zinc-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Diğer
        </button>
      </div>

      {/* 1. Casusluk Raporları Tablosu */}
      {subTab === 'espionage' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-md">
          {espionageReports.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Henüz gelen bir casusluk raporu bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Gezegen / Oyuncu</th>
                    <th className="p-3">Koordinat</th>
                    <th className="p-3">Kaynak Durumu</th>
                    <th className="p-3">Seviye</th>
                    <th className="p-3">Zaman</th>
                    <th className="p-3 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {espionageReports.map((report) => {
                    const isExpanded = expandedReportId === report.id;
                    const isSelected = selectedIds.includes(report.id);

                    // Parse json data safely
                    let resData = { metal: 12500, crystal: 8400, deuterium: 3100 };
                    try {
                      if (report.dataJson) resData = { ...resData, ...JSON.parse(report.dataJson) };
                    } catch {}

                    return (
                      <React.Fragment key={report.id}>
                        <tr className={`hover:bg-zinc-800/30 transition-colors ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleSelect(report.id)}
                              className="rounded border-zinc-700 text-cyan-600 focus:ring-0"
                            />
                          </td>
                          <td className="p-3 font-semibold text-zinc-200">
                            <div>{report.planetName}</div>
                            <span className="text-[11px] font-normal text-zinc-400">
                              Oyuncu: <strong className="text-zinc-300">{report.playerName}</strong>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-cyan-400">
                            <Link href="/galaxy" className="hover:underline flex items-center gap-1">
                              {report.coordinates}
                              <ExternalLink className="w-3 h-3 text-zinc-500" />
                            </Link>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-[11px] font-mono">
                              <span className="text-slate-300">M: {resData.metal.toLocaleString()}</span>
                              <span className="text-cyan-300">K: {resData.crystal.toLocaleString()}</span>
                              <span className="text-emerald-300">D: {resData.deuterium.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
                              Kademe {report.tierLevel || 1}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 text-[11px]">
                            {formatAge(report.ageMinutes)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onToggleFavorite(report.id, !report.isFavorite)}
                                title={report.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                                className={`p-1 rounded hover:bg-zinc-800 ${
                                  report.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                                }`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                              <Link
                                href={`/fleet?target=${encodeURIComponent(report.coordinates)}&mission=Attack`}
                                title="Hızlı Saldırı Düzenle"
                                className="p-1 rounded hover:bg-zinc-800 text-rose-400 hover:text-rose-300"
                              >
                                <Crosshair className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => toggleExpand(report.id)}
                                title="Raporu Genişlet"
                                className="p-1 rounded hover:bg-zinc-800 text-cyan-400"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Detail Expander */}
                        {isExpanded && (
                          <tr className="bg-zinc-950/70 border-b border-zinc-800">
                            <td colSpan={7} className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                                  <span className="font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                    1. Kademe: Hammaddeler
                                  </span>
                                  <div className="space-y-0.5 text-zinc-400 text-[11px]">
                                    <div>Metal: <strong className="text-zinc-200">{resData.metal.toLocaleString()}</strong></div>
                                    <div>Kristal: <strong className="text-zinc-200">{resData.crystal.toLocaleString()}</strong></div>
                                    <div>Deuterium: <strong className="text-zinc-200">{resData.deuterium.toLocaleString()}</strong></div>
                                  </div>
                                </div>

                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                                  <span className="font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                                    2. Kademe: Filolar
                                  </span>
                                  <p className="text-[11px] text-zinc-400">
                                    {report.tierLevel >= 2 ? 'Küçük Nakliye (12), Hafif Avcı (45)' : 'İstihbarat yetersiz (Casusluk Seviyesi +2 gereklidir)'}
                                  </p>
                                </div>

                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                                  <span className="font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                                    3. Kademe: Savunma
                                  </span>
                                  <p className="text-[11px] text-zinc-400">
                                    {report.tierLevel >= 3 ? 'Roketatar (25), Hafif Lazer (10)' : 'İstihbarat yetersiz (Casusluk Seviyesi +3 gereklidir)'}
                                  </p>
                                </div>

                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                                  <span className="font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                                    <Radar className="w-3.5 h-3.5 text-purple-400" />
                                    4. Kademe: Teknolojiler
                                  </span>
                                  <p className="text-[11px] text-zinc-400">
                                    {report.tierLevel >= 4 ? 'Silah Tek. (Lv 8), Kalkan Tek. (Lv 7)' : 'İstihbarat yetersiz'}
                                  </p>
                                </div>
                              </div>

                              {/* Simülatöre Aktar Aksiyon Barı */}
                              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-zinc-500">
                                  Hedef: {report.coordinates}
                                </span>
                                <Link
                                  href={`/simulator?target=${encodeURIComponent(report.coordinates)}&metal=${resData.metal}&crystal=${resData.crystal}&deut=${resData.deuterium}&tier=${report.tierLevel}`}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                                >
                                  <Swords className="w-3.5 h-3.5" />
                                  <span>Simülatöre Aktar</span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Savaş Raporları */}
      {subTab === 'combat' && (
        <div className="space-y-3">
          {combatReports.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Kayıtlı savaş raporu bulunmuyor.
            </div>
          ) : (
            combatReports.map((report) => {
              const isSelected = selectedIds.includes(report.id);
              return (
                <div
                  key={report.id}
                  className={`p-4 bg-zinc-900/60 border rounded-xl shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isSelected ? 'border-rose-500/80 bg-rose-950/10' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(report.id)}
                      className="mt-1 rounded border-zinc-700 text-rose-600 focus:ring-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm">
                          {report.attackerName} vs {report.defenderName}
                        </span>
                        <span className="font-mono text-cyan-400 text-xs">
                          {report.coordinates}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-800 text-rose-300">
                          {report.winner} Zaferi
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        6 rauntluk şiddetli çarpışma sonrası harabe alanı oluşturuldu. Yaş: {formatAge(report.ageMinutes)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onToggleFavorite(report.id, !report.isFavorite)}
                      title={report.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      className={`p-1.5 rounded hover:bg-zinc-800 ${
                        report.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => onShareReport(report.id, 'combat')}
                      title="İttifakla Paylaş"
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Paylaş
                    </button>
                    <Link
                      href={`/reports/combat/${report.id}`}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1"
                    >
                      Detaylı Rapor
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. Keşif Raporları */}
      {subTab === 'expeditions' && (
        <div className="space-y-3">
          {expeditionReports.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Kayıtlı keşif sonucu bulunmuyor.
            </div>
          ) : (
            expeditionReports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-zinc-200 text-xs">
                      16. Sektör Keşif Seferi ({report.coordinates})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 border border-amber-800 text-amber-300">
                      {report.outcome}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">{formatAge(report.ageMinutes)}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                  &quot;{report.narrativeText || 'Filomuz bilinmeyen bir sektörde keşif uçuşu gerçekleştirdi ve üsse döndü.'}&quot;
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Birlikler & Diğer */}
      {(subTab === 'transport' || subTab === 'other') && (
        <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs space-y-1">
          <p className="text-zinc-400 font-semibold">Bu kategoride yeni bildirim yok.</p>
          <p className="text-zinc-500 text-[11px]">Gelen kargo teslimatları ve istasyon bildirimleri burada toplanacaktır.</p>
        </div>
      )}
    </div>
  );
}

