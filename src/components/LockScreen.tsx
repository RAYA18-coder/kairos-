/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { Lock, Unlock, AlertTriangle, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const LockScreen: React.FC = () => {
  const isDeviceLocked = useKairosStore((s) => s.isDeviceLocked);
  const unlockWithPasscode = useKairosStore((s) => s.unlockWithPasscode);
  const resetActiveProfileData = useKairosStore((s) => s.resetActiveProfileData);
  const activeProfileId = useKairosStore((s) => s.activeProfileId);
  const profiles = useKairosStore((s) => s.profiles);

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isDeviceLocked) return null;

  const profile = profiles[activeProfileId];

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const ok = await unlockWithPasscode(passcode);
    if (ok) {
      triggerHaptic('heavy');
      setPasscode('');
    } else {
      triggerHaptic('medium');
      setErrorMsg('Incorrect passcode. Try again.');
      setPasscode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="w-full max-w-[380px] bg-[#090d14] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#C6FF3D]" />
            <span className="text-xs font-mono uppercase tracking-wider text-white">
              PROFILE LOCKED: {profile?.config.name || 'USER'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">PBKDF2 (150k)</span>
        </div>

        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          Enter your local passcode to unlock your attention digital twin. All data is kept
          exclusively on this device.
        </p>

        <form onSubmit={handleUnlock} className="space-y-3">
          <input
            type="password"
            maxLength={6}
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            className="w-full p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-center font-mono text-xl tracking-[0.5em] text-white focus:outline-none focus:border-[#C6FF3D]"
          />

          {errorMsg && (
            <p className="text-xs text-[#FF6B4A] font-mono text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
          >
            <Unlock className="w-4 h-4" />
            <span>UNLOCK PROFILE</span>
          </button>
        </form>

        <div className="pt-2 border-t border-white/[0.06] text-center">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              if (confirm('Forgot passcode? This will reset the passcode on this local profile.')) {
                resetActiveProfileData();
              }
            }}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 mx-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Forgot Passcode? Reset Local Lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
