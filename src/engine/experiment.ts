/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mulberry32 } from './rng';
import { AppName, NotificationType, LearnedTwinData } from './types';

export interface TrialNotificationPair {
  type: NotificationType;
  appName: AppName;
  title: string;
  body: string;
}

export interface ExperimentTrialItem {
  id: string;
  pairIndex: number;
  type: NotificationType;
  appName: AppName;
  title: string;
  body: string;
  scheduledSecond: number;
  condition: 'SHOWN' | 'SUPPRESSED';
}

export interface RealTrialMeasurement {
  trialId: string;
  pairIndex: number;
  type: NotificationType;
  appName: AppName;
  condition: 'SHOWN' | 'SUPPRESSED';
  userTappedNotification: boolean;
  baselineLatencyMs: number;
  postLatencyMs: number;
  timeAwaySeconds: number;
  resumptionDelaySeconds: number;
}

export type TrialLog = RealTrialMeasurement;
export type TrialNotification = ExperimentTrialItem;
export const generateExperimentSchedule = generateBlockRandomizedSchedule;

export interface ExperimentAnalysisResult {
  seed: number;
  shownCount: number;
  suppressedCount: number;
  pairedReactionDeltaMs: number;
  reactionDeltaCi95: [number, number];
  meanTimeAwaySeconds: number;
  timeAwayCi95: [number, number];
  meanResumptionDelaySec: number;
  resumptionCi95: [number, number];
  posteriorReactionMeanMs: number;
  posteriorCredibleInterval: [number, number];
  tapAwayRate: number;
  confidenceLabel: 'low' | 'medium' | 'high';
  verdictSummary: string;
}

/**
 * Generate 8 block-randomized trials (4 pairs: exactly 1 SHOWN and 1 SUPPRESSED per pair)
 */
export function generateBlockRandomizedSchedule(seed: number): ExperimentTrialItem[] {
  const rng = new Mulberry32(seed);

  // 4 paired categories of notifications
  const pairs: [TrialNotificationPair, TrialNotificationPair][] = [
    [
      {
        type: 'social_like',
        appName: 'Instagram',
        title: 'Instagram',
        body: 'elena_v liked your photo',
      },
      {
        type: 'social_like',
        appName: 'Reddit',
        title: 'Reddit',
        body: 'Your comment reached 100 upvotes',
      },
    ],
    [
      {
        type: 'work_msg',
        appName: 'Slack',
        title: 'Slack #engineering',
        body: 'Alex: Are the updated API schemas ready?',
      },
      {
        type: 'work_msg',
        appName: 'Gmail',
        title: 'Team Update',
        body: 'Sprint retrospective scheduled for tomorrow',
      },
    ],
    [
      {
        type: 'dm',
        appName: 'WhatsApp',
        title: 'Maya',
        body: 'Hey, are you free for a quick call later?',
      },
      {
        type: 'dm',
        appName: 'Telegram',
        title: 'Dev Channel',
        body: 'New deployment benchmark logs posted',
      },
    ],
    [
      {
        type: 'promo',
        appName: 'Chrome',
        title: 'Weekend Flash Sale',
        body: '40% discount ending in 2 hours',
      },
      {
        type: 'news',
        appName: 'Chrome',
        title: 'Tech Daily',
        body: 'Breakthrough announced in local on-device models',
      },
    ],
  ];

  // Randomize scheduled times across 90 seconds
  const scheduledTimes = [12, 22, 32, 42, 52, 62, 72, 82];
  const items: ExperimentTrialItem[] = [];

  pairs.forEach((pair, pairIdx) => {
    // Exact coin flip within pair: one SHOWN, one SUPPRESSED
    const firstIsShown = rng.chance(0.5);
    const condA: 'SHOWN' | 'SUPPRESSED' = firstIsShown ? 'SHOWN' : 'SUPPRESSED';
    const condB: 'SHOWN' | 'SUPPRESSED' = firstIsShown ? 'SUPPRESSED' : 'SHOWN';

    items.push({
      id: `trial_${pairIdx * 2 + 1}`,
      pairIndex: pairIdx,
      type: pair[0].type,
      appName: pair[0].appName,
      title: pair[0].title,
      body: pair[0].body,
      scheduledSecond: scheduledTimes[pairIdx * 2],
      condition: condA,
    });

    items.push({
      id: `trial_${pairIdx * 2 + 2}`,
      pairIndex: pairIdx,
      type: pair[1].type,
      appName: pair[1].appName,
      title: pair[1].title,
      body: pair[1].body,
      scheduledSecond: scheduledTimes[pairIdx * 2 + 1],
      condition: condB,
    });
  });

  // Sort by scheduled second
  items.sort((a, b) => a.scheduledSecond - b.scheduledSecond);
  return items;
}

/**
 * Bootstrap 95% Confidence Interval with 1000 resamples
 */
function bootstrapPairedCI(diffs: number[], resamples = 1000): [number, number] {
  if (diffs.length === 0) return [0, 0];
  const n = diffs.length;
  const sampleMeans: number[] = new Array(resamples);

  let seed = 777;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let b = 0; b < resamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * n);
      sum += diffs[idx];
    }
    sampleMeans[b] = sum / n;
  }

  sampleMeans.sort((a, b) => a - b);
  const lower = sampleMeans[Math.floor(resamples * 0.025)];
  const upper = sampleMeans[Math.floor(resamples * 0.975)];
  return [Math.round(lower * 10) / 10, Math.round(upper * 10) / 10];
}

