/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RealNotificationResponse } from '../engine/onlineLearning';

const DB_NAME = 'kairos_local_db';
const STORE_NAME = 'notif_events';

/**
 * Read recorded notification events from IndexedDB (written by Service Worker)
 */
export async function readIndexedDbNotificationEvents(): Promise<RealNotificationResponse[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onerror = () => resolve([]);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const records = getAllReq.result || [];
          resolve(
            records.map((r: any) => ({
              timestamp: r.recordedAt || Date.now(),
              appName: r.appName,
              type: r.notifType,
              action: r.action,
              latencyMs: r.latencyMs,
            }))
          );
        };
        getAllReq.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    };
  });
}

/**
 * WebCrypto PBKDF2 Passcode Hashing
 * Minimum 150,000 iterations with per-profile random salt. Never store plaintext.
 */
export async function hashPasscode(passcode: string, saltHex?: string): Promise<{ hashHex: string; saltHex: string }> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? hexToBuffer(saltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hashHex: bufferToHex(new Uint8Array(derivedBits)),
    saltHex: bufferToHex(salt),
  };
}

export async function verifyPasscode(passcode: string, saltHex: string, expectedHashHex: string): Promise<boolean> {
  const { hashHex } = await hashPasscode(passcode, saltHex);
  return hashHex === expectedHashHex;
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
