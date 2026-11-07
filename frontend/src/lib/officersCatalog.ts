export type OfficerKey =
  | 'dark_matter'
  | 'commander'
  | 'admiral'
  | 'engineer'
  | 'geologist'
  | 'technocrat';

export interface OfficerDef {
  key: OfficerKey;
  name: string;
  subtitle: string;
  description: string;
  lore: string;
  weeklyPrice: number;
  monthlyPrice: number;
  perks: string[];
  icon: string;
  themeColor: string;
  isAccountCurrency?: boolean;
}

export interface OfficerStatusDto {
  isActive: boolean;
  expiresAtUtc?: string | null;
  remainingSeconds: number;
}

export interface OfficersResponseDto {
  darkMatter: number;
  activeCount: number;
  officers: Record<string, OfficerStatusDto>;
  bonuses: {
    hasCommander: boolean;
    hasAdmiral: boolean;
    hasEngineer: boolean;
    hasGeologist: boolean;
    hasTechnocrat: boolean;
    hasFullCommandStaff: boolean;
    mineProductionMultiplier: number;
    energyProductionMultiplier: number;
    researchDurationMultiplier: number;
    defenseRepairRatio: number;
    extraFleetSlots: number;
    extraExpeditionSlots: number;
    extraEspionageTechLevels: number;
  };
}

