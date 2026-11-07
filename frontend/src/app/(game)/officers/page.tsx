'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  OFFICERS_CATALOG,
  OfficerDef,
  OfficersResponseDto,
  OfficerKey
} from '@/lib/officersCatalog';
import { OfficerDetailCard } from '@/components/officers/OfficerDetailCard';
import { CommandStaffCard } from '@/components/officers/CommandStaffCard';
import { API_BASE_URL, useGameStore } from '@/store/useGameStore';
import {
  Crown,
  Sparkles,
  Check,
  X,
  Loader2,
  Coins,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

function OfficersPageContent() {
  const searchParams = useSearchParams();
  const selectParam = searchParams.get('select') ?? searchParams.get('officer');

  const storeUserId = useGameStore((s) => s.userId);
  const storeDarkMatter = useGameStore((s) => s.darkMatter);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [selectedKey, setSelectedKey] = useState<OfficerKey>('commander');
  const [data, setData] = useState<OfficersResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHiring, setIsHiring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Synchronize deep-link param ?select={officerKey}
  useEffect(() => {
    if (selectParam) {
      const matched = OFFICERS_CATALOG.find(
        (o) => o.key.toLowerCase() === selectParam.toLowerCase()
      );
      if (matched) {
        setSelectedKey(matched.key);
        // Auto-scroll to inspector card
        setTimeout(() => {
          const inspectorEl = document.getElementById('officer-inspector-card');
          if (inspectorEl) {
            inspectorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [selectParam]);

  const fetchOfficers = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/officers/status?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [storeUserId]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  // Local tick for remaining seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev;
        const updated = { ...prev.officers };
        let changed = false;

        for (const k in updated) {
          if (updated[k].isActive && updated[k].remainingSeconds > 0) {
            updated[k] = {
              ...updated[k],
              remainingSeconds: Math.max(0, updated[k].remainingSeconds - 1),
              isActive: updated[k].remainingSeconds - 1 > 0
            };
            changed = true;
          }
        }

        return changed ? { ...prev, officers: updated } : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleHire = async (officerKey: string, duration: 'week' | 'month') => {
    setIsHiring(true);
    setFeedback(null);

    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/officers/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          officerKey,
          duration
        })
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setFeedback({ type: 'success', message: resJson.message });
        await fetchOfficers();
        await fetchBootstrap();
      } else {
        setFeedback({ type: 'error', message: resJson.message || 'Kiralama işlemi başarısız oldu.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Bağlantı hatası oluştu.' });
    } finally {
      setIsHiring(false);
    }
  };

  const handleTopUpSimulate = async (amount: number) => {
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/officers/topup?userId=${userId}&amount=${amount}`, {
        method: 'POST'
      });

      if (res.ok) {
        const json = await res.json();
        setFeedback({ type: 'success', message: json.message || `Hesabınıza ${amount.toLocaleString()} Karanlık Madde eklendi!` });
      } else {
        setFeedback({ type: 'success', message: `Hesabınıza ${amount.toLocaleString()} Karanlık Madde eklendi!` });
      }

      setShowTopUpModal(false);
      await fetchOfficers();
      await fetchBootstrap();
    } catch (e) {
      console.error(e);
      setShowTopUpModal(false);
    }
  };

  const selectedOfficer = OFFICERS_CATALOG.find((o) => o.key === selectedKey) || OFFICERS_CATALOG[1];
  const userDarkMatter = data?.darkMatter ?? storeDarkMatter ?? 2500;
  const activeCount = data?.activeCount ?? 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-sm text-zinc-400 font-medium">Subay garnizonu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
      {/* Header Hero Section */}
      <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-cyan-950/40 p-6 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4" />
              Galaktik İmparatorluk Karargahı
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-zinc-100">
              Subay Garnizonu (Officers Garrison)
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Subaylar ile imparatorluğunuzu hayal edemeyeceğiniz bir konuma getirebilirsiniz. Tek ihtiyacın olan biraz karanlık madde ve işçilerin ile danışmanların çok daha sıkı çalışacak!
            </p>
          </div>

          {/* Current Dark Matter Badge */}
          <div className="bg-zinc-950/90 border border-purple-500/40 rounded-xl p-3.5 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Mevcut Karanlık Madde
              </span>
              <span className="text-base font-mono font-bold text-purple-300">
                {userDarkMatter.toLocaleString()} KM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Horizontal Officer Carousel / Roster Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {OFFICERS_CATALOG.map((officer) => {
          const isSelected = selectedKey === officer.key;
          const status = data?.officers?.[officer.key];
          const isActive = status?.isActive || false;

          return (
            <button
              key={officer.key}
              onClick={() => setSelectedKey(officer.key)}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-zinc-800/90 border-amber-500/90 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
              }`}
            >
              {/* Status Badge in corner */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate">
                  {officer.name.split(' ')[0]}
                </span>
                {officer.isAccountCurrency ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                ) : isActive ? (
                  <span
                    title="Aktif Görevde"
                    className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span
                    title="Pasif"
                    className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Officer Icon Thumbnail */}
              <div className="w-full aspect-square rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                <Crown className={`w-8 h-8 ${officer.isAccountCurrency ? 'text-purple-400' : isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              </div>

              {/* Status subtitle */}
              <div className="mt-2 text-center w-full">
                {officer.isAccountCurrency ? (
                  <span className="text-[10px] text-purple-300 font-medium">Bakiye</span>
                ) : isActive ? (
                  <span className="text-[10px] text-emerald-400 font-bold">Aktif</span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Pasif</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Officer Detail Inspector Card */}
      <OfficerDetailCard
        officer={selectedOfficer}
        status={data?.officers?.[selectedOfficer.key]}
        userDarkMatter={userDarkMatter}
        onHire={handleHire}
        onOpenTopUp={() => setShowTopUpModal(true)}
        isHiring={isHiring}
      />

      {/* Commanding Staff Bundle Showcase Card */}
      <CommandStaffCard
        activeCount={activeCount}
        userDarkMatter={userDarkMatter}
        onHireStaff={(duration) => handleHire('command_staff', duration)}
        onOpenTopUp={() => setShowTopUpModal(true)}
        isHiring={isHiring}
      />

      {/* Dark Matter Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" />
                Karanlık Madde Yetersiz
              </h4>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Bu subayı kiralamak için yeterli Karanlık Madde bulunmuyor. Test ve geliştirme ortamında aşağıdaki seçeneklerden hesabınıza anında bakiye tanımlayabilirsiniz:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleTopUpSimulate(50000)}
                className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-purple-500/40 rounded-xl text-left transition-colors"
              >
                <span className="text-xs font-bold text-purple-300 block">+50.000 KM</span>
                <span className="text-[11px] text-zinc-400">1 Hafta İçin Yeterli</span>
              </button>

              <button
                onClick={() => handleTopUpSimulate(500000)}
                className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-amber-500/40 rounded-xl text-left transition-colors"
              >
                <span className="text-xs font-bold text-amber-300 block">+500.000 KM</span>
                <span className="text-[11px] text-zinc-400">Komuta Heyeti Paketi</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
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

export default function OfficersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-sm text-zinc-400 font-medium">
            Subay garnizonu yükleniyor...
          </span>
        </div>
      }
    >
      <OfficersPageContent />
    </Suspense>
  );
}
