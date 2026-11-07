"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SHOP_CLASSES_CATALOG,
  ShopClassItem,
  PlayerClassKey,
} from "@/lib/shopCatalog";
import { ClassActivationModal } from "@/components/shop/ClassActivationModal";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  Sparkles,
  Coins,
  Pickaxe,
  Swords,
  Compass,
  Check,
  ShieldCheck,
  AlertCircle,
  Hammer,
  ShoppingBag,
  ExternalLink,
  Tag,
  Clock,
  CalendarDays,
  User,
  Flame,
} from "lucide-react";

export default function ShopClassesPage() {
  const userId = useGameStore((s) => s.userId);
  const darkMatter = useGameStore((s) => s.darkMatter);
  const storePlayerClass = useGameStore((s) => s.playerClass);
  const setPlayerClass = useGameStore((s) => s.setPlayerClass);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);

  const [selectedItemForModal, setSelectedItemForModal] =
    useState<ShopClassItem | null>(null);
  const [activeClassKey, setActiveClassKey] =
    useState<PlayerClassKey>(storePlayerClass);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClassStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = userId
        ? `${API_BASE_URL}/api/shop/classes?userId=${userId}`
        : `${API_BASE_URL}/api/shop/classes`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.user?.playerClass) {
          setActiveClassKey(data.user.playerClass);
          setPlayerClass(data.user.playerClass);
        }
      }
    } catch {
      // Fallback to store
      setActiveClassKey(storePlayerClass);
    } finally {
      setIsLoading(false);
    }
  }, [userId, storePlayerClass, setPlayerClass]);

  useEffect(() => {
    fetchClassStatus();
  }, [fetchClassStatus]);

  useEffect(() => {
    if (storePlayerClass && storePlayerClass !== activeClassKey) {
      setActiveClassKey(storePlayerClass);
    }
  }, [storePlayerClass]);

  const activeClassItem = SHOP_CLASSES_CATALOG.find(
    (c) => c.key === activeClassKey
  );

  const getIcon = (iconName: string, className: string = "w-6 h-6") => {
    switch (iconName) {
      case "Pickaxe":
        return <Pickaxe className={className} />;
      case "Swords":
        return <Swords className={className} />;
      case "Compass":
        return <Compass className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Shop Main Header & Sub-Category Navigation */}
      <div
        className="relative rounded-xl border border-cyan-500/25 bg-[#080d16] p-6 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Galaktik Dükkan • Özel Öğeler & Sınıflar
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
            Dükkan - <span className="text-cyan-300">Sınıf Değişimi</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            OGame evreninin 3 kanonik oyuncu sınıfından (Kolektör, General,
            Kaşif) birini seçerek imparatorluğunuza kalıcı üretim, savaş veya
            keşif üstünlükleri kazandırın.
          </p>

          {/* Sub-Category Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Link
              href="/shop/classes"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sınıf Değişimi</span>
            </Link>
            <Link
              href="/shop/construction"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Hammer className="w-3.5 h-3.5 text-zinc-400" />
              <span>İnşa Ürünleri</span>
            </Link>
            <Link
              href="/shop/items"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tüm Eşyalar (71+)</span>
            </Link>
            <Link
              href="/shop/boosters-30d"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>30 Günlük Paketler</span>
            </Link>
            <Link
              href="/shop/boosters-90d"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
              <span>90 Günlük Paketler</span>
            </Link>
            <Link
              href="/shop/profile"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Profil & Özelleştirme</span>
            </Link>
            <Link
              href="/shop/special-offers"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900/60 border border-zinc-800 text-rose-300 hover:text-rose-200 hover:bg-zinc-800/60 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Özel İndirimler</span>
            </Link>
          </div>
        </div>

        {/* Currency Indicator: Dark Matter */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0e1420] border border-zinc-800 text-right shadow-md">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Karanlık Madde Bakiyesi
            </div>
            <div className="text-base font-mono font-bold text-purple-300 flex items-center justify-end gap-1.5 mt-0.5">
              <Coins className="h-4 w-4 text-purple-400" />
              <span>{darkMatter.toLocaleString("tr-TR")} KM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Class Status Card */}
      <div
        className={`rounded-xl border p-5 transition-all relative overflow-hidden ${
          activeClassItem
            ? `${activeClassItem.borderClass} ${activeClassItem.glowClass} bg-gradient-to-r ${activeClassItem.gradient}`
            : "border-zinc-800 bg-[#0d1017]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl border border-zinc-700/80 bg-zinc-950/80 shadow-inner ${
                activeClassItem ? activeClassItem.accentColor : "text-zinc-500"
              }`}
            >
              {activeClassItem
                ? getIcon(activeClassItem.iconName, "w-8 h-8")
                : <ShieldCheck className="w-8 h-8" />}
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Mevcut Aktif Oyuncu Sınıfı
              </div>
              <h2
                className={`text-lg font-bold ${
                  activeClassItem ? activeClassItem.accentColor : "text-zinc-300"
                }`}
              >
                {activeClassItem
                  ? activeClassItem.title
                  : "Henüz Bir Sınıf Seçilmedi (Standart Komutan)"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeClassItem
                  ? `Hedef Profil: ${activeClassItem.targetAudience} • Sınıf çarpanları motorlara aktif olarak entegre edilmiştir.`
                  : "Aşağıdaki 3 sınıftan dilediğinizi 500.000 KM karşılığında aktif ederek kalıcı bonuslar kazanabilirsiniz."}
              </p>
            </div>
          </div>

          {activeClassItem && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300 self-start sm:self-auto shrink-0">
              <span className="text-zinc-500">Durum: </span>
              <span className="text-emerald-400 font-bold">AKTİF & ÇALIŞIYOR</span>
            </div>
          )}
        </div>

        {activeClassItem && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Hesabınızda Aktif Olan Avantajlar:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeClassItem.perks.map((perk, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class Items Roster (3 Core Products Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Kullanılabilir Sınıf Değiştirme Öğeleri</span>
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            3 Kanonik Sınıf Kataloğu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SHOP_CLASSES_CATALOG.map((item) => {
            const isCurrent = activeClassKey === item.key;
            const effectiveCost = item.isDiscountActive
              ? item.discountCost
              : item.baseCost;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden bg-gradient-to-b ${
                  item.gradient
                } ${
                  isCurrent
                    ? `${item.borderClass} ${item.glowClass} ring-1 ring-cyan-400/50`
                    : "border-zinc-800/90 hover:border-zinc-700 hover:bg-[#0c121e]"
                }`}
              >
                {/* Active Class Pill Tag */}
                {isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    AKTİF SINIF
                  </div>
                )}

                <div>
                  {/* Card Header: Icon, Badge, Name & Cost */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div
                      className={`p-3 rounded-xl border border-zinc-800 bg-zinc-950/90 shrink-0 shadow-sm ${item.accentColor}`}
                    >
                      {getIcon(item.iconName, "w-7 h-7")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-400 block truncate">
                        {item.badgeText}
                      </span>
                      <h4 className="text-base font-bold text-zinc-100 truncate mt-0.5">
                        {item.title}
                      </h4>
                      <div className="text-xs font-mono font-semibold text-amber-300 mt-1 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{effectiveCost.toLocaleString("tr-TR")} KM</span>
                        {item.isDiscountActive && (
                          <span className="text-[10px] text-zinc-500 line-through">
                            {item.baseCost.toLocaleString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lore Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Target Audience Bar */}
                  <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 mb-4 flex items-center justify-between">
                    <span className="text-zinc-500">Hedef Oyuncu:</span>
                    <span className="font-semibold text-zinc-200">
                      {item.targetAudience}
                    </span>
                  </div>

                  {/* In-Game Perks & Lore List */}
                  <div className="space-y-2 border-t border-zinc-800/80 pt-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      Sağlanan Avantajlar:
                    </span>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {item.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Purchase / Activation Action Button */}
                <div className="mt-6 pt-4 border-t border-zinc-800/60">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-lg bg-zinc-800/80 text-zinc-500 text-xs font-semibold uppercase tracking-wider cursor-not-allowed border border-zinc-700/40"
                    >
                      Aktif Olarak Kullanılıyor
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedItemForModal(item)}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      Satın Al ve Aktif Et ({effectiveCost.toLocaleString("tr-TR")} KM)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Activation Modal */}
      {selectedItemForModal && (
        <ClassActivationModal
          item={selectedItemForModal}
          isOpen={true}
          onClose={() => setSelectedItemForModal(null)}
          onSuccess={(newClass) => {
            setActiveClassKey(newClass.key);
            setPlayerClass(newClass.key);
            fetchBootstrap();
          }}
        />
      )}
    </div>
  );
}

