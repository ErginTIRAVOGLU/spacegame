export interface DirectiveReward {
  metal: number;
  crystal: number;
  deuterium: number;
  darkMatter: number;
}

export interface DirectiveSubStep {
  index: number;
  description: string;
  isMet: boolean;
}

export interface DirectiveActiveQuest {
  questId: number;
  title: string;
  description: string;
  hint: string;
  steps: DirectiveSubStep[];
  reward: DirectiveReward;
  completedCount: number;
  totalCount: number;
  isFulfilled: boolean;
  canClaim: boolean;
}

export interface DirectiveQuestSummary {
  questId: number;
  title: string;
  description: string;
  hint: string;
  goals: string[];
  reward: DirectiveReward;
  status: "Completed" | "Active" | "Locked";
  isClaimed: boolean;
  canClaim: boolean;
  progressText: string;
  completedCount: number;
  totalCount: number;
}

export interface TutorialGuide {
  name: string;
  role: string;
  introLore: string;
}

export interface AvailableDirectiveSummary {
  directiveId: number;
  title: string;
  totalQuests: number;
  currentStep: number;
  isCompleted: boolean;
  isRewardClaimed: boolean;
}

export interface TutorialCurrentResponse {
  directiveId: number;
  title: string;
  guide: TutorialGuide;
  currentQuestStep: number;
  subStepBitmask: number;
  isDirectiveCompleted: boolean;
  isDirectiveRewardClaimed: boolean;
  canClaimDirectiveReward: boolean;
  finalReward: DirectiveReward;
  nextDirectiveSummary: string;
  pinnedQuestId?: number | null;
  pinnedQuestKey?: string | null;
  activeQuest: DirectiveActiveQuest;
  allQuests: DirectiveQuestSummary[];
  availableDirectives?: AvailableDirectiveSummary[];
  planetId?: string;
  userDarkMatter: number;
}

