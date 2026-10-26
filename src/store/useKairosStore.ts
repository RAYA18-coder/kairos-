/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import {
  ActivityType,
  AppName,
  LearnedTwinData,
  NotificationItem,
  NotificationType,
  PersonaId,
  PersonaProfileConfig,
  SimulationResult,
  UserState,
  VerdictDecision,
} from '../engine/types';
import {
  generateSyntheticLogs,
  PRESET_PERSONA_CONFIGS,
} from '../engine/syntheticData';
import { trainTwinFromLogs } from '../engine/twinLearner';
import { simulate } from '../engine/simulator';
import { BacktestResults, runBacktest } from '../engine/backtest';
import {
  analyzeExperiment,
  buildPersonalTwin,
  ExperimentAnalysisResult,
  RealTrialMeasurement,
} from '../engine/experiment';
import {
  PersonalCheckIn,
  RealNotificationResponse,
  TwinDiffMetric,
  updateTwinWithPersonalData,
} from '../engine/onlineLearning';
import {
  hashPasscode,
  readIndexedDbNotificationEvents,
  verifyPasscode,
} from '../lib/storage';
import { runEngineSelfChecks, SelfCheckResult } from '../engine/selfCheck';
import { importanceLearner, UserRole, hashSender } from '../native/importanceLearner';
import { sendTestNotification } from '../native/notify';
import { subscribe, IncomingNotificationEvent, channelToNotificationType } from '../native/sensor';
import { explainVerdictWithAi, parseWhatIfNaturalLanguage } from '../lib/geminiClient';

export interface GuardStreamItem {
  id: string;
  appName: AppName | string;
  type: NotificationType;
  channel?: string;
  title: string;
  body: string;
  senderRaw?: string;
  senderHash?: string;
  senderImportance: number;
  importanceConfidence?: [number, number];
  importanceWhy?: string;
  importanceBefore?: number;
  importanceAfter?: number;
  timestamp: number;
  verdict: VerdictDecision;
  reason: string;
  savedMinutes: number;
  status: 'sent' | 'held' | 'batched' | 'suppressed';
  userOverride?: 'ALLOWED' | 'SUPPRESSED';
  userFeedback?: 'worth_it' | 'hijacked' | 'dismissed';
  isVip?: boolean;
}

export interface ProfileRecord {
  config: PersonaProfileConfig;
  passcodeHash?: string;
  passcodeSalt?: string;
  isProtectedWithPasscode: boolean;
}

export interface KairosState {
  // Navigation & Flows
  currentView: 'welcome' | 'landing' | 'builder' | 'app';
  activeTab: 'now' | 'simulate' | 'guard' | 'twin' | 'proof';
  isExperimentActive: boolean;
  guidedDemoStep: number;
  isGuidedDemoRunning: boolean;

  // Personal Role & Creator Mode
  role: UserRole;
  workApps: string[];
  theme: 'dark' | 'light';
  dataSource: 'simulated' | 'live';
  isSettingsOpen: boolean;
  selectedGuardDetail: GuardStreamItem | null;
  aiOnline: boolean;

  // Profiles & Passcode Security
  profiles: Record<string, ProfileRecord>;
  activeProfileId: string;
  activePersona: string;
  isDeviceLocked: boolean;
  onboardingStep: 'welcome' | 'archetype' | 'training' | 'completed';

  // Settings
  quietMode: boolean;
  judgeMode: boolean;
  canvasQuality: 'high' | 'medium' | 'low';
  notificationPermission: NotificationPermission | 'unsupported';

  // Digital Twins & Models
  twins: Record<string, LearnedTwinData>;
  twinDiffs: TwinDiffMetric[];
  experimentAnalysis: ExperimentAnalysisResult | null;
  backtestResults: Record<string, BacktestResults>;
  selfChecks: SelfCheckResult;
  checkIns: PersonalCheckIn[];
  realResponses: RealNotificationResponse[];

  // Simulation State
  userState: UserState;
  activeNotification: NotificationItem;
  simulation: SimulationResult;
  simulationSeed: number;
  sideBySideSimulations: Record<string, SimulationResult> | null;
  aiExplanation: string | null;
  isAiGenerating: boolean;

