// src/native/kairosSensor.ts  — typed bridge to the Android plugin
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type SensorCategory = 'social' | 'messaging' | 'video' | 'work' | 'email' | 'news' | 'other';

export interface RawNotifEvent {
  kind: 'posted' | 'removed';
  key: string;
  pkg: string;
  timeMs: number;
  // posted only
  appLabel?: string;
  appCategory?: SensorCategory;
  androidCategory?: string;
  importance?: number;      // Android ranking importance, -1 if unknown
  senderHash?: string;      // salted hash, never the real name
  // removed only
  wasTapped?: boolean;
  wasDismissed?: boolean;
}

export interface AppSession {
  pkg: string;
  appLabel: string;
  appCategory: SensorCategory;
  startMs: number;
  endMs: number;
}
export interface ScreenSession { startMs: number; endMs: number; }

export interface KairosSensorPlugin {
  getPermissionState(): Promise<{ notificationAccess: boolean; usageAccess: boolean }>;
  openNotificationAccessSettings(): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  drainNotifications(opts: { sinceMs: number }): Promise<{ events: RawNotifEvent[] }>;
  getAppSessions(opts: { sinceMs: number }): Promise<{ sessions: AppSession[]; screen: ScreenSession[] }>;
  clearBuffer(): Promise<void>;
  addListener(
    eventName: 'notification',
    cb: (e: RawNotifEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const KairosSensor = registerPlugin<KairosSensorPlugin>('KairosSensor');
