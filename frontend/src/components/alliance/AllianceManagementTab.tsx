'use client';

import React, { useState } from 'react';
import { AllianceDataDto, PERMISSION_LIST } from '@/lib/allianceCatalog';
import { API_BASE_URL } from '@/store/useGameStore';
import { Shield, Settings, Trash2, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AllianceManagementTabProps {
  alliance: AllianceDataDto;
  onAllianceUpdated: () => void;
  onAllianceDisbanded: () => void;
}

export function AllianceManagementTab({
  alliance,
  onAllianceUpdated,
  onAllianceDisbanded
}: AllianceManagementTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'texts' | 'general' | 'danger'>('matrix');

  // Permission Matrix mock states (Member vs General vs Founder)
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({
    disband: false,
    kick: true,
    applications: true,
    member_list: true,
    edit_roles: false,
    change_class: true,
    circular_mail: true,
    manage_text: true,
    manage_diplomacy: false,
    view_applications: true
  });

  // Texts
  const [internalText, setInternalText] = useState(alliance.internalText || '');
  const [externalText, setExternalText] = useState(alliance.externalText || '');
  const [applicationText, setApplicationText] = useState(alliance.applicationText || '');

  // General Settings
  const [allianceName, setAllianceName] = useState(alliance.name);
  const [allianceTag, setAllianceTag] = useState(alliance.tag);
  const [logoUrl, setLogoUrl] = useState(alliance.logoUrl || '');
  const [homepageUrl, setHomepageUrl] = useState(alliance.homepageUrl || '');
  const [isOpenForApplications, setIsOpenForApplications] = useState(alliance.isOpenForApplications);

  // Status & Danger
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [disbandConfirmText, setDisbandConfirmText] = useState('');
  const [isDisbanding, setIsDisbanding] = useState(false);

  const isFounder = alliance.userRole === 3;

  const togglePermission = (key: string) => {
    setRolePermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const insertBBCode = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    before: string,
    after: string
  ) => {
    setter((prev) => `${prev}${before}örnek metin${after}`);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/alliances/${alliance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: allianceName.trim(),
          tag: allianceTag.trim().toUpperCase(),
          logoUrl: logoUrl.trim() || null,
          homepageUrl: homepageUrl.trim() || null,
          isOpenForApplications,
          internalText,
          externalText,
          applicationText
        })
      });

      if (res.ok) {
        setSaveSuccess('İttifak ayarları ve yetki matrisi başarıyla güncellendi.');
        onAllianceUpdated();
      } else {
        const err = await res.json();
        setSaveError(err.message || 'Güncelleme sırasında hata oluştu.');
      }
    } catch {
      setSaveError('Bağlantı hatası.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisband = async () => {
    if (disbandConfirmText !== alliance.tag) return;

    setIsDisbanding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alliances/${alliance.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Clear local storage tag
        const userStr = localStorage.getItem('ogame_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          delete u.allianceTag;
          localStorage.setItem('ogame_user', JSON.stringify(u));
        }
        onAllianceDisbanded();
      } else {
        const err = await res.json();
        setSaveError(err.message || 'İttifak dağıtılamadı.');
      }
    } catch {
      setSaveError('Bağlantı hatası.');
    } finally {
      setIsDisbanding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-lg transition-all ${
            activeSubTab === 'matrix'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-x border-zinc-700 border-t-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Yetki Matrisi (Haklar)
        </button>
        <button
          onClick={() => setActiveSubTab('texts')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-lg transition-all ${
            activeSubTab === 'texts'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-x border-zinc-700 border-t-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          Metinler ve Duyurular
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-lg transition-all ${
            activeSubTab === 'general'
              ? 'bg-zinc-800 text-cyan-400 border-t-2 border-x border-zinc-700 border-t-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Settings className="w-4 h-4" />
          Genel Ayarlar
        </button>
        {isFounder && (
          <button
            onClick={() => setActiveSubTab('danger')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-lg transition-all ${
              activeSubTab === 'danger'
                ? 'bg-rose-950/40 text-rose-400 border-t-2 border-x border-rose-900 border-t-rose-500'
                : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/40'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Tehlikeli Bölge
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Permission Matrix SubTab */}
      {activeSubTab === 'matrix' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-5">
          <div>
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Rütbe Yetki Matrisi (General / İkinci Komutan)
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              İttifak içi General ve yardımcı yöneticilerin yapmaya yetkili olduğu işlemleri aşağıdan detaylıca yapılandırabilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {PERMISSION_LIST.map((perm) => (
              <label
                key={perm.key}
                className="flex items-start gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={rolePermissions[perm.key] || false}
                  onChange={() => togglePermission(perm.key)}
                  className="mt-0.5 rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-zinc-950"
                />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    {perm.label}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {perm.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Yetkileri Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Texts SubTab */}
      {activeSubTab === 'texts' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-6">
          {/* Internal Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Dahili Metin (Sadece İttifak Üyelerine Özel)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => insertBBCode(setInternalText, '[b]', '[/b]')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertBBCode(setInternalText, '[i]', '[/i]')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs italic rounded"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertBBCode(setInternalText, '[color=#06b6d4]', '[/color]')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs rounded"
                >
                  Renk
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={internalText}
              onChange={(e) => setInternalText(e.target.value)}
              placeholder="İttifak içi strateji, discord bağlantısı veya filo koordinasyonu notları..."
              className="w-full p-3 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* External Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Harici Metin (Tüm Evrene Açık Tanıtım Sayfası)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => insertBBCode(setExternalText, '[b]', '[/b]')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertBBCode(setExternalText, '[i]', '[/i]')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs italic rounded"
                >
                  I
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={externalText}
              onChange={(e) => setExternalText(e.target.value)}
              placeholder="İttifak vizyonu, kabul şartları ve diplomasi kuralları..."
              className="w-full p-3 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Application Template */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
              Başvuru Şablonu Metni (Adayların Karşılaşacağı Rehber Metin)
            </label>
            <textarea
              rows={3}
              value={applicationText}
              onChange={(e) => setApplicationText(e.target.value)}
              placeholder="Örn: Başvururken günlük online saatinizi ve filo durumunuzu belirtiniz."
              className="w-full p-3 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Metinleri Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* 3. General Settings SubTab */}
      {activeSubTab === 'general' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-md space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              İttifak Adı
            </label>
            <input
              type="text"
              value={allianceName}
              onChange={(e) => setAllianceName(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              İttifak TAG Kısaltması
            </label>
            <input
              type="text"
              value={allianceTag}
              onChange={(e) => setAllianceTag(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              İttifak Logo URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              İttifak Web Sitesi / Discord URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOpenForApplications}
                onChange={(e) => setIsOpenForApplications(e.target.checked)}
                className="rounded border-zinc-700 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-xs font-semibold text-zinc-200">
                Aday başvurularına açık olsun (Kapatılırsa yeni oyuncular başvuramaz)
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Danger Zone SubTab */}
      {activeSubTab === 'danger' && isFounder && (
        <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold text-base">Bu İttifakı Dağıt (Kalıcı İşlem)</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
            İttifakı dağıttığınızda tüm üyelerin ittifak bağları koparılır, ittifak istatistikleri ve kasası silinir.
            Bu işlem <strong>geri alınamaz</strong>.
          </p>

          <button
            onClick={() => setShowDisbandModal(true)}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-rose-950/50"
          >
            İttifakı Dağıt
          </button>
        </div>
      )}

      {/* Disband Modal */}
      {showDisbandModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-rose-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-base text-zinc-100">İttifakı Dağıtma Onayı</h4>
            </div>
            <p className="text-xs text-zinc-300">
              İttifakı kalıcı olarak silmek istediğinizi teyit etmek için lütfen kutucuğa ittifakınızın TAG kısaltmasını (<strong>{alliance.tag}</strong>) yazın:
            </p>

            <input
              type="text"
              placeholder={alliance.tag}
              value={disbandConfirmText}
              onChange={(e) => setDisbandConfirmText(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-100 uppercase font-mono tracking-widest text-center"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setShowDisbandModal(false);
                  setDisbandConfirmText('');
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
              >
                Vazgeç
              </button>
              <button
                disabled={disbandConfirmText !== alliance.tag || isDisbanding}
                onClick={handleDisband}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs disabled:opacity-40"
              >
                {isDisbanding ? 'Dağıtılıyor...' : 'Evet, İttifakı Kapat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