  // Guard & Real Notifications
  guardStream: GuardStreamItem[];
  digestList: GuardStreamItem[];
  digestItems: GuardStreamItem[];
  protectedList: GuardStreamItem[];
  attentionSavedTodayMinutes: number;

  // Actions
  setCurrentView: (view: 'welcome' | 'landing' | 'builder' | 'app') => void;
  setActiveTab: (tab: 'now' | 'simulate' | 'guard' | 'twin' | 'proof') => void;
  setActiveProfile: (profileId: string) => void;
  setActivePersona: (personaId: string) => void;
  setRole: (role: UserRole) => void;
  setWorkApps: (apps: string[]) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setDataSource: (source: 'simulated' | 'live') => void;
  setIsSettingsOpen: (open: boolean) => void;
  setSelectedGuardDetail: (item: GuardStreamItem | null) => void;
  setOnboardingStep: (step: 'welcome' | 'archetype' | 'training' | 'completed') => void;

  createProfile: (config: PersonaProfileConfig, passcode?: string) => Promise<void>;
  setPasscodeForActiveProfile: (passcode: string) => Promise<void>;
  unlockWithPasscode: (passcode: string) => Promise<boolean>;
  lockDevice: () => void;
  resetActiveProfileData: () => void;
  resetEverything: () => void;
  deleteEverything: () => void;

  setUserState: (partial: Partial<UserState>) => void;
  setActiveNotification: (notif: NotificationItem) => void;
  runSimulationNow: (customSeed?: number) => void;
  runSideBySideSimulations: () => void;
  setJudgeMode: (enabled: boolean) => void;
  setQuietMode: (enabled: boolean) => void;

  startGuidedDemo: () => void;
  stopGuidedDemo: () => void;
  setGuidedDemoStep: (step: number) => void;

  startExperiment: () => void;
  finishExperiment: (trials: RealTrialMeasurement[]) => void;
  finishExperimentWithRealMeasurements: (trials: RealTrialMeasurement[], seed: number) => void;
  logCheckIn: (type: 'flow' | 'distracted' | 'tired') => void;
  syncWithIndexedDbTelemetry: () => Promise<void>;

  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendRealNotification: (notif: NotificationItem) => Promise<void>;
  sendTestNotificationNow: (title?: string, body?: string) => Promise<boolean>;
  overrideGuardDecision: (id: string, override: 'ALLOWED' | 'SUPPRESSED') => void;
  recordNotificationFeedback: (id: string, outcome: 'worth_it' | 'hijacked', explicit?: boolean) => void;
  toggleSenderVip: (id: string) => void;
  releaseDigestNow: () => void;
  requestAiExplanation: () => Promise<void>;
  simulateNaturalLanguageWhatIf: (queryText: string) => Promise<void>;
}

// Initial default persona twins trained from synthetic logs
const arjunLogs = generateSyntheticLogs(PRESET_PERSONA_CONFIGS.arjun, 42);
const meeraLogs = generateSyntheticLogs(PRESET_PERSONA_CONFIGS.meera, 42);
const kabirLogs = generateSyntheticLogs(PRESET_PERSONA_CONFIGS.kabir, 42);

const arjunTwin = trainTwinFromLogs(arjunLogs, 'Simulated persona');
const meeraTwin = trainTwinFromLogs(meeraLogs, 'Simulated persona');
const kabirTwin = trainTwinFromLogs(kabirLogs, 'Simulated persona');
const youTwin = JSON.parse(JSON.stringify(arjunTwin)) as LearnedTwinData;
youTwin.focusCurve.provenance = 'You: experiment';

const arjunBacktest = runBacktest('arjun');
const meeraBacktest = runBacktest('meera');
const kabirBacktest = runBacktest('kabir');

const defaultUserState: UserState = {
  hour: 22,
  dayType: 'weekday',
  activity: 'coding',
  minutesIntoFocusBlock: 35,
  minutesSinceBreak: 40,
  fatigue: 0.3,
  recentAppSwitches: 2,
  minutesSinceLastNotification: 38,
};

