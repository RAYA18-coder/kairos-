/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { hashSender } from './importanceLearner';
import type { NotificationType } from '../engine/types';

export type SensorCategory = 'social' | 'messaging' | 'video' | 'work' | 'email' | 'news' | 'other';

export interface IncomingNotificationEvent {
  id: string;
  appName: string;
  appCategory: SensorCategory;
  channel: string;
  title: string;
  body: string;
  senderRaw?: string;
  senderHash: string;
  timestamp: number;
  importanceRating?: number;
}

export interface KairosSensorPlugin {
  getPermissionState(): Promise<{ notificationAccess: boolean; usageAccess: boolean }>;
  openNotificationAccessSettings(): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  drainNotifications(opts: { sinceMs: number }): Promise<{ events: any[] }>;
  getAppSessions(opts: { sinceMs: number }): Promise<{ sessions: any[]; screen: any[] }>;
  clearBuffer(): Promise<void>;
  addListener(
    eventName: 'notification',
    cb: (e: any) => void
  ): Promise<PluginListenerHandle>;
}

let nativePluginInstance: KairosSensorPlugin | null = null;
try {
  if (Capacitor.isNativePlatform()) {
    nativePluginInstance = registerPlugin<KairosSensorPlugin>('KairosSensor');
  }
} catch {
  nativePluginInstance = null;
}

/** Map Android channel label / category to the channel strings the learner and engine understand. No message text is used. */
export function normalizeChannel(raw: any): string {
  const label = `${raw?.channelName || ''} ${raw?.channelId || ''}`.toLowerCase();
  const cat = String(raw?.androidCategory || '').toLowerCase();
  const appCat = raw?.appCategory;
  if (/otp|verification|passcode|security.?code|one.?time/.test(label)) return 'otp';
  if (/direct|message|\bdm\b|chat|conversation|inbox|repl(y|ies)/.test(label) || cat === 'msg') return 'dm';
  if (/comment|mention|\btag/.test(label)) return 'comment';
  if (/like|reaction|follow|story|reel|activity|suggest|recommend|trending|live/.test(label) || cat === 'social') return 'like';
  if (/promo|offer|marketing|deal|\bads?\b/.test(label) || cat === 'promo') return 'promo';
  if (cat === 'event' || cat === 'reminder' || /calendar|reminder|event/.test(label)) return 'calendar';
  if (cat === 'email' || appCat === 'email' || appCat === 'work') return 'work_msg';
  if (appCat === 'news') return 'news';
  if (appCat === 'messaging') return 'dm';
  return 'system';
}

/** Engine NotificationType for a normalized channel. */
export function channelToNotificationType(channel: string): NotificationType {
  switch (channel) {
    case 'like': return 'social_like';
    case 'dm': case 'comment': return 'dm';
    case 'work_msg': return 'work_msg';
    case 'otp': return 'otp';
    case 'calendar': return 'calendar';
    case 'promo': return 'promo';
    case 'news': return 'news';
    default: return 'system';
  }
}

export function isNative(): boolean {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
}

export async function permissionState(): Promise<{
  notificationAccess: boolean;
  usageAccess: boolean;
  mock: boolean;
}> {
  if (isNative() && nativePluginInstance) {
    try {
      const res = await nativePluginInstance.getPermissionState();
      return {
        notificationAccess: res.notificationAccess,
        usageAccess: res.usageAccess,
        mock: false,
      };
    } catch {
      // Fallback if plugin throws
    }
  }

  // Web / preview simulated state
  return {
    notificationAccess: true,
    usageAccess: true,
    mock: true,
  };
}

export async function openNotificationAccess(): Promise<void> {
  if (isNative() && nativePluginInstance) {
    try {
      await nativePluginInstance.openNotificationAccessSettings();
      return;
    } catch {
      // Ignore
    }
  }
  console.log('[KAIROS Sensor] openNotificationAccess requested (web simulation)');
}

export async function openUsageAccess(): Promise<void> {
  if (isNative() && nativePluginInstance) {
    try {
      await nativePluginInstance.openUsageAccessSettings();
      return;
    } catch {
      // Ignore
    }
  }
  console.log('[KAIROS Sensor] openUsageAccess requested (web simulation)');
}

