/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window)) return;
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate([20, 30, 20]);
          break;
        case 'heavy':
          navigator.vibrate([40, 40, 60]);
          break;
      }
    }
  } catch {
    // Ignore environments where vibration API is disabled or restricted
  }
}
