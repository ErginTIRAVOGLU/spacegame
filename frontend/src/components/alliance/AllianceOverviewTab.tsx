'use client';

import React, { useState } from 'react';
import { AllianceDataDto, AllianceMemberDto } from '@/lib/allianceCatalog';
import { Users, Trophy, Calendar, Eye, ChevronDown, ChevronUp, UserX, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

interface AllianceOverviewTabProps {
  alliance: AllianceDataDto;
  onMemberAction?: (userId: string, action: 'kick' | 'promote') => void;
}

export function AllianceOverviewTab({ alliance, onMemberAction }: AllianceOverviewTabProps) {
  const [showInternal, setShowInternal] = useState(true);
  const [showExternal, setShowExternal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);

  const canManageMembers = alliance.userRole >= 2; // General or Founder

  const getClassBadge = (cls?: string) => {
    switch (cls) {
      case 'warrior':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 border border-rose-800 text-rose-300">⚔️ Savaşçı</span>;
      case 'trader':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">⚖️ Tüccar</span>;
      case 'researcher':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-800 text-cyan-300">🔭 Araştırmacı</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400">Sınıf Seçilmedi</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-900/50 to-blue-950/50 border border-cyan-700/50 flex items-center justify-center text-cyan-400 font-mono font-bold text-2xl shadow-inner">
              {alliance.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alliance.logoUrl} alt={alliance.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                `[${alliance.tag}]`
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 font-bold text-lg bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  [{alliance.tag}]
                </span>
                <h2 className="text-xl font-bold text-zinc-100">{alliance.name}</h2>
                {getClassBadge(alliance.allianceClass)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Kuruluş: {new Date(alliance.createdAt || Date.now()).toLocaleDateString('tr-TR')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  Üyeler: <strong className="text-zinc-200">{alliance.memberCount || alliance.members.length} / {alliance.maxMembers || 50}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Sıralama: <strong className="text-amber-400">#{alliance.rank || 1}</strong> ({(alliance.score || 0).toLocaleString()} Puan)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {alliance.homepageUrl && (
              <a
                href={alliance.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Web Sitesi
              </a>
            )}
            <button
              onClick={() => setShowExternalModal(true)}
              className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Harici Önizleme
            </button>
          </div>
        </div>
      </div>

      {/* Accordions: Internal & External Text */}
      <div className="space-y-4">
        {/* Özel Alan (Dahili Metin - Sadece Üyeler) */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowInternal(!showInternal)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-sm font-semibold text-zinc-200">
                Özel Alan (Dahili İttifak Metni - Sadece Üyeler Görür)
              </span>
            </div>
            {showInternal ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          {showInternal && (
            <div className="p-5 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 whitespace-pre-wrap">
              {alliance.internalText || 'İttifak içi henüz özel bir duyuru bulunmuyor.'}
            </div>
          )}
        </div>

        {/* Harici Alan (Dış Görünüm) */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowExternal(!showExternal)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-sm font-semibold text-zinc-200">
                Harici Alan (Tüm Evrene Açık Genel Tanıtım)
              </span>
            </div>
            {showExternal ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          {showExternal && (
            <div className="p-5 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 whitespace-pre-wrap">
              {alliance.externalText || 'İttifak için harici bir tanıtım metni girilmemiş.'}
            </div>
          )}
        </div>
      </div>

      {/* Member List Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            İttifak Üye Listesi ({alliance.members.length})
          </h3>
          <span className="text-xs text-zinc-500">
            Aktiflik ve Görev Dağılımı
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">İsim</th>
                <th className="py-3 px-4">Rütbe</th>
                <th className="py-3 px-4">Puan / Sıra</th>
                <th className="py-3 px-4">Ana Koordinat</th>
                <th className="py-3 px-4">Giriş / Durum</th>
                <th className="py-3 px-4 text-right">Fonksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
              {alliance.members.map((member: AllianceMemberDto) => (
                <tr key={member.userId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-zinc-100 flex items-center gap-2">
                    <span
                      title={member.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        member.isOnline
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'bg-zinc-600'
                      }`}
                    />
                    {member.userName || (member as any).username || 'Komutan'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      {member.roleName}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-zinc-200 font-semibold">
                      {(member.score ?? (member as any).totalPoints ?? 0).toLocaleString()}
                    </span>
                    <span className="text-zinc-500 ml-1.5">(#{member.rank || 1})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    [{member.mainCoordinates || (member as any).coords || '1:142:4'}]
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    {member.isOnline ? (
                      <span className="text-emerald-400 font-semibold">Şimdi Aktif</span>
                    ) : (
                      member.lastLogin || 'Bilinmiyor'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canManageMembers && member.role < alliance.userRole ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onMemberAction?.(member.userId, 'promote')}
                          title="Rütbe Yükselt / Yetki Ver"
                          className="p-1 hover:bg-zinc-800 rounded text-cyan-400 hover:text-cyan-300"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onMemberAction?.(member.userId, 'kick')}
                          title="İttifaktan Çıkar"
                          className="p-1 hover:bg-rose-950/50 rounded text-rose-400 hover:text-rose-300"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Modal Preview */}
      {showExternalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                Harici İttifak Sayfası Önizleme
              </h4>
              <button
                onClick={() => setShowExternalModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  [{alliance.tag}]
                </span>
                <span className="font-bold text-zinc-100">{alliance.name}</span>
              </div>
              <p className="text-xs text-zinc-400">Üye Sayısı: {alliance.memberCount || alliance.members.length} / Puan: {(alliance.score || 0).toLocaleString()}</p>
              <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {alliance.externalText || 'Tanıtım metni bulunmuyor.'}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowExternalModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

