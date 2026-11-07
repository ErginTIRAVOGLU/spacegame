'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AllianceDataDto } from '@/lib/allianceCatalog';
import { AllianceOnboarding } from '@/components/alliance/AllianceOnboarding';
import { AllianceOverviewTab } from '@/components/alliance/AllianceOverviewTab';
import { AllianceClassesTab } from '@/components/alliance/AllianceClassesTab';
import { AllianceManagementTab } from '@/components/alliance/AllianceManagementTab';
import { AllianceCommunicationTab } from '@/components/alliance/AllianceCommunicationTab';
import { AllianceApplicationsTab } from '@/components/alliance/AllianceApplicationsTab';
import { API_BASE_URL, useGameStore } from '@/store/useGameStore';
import { Users, Shield, Mail, Award, UserCheck, Loader2 } from 'lucide-react';

export default function AlliancePage() {
  const storeUserId = useGameStore((s) => s.userId);
  const [alliance, setAlliance] = useState<AllianceDataDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'management' | 'communication' | 'applications'>('overview');

  const fetchAllianceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('ogame_user');
      const userId = storeUserId || (userStr ? JSON.parse(userStr).id : 'f374d6bd-49bd-4237-b9f6-5a5b9d7c09e7');

      const res = await fetch(`${API_BASE_URL}/api/alliances/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.inAlliance && data.alliance) {
          setAlliance(data.alliance);
        } else {
          setAlliance(null);
        }
      } else {
        setAlliance(null);
      }
    } catch {
      setAlliance(null);
    } finally {
      setIsLoading(false);
    }
  }, [storeUserId]);

  useEffect(() => {
    fetchAllianceData();
  }, [fetchAllianceData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm text-zinc-400 font-medium">İttifak verileri yükleniyor...</span>
      </div>
    );
  }

  // Not in alliance -> Onboarding Flow
  if (!alliance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AllianceOnboarding onAllianceCreatedOrJoined={fetchAllianceData} />
      </div>
    );
  }

  // In alliance -> Hub View
  const isManager = alliance.userRole >= 2;
  const pendingAppsCount = alliance.applications?.length ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Alliance Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-mono font-bold text-sm rounded">
            [{alliance.tag}]
          </span>
          <h1 className="text-xl font-bold text-zinc-100">
            {alliance.name}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Genel Bakış
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'classes'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            İttifak Sınıfları
          </button>

          <button
            onClick={() => setActiveTab('communication')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'communication'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            İletişim & Sirküler
          </button>

          {isManager && (
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'applications'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Başvurular
              {pendingAppsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                  {pendingAppsCount}
                </span>
              )}
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setActiveTab('management')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'management'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Yönetim
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'overview' && (
          <AllianceOverviewTab
            alliance={alliance}
            onMemberAction={async (memberUserId, action) => {
              if (action === 'kick') {
                if (confirm('Bu üyeyi ittifaktan ihraç etmek istediğinize emin misiniz?')) {
                  await fetch(`${API_BASE_URL}/api/alliances/${alliance.id}/members/${memberUserId}`, { method: 'DELETE' });
                  fetchAllianceData();
                }
              } else {
                alert('Üye rütbe yetkileri güncellendi.');
              }
            }}
          />
        )}

        {activeTab === 'classes' && (
          <AllianceClassesTab
            alliance={alliance}
            onClassChanged={(newClass) => {
              setAlliance((prev) => (prev ? { ...prev, allianceClass: newClass } : null));
            }}
          />
        )}

        {activeTab === 'communication' && (
          <AllianceCommunicationTab alliance={alliance} />
        )}

        {activeTab === 'applications' && isManager && (
          <AllianceApplicationsTab
            alliance={alliance}
            onApplicationHandled={fetchAllianceData}
          />
        )}

        {activeTab === 'management' && isManager && (
          <AllianceManagementTab
            alliance={alliance}
            onAllianceUpdated={fetchAllianceData}
            onAllianceDisbanded={() => {
              setAlliance(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

