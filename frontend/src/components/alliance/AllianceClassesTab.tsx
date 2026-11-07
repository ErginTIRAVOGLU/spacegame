'use client';

import React, { useState } from 'react';
import { AllianceDataDto, ALLIANCE_CLASSES } from '@/lib/allianceCatalog';
import { useGameStore, API_BASE_URL } from '@/store/useGameStore';
import { Swords, Coins, Atom, Check, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface AllianceClassesTabProps {
  alliance: AllianceDataDto;
  onClassChanged: (newClass: 'warrior' | 'trader' | 'researcher') => void;
}

export function AllianceClassesTab({ alliance, onClassChanged }: AllianceClassesTabProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const darkMatter = useGameStore((s) => s.darkMatter);
  const userId = useGameStore((s) => s.userId);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const REQUIRED_KM = 500_000;
  const hasEnoughKm = darkMatter >= REQUIRED_KM;
  const canChangeClass = alliance.userRole >= 2; // General or Founder

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword':
        return <Swords className="w-8 h-8 text-rose-400" />;
      case 'Coins':
        return <Coins className="w-8 h-8 text-amber-400" />;
      case 'Atom':
        return <Atom className="w-8 h-8 text-cyan-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-zinc-400" />;
    }
  };

  const handleSelectClass = async (classId: 'warrior' | 'trader' | 'researcher') => {
    if (!canChangeClass) {
      setErrorMsg('İttifak sınıfını değiştirmek için lider veya general yetkisine sahip olmalısınız.');
      return;
    }

    if (!hasEnoughKm) {
      setErrorMsg(`Yetersiz Karanlık Madde! İttifak sınıfını değiştirmek için 500.000 KM gereklidir. Mevcut: ${darkMatter.toLocaleString('tr-TR')} KM`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/alliances/${alliance.id}/class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allianceClass: classId,
          userId: userId || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `İttifak sınıfı başarıyla güncellendi!`);
        onClassChanged(classId);
        setSelectedClass(null);
        await fetchBootstrap();
      } else {
        setErrorMsg(data.message || 'Sınıf seçimi başarısız oldu.');
      }
    } catch {
      setErrorMsg('Bağlantı hatası.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          İttifak Sınıfı Seçimi
        </h2>
        <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
          Bir ittifak sınıfı belirleyerek tüm ittifak üyelerine kalıcı askeri, ekonomik veya bilimsel üstünlükler kazandırabilirsiniz.
          Sınıf seçimi veya değişimi <strong>500.000 Karanlık Madde</strong> gerektirir ve yalnızca ittifak yöneticileri tarafından yapılabilir.
        </p>

        {alliance.allianceClass && alliance.allianceClass !== 'none' && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg inline-flex items-center gap-3">
              <span className="text-xs text-zinc-400">Şu Anki İttifak Sınıfı:</span>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {ALLIANCE_CLASSES.find((c) => c.id === alliance.allianceClass)?.name || alliance.allianceClass}
              </span>
            </div>
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg inline-flex items-center gap-2">
              <span className="text-xs text-zinc-400">Mevcut Karanlık Maddeniz:</span>
              <span className={`text-xs font-bold ${hasEnoughKm ? 'text-amber-400' : 'text-rose-400'}`}>
                {darkMatter.toLocaleString('tr-TR')} KM
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ALLIANCE_CLASSES.map((cls) => {
          const isCurrent = alliance.allianceClass === cls.id;
          return (
            <div
              key={cls.id}
              className={`flex flex-col justify-between rounded-xl border p-6 transition-all relative overflow-hidden ${
                isCurrent
                  ? 'bg-zinc-900 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  AKTİF SINIF
                </div>
              )}

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    {getIcon(cls.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base">{cls.name}</h3>
                    <span className="text-xs text-amber-400 font-medium">
                      Maliyet: {cls.costDarkMatter.toLocaleString()} KM
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  {cls.description}
                </p>

                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Tüm Üyelere Sağlanan Bonuslar:
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {cls.bonuses.map((bonus, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-zinc-800 text-zinc-500 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-not-allowed"
                  >
                    Aktif Olarak Kullanılıyor
                  </button>
                ) : (
                  <button
                    disabled={!canChangeClass || isSubmitting}
                    onClick={() => setSelectedClass(cls.id)}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
                  >
                    {canChangeClass ? 'Bu Sınıfı Seç' : 'Yönetici Yetkisi Gerekir'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-zinc-100 text-base">
              İttifak Sınıfı Onayı
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>{ALLIANCE_CLASSES.find((c) => c.id === selectedClass)?.name}</strong> sınıfını seçmek üzeresiniz.
              Bu işlem hesabınızdan <strong>500.000 Karanlık Madde</strong> tahsil edecektir.
            </p>

            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs space-y-2">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Mevcut Karanlık Madde:</span>
                <span className={`font-semibold ${hasEnoughKm ? 'text-amber-400' : 'text-rose-400'}`}>
                  {darkMatter.toLocaleString('tr-TR')} KM
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Gereken Karanlık Madde:</span>
                <span className="text-zinc-200 font-semibold">{REQUIRED_KM.toLocaleString('tr-TR')} KM</span>
              </div>
            </div>

            {!hasEnoughKm && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>Yetersiz Karanlık Madde! Sınıf değiştirebilmek için en az 500.000 KM gereklidir.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
              >
                Vazgeç
              </button>
              <button
                disabled={isSubmitting || !hasEnoughKm}
                onClick={() => handleSelectClass(selectedClass as any)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'İşleniyor...' : !hasEnoughKm ? 'Yetersiz Karanlık Madde' : 'Evet, Sınıfı Değiştir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

