/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface InAppNotificationDetail {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

export function isNativePlatform(): boolean {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Dispatches an in-app banner notification event to window
 */
export function dispatchInAppNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  const detail: InAppNotificationDetail = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    timestamp: Date.now(),
  };
  window.dispatchEvent(new CustomEvent('kairos:in-app-notification', { detail }));
}

/**
 * Ensures system notification permissions are granted.
 */
export async function ensureNotifyPermission(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') return true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch (e) {
      console.warn('[KAIROS] Native notification permission check failed:', e);
      return false;
    }
  }

  // Web Browser environment
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }

  return false;
}

/**
 * Sends a notification. Never fails silently — if native or web notification is blocked,
 * it immediately triggers the in-app notification banner.
 */
export async function sendTestNotification(
  title: string,
  body: string,
  delayMs = 0
): Promise<boolean> {
  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const hasPerm = await ensureNotifyPermission();
      if (hasPerm) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000) + 1,
              title,
              body,
              schedule: delayMs > 0 ? { at: new Date(Date.now() + delayMs) } : undefined,
              sound: 'beep.wav',
            },
          ],
        });
        return true;
      }
    } catch (err) {
      console.warn('[KAIROS] Native LocalNotifications.schedule failed:', err);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const hasPerm = await ensureNotifyPermission();
      if (hasPerm) {
        if (delayMs > 0) {
          setTimeout(() => {
            try {
              new Notification(title, {
                body,
                icon: '/icon.svg',
              });
            } catch {
              dispatchInAppNotification(title, body);
            }
          }, delayMs);
        } else {
          new Notification(title, {
            body,
            icon: '/icon.svg',
          });
        }
        return true;
      }
    } catch (err) {
      console.warn('[KAIROS] Web Notification failed:', err);
    }
  }

  // Fallback: Dispatch in-app notification banner so user always sees the notification
  if (delayMs > 0) {
    setTimeout(() => {
      dispatchInAppNotification(title, body);
    }, delayMs);
  } else {
    dispatchInAppNotification(title, body);
  }

  return true;
}