// 4 realistic notification presets emitted every ~9s on web/preview
const MOCK_NOTIFICATION_ROTATION = [
  {
    appName: 'Instagram',
    appCategory: 'social' as SensorCategory,
    channel: 'like',
    title: 'Instagram',
    body: 'sarah_k and 14 others liked your reel',
    senderRaw: 'sarah_k',
  },
  {
    appName: 'Instagram',
    appCategory: 'social' as SensorCategory,
    channel: 'dm',
    title: 'Instagram',
    body: "Hey! We'd love to partner on our summer drop...",
    senderRaw: 'brand1',
  },
  {
    appName: 'WhatsApp',
    appCategory: 'messaging' as SensorCategory,
    channel: 'dm',
    title: 'WhatsApp',
    body: "Call me when you're done with work honey",
    senderRaw: 'mom',
  },
  {
    appName: 'Slack',
    appCategory: 'work' as SensorCategory,
    channel: 'work_msg',
    title: 'Slack #engineering',
    body: '@channel team deploy is scheduled for 3pm today',
    senderRaw: 'boss',
  },
];

let mockRotationIndex = 0;
const memoryBuffer: IncomingNotificationEvent[] = [];

/**
 * Subscribes to notification stream. In preview/browser, emits every ~9 seconds.
 */
export async function subscribe(
  cb: (event: IncomingNotificationEvent) => void
): Promise<() => void> {
  if (isNative() && nativePluginInstance) {
    try {
      const handle = await nativePluginInstance.addListener('notification', (raw: any) => {
        if (raw.kind && raw.kind !== 'posted') return; // ignore 'removed' events (not new notifications)
        const item: IncomingNotificationEvent = {
          id: raw.key || `evt_${Date.now()}_${Math.random()}`,
          appName: raw.appLabel || 'Unknown',
          appCategory: (raw.appCategory as SensorCategory) || 'other',
          channel: normalizeChannel(raw),
          title: raw.appLabel || 'Notification',
          body: raw.body || '',
          senderHash: raw.senderHash || hashSender(raw.senderHash || 'sender'),
          timestamp: raw.timeMs || Date.now(),
        };
        memoryBuffer.unshift(item);
        if (memoryBuffer.length > 50) memoryBuffer.pop();
        cb(item);
      });
      return () => {
        handle.remove();
      };
    } catch {
      // Fallback to web mock if plugin listeners fail
    }
  }

  // Web Browser Mock Timer
  let active = true;
  let timerId: ReturnType<typeof setTimeout>;

  const scheduleNext = () => {
    if (!active) return;
    const interval = 8500 + Math.random() * 1500; // ~9 seconds
    timerId = setTimeout(() => {
      if (!active) return;
      const seed = MOCK_NOTIFICATION_ROTATION[mockRotationIndex % MOCK_NOTIFICATION_ROTATION.length];
      mockRotationIndex++;

      const event: IncomingNotificationEvent = {
        id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        appName: seed.appName,
        appCategory: seed.appCategory,
        channel: seed.channel,
        title: seed.title,
        body: seed.body,
        senderRaw: seed.senderRaw,
        senderHash: hashSender(seed.senderRaw),
        timestamp: Date.now(),
      };

      memoryBuffer.unshift(event);
      if (memoryBuffer.length > 50) memoryBuffer.pop();
      cb(event);
      scheduleNext();
    }, interval);
  };

  scheduleNext();

  return () => {
    active = false;
    clearTimeout(timerId);
  };
}

export async function drainSince(ms: number): Promise<IncomingNotificationEvent[]> {
  if (isNative() && nativePluginInstance) {
    try {
      const res = await nativePluginInstance.drainNotifications({ sinceMs: ms });
      return (res.events || []).filter((raw: any) => !raw.kind || raw.kind === 'posted').map((raw: any) => ({
        id: raw.key || `evt_${raw.timeMs}`,
        appName: raw.appLabel || 'Unknown',
        appCategory: raw.appCategory || 'other',
        channel: normalizeChannel(raw),
        title: raw.appLabel || 'Notification',
        body: raw.body || '',
        senderHash: raw.senderHash || hashSender('unknown'),
        timestamp: raw.timeMs || Date.now(),
      }));
    } catch {
      // Fallback
    }
  }
  return memoryBuffer.filter((e) => e.timestamp >= ms);
}