const defaultNotification: NotificationItem = {
  id: 'notif_default',
  appName: 'Instagram',
  type: 'social_like',
  title: 'Instagram',
  body: 'Someone liked your post',
  senderImportance: 0.12,
  timestamp: Date.now(),
};

const initialSimulation = simulate(defaultUserState, defaultNotification, arjunTwin, 1337);

const initialGuardItems: GuardStreamItem[] = [
  {
    id: 'g_1',
    appName: 'Instagram',
    type: 'social_like',
    channel: 'like',
    title: 'Instagram',
    body: 'sarah_k and 14 others liked your reel',
    senderRaw: 'sarah_k',
    senderHash: hashSender('sarah_k'),
    senderImportance: 0.12,
    importanceConfidence: [0.08, 0.18],
    importanceWhy: 'Role prior: Developer social likes low importance',
    timestamp: Date.now() - 4 * 60000,
    verdict: 'SUPPRESS',
    reason: 'Deep coding flow (35m). Predicted 17m detour risk into feed.',
    savedMinutes: 24,
    status: 'suppressed',
  },
  {
    id: 'g_2',
    appName: 'System',
    type: 'otp',
    channel: 'otp',
    title: 'Bank Verification Code',
    body: '934102 is your transaction security code',
    senderRaw: 'SecurityBank',
    senderHash: hashSender('SecurityBank'),
    senderImportance: 1.0,
    importanceConfidence: [0.98, 1.0],
    importanceWhy: 'Safety rule: Time-critical authentication code',
    timestamp: Date.now() - 14 * 60000,
    verdict: 'ALLOW NOW',
    reason: 'Safety rule: Time-critical authentication code.',
    savedMinutes: 0,
    status: 'sent',
  },
  {
    id: 'g_3',
    appName: 'Slack',
    type: 'work_msg',
    channel: 'work_msg',
    title: 'Slack #core-product',
    body: 'Sarah: Please check the PR when you take your next break',
    senderRaw: 'sarah_pm',
    senderHash: hashSender('sarah_pm'),
    senderImportance: 0.84,
    importanceConfidence: [0.76, 0.92],
    importanceWhy: 'Learned from 8 past interactions with Slack',
    timestamp: Date.now() - 25 * 60000,
    verdict: 'HOLD UNTIL NEXT BREAK',
    reason: 'Valuable message held for natural pause in ~18 min.',
    savedMinutes: 14,
    status: 'held',
  },
  {
    id: 'g_4',
    appName: 'Reddit',
    type: 'news',
    channel: 'news',
    title: 'Reddit r/technology',
    body: 'New chip architecture benchmarks published',
    senderRaw: 'reddit_bot',
    senderHash: hashSender('reddit_bot'),
    senderImportance: 0.18,
    importanceConfidence: [0.12, 0.26],
    importanceWhy: 'Aggregated daily tech news digest',
    timestamp: Date.now() - 50 * 60000,
    verdict: 'BATCH IN DIGEST',
    reason: 'Scheduled for 21:00 evening digest.',
    savedMinutes: 9,
    status: 'batched',
  },
];

