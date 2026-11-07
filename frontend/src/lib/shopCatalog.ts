export type PlayerClassKey = "None" | "Collector" | "General" | "Discoverer";

export interface ShopClassItem {
  id: number;
  key: PlayerClassKey;
  name: string;
  title: string;
  targetAudience: string;
  badgeText: string;
  baseCost: number;
  discountCost: number;
  isDiscountActive: boolean;
  accentColor: string;
  gradient: string;
  borderClass: string;
  glowClass: string;
  iconName: "Pickaxe" | "Swords" | "Compass";
  description: string;
  perks: string[];
}

export const SHOP_CLASSES_CATALOG: ShopClassItem[] = [
  {
    id: 1,
    key: "Collector",
    name: "Kolektör Sınıfı Değiştirme Öğesi",
    title: "Kolektör (Collector)",
    targetAudience: "Madenci (Miner)",
    badgeText: "EKONOMİ & ÜRETİM",
    baseCost: 500_000,
    discountCost: 400_000,
    isDiscountActive: false,
    accentColor: "text-amber-300",
    gradient: "from-amber-950/70 via-[#181308] to-[#080d16]",
    borderClass: "border-amber-500/50 hover:border-amber-400",
    glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.2)]",
    iconName: "Pickaxe",
    description:
      "Büyük maden imparatorlukları ve yüksek verimli lojistik hatları kurmak isteyen komutanlar için tasarlandı. Hammadde ve enerji üretimini doruğa çıkarır.",
    perks: [
      "+%25 Maden üretimi (Metal, Kristal, Deuterium)",
      "+%10 Enerji üretimi (Güneş Santrali ve Füzyon)",
      "Daha yüksek Paletli (Crawler) verim limiti",
      "+%100 daha hızlı Nakliye gemileri (Küçük ve Büyük Nakliye)",
      "Aşırı yüklenme koruması: Enerji yetersizliğinde daha az verim kaybı",
    ],
  },
  {
    id: 2,
    key: "General",
    name: "General Sınıfı Değiştirme Öğesi",
    title: "General",
    targetAudience: "Savaşçı / Yağmacı (Fleeter)",
    badgeText: "ASKERİ & YAĞMA",
    baseCost: 500_000,
    discountCost: 400_000,
    isDiscountActive: false,
    accentColor: "text-rose-400",
    gradient: "from-rose-950/70 via-[#1a0c10] to-[#080d16]",
    borderClass: "border-rose-500/50 hover:border-rose-400",
    glowClass: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    iconName: "Swords",
    description:
      "Galakside mutlak askeri hakimiyet kurmak ve düşman filolarını harabeye çevirmek isteyen filocular için optimize edildi. Savaş hızını ve kapasitesini artırır.",
    perks: [
      "Savaş filoları için +%10 hız bonusu",
      "Geri Dönüşümcüler ve Azrail için +%25 uçuş hızı",
      "Savaşlarda +1 ek zırh ve silah teknolojisi kademesi etkisi",
      "+2 Maksimum filo slotu (Filo sınırını genişletir)",
      "Savaş sonrasında enkaz alanından enkaz toplama önceliği (Azrail enkaz yağması)",
    ],
  },
  {
    id: 3,
    key: "Discoverer",
    name: "Kaşif Sınıfı Değiştirme Öğesi",
    title: "Kaşif (Discoverer)",
    targetAudience: "Keşifçi (Explorer)",
    badgeText: "BİLİM & KEŞİF",
    baseCost: 500_000,
    discountCost: 400_000,
    isDiscountActive: false,
    accentColor: "text-cyan-300",
    gradient: "from-cyan-950/70 via-[#0a1824] to-[#080d16]",
    borderClass: "border-cyan-500/50 hover:border-cyan-400",
    glowClass: "shadow-[0_0_20px_rgba(34,211,238,0.2)]",
    iconName: "Compass",
    description:
      "16. Slot derin uzay keşiflerini, bilimsel araştırmaları ve terk edilmiş sistem yağmalarını en üst seviyeye taşır. Keşif ve araştırma verimini katlar.",
    perks: [
      "Keşif görevlerinden (16. Slot) çarpanlı hammadde, gemi ve Karanlık Madde bulma şansı",
      "İnaktif oyunculardan %75 yağmalama kapasitesi (%50 yerine %75 taban ganimet)",
      "+2 Ek keşif slotu",
      "+%25 Daha hızlı araştırma laboratuvarı tamamlama süresi",
      "Rehber (Pathfinder) gemisi ile keşif enkazlarını anında toplama yeteneği",
    ],
  },
];

