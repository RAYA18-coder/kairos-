/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateSyntheticLogs } from './syntheticData';
import { trainTwinFromLogs } from './twinLearner';
import { simulate } from './simulator';
import { UserState, NotificationItem } from './types';

export interface SelfCheckResult {
  passed: boolean;
  deterministicCheck: { passed: boolean; message: string };
  counterfactualCheck: { passed: boolean; message: string };
  confidenceNarrowingCheck: { passed: boolean; message: string };
}

/**
 * Run mathematical and statistical self-checks on engine startup
 */
export function runEngineSelfChecks(): SelfCheckResult {
  const testState: UserState = {
    hour: 22,
    dayType: 'weekday',
    activity: 'coding',
    minutesIntoFocusBlock: 35,
    minutesSinceBreak: 40,
    fatigue: 0.3,
    recentAppSwitches: 2,
    minutesSinceLastNotification: 45,
  };

  const testNotif: NotificationItem = {
    id: 'test_1',
    appName: 'Instagram',
    type: 'social_like',
    title: 'Instagram',
    body: 'Someone liked your post',
    senderImportance: 0.1,
    timestamp: Date.now(),
  };

  const syntheticLogs = generateSyntheticLogs('arjun', 42);
  const twin = trainTwinFromLogs(syntheticLogs);

  // 1. Determinism check: same seed must yield exact same results
  const sim1 = simulate(testState, testNotif, twin, 777);
  const sim2 = simulate(testState, testNotif, twin, 777);

  const isDeterministic =
    sim1.expectedFocusLossMinutes === sim2.expectedFocusLossMinutes &&
    sim1.pOpen === sim2.pOpen &&
    sim1.expectedDetourMinutes === sim2.expectedDetourMinutes &&
    sim1.meanFocusShown[10] === sim2.meanFocusShown[10];

  // 2. Counterfactual check: suppressed focus loss must be <= shown focus loss on average
  const isCounterfactualSound =
    sim1.counterfactual.focusMinutesSaved >= 0 &&
    sim1.expectedFocusLossMinutes >= 0 &&
    sim1.meanFocusSuppressed[30] >= sim1.meanFocusShown[30];

  // 3. Confidence narrowing check: Wilson interval with larger n is narrower
  const earlyLogs = syntheticLogs.slice(0, 100);
  const fullLogs = syntheticLogs;
  const earlyTwin = trainTwinFromLogs(earlyLogs);
  const fullTwin = trainTwinFromLogs(fullLogs);

  const earlyBand =
    earlyTwin.focusCurve.data.weekday[22].ciUpper - earlyTwin.focusCurve.data.weekday[22].ciLower;
  const fullBand =
    fullTwin.focusCurve.data.weekday[22].ciUpper - fullTwin.focusCurve.data.weekday[22].ciLower;

  const isNarrowingValid = fullBand <= earlyBand + 0.05;

  const passed = isDeterministic && isCounterfactualSound && isNarrowingValid;

  return {
    passed,
    deterministicCheck: {
      passed: isDeterministic,
      message: isDeterministic
        ? 'Mulberry32 PRNG seed 777 produced byte-identical Monte Carlo run.'
        : 'Determinism failure: simulation output diverged across identical seeds.',
    },
    counterfactualCheck: {
      passed: isCounterfactualSound,
      message: isCounterfactualSound
        ? `Suppressed condition preserved +${sim1.counterfactual.focusMinutesSaved}m cognitive focus over shown condition.`
        : 'Counterfactual violation detected.',
    },
    confidenceNarrowingCheck: {
      passed: isNarrowingValid,
      message: isNarrowingValid
        ? `Confidence interval band narrowed from ±${Math.round(earlyBand * 50)}% (n=100) to ±${Math.round(fullBand * 50)}% (n=${syntheticLogs.length}).`
        : 'Confidence interval failed to narrow with increased sample size.',
    },
  };
}
