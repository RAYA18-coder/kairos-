/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KAIROS Service Worker: App-shell cache & real notification telemetry
 */

const CACHE_NAME = 'kairos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Open IndexedDB to record notification interaction events
function logSwEvent(eventRecord) {
  const request = indexedDB.open('kairos_local_db', 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('notif_events')) {
      db.createObjectStore('notif_events', { keyPath: 'id', autoIncrement: true });
    }
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    try {
      const tx = db.transaction('notif_events', 'readwrite');
      tx.objectStore('notif_events').add({
        ...eventRecord,
        recordedAt: Date.now(),
      });
    } catch (err) {
      console.warn('SW IndexedDB write error:', err);
    }
  };
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-first / Network-fallback fetch strategy for offline independence
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses for offline use
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is an HTML navigation, return cached index
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Real Notification Click telemetry (captures tap latency from delivery time)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const sentTime = data.sentTime || Date.now();
  const tapLatencyMs = Math.max(100, Date.now() - sentTime);

  logSwEvent({
    notifId: data.id || 'notif_' + Date.now(),
    appName: data.appName || 'Unknown',
    notifType: data.type || 'system',
    action: 'clicked',
    latencyMs: tapLatencyMs,
  });

  // Focus open tab or open window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});

// Real Notification Dismissed telemetry
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  logSwEvent({
    notifId: data.id || 'notif_' + Date.now(),
    appName: data.appName || 'Unknown',
    notifType: data.type || 'system',
    action: 'dismissed',
  });
});
