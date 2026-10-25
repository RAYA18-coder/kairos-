/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LearnedTwinData,
  NotificationItem,
  UserState,
  VerdictDecision,
  VerdictResult,
} from './types';

export function evaluateDecision(
  state: UserState,
  notification: NotificationItem,
  twin: LearnedTwinData,
  expectedFocusLossMinutes: number,
  learnedUtilityProb: number
): VerdictResult {
  // Utility incorporates learned probActedMeaningfully and senderImportance
  const rawUtility = learnedUtilityProb * 0.7 + notification.senderImportance * 0.3;
  const utilityScore = Math.min(100, Math.round(rawUtility * 100));

  // Attention cost incorporates expected focus loss, mental fatigue, and session focus depth
  const attentionCostScore = Math.min(
    100,
    Math.round(
      expectedFocusLossMinutes * 2.6 +
        state.fatigue * 22 +
        (state.activity === 'coding' || state.activity === 'studying' ? 20 : 5)
    )
  );

  // Predicted break time from learned focus block length
  const predictedBreakMinutes = Math.max(
    5,
    Math.round(twin.meanFocusBlockMinutes - state.minutesIntoFocusBlock)
  );

  // Dynamic factor calculations (computing largest contributing terms)
  const factorPool: { name: string; impact: number }[] = [
    {
      name: `Expected focus loss: ${Math.round(expectedFocusLossMinutes)}m`,
      impact: expectedFocusLossMinutes * 2.6,
    },
    {
      name: `Sender importance: ${Math.round(notification.senderImportance * 100)}%`,
      impact: notification.senderImportance * 40,
    },
    {
      name: `Fatigue baseline: ${Math.round(state.fatigue * 100)}%`,
      impact: state.fatigue * 22,
    },
    {
      name: `Deep focus block (${state.minutesIntoFocusBlock}m active)`,
      impact: state.minutesIntoFocusBlock * 0.5,
    },
    {
      name: `Information utility: ${utilityScore}/100`,
      impact: rawUtility * 35,
    },
  ];
  factorPool.sort((a, b) => b.impact - a.impact);
  const topFactors: [string, string] = [factorPool[0].name, factorPool[1].name];

  let decision: VerdictDecision;
  let primaryReason = '';
  let isSafetyRule = false;

  // Transparent safety rule for OTP (displayed as Safety rule, not learned)
  if (notification.type === 'otp') {
    decision = 'ALLOW NOW';
    primaryReason = 'Safety rule: Time-sensitive authentication codes are never delayed.';
    isSafetyRule = true;
  } else if (rawUtility > 0.82 && state.activity === 'idle') {
    decision = 'ALLOW NOW';
    primaryReason = `High sender importance (${Math.round(notification.senderImportance * 100)}%) arriving during idle cognitive state.`;
  } else if (attentionCostScore >= 52 && rawUtility < 0.38) {
    decision = 'SUPPRESS';
    primaryReason = `Predicted ${Math.round(expectedFocusLossMinutes)}m concentration loss during deep ${state.activity} exceeds utility (${utilityScore}/100).`;
  } else if (rawUtility >= 0.55) {
    decision = 'HOLD UNTIL NEXT BREAK';
    primaryReason = `Valuable message held for natural cognitive pause in ~${predictedBreakMinutes} min to protect active flow.`;
  } else if (rawUtility >= 0.22) {
    decision = 'BATCH IN DIGEST';
    primaryReason = 'Low urgency announcement batched for daily focus digest to prevent resumption lag.';
  } else {
    decision = 'SUPPRESS';
    primaryReason = `Extractive distractor with high fragmentation penalty (${topFactors[0]}).`;
  }

  return {
    decision,
    primaryReason,
    topFactors,
    isSafetyRule,
    predictedBreakMinutes,
    attentionCostScore,
    utilityScore,
  };
}