export const useKairosStore = create<KairosState>((set, get) => ({
  currentView: 'app',
  activeTab: 'now',
  isExperimentActive: false,
  guidedDemoStep: 0,
  isGuidedDemoRunning: false,

  role: importanceLearner.getRole(),
  workApps: importanceLearner.getWorkApps(),
  theme: 'dark',
  dataSource: 'simulated',
  isSettingsOpen: false,
  selectedGuardDetail: null,
  aiOnline: true,

  profiles: {
    arjun: { config: PRESET_PERSONA_CONFIGS.arjun, isProtectedWithPasscode: false },
    meera: { config: PRESET_PERSONA_CONFIGS.meera, isProtectedWithPasscode: false },
    kabir: { config: PRESET_PERSONA_CONFIGS.kabir, isProtectedWithPasscode: false },
  },
  activeProfileId: 'arjun',
  activePersona: 'arjun',
  isDeviceLocked: false,
  onboardingStep: 'completed',

  quietMode: false,
  judgeMode: false,
  canvasQuality: 'high',
  notificationPermission:
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported',

  twins: {
    arjun: arjunTwin,
    meera: meeraTwin,
    kabir: kabirTwin,
    you: youTwin,
  },
  twinDiffs: [],
  experimentAnalysis: null,
  backtestResults: {
    arjun: arjunBacktest,
    meera: meeraBacktest,
    kabir: kabirBacktest,
    you: arjunBacktest,
  },
  selfChecks: runEngineSelfChecks(),
  checkIns: [],
  realResponses: [],

  userState: defaultUserState,
  activeNotification: defaultNotification,
  simulation: initialSimulation,
  simulationSeed: 1337,
  sideBySideSimulations: null,
  aiExplanation: null,
  isAiGenerating: false,

  guardStream: initialGuardItems,
  digestList: [initialGuardItems[3]],
  digestItems: [initialGuardItems[3]],
  protectedList: [initialGuardItems[0], initialGuardItems[2]],
  attentionSavedTodayMinutes: 47,

  setCurrentView: (view) => set({ currentView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setSelectedGuardDetail: (item) => set({ selectedGuardDetail: item }),

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
    set({ theme });
  },

  setDataSource: (dataSource) => set({ dataSource }),

  setRole: (role) => {
    importanceLearner.setRole(role);
    // Align persona profile with role
    let targetProfile = 'arjun';
    if (role === 'creator') targetProfile = 'meera';
    else if (role === 'student') targetProfile = 'kabir';

    const { activeNotification, userState, twins, simulationSeed, guardStream } = get();
    const currentTwin = twins[targetProfile] || twins.arjun;

    // Rescore active notification with new role prior
    const scoreRes = importanceLearner.score(
      activeNotification.appName,
      activeNotification.type,
      activeNotification.id
    );

    const updatedNotif = {
      ...activeNotification,
      senderImportance: scoreRes.value,
    };

    const newSim = simulate(userState, updatedNotif, currentTwin, simulationSeed);

    // Rescore all guard stream items
    const updatedGuard = guardStream.map((item) => {
      const s = importanceLearner.score(item.appName, item.channel || item.type, item.senderHash);
      const isV = importanceLearner.isVip(item.senderHash || '');
      const itemSim = simulate(
        userState,
        {
          id: item.id,
          appName: item.appName as AppName,
          type: item.type,
          title: item.title,
          body: item.body,
          senderImportance: s.value,
          timestamp: item.timestamp,
        },
        currentTwin
      );
      return {
        ...item,
        senderImportance: s.value,
        importanceConfidence: [s.low, s.high] as [number, number],
        importanceWhy: s.why,
        verdict: itemSim.verdict.decision,
        reason: itemSim.verdict.primaryReason,
        isVip: isV,
      };
    });

    set({
      role,
      activeProfileId: targetProfile,
      activePersona: targetProfile,
      activeNotification: updatedNotif,
      simulation: newSim,
      guardStream: updatedGuard,
      aiExplanation: null,
    });
  },

  setWorkApps: (apps) => {
    importanceLearner.setWorkApps(apps);
    set({ workApps: apps });
  },

  setActiveProfile: (profileId) => {
    const { profiles, twins, userState, activeNotification, simulationSeed } = get();
    const prof = profiles[profileId];
    if (!prof) return;

    if (prof.isProtectedWithPasscode) {
      set({ activeProfileId: profileId, activePersona: profileId, isDeviceLocked: true });
      return;
    }

    const currentTwin = twins[profileId] || twins.arjun;
    const newSim = simulate(userState, activeNotification, currentTwin, simulationSeed);
    set({
      activeProfileId: profileId,
      activePersona: profileId,
      isDeviceLocked: false,
      simulation: newSim,
      aiExplanation: null,
    });
  },

  setActivePersona: (id) => get().setActiveProfile(id),

  finishExperiment: (trials) => {
    get().finishExperimentWithRealMeasurements(trials, 4444);
  },

  resetEverything: () => {
    set({
      checkIns: [],
      realResponses: [],
      twinDiffs: [],
      experimentAnalysis: null,
      activeProfileId: 'arjun',
      activePersona: 'arjun',
      isDeviceLocked: false,
      userState: defaultUserState,
      activeNotification: defaultNotification,
      simulation: initialSimulation,
      attentionSavedTodayMinutes: 47,
    });
  },

  deleteEverything: () => {
    importanceLearner.clearAll();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    set({
      checkIns: [],
      realResponses: [],
      twinDiffs: [],
      experimentAnalysis: null,
      guardStream: initialGuardItems,
      digestList: [initialGuardItems[3]],
      digestItems: [initialGuardItems[3]],
      protectedList: [initialGuardItems[0], initialGuardItems[2]],
      activeProfileId: 'arjun',
      activePersona: 'arjun',
      isDeviceLocked: false,
      userState: defaultUserState,
      activeNotification: defaultNotification,
      simulation: initialSimulation,
      attentionSavedTodayMinutes: 0,
      role: 'developer',
      workApps: ['Slack', 'GitHub'],
    });
  },

  createProfile: async (config, passcode) => {
    const logs = generateSyntheticLogs(config, 42);
    const newTwin = trainTwinFromLogs(logs, 'Simulated persona');
    const newBacktest = runBacktest(config.id as any);

    let passcodeHash: string | undefined;
    let passcodeSalt: string | undefined;
    if (passcode && passcode.length >= 4) {
      const res = await hashPasscode(passcode);
      passcodeHash = res.hashHex;
      passcodeSalt = res.saltHex;
    }

    const newRecord: ProfileRecord = {
      config,
      passcodeHash,
      passcodeSalt,
      isProtectedWithPasscode: !!passcodeHash,
    };

    set((state) => ({
      profiles: { ...state.profiles, [config.id]: newRecord },
      twins: { ...state.twins, [config.id]: newTwin },
      backtestResults: { ...state.backtestResults, [config.id]: newBacktest },
      activeProfileId: config.id,
      currentView: 'app',
      activeTab: 'now',
    }));
  },

  setPasscodeForActiveProfile: async (passcode) => {
    const { activeProfileId, profiles } = get();
    const current = profiles[activeProfileId];
    if (!current) return;

    const res = await hashPasscode(passcode);
    set({
      profiles: {
        ...profiles,
        [activeProfileId]: {
          ...current,
          passcodeHash: res.hashHex,
          passcodeSalt: res.saltHex,
          isProtectedWithPasscode: true,
        },
      },
    });
  },

  unlockWithPasscode: async (passcode) => {
    const { activeProfileId, profiles } = get();
    const prof = profiles[activeProfileId];
    if (!prof || !prof.passcodeHash || !prof.passcodeSalt) {
      set({ isDeviceLocked: false });
      return true;
    }

    const ok = await verifyPasscode(passcode, prof.passcodeSalt, prof.passcodeHash);
    if (ok) {
      set({ isDeviceLocked: false });
      return true;
    }
    return false;
  },

  lockDevice: () => set({ isDeviceLocked: true }),

  resetActiveProfileData: () => {
    const { activeProfileId, profiles } = get();
    const prof = profiles[activeProfileId];
    if (prof) {
      prof.passcodeHash = undefined;
      prof.passcodeSalt = undefined;
      prof.isProtectedWithPasscode = false;
    }
    set({ isDeviceLocked: false });
  },

  setUserState: (partial) => {
    const newState = { ...get().userState, ...partial };
    const { activeNotification, twins, activeProfileId, simulationSeed } = get();
    const currentTwin = twins[activeProfileId] || twins.arjun;
    const newSim = simulate(newState, activeNotification, currentTwin, simulationSeed);
    set({
      userState: newState,
      simulation: newSim,
      aiExplanation: null,
    });
  },

  setActiveNotification: (notif) => {
    const { userState, twins, activeProfileId, simulationSeed } = get();
    const currentTwin = twins[activeProfileId] || twins.arjun;
    const newSim = simulate(userState, notif, currentTwin, simulationSeed);
    set({
      activeNotification: notif,
      simulation: newSim,
      aiExplanation: null,
    });
  },

  runSimulationNow: (customSeed) => {
    const seed = customSeed ?? get().simulationSeed + 1;
    const { userState, activeNotification, twins, activeProfileId } = get();
    const currentTwin = twins[activeProfileId] || twins.arjun;
    const newSim = simulate(userState, activeNotification, currentTwin, seed);
    set({
      simulationSeed: seed,
      simulation: newSim,
      aiExplanation: null,
    });
  },

  runSideBySideSimulations: () => {
    const { userState, activeNotification, twins, simulationSeed } = get();
    const ids = ['arjun', 'meera', 'kabir', 'you'];
    const results: Record<string, SimulationResult> = {};
    ids.forEach((id) => {
      const t = twins[id] || twins.arjun;
      results[id] = simulate(userState, activeNotification, t, simulationSeed);
    });
    set({ sideBySideSimulations: results });
  },

  setJudgeMode: (enabled) => set({ judgeMode: enabled }),
  setQuietMode: (enabled) => set({ quietMode: enabled }),

  startGuidedDemo: () => {
    set({ isGuidedDemoRunning: true, guidedDemoStep: 1, currentView: 'app', activeTab: 'now' });
  },

  stopGuidedDemo: () => {
    set({ isGuidedDemoRunning: false, guidedDemoStep: 0 });
  },

  setGuidedDemoStep: (step) => set({ guidedDemoStep: step }),

  startExperiment: () => set({ isExperimentActive: true }),

  finishExperimentWithRealMeasurements: (trials, seed) => {
    const analysis = analyzeExperiment(trials, seed);
    const { twins, userState, activeNotification, simulationSeed } = get();
    const updatedYou = buildPersonalTwin(twins.arjun, analysis);
    const newSim = simulate(userState, activeNotification, updatedYou, simulationSeed);

    set({
      isExperimentActive: false,
      experimentAnalysis: analysis,
      activeProfileId: 'you',
      twins: {
        ...twins,
        you: updatedYou,
      },
      simulation: newSim,
      activeTab: 'simulate',
    });
  },

  logCheckIn: (type) => {
    const { userState, checkIns, realResponses, twins, activeProfileId } = get();
    const newCheckIn: PersonalCheckIn = {
      timestamp: Date.now(),
      type,
      hour: userState.hour,
    };
    const updatedCheckIns = [...checkIns, newCheckIn];

    const currentTwin = twins[activeProfileId] || twins.arjun;
    const { updatedTwin, diffs } = updateTwinWithPersonalData(currentTwin, updatedCheckIns, realResponses);

    let newFatigue = userState.fatigue;
    if (type === 'flow') newFatigue = Math.max(0.08, userState.fatigue - 0.12);
    else if (type === 'distracted') newFatigue = Math.min(0.85, userState.fatigue + 0.15);
    else if (type === 'tired') newFatigue = Math.min(1.0, userState.fatigue + 0.25);

    const updatedState = { ...userState, fatigue: newFatigue };
    const { activeNotification, simulationSeed } = get();
    const newSim = simulate(updatedState, activeNotification, updatedTwin, simulationSeed);

    set({
      userState: updatedState,
      checkIns: updatedCheckIns,
      twinDiffs: diffs,
      twins: { ...twins, [activeProfileId]: updatedTwin },
      simulation: newSim,
    });
  },

  syncWithIndexedDbTelemetry: async () => {
    const events = await readIndexedDbNotificationEvents();
    if (events.length === 0) return;

    const { checkIns, twins, activeProfileId } = get();
    const currentTwin = twins[activeProfileId] || twins.arjun;
    const { updatedTwin, diffs } = updateTwinWithPersonalData(currentTwin, checkIns, events);

    set({
      realResponses: events,
      twinDiffs: diffs,
      twins: { ...twins, [activeProfileId]: updatedTwin },
    });
  },

  requestNotificationPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported' as any;
    }
    const perm = await Notification.requestPermission();
    set({ notificationPermission: perm });
    return perm;
  },

  sendRealNotification: async (notif) => {
    const { userState, twins, activeProfileId, guardStream, attentionSavedTodayMinutes } = get();
    const currentTwin = twins[activeProfileId] || twins.arjun;
    const sim = simulate(userState, notif, currentTwin);

    const verdict = sim.verdict.decision;
    let status: 'sent' | 'held' | 'batched' | 'suppressed' = 'suppressed';
    let saved = 0;

    if (verdict === 'ALLOW NOW') {
      status = 'sent';
      await sendTestNotification(notif.appName, notif.body);
    } else if (verdict === 'HOLD UNTIL NEXT BREAK') {
      status = 'held';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved));
    } else if (verdict === 'BATCH IN DIGEST') {
      status = 'batched';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved * 0.7));
    } else {
      status = 'suppressed';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved));
    }

    const newItem: GuardStreamItem = {
      id: notif.id,
      appName: notif.appName,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      senderImportance: notif.senderImportance,
      timestamp: Date.now(),
      verdict,
      reason: sim.verdict.primaryReason,
      savedMinutes: saved,
      status,
    };

    set({
      guardStream: [newItem, ...guardStream],
      attentionSavedTodayMinutes: attentionSavedTodayMinutes + saved,
    });
  },

  sendTestNotificationNow: async (title = 'KAIROS Attention Guard', body = 'Focus firewall active: 1 notification held.') => {
    return await sendTestNotification(title, body);
  },

  overrideGuardDecision: (id, override) => {
    const { guardStream, attentionSavedTodayMinutes } = get();
    const updated = guardStream.map((item) => {
      if (item.id === id) {
        return { ...item, userOverride: override };
      }
      return item;
    });

    const delta = override === 'SUPPRESSED' ? 14 : -10;
    set({
      guardStream: updated,
      attentionSavedTodayMinutes: Math.max(0, attentionSavedTodayMinutes + delta),
    });
  },

  recordNotificationFeedback: (id, outcome, explicit = true) => {
    const { guardStream, userState, twins, activeProfileId } = get();
    const target = guardStream.find((g) => g.id === id);
    if (!target) return;

    const oldImportance = target.senderImportance;

    // Record in Bayesian hierarchy
    importanceLearner.recordReaction(
      target.appName,
      target.channel || target.type,
      outcome,
      target.senderHash,
      explicit
    );

    const s = importanceLearner.score(
      target.appName,
      target.channel || target.type,
      target.senderHash
    );

    const currentTwin = twins[activeProfileId] || twins.arjun;
    const newSim = simulate(
      userState,
      {
        id: target.id,
        appName: target.appName as AppName,
        type: target.type,
        title: target.title,
        body: target.body,
        senderImportance: s.value,
        timestamp: target.timestamp,
      },
      currentTwin
    );

    const updated = guardStream.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          userFeedback: outcome,
          senderImportance: s.value,
          importanceConfidence: [s.low, s.high] as [number, number],
          importanceWhy: s.why,
          importanceBefore: oldImportance,
          importanceAfter: s.value,
          verdict: newSim.verdict.decision,
          reason: newSim.verdict.primaryReason,
        };
      }
      return item;
    });

    set({ guardStream: updated });
  },

  toggleSenderVip: (id) => {
    const { guardStream, userState, twins, activeProfileId } = get();
    const target = guardStream.find((g) => g.id === id);
    if (!target || !target.senderHash) return;

    const isVipNow = importanceLearner.toggleVip(target.senderHash);
    const s = importanceLearner.score(
      target.appName,
      target.channel || target.type,
      target.senderHash
    );

    const currentTwin = twins[activeProfileId] || twins.arjun;
    const newSim = simulate(
      userState,
      {
        id: target.id,
        appName: target.appName as AppName,
        type: target.type,
        title: target.title,
        body: target.body,
        senderImportance: s.value,
        timestamp: target.timestamp,
      },
      currentTwin
    );

    const updated = guardStream.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isVip: isVipNow,
          senderImportance: s.value,
          importanceConfidence: [s.low, s.high] as [number, number],
          importanceWhy: s.why,
          verdict: newSim.verdict.decision,
          reason: newSim.verdict.primaryReason,
        };
      }
      return item;
    });

    set({ guardStream: updated });
  },

  releaseDigestNow: () => {
    const { digestList, guardStream } = get();
    if (digestList.length === 0) return;

    sendTestNotification('KAIROS Digest Released', `${digestList.length} batched notifications delivered.`);
    const updated = guardStream.map((item) => {
      if (item.status === 'batched') {
        return { ...item, status: 'sent' as const };
      }
      return item;
    });

    set({
      digestList: [],
      digestItems: [],
      guardStream: updated,
    });
  },

  requestAiExplanation: async () => {
    const { simulation, activeNotification, userState, isAiGenerating } = get();
    if (isAiGenerating) return;

    set({ isAiGenerating: true });
    const res = await explainVerdictWithAi(simulation, activeNotification, userState);
    set({
      aiExplanation: res.explanation,
      aiOnline: res.isAiOnline,
      isAiGenerating: false,
    });
  },

  simulateNaturalLanguageWhatIf: async (queryText) => {
    const { userState, twins, activeProfileId } = get();
    const parsed = await parseWhatIfNaturalLanguage(queryText);

    const scoreRes = importanceLearner.score(parsed.appName, parsed.notifType);

    const notif: NotificationItem = {
      id: `query_${Date.now()}`,
      appName: (parsed.appName as AppName) || 'Instagram',
      type: (parsed.notifType as NotificationType) || 'social_like',
      title: parsed.title,
      body: parsed.body,
      senderImportance: scoreRes.value,
      timestamp: Date.now(),
    };

    const newState = {
      ...userState,
      hour: parsed.hour,
      activity: parsed.activity as ActivityType,
    };

    const currentTwin = twins[activeProfileId] || twins.arjun;
    const sim = simulate(newState, notif, currentTwin);

    set({
      userState: newState,
      activeNotification: notif,
      simulation: sim,
      aiExplanation: null,
    });
  },
}));

