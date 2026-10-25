/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mulberry32 } from './rng';
import {
  ActivityType,
  AppName,
  ArchetypeId,
  Chronotype,
  ContentType,
  NotificationType,
  PersonaId,
  PersonaProfileConfig,
  Sensitivity,
  SyntheticEvent,
} from './types';
import { HIDDEN_ARCHETYPES, HiddenArchetypeParams } from './hiddenGroundTruth';

export interface DerivedGroundTruth extends HiddenArchetypeParams {
  personaId: string;
  chronotype: Chronotype;
  biggestSinkApp: AppName;
  sensitivity: Sensitivity;
  importantSenders: string[];
}

export function buildDerivedGroundTruth(config: PersonaProfileConfig): DerivedGroundTruth {
  const base = HIDDEN_ARCHETYPES[config.archetype] || HIDDEN_ARCHETYPES.coder;
  const clone = JSON.parse(JSON.stringify(base)) as HiddenArchetypeParams;

  // Chronotype adjustment: shift peak hours
  const hourlyFocus = [...clone.baseHourlyFocus];
  if (config.chronotype === 'early') {
    // Peak 07:00 - 12:00
    for (let h = 0; h < 24; h++) {
      if (h >= 6 && h <= 12) hourlyFocus[h] = Math.min(0.95, hourlyFocus[h] * 1.3);
      else if (h >= 20 || h <= 4) hourlyFocus[h] = Math.max(0.05, hourlyFocus[h] * 0.4);
    }
  } else if (config.chronotype === 'night') {
    // Peak 20:00 - 02:00
    for (let h = 0; h < 24; h++) {
      if (h >= 20 || h <= 2) hourlyFocus[h] = Math.min(0.95, hourlyFocus[h] * 1.3);
      else if (h >= 6 && h <= 11) hourlyFocus[h] = Math.max(0.05, hourlyFocus[h] * 0.5);
    }
  } else if (config.chronotype === 'split') {
    // Two peaks: morning 06:00 - 09:00 and evening 19:00 - 22:00
    for (let h = 0; h < 24; h++) {
      if ((h >= 6 && h <= 9) || (h >= 19 && h <= 22)) {
        hourlyFocus[h] = Math.min(0.95, hourlyFocus[h] * 1.25);
      } else if (h >= 12 && h <= 16) {
        hourlyFocus[h] = Math.max(0.2, hourlyFocus[h] * 0.7);
      }
    }
  }
  clone.baseHourlyFocus = hourlyFocus;

  // Sensitivity adjustment on open propensity
  const sensMultiplier =
    config.sensitivity === 'high' ? 1.15 : config.sensitivity === 'low' ? 0.85 : 1.0;
  (Object.keys(clone.baseOpenPropensities) as NotificationType[]).forEach((type) => {
    clone.baseOpenPropensities[type] = Math.min(
      0.99,
      Math.max(0.05, clone.baseOpenPropensities[type] * sensMultiplier)
    );
  });

  // Boost stickiness of biggest sink app
  if (clone.appLognormals[config.biggestSinkApp]) {
    clone.appLognormals[config.biggestSinkApp].mu += 0.35;
  }

  return {
    ...clone,
    personaId: config.id,
    chronotype: config.chronotype,
    biggestSinkApp: config.biggestSinkApp,
    sensitivity: config.sensitivity,
    importantSenders: config.importantSenders,
  };
}

export const PRESET_PERSONA_CONFIGS: Record<'arjun' | 'meera' | 'kabir' | 'rohan', PersonaProfileConfig> = {
  arjun: {
    id: 'arjun',
    name: 'Arjun',
    archetype: 'coder',
    chronotype: 'night',
    biggestSinkApp: 'Instagram',
    sensitivity: 'high',
    importantSenders: ['boss', 'github', 'bank'],
    accentColor: '#C6FF3D',
  },
  meera: {
    id: 'meera',
    name: 'Meera',
    archetype: 'designer',
    chronotype: 'early',
    biggestSinkApp: 'YouTube',
    sensitivity: 'med',
    importantSenders: ['client', 'slack', 'bank'],
    accentColor: '#FF6B4A',
  },
  kabir: {
    id: 'kabir',
    name: 'Kabir',
    archetype: 'exam_aspirant',
    chronotype: 'split',
    biggestSinkApp: 'Reddit',
    sensitivity: 'high',
    importantSenders: ['mentor', 'telegram', 'bank'],
    accentColor: '#38BDF8',
  },
  rohan: {
    id: 'rohan',
    name: 'Rohan',
    archetype: 'founder',
    chronotype: 'early',
    biggestSinkApp: 'Slack',
    sensitivity: 'high',
    importantSenders: ['investor', 'co-founder', 'board'],
    accentColor: '#F59E0B',
  },
};

