// src/native/liveIngest.ts
// Converts raw phone signals into the twin's event schema.
// NOTE: field names below follow the original KAIROS schema (focus_block, notification,
// app_open, resume, acted). If your regenerated engine renamed anything, change ONLY this file.
import { Capacitor } from '@capacitor/core';
import { KairosSensor, type AppSession, type RawNotifEvent, type SensorCategory } from './kairosSensor';

export const isNative = () => Capacitor.isNativePlatform();

const TAP_WINDOW_MS = 45_000;      // app opened this soon after a notif from same pkg => notification-triggered
const FOCUS_APP_CATEGORIES: SensorCategory[] = ['work'];

// Android category -> notification type used by the engine
export function toNotifType(e: RawNotifEvent) {
  const c = e.androidCategory;
  if (c === 'social' || e.appCategory === 'social') return 'social_like';
  if (c === 'msg' || e.appCategory === 'messaging') return 'dm';
  if (c === 'email' || e.appCategory === 'email') return 'work_msg';
  if (c === 'event' || c === 'reminder') return 'calendar';
  if (c === 'promo') return 'promo';
  if (e.appCategory === 'news') return 'news';
  if (e.appCategory === 'work') return 'work_msg';
  return 'system';
}

// Content type per session (coarse; refine by app if you like)
export function toContentType(s: AppSession) {
  const p = s.pkg.toLowerCase();
  if (p.includes('instagram') || p.includes('snapchat') || p.includes('reddit')) return 'feed_scroll';
  if (p.includes('youtube')) return 'long_video';        // shorts vs long needs UI-level info
  if (s.appCategory === 'messaging') return 'chat';
  if (s.appCategory === 'work' || s.appCategory === 'email') return 'docs_work';
  if (s.appCategory === 'news') return 'news_article';
  return 'feed_scroll';
}

export async function pullLiveEvents(sinceMs: number) {
  const [{ events: raw }, { sessions }] = await Promise.all([
    KairosSensor.drainNotifications({ sinceMs }),
    KairosSensor.getAppSessions({ sinceMs }),
  ]);

  const posted = raw.filter((r) => r.kind === 'posted');
  const removedByKey = new Map(raw.filter((r) => r.kind === 'removed').map((r) => [r.key, r]));
  const out: any[] = [];

  for (const n of posted) {
    const rm = removedByKey.get(n.key);
    const d = new Date(n.timeMs);
    out.push({
      type: 'notification',
      timestamp: n.timeMs,
      day: Math.floor(n.timeMs / 86_400_000),
      hour: d.getHours(),
      provenance: 'You: your device',
      details: {
        id: n.key,
        appName: n.appLabel,
        notifType: toNotifType(n),
        senderKey: n.senderHash,
        shown: true,
        tapped: !!rm?.wasTapped,
        dismissed: !!rm?.wasDismissed,
        // state fields (activity, minutesIntoFocusBlock...) must be filled by the focus-session tracker
      },
    });
  }

  sessions.sort((a, b) => a.startMs - b.startMs);
  let lastFocusEnd: number | null = null;
  for (const s of sessions) {
    const triggerNotif = posted.find(
      (n) => n.pkg === s.pkg && s.startMs >= n.timeMs && s.startMs - n.timeMs <= TAP_WINDOW_MS
    );
    const d = new Date(s.startMs);
    const isFocus = FOCUS_APP_CATEGORIES.includes(s.appCategory);

    if (!isFocus) {
      out.push({
        type: 'app_open',
        timestamp: s.startMs,
        day: Math.floor(s.startMs / 86_400_000),
        hour: d.getHours(),
        provenance: 'You: your device',
        details: {
          appName: s.appLabel,
          duration: (s.endMs - s.startMs) / 60_000,
          contentType: toContentType(s),
          trigger: triggerNotif ? 'notification' : 'spontaneous',
        },
      });
    } else {
      // resumption delay: gap between leaving focus and the next focus-app session
      if (lastFocusEnd !== null && s.startMs - lastFocusEnd < 30 * 60_000) {
        out.push({
          type: 'resume',
          timestamp: s.startMs,
          day: Math.floor(s.startMs / 86_400_000),
          hour: d.getHours(),
          provenance: 'You: your device',
          details: { delayMinutes: (s.startMs - lastFocusEnd) / 60_000 },
        });
      }
      lastFocusEnd = s.endMs;
    }
  }
  return out;
}
