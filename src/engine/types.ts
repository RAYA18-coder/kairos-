/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ArchetypeId =
  | 'coder'
  | 'exam_aspirant'
  | 'designer'
  | 'creator'
  | 'founder'
  | 'med_student'
  | 'shift_worker'
  | 'researcher';

export type Chronotype = 'early' | 'night' | 'split';

export type Sensitivity = 'low' | 'med' | 'high';

export type PersonaId = 'arjun' | 'meera' | 'kabir' | 'rohan' | 'you';

export type ContentType =
  | 'short_video'
  | 'feed_scroll'
  | 'long_video'
  | 'chat'
  | 'docs_work'
  | 'news_article';

export type DayType = 'weekday' | 'weekend';

export type ActivityType = 'coding' | 'studying' | 'reading' | 'writing' | 'idle';

export type NotificationType =
  | 'social_like'
  | 'dm'
  | 'work_msg'
  | 'otp'
  | 'calendar'
  | 'promo'
  | 'news'
  | 'system';

export type AppName =
  | 'Instagram'
  | 'WhatsApp'
  | 'YouTube'
  | 'Slack'
  | 'Gmail'
  | 'Reddit'
  | 'Telegram'
  | 'VS Code'
  | 'Notion'
  | 'Chrome'
  | 'System';

export type ProvenanceBadge =
  | 'Simulated persona'
  | 'You: experiment'
  | 'You: your device';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface PersonaProfileConfig {
  id: string;
  name: string;
  archetype: ArchetypeId;
  chronotype: Chronotype;
  biggestSinkApp: AppName;
  sensitivity: Sensitivity;
  importantSenders: string[];
  accentColor: string;
}

export interface UserState {
  hour: number; // 0 - 23
  dayType: DayType;
  activity: ActivityType;
  minutesIntoFocusBlock: number;
  minutesSinceBreak: number;
  fatigue: number; // 0.0 (rested) to 1.0 (depleted)
  recentAppSwitches: number; // count in last 15 min
  minutesSinceLastNotification: number;
}

export interface NotificationItem {
  id: string;
  appName: AppName;
  type: NotificationType;
  title: string;
  body: string;
  senderImportance: number; // 0.0 to 1.0
  timestamp: number;
}

export interface FeatureContribution {
  name: string;
  impact: string;
  weight: number;
}

export interface LearnedModuleOutput<T> {
  data: T;
  sampleSize: number;
  interval95: [number, number]; // [lower, upper]
  confidence: ConfidenceLevel;
  provenance: ProvenanceBadge;
  topFeatures: FeatureContribution[];
}

export interface FocusCurvePoint {
  hour: number;
  probDeepFocus: number;
  ciLower: number;
  ciUpper: number;
  sampleSize: number;
}

export interface InterruptionModelWeights {
  bias: number;
  typeWeights: Record<NotificationType, number>;
  appWeights: Record<AppName, number>;
  activityWeights: Record<ActivityType, number>;
  fatigueWeight: number;
  senderImportanceWeight: number;
  recentSwitchesWeight: number;
  hourSinWeight: number;
  hourCosWeight: number;
  accuracy: number;
}

export interface ContentTypeDurationInfo {
  contentType: ContentType;
  medianMinutes: number;
  p90Minutes: number;
  ciMedian: [number, number];
  ciP90: [number, number];
  sampleCount: number;
  mu: number;
  sigma: number;
}

export interface StickyContentInfo {
  appName: AppName;
  medianMinutes: number;
  p90Minutes: number;
  ciMedian: [number, number];
  ciP90: [number, number];
  sampleCount: number;
  mu: number;
  sigma: number;
  contentTypeBreakdown?: ContentTypeDurationInfo[];
}

export interface NotificationValueInfo {
  type: NotificationType;
  importanceBand: 'low' | 'medium' | 'high';
  probActedMeaningfully: number;
  ciLower: number;
  ciUpper: number;
  sampleCount: number;
}

export interface FatigueModelFit {
  intercept: number;
  minutesSinceBreakSlope: number;
  hourSlope: number;
  switchesSlope: number;
  rSquared: number;
  sampleCount: number;
}