// Initialize sensor subscription so incoming notifications (native or mock ~9s) populate the feed
if (typeof window !== 'undefined') {
  subscribe((evt: IncomingNotificationEvent) => {
    const state = useKairosStore.getState();
    const currentTwin = state.twins[state.activeProfileId] || state.twins.arjun;

    const s = importanceLearner.score(evt.appName, evt.channel, evt.senderHash);
    const isV = importanceLearner.isVip(evt.senderHash);

    const notif: NotificationItem = {
      id: evt.id,
      appName: (evt.appName as AppName) || 'Instagram',
      type: channelToNotificationType(evt.channel),
      title: evt.title,
      body: evt.body,
      senderImportance: s.value,
      timestamp: evt.timestamp,
    };

    const sim = simulate(state.userState, notif, currentTwin);
    const verdict = sim.verdict.decision;
    let status: 'sent' | 'held' | 'batched' | 'suppressed' = 'suppressed';
    let saved = 0;

    if (verdict === 'ALLOW NOW') {
      status = 'sent';
    } else if (verdict === 'HOLD UNTIL NEXT BREAK') {
      status = 'held';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved));
    } else if (verdict === 'BATCH IN DIGEST') {
      status = 'batched';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved * 0.7));
    } else {
      status = 'suppressed';
      saved = Math.max(0, Math.round(sim.counterfactual.focusMinutesSaved));
    }

    const newItem: GuardStreamItem = {
      id: evt.id,
      appName: evt.appName,
      type: notif.type,
      channel: evt.channel,
      title: evt.title,
      body: evt.body,
      senderRaw: evt.senderRaw,
      senderHash: evt.senderHash,
      senderImportance: s.value,
      importanceConfidence: [s.low, s.high],
      importanceWhy: s.why,
      timestamp: evt.timestamp,
      verdict,
      reason: sim.verdict.primaryReason,
      savedMinutes: saved,
      status,
      isVip: isV,
    };

    useKairosStore.setState((prev) => {
      const nextStream = [newItem, ...prev.guardStream.slice(0, 49)];
      const nextDigest =
        status === 'batched' ? [newItem, ...prev.digestList.slice(0, 19)] : prev.digestList;
      return {
        guardStream: nextStream,
        digestList: nextDigest,
        digestItems: nextDigest,
        attentionSavedTodayMinutes: prev.attentionSavedTodayMinutes + saved,
      };
    });
  });
}