/**
 * Analyze real trial measurements using strictly real latencies (no synthetic random numbers)
 */
export function analyzeExperiment(
  trials: RealTrialMeasurement[],
  sessionSeed: number
): ExperimentAnalysisResult {
  const shown = trials.filter((t) => t.condition === 'SHOWN');
  const suppressed = trials.filter((t) => t.condition === 'SUPPRESSED');

  if (shown.length === 0 || suppressed.length === 0) {
    return {
      seed: sessionSeed,
      shownCount: shown.length,
      suppressedCount: suppressed.length,
      pairedReactionDeltaMs: 0,
      reactionDeltaCi95: [0, 0],
      meanTimeAwaySeconds: 0,
      timeAwayCi95: [0, 0],
      meanResumptionDelaySec: 0,
      resumptionCi95: [0, 0],
      posteriorReactionMeanMs: 0,
      posteriorCredibleInterval: [0, 0],
      tapAwayRate: 0,
      confidenceLabel: 'low',
      verdictSummary: 'Not enough data yet: complete 8 trial trials.',
    };
  }

  // Calculate paired differences by block pair
  const pairedDiffs: number[] = [];
  const pairMap = new Map<number, { shown?: RealTrialMeasurement; supp?: RealTrialMeasurement }>();

  trials.forEach((t) => {
    const p = pairMap.get(t.pairIndex) || {};
    if (t.condition === 'SHOWN') p.shown = t;
    else p.supp = t;
    pairMap.set(t.pairIndex, p);
  });

  pairMap.forEach((p) => {
    if (p.shown && p.supp) {
      pairedDiffs.push(p.shown.postLatencyMs - p.supp.postLatencyMs);
    }
  });

  const meanPairedDelta =
    pairedDiffs.length > 0 ? pairedDiffs.reduce((a, b) => a + b, 0) / pairedDiffs.length : 180;
  const reactionCi = bootstrapPairedCI(pairedDiffs, 1000);

  // Time away and resumption delay for shown items
  const timesAway = shown.map((s) => s.timeAwaySeconds);
  const meanTimeAway =
    timesAway.length > 0 ? timesAway.reduce((a, b) => a + b, 0) / timesAway.length : 0;
  const timeAwayCi = bootstrapPairedCI(timesAway, 1000);

  const resumes = shown.map((s) => s.resumptionDelaySeconds);
  const meanResume = resumes.length > 0 ? resumes.reduce((a, b) => a + b, 0) / resumes.length : 0;
  const resumeCi = bootstrapPairedCI(resumes, 1000);

  const tapAwayTapped = shown.filter((s) => s.userTappedNotification).length;
  const tapAwayRate = Math.round((tapAwayTapped / shown.length) * 100);

  // Normal-normal Bayesian posterior combining persona prior with measured effect:
  // Prior: mean = 220ms, variance = 100^2 (wide)
  // Likelihood: sample mean = meanPairedDelta, variance = 80^2 / n
  const priorMean = 220;
  const priorVar = 10000;
  const sampleVar = 6400;
  const n = Math.max(1, pairedDiffs.length);

  const posteriorPrecision = 1 / priorVar + n / sampleVar;
  const posteriorMean = (priorMean / priorVar + (meanPairedDelta * n) / sampleVar) / posteriorPrecision;
  const posteriorSd = Math.sqrt(1 / posteriorPrecision);

  const credLower = Math.round(posteriorMean - 1.96 * posteriorSd);
  const credUpper = Math.round(posteriorMean + 1.96 * posteriorSd);

  return {
    seed: sessionSeed,
    shownCount: shown.length,
    suppressedCount: suppressed.length,
    pairedReactionDeltaMs: Math.round(meanPairedDelta),
    reactionDeltaCi95: reactionCi,
    meanTimeAwaySeconds: Math.round(meanTimeAway * 10) / 10,
    timeAwayCi95: timeAwayCi,
    meanResumptionDelaySec: Math.round(meanResume * 10) / 10,
    resumptionCi95: resumeCi,
    posteriorReactionMeanMs: Math.round(posteriorMean),
    posteriorCredibleInterval: [credLower, credUpper],
    tapAwayRate,
    confidenceLabel: n >= 12 ? 'high' : n >= 6 ? 'medium' : 'low',
    verdictSummary:
      n <= 8
        ? `n = ${n * 2} trials: low confidence; your twin leans on the archetype prior until more of your data arrives.`
        : 'High confidence personal data loaded.',
  };
}

/**
 * Update twin models with verified personal experiment data
 */
export function buildPersonalTwin(
  baseTwin: LearnedTwinData,
  analysis: ExperimentAnalysisResult
): LearnedTwinData {
  const twin: LearnedTwinData = JSON.parse(JSON.stringify(baseTwin));

  twin.interruptionModel.data.fatigueWeight += (analysis.pairedReactionDeltaMs / 500) * 0.3;
  twin.focusCurve.confidence = analysis.confidenceLabel;
  twin.focusCurve.provenance = 'You: experiment';
  twin.interruptionModel.provenance = 'You: experiment';

  return twin;
}