export const OFFICERS_CATALOG: OfficerDef[] = [
  {
    key: 'dark_matter',
    name: 'Karanlık Madde (Dark Matter)',
    subtitle: 'Galaktik Para Birimi & Ayrıcalık Kaynağı',
    description:
      'Karanlık Madde, evrenin derinliklerinden toplanan nadir bir enerjidir. Subayları kiralamak, tüccarı çağırmak ve imparatorluğunuzun gelişimini hızlandırmak için kullanılır.',
    lore:
      'Yıldızlararası medeniyetler asırlar boyu sıradan madenlerle yetindi; ta ki karanlık maddenin uzay-zamanı bükme kudreti keşfedilene kadar. Artık gerçek güç, bu gizemli maddeyi yönetebilenlerin elindedir.',
    weeklyPrice: 0,
    monthlyPrice: 0,
    perks: [
      'Subay ve Komuta Heyeti kiralama',
      'Tüccar filolarıyla anlık hammadde takası',
      'Açık artırma ve hurda tüccarı hizmetleri',
      'İttifak sınıflarını aktive etme ve değiştirme'
    ],
    icon: 'Sparkles',
    themeColor: 'from-purple-900/40 to-indigo-950/40 border-purple-500/40 text-purple-400',
    isAccountCurrency: true
  },
  {
    key: 'commander',
    name: 'Commander (Komutan)',
    subtitle: 'İmparatorluk Yönetimi & İnşa Kuyruğu',
    description:
      'Commander, imparatorluğunuzun tüm gezegenlerini tek bir bakışta yönetmenizi sağlar. Gelişmiş emir kuyruğu ve imparatorluk genel bakış paneli ile stratejinizi mükemmelleştirir.',
    lore:
      'Büyük bir imparatorluğu yönetmek olağanüstü organizasyon gerektirir. Commander, komuta köprünüzdeki binlerce raporu süzerek en doğru kararları anında uygulamanıza yardım eder.',
    weeklyPrice: 10000,
    monthlyPrice: 100000,
    perks: [
      '+40 Favori gezegen ve filo hedefi',
      'Gelişmiş İnşa ve Tersane Kuyruğu sıralaması',
      'Nakliye ve filo tarayıcısı entegrasyonu',
      'Reklamsız ve optimize edilmiş galaksi deneyimi'
    ],
    icon: 'Crown',
    themeColor: 'from-amber-900/40 to-yellow-950/40 border-amber-500/40 text-amber-400'
  },
  {
    key: 'admiral',
    name: 'Amiral (Fleet Admiral)',
    subtitle: 'Filo Doktrini & Genişletilmiş Keşifler',
    description:
      'Deneyimli filo stratejisti. Donanmanıza aynı anda daha fazla bağımsız operasyon yürütme kabiliyeti kazandırır ve keşif sınırlarını genişletir.',
    lore:
      'Yüzlerce uzay muharebesinden zaferle çıkmış kıdemli bir donanma lideri. Taktik dehası sayesinde gemileriniz düşman pusularından daha kolay kaçar ve daha uzak sektörlere ulaşır.',
    weeklyPrice: 5000,
    monthlyPrice: 50000,
    perks: [
      'Maks. filo sayısı +2 slot bonusu',
      'Maks. keşif (expedition) sayısı +1',
      'Geliştirilmiş filo taktik firar oranı',
      'Maks. depo koruma kapasitesi +%20'
    ],
    icon: 'Compass',
    themeColor: 'from-blue-900/40 to-cyan-950/40 border-blue-500/40 text-blue-400'
  },
  {
    key: 'engineer',
    name: 'Mühendis (Engineer)',
    subtitle: 'Enerji Verimliliği & Savunma Onarımı',
    description:
      'Enerji ağlarınızı optimize eder ve savunma tesislerinizin düşman bombardımanında aldığı hasarı minimuma indirerek onarım oranını artırır.',
    lore:
      'En karmaşık reaktörlerin bile dilinden anlayan bir teknoloji dehası. Ağır bombardıman altındaki taretleri olağanüstü bir hızla tekrar operasyonel hale getirir.',
    weeklyPrice: 5000,
    monthlyPrice: 50000,
    perks: [
      'Savunma sistemlerindeki kaybı ikiye düşürür (%85 onarım)',
      '+%10 Enerji üretimi (Güneş & Füzyon santralleri)',
      'Ağır savunma bataryalarında enerji dengesi koruması',
      'Madenlerin enerji kesintilerinden daha az etkilenmesi'
    ],
    icon: 'Zap',
    themeColor: 'from-emerald-900/40 to-teal-950/40 border-emerald-500/40 text-emerald-400'
  },
  {
    key: 'geologist',
    name: 'Jeolog (Geologist)',
    subtitle: 'Maden Çıkarımı & Gezegensel Jeoloji',
    description:
      'Gezegen kabuklarındaki en zengin damarları tespit eder ve madencilik sondaj operasyonlarının verimini kalıcı olarak artırır.',
    lore:
      'Yıldız sistemlerindeki en sert asteroitlerin ve çekirdeklerin mineral yapısını çözen uzman jeolog. Madencilik droidlerinizin her vardiyada maksimum cevher çıkarmasını sağlar.',
    weeklyPrice: 12500,
    monthlyPrice: 125000,
    perks: [
      '+%10 Maden geliri (Metal, Kristal ve Deuterium)',
      'Tüm gezegenlerde eşzamanlı aktif maden artışı',
      'Sondaj makinelerinde düşük aşınma payı',
      'Derin maden galerilerinde güvenli üretim'
    ],
    icon: 'Pickaxe',
    themeColor: 'from-orange-900/40 to-amber-950/40 border-orange-500/40 text-orange-400'
  },
  {
    key: 'technocrat',
    name: 'Teknokrat (Technocrat)',
    subtitle: 'Bilimsel Araştırma & Casusluk Ağı',
    description:
      'Araştırma laboratuvarlarını ileri düzey algoritmalarla donatır, araştırma sürelerini kısaltır ve istihbarat uydularınızın gücünü yükseltir.',
    lore:
      'Bilgi evrendeki en keskin silahtır. Teknokrat, kuantum hesaplama kümelerini araştırma merkezlerinize entegre ederek yeni teknolojileri çeyrek kat daha hızlı keşfetmenizi sağlar.',
    weeklyPrice: 10000,
    monthlyPrice: 100000,
    perks: [
      '+2 Casusluk Teknolojisi seviyesi',
      '%25 daha kısa araştırma süresi (Tüm laboratuvarlar)',
      'Gelişmiş radar ve sinyal çözümleme avantajı',
      'Düşman istihbarat taramalarına karşı aktif karşı koyma'
    ],
    icon: 'Cpu',
    themeColor: 'from-cyan-900/40 to-sky-950/40 border-cyan-500/40 text-cyan-400'
  }
];

export const COMMAND_STAFF_DEF = {
  name: 'Komuta Heyeti (Commanding Staff)',
  subtitle: 'Tüm Subayların Ortak Konsorsiyumu',
  weeklyPrice: 42500,
  monthlyPrice: 425000,
  bonuses: [
    'Maks. filo sayısı +1 ekstra slot',
    '+%2 Ekstra enerji üretimi (Toplam +%12)',
    '+%2 Ekstra maden kazanımı (Toplam +%12)',
    '+1 Ekstra casusluk teknolojisi seviyesi (Toplam +3)',
    'Tüm 5 subayın ayrıcalıkları aynı anda aktifleşir'
  ]
};