export function getAppContentType(app: AppName, rngVal: number): ContentType {
  switch (app) {
    case 'Instagram':
      return rngVal < 0.65 ? 'short_video' : 'feed_scroll';
    case 'YouTube':
      return rngVal < 0.6 ? 'long_video' : 'short_video';
    case 'Reddit':
      return rngVal < 0.7 ? 'feed_scroll' : 'news_article';
    case 'Slack':
    case 'WhatsApp':
    case 'Telegram':
      return rngVal < 0.85 ? 'chat' : 'docs_work';
    case 'VS Code':
    case 'Notion':
      return rngVal < 0.85 ? 'docs_work' : 'chat';
    case 'Chrome':
      return rngVal < 0.55 ? 'news_article' : 'docs_work';
    case 'Gmail':
      return rngVal < 0.7 ? 'chat' : 'docs_work';
    default:
      return 'docs_work';
  }
}

/**
 * Generate 30 days of realistic behavioral event logs in <500ms using Mulberry32.
 */
export function generateSyntheticLogs(
  configOrPersona: PersonaProfileConfig | PersonaId,
  seed = 42
): SyntheticEvent[] {
  const config =
    typeof configOrPersona === 'string'
      ? PRESET_PERSONA_CONFIGS[configOrPersona as 'arjun' | 'meera' | 'kabir' | 'rohan'] ||
        PRESET_PERSONA_CONFIGS.arjun
      : configOrPersona;

  const gt = buildDerivedGroundTruth(config);
  const rng = new Mulberry32(seed);
  const events: SyntheticEvent[] = [];

  const notifTypes: NotificationType[] = [
    'social_like',
    'dm',
    'work_msg',
    'otp',
    'calendar',
    'promo',
    'news',
    'system',
  ];

  const appPool: AppName[] = [
    'Instagram',
    'WhatsApp',
    'YouTube',
    'Slack',
    'Gmail',
    'Reddit',
    'Telegram',
    'Chrome',
    'VS Code',
    'Notion',
  ];

  let currentTimestamp = 1704067200000; // Jan 1 2024 00:00:00

  for (let day = 1; day <= 30; day++) {
    const isWeekend = day % 7 === 0 || day % 7 === 6;
    let dailyFatigue = 0.1;
    let minutesSinceBreak = 0;
    let recentAppSwitches = 1;

    for (let hour = 0; hour < 24; hour++) {
      let baseFocusProb = gt.baseHourlyFocus[hour];
      if (isWeekend) {
        baseFocusProb = Math.min(0.95, baseFocusProb * (config.chronotype === 'night' ? 1.1 : 0.8));
      }

      // 1. Focus block probability
      const doesFocus = rng.chance(Math.min(0.95, Math.max(0.05, baseFocusProb * (1 - dailyFatigue * 0.35))));
      let currentActivity: ActivityType =
        config.archetype === 'coder'
          ? 'coding'
          : config.archetype === 'designer'
          ? 'writing'
          : config.archetype === 'exam_aspirant'
          ? 'studying'
          : 'reading';

      let focusBlockDuration = 0;
      let focusStartTs = 0;

      if (doesFocus) {
        focusBlockDuration = Math.round(rng.nextGaussian(gt.meanFocusBlockMinutes, 8));
        focusBlockDuration = Math.max(20, Math.min(90, focusBlockDuration));
        focusStartTs = currentTimestamp + hour * 3600000 + 5 * 60000;
        const endedEarly = rng.chance(Math.min(0.6, dailyFatigue * 0.5 + recentAppSwitches * 0.04));

        events.push({
          type: 'focus_block',
          timestamp: focusStartTs,
          day,
          hour,
          details: {
            start: focusStartTs,
            end: focusStartTs + focusBlockDuration * 60000,
            durationMinutes: endedEarly ? Math.round(focusBlockDuration * 0.6) : focusBlockDuration,
            activity: currentActivity,
            endedEarly,
          },
        });

        minutesSinceBreak += focusBlockDuration;
        dailyFatigue = Math.min(1.0, dailyFatigue + focusBlockDuration * gt.fatigueAccumulationPerMin);
      } else {
        currentActivity = 'idle';
        minutesSinceBreak = Math.max(0, minutesSinceBreak - 40);
        dailyFatigue = Math.max(0.05, dailyFatigue - 60 * gt.fatigueRecoveryPerMin);
      }

      // 2. Incoming notifications in this hour (Poisson 1 to 4)
      const notifCount = rng.nextInt(1, 3);
      for (let k = 0; k < notifCount; k++) {
        const notifId = `evt_notif_${day}_${hour}_${k}`;
        const type = notifTypes[rng.nextInt(0, notifTypes.length - 1)];

        const notifApp: AppName =
          type === 'social_like'
            ? rng.chance(0.6)
              ? config.biggestSinkApp
              : 'Instagram'
            : type === 'work_msg'
            ? 'Slack'
            : type === 'dm'
            ? 'WhatsApp'
            : type === 'otp'
            ? 'System'
            : appPool[rng.nextInt(0, appPool.length - 1)];

        const senderImportance =
          type === 'otp'
            ? 0.99
            : type === 'work_msg'
            ? 0.75 + rng.next() * 0.2
            : type === 'promo'
            ? 0.05 + rng.next() * 0.1
            : rng.next();

        const notifTime = currentTimestamp + hour * 3600000 + (k * 18 + rng.nextInt(2, 10)) * 60000;
        const minutesIntoFocus = doesFocus ? Math.min(focusBlockDuration, (k + 1) * 15) : 0;

        // Ground-truth open probability calibrated around baseOpenPropensities
        const baseProp = gt.baseOpenPropensities[type] || 0.5;
        // Balanced zero-centered contextual variation so empirical mean tracks baseProp within ±0.05
        const contextShift = (dailyFatigue - 0.5) * 0.04 - (doesFocus ? 0.02 : -0.02);
        const openProb = Math.min(0.98, Math.max(0.02, baseProp + contextShift));
        const opened = rng.chance(openProb);

        events.push({
          type: 'notification',
          timestamp: notifTime,
          day,
          hour,
          details: {
            id: notifId,
            appName: notifApp,
            notifType: type,
            senderImportance,
            shown: true,
            state: {
              hour,
              activity: currentActivity,
              minutesIntoFocusBlock: minutesIntoFocus,
              minutesSinceBreak,
              recentAppSwitches,
            },
          },
        });

        // Did user act meaningfully on this notification?
        const baseActed = gt.probActedMeaningfullyBase[type] || 0.2;
        const actedProb = Math.min(
          0.99,
          Math.max(0.01, baseActed + senderImportance * gt.importanceWeightOnActed)
        );
        events.push({
          type: 'acted',
          timestamp: notifTime + 15000,
          day,
          hour,
          details: {
            notifId,
            actedMeaningfully: rng.chance(actedProb),
          },
        });

        if (opened) {
          recentAppSwitches++;
          // App open duration from lognormal
          const appLognormal = gt.appLognormals[notifApp] || { mu: 2.2, sigma: 0.5 };
          const duration = Math.max(
            1,
            Math.min(120, Math.round(rng.nextLognormal(appLognormal.mu, appLognormal.sigma)))
          );
          const contentType = getAppContentType(notifApp, rng.next());

          events.push({
            type: 'app_open',
            timestamp: notifTime + 30000,
            day,
            hour,
            details: {
              appName: notifApp,
              contentType,
              duration,
              trigger: 'notification',
            },
          });

          // Resumption delay
          const delayModel = gt.appResumptionDelays[notifApp] || { alpha: 3.5, beta: 0.25 };
          const delayMinutes = Math.max(
            1,
            Math.min(
              45,
              Math.round(delayModel.alpha + delayModel.beta * (duration / 5) + rng.nextGaussian(0, 0.8))
            )
          );

          events.push({
            type: 'resume',
            timestamp: notifTime + 30000 + duration * 60000,
            day,
            hour,
            details: {
              delayMinutes,
            },
          });

          dailyFatigue = Math.min(1.0, dailyFatigue + 0.06);
        }
      }

      // 3. Spontaneous phone checks during non-focus or low-focus time
      if (!doesFocus && rng.chance(gt.spontaneousChecksPerHour / 4)) {
        const checkApp = appPool[rng.nextInt(0, 4)];
        const spontContentType = getAppContentType(checkApp, rng.next());
        events.push({
          type: 'app_open',
          timestamp: currentTimestamp + hour * 3600000 + 40 * 60000,
          day,
          hour,
          details: {
            appName: checkApp,
            contentType: spontContentType,
            duration: Math.max(1, Math.min(25, Math.round(rng.nextLognormal(1.5, 0.4)))),
            trigger: 'spontaneous',
          },
        });
        recentAppSwitches++;
      }

      // Decay recent switches slightly each hour
      recentAppSwitches = Math.max(1, Math.round(recentAppSwitches * 0.7));

      // 4. Occasional self-report (at 14:00 and 21:00)
      if (hour === 14 || hour === 21) {
        events.push({
          type: 'self_report',
          timestamp: currentTimestamp + hour * 3600000 + 50 * 60000,
          day,
          hour,
          details: {
            state:
              dailyFatigue > 0.65 ? 'tired' : baseFocusProb > 0.6 ? 'flow' : 'distracted',
          },
        });
      }
    }
    currentTimestamp += 86400000;
  }

  return events;
}
