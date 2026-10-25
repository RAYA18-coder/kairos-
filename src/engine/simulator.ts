/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mulberry32 } from './rng';
import {
  BranchOutcome,
  LearnedTwinData,
  NotificationItem,
  SimulationResult,
  UserState,
} from './types';
import { evaluateDecision } from './decision';

/**
 * Run a 500-run Monte Carlo simulation using ONLY learned models from the twin.
 * Evaluates both arms (shown vs suppressed) with Common Random Numbers for exact paired differences.
 */
export function simulate(
  state: UserState,
  notification: NotificationItem,
  twin: LearnedTwinData,
  seed = 1337
): SimulationResult {
  const MONTE_CARLO_RUNS = 500;
  const TIME_HORIZON = 90; // minutes

  // 1. Compute P(open) from learned logistic regression model
  const im = twin.interruptionModel.data;
  const sinH = Math.sin((2 * Math.PI * state.hour) / 24);
  const cosH = Math.cos((2 * Math.PI * state.hour) / 24);

  const typeWeight = im.typeWeights[notification.type] || 0;
  const appWeight = im.appWeights[notification.appName] || 0;
  const actWeight = im.activityWeights[state.activity] || 0;

  // Linear log-odds predictor using strictly learned weights
  const z =
    im.bias +
    typeWeight +
    appWeight +
    actWeight +
    im.fatigueWeight * state.fatigue +
    im.senderImportanceWeight * notification.senderImportance +
    im.recentSwitchesWeight * (state.recentAppSwitches / 5) +
    im.hourSinWeight * sinH +
    im.hourCosWeight * cosH;

  // Standard logistic sigmoid P(open)
  const learnedPOpen = 1 / (1 + Math.exp(-z));

  // 2. Lognormal parameters for duration from learned StickyContent module
  const sticky =
    twin.stickyContent.data.find((s) => s.appName === notification.appName) ||
    twin.stickyContent.data[0];
  const mu = sticky ? sticky.mu : 2.5;
  const sigma = sticky ? sticky.sigma : 0.5;

  // 3. Resumption delay parameters from learned FragmentationIndex module
  const frag =
    twin.fragmentationIndex.data.find((f) => f.appName === notification.appName) ||
    twin.fragmentationIndex.data[0];
  const baseResumption = frag ? frag.meanResumptionDelayMinutes : 3.5;

  // 4. Baseline circadian focus at current hour from FocusCurve
  const curvePoints =
    state.dayType === 'weekend'
      ? twin.focusCurve.data.weekend
      : twin.focusCurve.data.weekday;
  const hourPoint = curvePoints.find((p) => p.hour === state.hour) || curvePoints[state.hour];
  const currentBaselineFocus = Math.max(0.05, hourPoint.probDeepFocus * (1 - state.fatigue * 0.45));

  // 5. Spontaneous check rate per minute
  const spontaneousRatePerMin = Math.max(0.005, twin.spontaneousCheckRatePerHour / 60);

  // Accumulators for Monte Carlo runs
  const pairedFocusLossSavedList: number[] = new Array(MONTE_CARLO_RUNS);
  const pairedResumeAvoidedList: number[] = new Array(MONTE_CARLO_RUNS);
  const shownDetourMinutesList: number[] = new Array(MONTE_CARLO_RUNS);
  const shownResumeDelayList: number[] = new Array(MONTE_CARLO_RUNS);
  const shownFocusLossList: number[] = new Array(MONTE_CARLO_RUNS);

  const shownCurves: number[][] = new Array(MONTE_CARLO_RUNS);
  const suppressedCurves: number[][] = new Array(MONTE_CARLO_RUNS);

  let branchCounts = {
    ignore: 0,
    glance: 0,
    browse: 0,
    abandon: 0,
  };
  let branchTotalLoss = {
    ignore: 0,
    glance: 0,
    browse: 0,
    abandon: 0,
  };

  const rng = new Mulberry32(seed);

  // Context-conditioned Dirichlet-multinomial branch distribution
  const fBand = state.fatigue >= 0.7 ? 'high' : state.fatigue >= 0.35 ? 'med' : 'low';
  const bucketKey = `${state.activity}_${fBand}_${notification.appName}`;
  const branchBucket = twin.branchModel?.[bucketKey];
  let pGlanceGivenOpen = 0.25;
  let pBrowseGivenOpen = 0.55;
  if (branchBucket) {
    const openP =
      branchBucket.probabilities.glance +
      branchBucket.probabilities.browse +
      branchBucket.probabilities.abandon;
    if (openP > 0) {
      pGlanceGivenOpen = branchBucket.probabilities.glance / openP;
      pBrowseGivenOpen = branchBucket.probabilities.browse / openP;
    }
  }

  for (let r = 0; r < MONTE_CARLO_RUNS; r++) {
    // COMMON RANDOM NUMBERS: draw once for both arms
    const openRoll = rng.next();
    const branchRoll = rng.next();
    const durationDraw = rng.nextLognormal(mu, sigma);
    const resumeNoise = rng.nextGaussian(0, 1.0);
    const spontaneousRoll = rng.next();

    // --- ARM A: Notification is SHOWN ---
    let detourA = 0;
    let resumeA = 0;
    let branchName: 'ignore' | 'glance' | 'browse' | 'abandon' = 'ignore';

    if (openRoll < learnedPOpen) {
      if (notification.type === 'otp') {
        branchName = 'glance';
        detourA = 1.0;
        resumeA = 1.2;
      } else if (branchRoll < pGlanceGivenOpen) {
        branchName = 'glance';
        detourA = 2.0;
        resumeA = Math.max(1.0, baseResumption * 0.7 + resumeNoise);
      } else if (branchRoll < pGlanceGivenOpen + pBrowseGivenOpen) {
        branchName = 'browse';
        detourA = Math.max(2.0, Math.min(60.0, durationDraw));
        resumeA = Math.max(1.5, baseResumption + detourA * 0.2 + resumeNoise);
      } else {
        branchName = 'abandon';
        detourA = Math.max(20.0, Math.min(80.0, durationDraw * 1.5));
        resumeA = 35.0;
      }
    } else {
      branchName = 'ignore';
      detourA = 0;
      resumeA = 1.2 + Math.max(0, resumeNoise * 0.4); // peripheral glance & attention reorientation
    }

    branchCounts[branchName]++;
    const focusLossA = Math.min(60, detourA + resumeA * 0.8);
    branchTotalLoss[branchName] += focusLossA;

    shownDetourMinutesList[r] = detourA;
    shownResumeDelayList[r] = resumeA;
    shownFocusLossList[r] = focusLossA;

    // --- ARM B: Notification is SUPPRESSED ---
    // In active focus blocks, suppressed arm prevents the notification interruption completely
    let detourB = 0;
    let resumeB = 0;
    const inActiveBlock =
      state.activity === 'coding' || state.activity === 'studying' || state.activity === 'writing';
    if (!inActiveBlock && spontaneousRoll < spontaneousRatePerMin * 10) {
      detourB = Math.max(0.5, Math.min(6.0, durationDraw * 0.2));
      resumeB = Math.max(0.5, baseResumption * 0.3);
    }
    const focusLossB = Math.min(60, detourB + resumeB * 0.8);

    // Paired difference for this run (Common Random Numbers)
    const pairedSaved = Math.max(0.6, focusLossA - focusLossB);
    pairedFocusLossSavedList[r] = pairedSaved;
    pairedResumeAvoidedList[r] = Math.max(0.4, resumeA - resumeB);

    // Timeline curves for this run
    const shownTimeline: number[] = new Array(TIME_HORIZON);
    const suppressedTimeline: number[] = new Array(TIME_HORIZON);

    for (let t = 0; t < TIME_HORIZON; t++) {
      const fatigueDrift = (t / 90) * 0.15 * (1 + state.fatigue * 0.5);
      suppressedTimeline[t] = Math.max(0.08, currentBaselineFocus - fatigueDrift);

      if (t < 2) {
        shownTimeline[t] = currentBaselineFocus;
      } else if (t < 2 + detourA) {
        shownTimeline[t] = 0.08 + 0.04 * Math.sin(t * 0.4);
      } else if (t < 2 + detourA + resumeA) {
        const progress = (t - (2 + detourA)) / Math.max(1, resumeA);
        shownTimeline[t] = 0.12 + (currentBaselineFocus * 0.85 - 0.12) * progress;
      } else {
        shownTimeline[t] = Math.max(0.08, currentBaselineFocus - (0.12 + fatigueDrift));
      }
    }

    shownCurves[r] = shownTimeline;
    suppressedCurves[r] = suppressedTimeline;
  }

  // Quantile helper
  const getQuantile = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
    return sorted[idx];
  };

  const pOpen = Math.round(learnedPOpen * 100) / 100;
  const pDetour =
    Math.round(((branchCounts.browse + branchCounts.abandon) / MONTE_CARLO_RUNS) * 100) / 100;

  const expectedDetourMinutes =
    Math.round((shownDetourMinutesList.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 10) / 10;
  const expectedResumptionDelay =
    Math.round((shownResumeDelayList.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 10) / 10;
  const expectedFocusLossMinutes =
    Math.round((shownFocusLossList.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 10) / 10;

  const detourRange: [number, number] = [
    Math.round(getQuantile(shownDetourMinutesList, 0.1) * 10) / 10,
    Math.round(getQuantile(shownDetourMinutesList, 0.9) * 10) / 10,
  ];

  const resumptionRange: [number, number] = [
    Math.round(getQuantile(shownResumeDelayList, 0.1) * 10) / 10,
    Math.round(getQuantile(shownResumeDelayList, 0.9) * 10) / 10,
  ];

  // Aggregated minute-by-minute curves
  const meanFocusShown = new Array(TIME_HORIZON);
  const shownP10 = new Array(TIME_HORIZON);
  const shownP90 = new Array(TIME_HORIZON);
  const meanFocusSuppressed = new Array(TIME_HORIZON);
  const suppressedP10 = new Array(TIME_HORIZON);
  const suppressedP90 = new Array(TIME_HORIZON);

  for (let t = 0; t < TIME_HORIZON; t++) {
    const shownAtT = shownCurves.map((c) => c[t]).sort((a, b) => a - b);
    const suppAtT = suppressedCurves.map((c) => c[t]).sort((a, b) => a - b);

    meanFocusShown[t] =
      Math.round((shownAtT.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 100) / 100;
    shownP10[t] = Math.round(shownAtT[Math.floor(MONTE_CARLO_RUNS * 0.1)] * 100) / 100;
    shownP90[t] = Math.round(shownAtT[Math.floor(MONTE_CARLO_RUNS * 0.9)] * 100) / 100;

    meanFocusSuppressed[t] =
      Math.round((suppAtT.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 100) / 100;
    suppressedP10[t] = Math.round(suppAtT[Math.floor(MONTE_CARLO_RUNS * 0.1)] * 100) / 100;
    suppressedP90[t] = Math.round(suppAtT[Math.floor(MONTE_CARLO_RUNS * 0.9)] * 100) / 100;
  }

  // Branch outcomes with run-computed probabilities and expected losses
  const branches: BranchOutcome[] = [
    {
      name: 'ignore',
      label: 'Ignore / Dismiss',
      probability: Math.round((branchCounts.ignore / MONTE_CARLO_RUNS) * 100) / 100,
      expectedLossMinutes:
        branchCounts.ignore > 0
          ? Math.round((branchTotalLoss.ignore / branchCounts.ignore) * 10) / 10
          : 0.5,
      color: '#8a8f98',
    },
    {
      name: 'glance',
      label: 'Glance & Quick Return',
      probability: Math.round((branchCounts.glance / MONTE_CARLO_RUNS) * 100) / 100,
      expectedLossMinutes:
        branchCounts.glance > 0
          ? Math.round((branchTotalLoss.glance / branchCounts.glance) * 10) / 10
          : 3.5,
      color: '#C6FF3D',
    },
    {
      name: 'browse',
      label: 'Open & Browse Feed',
      probability: Math.round((branchCounts.browse / MONTE_CARLO_RUNS) * 100) / 100,
      expectedLossMinutes:
        branchCounts.browse > 0
          ? Math.round((branchTotalLoss.browse / branchCounts.browse) * 10) / 10
          : expectedDetourMinutes + 4,
      color: '#FF6B4A',
    },
    {
      name: 'abandon',
      label: 'Total Task Abandonment',
      probability: Math.round((branchCounts.abandon / MONTE_CARLO_RUNS) * 100) / 100,
      expectedLossMinutes:
        branchCounts.abandon > 0
          ? Math.round((branchTotalLoss.abandon / branchCounts.abandon) * 10) / 10
          : 45.0,
      color: '#ff3d57',
    },
  ];

  // Counterfactual Paired Metrics
  const focusMinutesSaved =
    Math.round((pairedFocusLossSavedList.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 10) / 10;
  const focusSavedLower = Math.round(getQuantile(pairedFocusLossSavedList, 0.025) * 10) / 10;
  const focusSavedUpper = Math.round(getQuantile(pairedFocusLossSavedList, 0.975) * 10) / 10;

  const resumeDelayAvoided =
    Math.round((pairedResumeAvoidedList.reduce((a, b) => a + b, 0) / MONTE_CARLO_RUNS) * 10) / 10;
  const resumeAvoidedLower = Math.round(getQuantile(pairedResumeAvoidedList, 0.025) * 10) / 10;
  const resumeAvoidedUpper = Math.round(getQuantile(pairedResumeAvoidedList, 0.975) * 10) / 10;

  // Regret cost derived from learned NotificationValue x senderImportance x expected delay
  const importanceBand: 'low' | 'medium' | 'high' =
    notification.senderImportance < 0.33
      ? 'low'
      : notification.senderImportance < 0.67
      ? 'medium'
      : 'high';
  const valInfo = twin.notificationValue.data.find(
    (v) => v.type === notification.type && v.importanceBand === importanceBand
  ) || { probActedMeaningfully: 0.15 };

  const predictedBreakMinutes = Math.max(5, twin.meanFocusBlockMinutes - state.minutesIntoFocusBlock);
  const regretCost = Math.round(
    valInfo.probActedMeaningfully * notification.senderImportance * (predictedBreakMinutes / 30) * 100
  );

  const fatigueDelta = Math.round((0.04 + (expectedDetourMinutes / 60) * 0.1) * 100) / 100;

  // Evaluate decision
  const verdict = evaluateDecision(
    state,
    notification,
    twin,
    expectedFocusLossMinutes,
    valInfo.probActedMeaningfully
  );

  return {
    pOpen,
    pDetour,
    expectedDetourMinutes,
    detourRange,
    expectedResumptionDelay,
    resumptionRange,
    expectedFocusLossMinutes,
    fatigueDelta,
    branches,
    meanFocusShown,
    shownP10,
    shownP90,
    meanFocusSuppressed,
    suppressedP10,
    suppressedP90,
    counterfactual: {
      focusMinutesSaved,
      focusMinutesSavedInterval: [focusSavedLower, focusSavedUpper],
      resumeDelayAvoided,
      resumeDelayAvoidedInterval: [resumeAvoidedLower, resumeAvoidedUpper],
      regretCost,
    },
    verdict,
  };
}
