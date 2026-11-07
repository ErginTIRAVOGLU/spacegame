export interface AllianceMemberDto {
  userId: string;
  userName: string;
  role: number; // 1: Member, 2: General, 3: Founder
  roleName: string;
  score: number;
  rank: number;
  mainCoordinates: string;
  joinedAt: string;
  lastLogin: string;
  isOnline: boolean;
}

export interface AllianceApplicantDto {
  id: string;
  userId: string;
  userName: string;
  appliedAt: string;
  rank: number;
  score: number;
  message: string;
}

export interface AllianceRolePermission {
  id: string;
  name: string;
  description: string;
  key: string;
}

export interface AllianceDataDto {
  id: string;
  name: string;
  tag: string;
  founderId: string;
  founderName: string;
  createdAt: string;
  memberCount: number;
  maxMembers: number;
  rank: number;
  score: number;
  logoUrl?: string;
  homepageUrl?: string;
  isOpenForApplications: boolean;
  internalText?: string;
  externalText?: string;
  applicationText?: string;
  allianceClass?: 'none' | 'warrior' | 'trader' | 'researcher';
  userRole: number; // 1: Member, 2: General, 3: Founder
  userPermissions: string[];
  members: AllianceMemberDto[];
  applications?: AllianceApplicantDto[];
}

export interface AllianceSearchResult {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
  score: number;
  rank: number;
  isOpen: boolean;
}

export interface AllianceClassDefinition {
  id: 'warrior' | 'trader' | 'researcher';
  name: string;
  badge: string;
  icon: string;
  costDarkMatter: number;
  description: string;
  bonuses: string[];
}

export const ALLIANCE_CLASSES: AllianceClassDefinition[] = [
  {
    id: 'warrior',
    name: 'Savaşçı Birliği (Warrior)',
    badge: '⚔️ Savaşçı',
    icon: 'Sword',
    costDarkMatter: 500000,
    description: 'Agresif askeri taktikler, filo hızlandırmaları ve istihbarat hakimiyeti sağlar.',
    bonuses: [
      '+%10 İttifak Filo Muharebe Hızı',
      '+1 İttifak Seviyesi Silah, Kalkan & Zırh Teknolojisi (tüm üyelere pasif)',
      '+1 Casusluk Teknolojisi seviyesi',
      'Güneş sistemindeki müttefik ve düşman filo hareketlerini daha erken tespit etme'
    ]
  },
  {
    id: 'trader',
    name: 'Ticaret Birliği (Trader)',
    badge: '⚖️ Tüccar',
    icon: 'Coins',
    costDarkMatter: 500000,
    description: 'Geniş nakliye filoları, ticaret kotaları ve geliştirilmiş hammadde madenciliği sağlar.',
    bonuses: [
      '+%10 Nakliye Gemileri Uçuş Hızı',
      '+%5 Tüm Üyelerde Maden Üretim Artışı',
      '+%5 Enerji Üretim Bonusu',
      '+%10 Depo Kapasitesi Artışı'
    ]
  },
  {
    id: 'researcher',
    name: 'Kaşif & Araştırmacı Birliği (Researcher)',
    badge: '🔭 Araştırmacı',
    icon: 'Atom',
    costDarkMatter: 500000,
    description: 'Gelişmiş keşif operasyonları, radar taramaları ve araştırma sinerjisi sağlar.',
    bonuses: [
      'Gezegenlerde +%5 Kullanılabilir Alan Artışı',
      '+%10 Keşif (Expedition) Uçuş Hızı & %15 Daha Fazla Keşif Kazancı',
      'Müttefik Radar/Sensor Phalanx tarama verilerinin ortak istihbarat havuzunda paylaşımı',
      'Araştırma sürelerinde %5 İttifak Laboratuvarı İndirimi'
    ]
  }
];

export const PERMISSION_LIST = [
  { key: 'disband', label: 'İttifakı Dağıt', desc: 'İttifakı tamamen kapatma ve silme hakkı' },
  { key: 'kick', label: 'Üye İhraç Et', desc: 'Mevcut üyeleri ittifaktan çıkarma yetkisi' },
  { key: 'applications', label: 'Başvuruları Yönet', desc: 'Yeni başvuruları onaylama veya reddetme' },
  { key: 'member_list', label: 'Üye Listesi & Online Durumu', desc: 'Detaylı üye aktivitelerini ve koordinatlarını görme' },
  { key: 'edit_roles', label: 'Rütbeleri Düzenle', desc: 'Yeni rütbe oluşturma ve yetki matrisini değiştirme' },
  { key: 'change_class', label: 'İttifak Sınıfı Seç', desc: 'İttifak sınıfını aktive etme veya değiştirme' },
  { key: 'circular_mail', label: 'Sirküler Mesaj Gönder', desc: 'Tüm üyelere toplu ittifak duyurusu yapma' },
  { key: 'manage_text', label: 'Metinleri ve Logoyu Düzenle', desc: 'Dahili, harici metinleri ve logo/web url güncelleme' },
  { key: 'manage_diplomacy', label: 'Diplomasi Yönetimi', desc: 'Savaş, Barış ve Ticaret anlaşmalarını imzalama' },
  { key: 'view_applications', label: 'Başvuru Metinlerini Oku', desc: 'Adayların gönderdiği mesajları inceleme' }
];

