/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LearnedTwinData,
  NotificationType,
  ProvenanceBadge,
} from './types';

export interface PersonalCheckIn {
  timestamp: number;
  type: 'flow' | 'distracted' | 'tired';
  hour: number;
}

export interface RealNotificationResponse {
  timestamp: number;
  appName: string;
  type: NotificationType;
  action: 'clicked' | 'dismissed' | 'ignored';
  latencyMs?: number;
}

export interface TwinDiffMetric {
  moduleName: string;
  metricLabel: string;
  priorValue: number;
  personalValue: number;
  deltaPercent: string;
  confidence: string;
}

/**
 * Apply hierarchical online updating combining persona prior with personal signals.
 * Prior is capped at effective strength of 30 pseudo-observations so personal signals dominate.
 */
export function updateTwinWithPersonalData(
  priorTwin: LearnedTwinData,
  checkIns: PersonalCheckIn[],
  notifResponses: RealNotificationResponse[]
): { updatedTwin: LearnedTwinData; diffs: TwinDiffMetric[] } {
  // Deep clone prior twin
  const updated: LearnedTwinData = JSON.parse(JSON.stringify(priorTwin));
  const diffs: TwinDiffMetric[] = [];

  const totalPersonalEvents = checkIns.length + notifResponses.length;
  if (totalPersonalEvents === 0) {
    return { updatedTwin: priorTwin, diffs: [] };
  }

  // 1. Update FocusCurve using check-ins
  const flowCheckIns = checkIns.filter((c) => c.type === 'flow').length;
  const distractedCheckIns = checkIns.filter((c) => c.type === 'distracted' || c.type === 'tired').length;

  const priorMeanFocus =
    priorTwin.focusCurve.data.weekday.reduce((a, b) => a + b.probDeepFocus, 0) / 24;

  if (checkIns.length > 0) {
    // Prior capped at n_prior = 30
    const nPrior = Math.min(30, priorTwin.focusCurve.sampleSize);
    const priorAlpha = priorMeanFocus * nPrior;
    const priorBeta = (1 - priorMeanFocus) * nPrior;

    // Real device events weighted by 2.0x
    const personalWeight = 2.0;
    const newAlpha = priorAlpha + flowCheckIns * personalWeight;
    const newBeta = priorBeta + distractedCheckIns * personalWeight;
    const personalMeanFocus = newAlpha / (newAlpha + newBeta);

    const shift = personalMeanFocus - priorMeanFocus;
    updated.focusCurve.data.weekday.forEach((pt) => {
      pt.probDeepFocus = Math.min(0.98, Math.max(0.04, pt.probDeepFocus + shift * 0.4));
    });

    diffs.push({
      moduleName: 'Focus Curve',
      metricLabel: 'Mean Deep Flow Probability',
      priorValue: Math.round(priorMeanFocus * 100),
      personalValue: Math.round(personalMeanFocus * 100),
      deltaPercent: `${shift >= 0 ? '+' : ''}${Math.round(shift * 100)}%`,
      confidence: totalPersonalEvents >= 10 ? 'High' : 'Evolving (leaning on prior)',
    });
  }

  // 2. Update Interruption Model from real notification responses
  if (notifResponses.length > 0) {
    const priorOpenProb = 0.58;
    const clickedCount = notifResponses.filter((r) => r.action === 'clicked').length;
    const totalNotifs = notifResponses.length;

    // Beta-binomial update with capped prior (n=30)
    const nPrior = 30;
    const updatedOpenRate = (priorOpenProb * nPrior + clickedCount * 2) / (nPrior + totalNotifs * 2);

    const delta = updatedOpenRate - priorOpenProb;
    updated.interruptionModel.data.bias += delta * 0.5;

    diffs.push({
      moduleName: 'Interruption Model',
      metricLabel: 'Overall Notification Open Rate',
      priorValue: Math.round(priorOpenProb * 100),
      personalValue: Math.round(updatedOpenRate * 100),
      deltaPercent: `${delta >= 0 ? '+' : ''}${Math.round(delta * 100)}%`,
      confidence: totalNotifs >= 8 ? 'High' : 'Evolving',
    });
  }

  // Update provenance badge
  updated.focusCurve.provenance = 'You: your device';
  updated.interruptionModel.provenance = 'You: your device';
  updated.focusCurve.confidence = totalPersonalEvents >= 15 ? 'high' : 'medium';

  return { updatedTwin: updated, diffs };
}
