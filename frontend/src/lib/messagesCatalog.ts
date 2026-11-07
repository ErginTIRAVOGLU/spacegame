export type MessageCategory =
  | 'fleet'
  | 'communication'
  | 'economy'
  | 'universe'
  | 'ogame'
  | 'favorites';

export type FleetSubTab =
  | 'espionage'
  | 'combat'
  | 'expeditions'
  | 'transport'
  | 'other';

export type CommunicationSubTab =
  | 'reports'
  | 'info'
  | 'shared_combat'
  | 'shared_spy'
  | 'expeditions';

export interface EspionageReportItem {
  id: string;
  planetName: string;
  coordinates: string;
  playerName: string;
  tierLevel: number;
  dataJson: string;
  createdAtUtc: string;
  ageMinutes: number;
  isFavorite: boolean;
}

export interface CombatReportItem {
  id: string;
  attackerName: string;
  defenderName: string;
  coordinates: string;
  winner: string;
  dataJson: string;
  createdAtUtc: string;
  ageMinutes: number;
  isFavorite: boolean;
}

export interface ExpeditionReportItem {
  id: string;
  coordinates: string;
  outcome: string;
  narrativeText: string;
  lootJson: string;
  createdAtUtc: string;
  ageMinutes: number;
  isFavorite: boolean;
}

export interface PlayerMessageItem {
  id: string;
  senderName: string;
  subject: string;
  contentJson: string;
  isRead: boolean;
  createdAtUtc: string;
  ageMinutes: number;
  isFavorite: boolean;
}

export interface MessagesHubResponse {
  category: MessageCategory;
  subTab: string;
  bookmarks: string[];
  espionageReports: EspionageReportItem[];
  combatReports: CombatReportItem[];
  expeditionReports: ExpeditionReportItem[];
  playerMessages: PlayerMessageItem[];
}

export interface ChatMessageItem {
  id: string;
  senderUserId: string;
  senderUsername: string;
  recipientUserId?: string | null;
  channel?: string | null;
  messageText: string;
  sentAtUtc: string;
}