export interface FragmentationInfo {
  appName: AppName;
  meanResumptionDelayMinutes: number;
  ciResumptionDelay: [number, number];
  nextBlockShorteningMinutes: number;
  ciShortening: [number, number];
  sampleCount: number;
}

export interface BranchDistributionBucket {
  bucketKey: string;
  ignore: number;
  glance: number;
  browse: number;
  abandon: number;
  totalSamples: number;
  probabilities: {
    ignore: number;
    glance: number;
    browse: number;
    abandon: number;
  };
}

export interface LearnedTwinData {
  focusCurve: LearnedModuleOutput<{ weekday: FocusCurvePoint[]; weekend: FocusCurvePoint[] }>;
  interruptionModel: LearnedModuleOutput<InterruptionModelWeights>;
  stickyContent: LearnedModuleOutput<StickyContentInfo[]>;
  contentTypeLognormals: LearnedModuleOutput<ContentTypeDurationInfo[]>;
  notificationValue: LearnedModuleOutput<NotificationValueInfo[]>;
  fatigueModel: LearnedModuleOutput<FatigueModelFit>;
  fragmentationIndex: LearnedModuleOutput<FragmentationInfo[]>;
  branchModel: Record<string, BranchDistributionBucket>;
  spontaneousCheckRatePerHour: number;
  meanFocusBlockMinutes: number;
  stdFocusBlockMinutes: number;
}

export interface BranchOutcome {
  name: 'ignore' | 'glance' | 'browse' | 'abandon';
  label: string;
  probability: number;
  expectedLossMinutes: number;
  color: string;
}

export type VerdictDecision =
  | 'ALLOW NOW'
  | 'HOLD UNTIL NEXT BREAK'
  | 'BATCH IN DIGEST'
  | 'SUPPRESS';

export interface VerdictResult {
  decision: VerdictDecision;
  primaryReason: string;
  topFactors: [string, string];
  isSafetyRule: boolean;
  predictedBreakMinutes: number;
  attentionCostScore: number; // 0 - 100
  utilityScore: number; // 0 - 100
}

export interface SimulationResult {
  pOpen: number;
  pDetour: number;
  expectedDetourMinutes: number;
  detourRange: [number, number]; // [P10, P90]
  expectedResumptionDelay: number;
  resumptionRange: [number, number]; // [P10, P90]
  expectedFocusLossMinutes: number;
  fatigueDelta: number;
  branches: BranchOutcome[];
  meanFocusShown: number[];
  shownP10: number[];
  shownP90: number[];
  meanFocusSuppressed: number[];
  suppressedP10: number[];
  suppressedP90: number[];
  counterfactual: {
    focusMinutesSaved: number;
    focusMinutesSavedInterval: [number, number];
    resumeDelayAvoided: number;
    resumeDelayAvoidedInterval: [number, number];
    regretCost: number;
  };
  verdict: VerdictResult;
}

export interface TwinFidelityReport {
  score: number; // 0 - 100%
  brierScore: number;
  ece: number; // Expected Calibration Error
  detourMaeMinutes: number;
  counterfactualMaeMinutes: number;
  summary: string;
  honestLimits: string[];
}

export type SyntheticEvent =
  | {
      type: 'focus_block';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        start: number;
        end: number;
        durationMinutes: number;
        activity: ActivityType;
        endedEarly: boolean;
      };
    }
  | {
      type: 'notification';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        id: string;
        appName: AppName;
        notifType: NotificationType;
        senderImportance: number;
        shown: boolean;
        state: {
          hour: number;
          activity: ActivityType;
          minutesIntoFocusBlock: number;
          minutesSinceBreak: number;
          recentAppSwitches: number;
        };
      };
    }
  | {
      type: 'app_open';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        appName: AppName;
        contentType: ContentType;
        duration: number;
        trigger: 'notification' | 'spontaneous';
      };
    }
  | {
      type: 'resume';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        delayMinutes: number;
      };
    }
  | {
      type: 'acted';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        notifId: string;
        actedMeaningfully: boolean;
      };
    }
  | {
      type: 'self_report';
      timestamp: number;
      day: number;
      hour: number;
      details: {
        state: 'flow' | 'distracted' | 'tired';
      };
    };
