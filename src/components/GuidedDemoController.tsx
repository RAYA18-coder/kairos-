/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { triggerHaptic } from '../lib/haptics';
import { Square, ArrowRight } from 'lucide-react';

export const GuidedDemoController: React.FC = () => {
  const isGuidedDemoRunning = useKairosStore((s) => s.isGuidedDemoRunning);
  const guidedDemoStep = useKairosStore((s) => s.guidedDemoStep);
  const stopGuidedDemo = useKairosStore((s) => s.stopGuidedDemo);
  const setGuidedDemoStep = useKairosStore((s) => s.setGuidedDemoStep);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);
  const setUserState = useKairosStore((s) => s.setUserState);
  const setActiveNotification = useKairosStore((s) => s.setActiveNotification);
  const runSimulationNow = useKairosStore((s) => s.runSimulationNow);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGuidedDemoRunning) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Step sequences:
    // Step 1: Arjun coding at 22:00 in flow on NOW screen (4 seconds)
    // Step 2: Instagram "Someone liked your post" arrives -> switch to SIMULATE (5 seconds)
    // Step 3: Draw 3D split-timeline -> verdict SUPPRESS (6 seconds)
    // Step 4: OTP arrives -> re-simulates -> verdict ALLOW NOW (5 seconds)
    // Step 5: Switch to PROOF screen (calibration & fidelity) (6 seconds)
    // Step 6: End demo / return to NOW

    if (guidedDemoStep === 1) {
      setActivePersona('arjun');
      setUserState({
        hour: 22,
        activity: 'coding',
        minutesIntoFocusBlock: 35,
        fatigue: 0.25,
      });
      setActiveTab('now');
      timerRef.current = setTimeout(() => {
        triggerHaptic('medium');
        setGuidedDemoStep(2);
      }, 5000);
    } else if (guidedDemoStep === 2) {
      setActiveNotification({
        id: 'demo_notif_1',
        appName: 'Instagram',
        type: 'social_like',
        title: 'Instagram',
        body: 'Someone liked your post',
        senderImportance: 0.1,
        timestamp: Date.now(),
      });
      setActiveTab('simulate');
      timerRef.current = setTimeout(() => {
        triggerHaptic('heavy');
        setGuidedDemoStep(3);
      }, 4000);
    } else if (guidedDemoStep === 3) {
      runSimulationNow(1337);
      timerRef.current = setTimeout(() => {
        triggerHaptic('medium');
        setGuidedDemoStep(4);
      }, 6000);
    } else if (guidedDemoStep === 4) {
      setActiveNotification({
        id: 'demo_notif_2',
        appName: 'System',
        type: 'otp',
        title: 'Bank Verification Code',
        body: '849201 is your security confirmation code',
        senderImportance: 1.0,
        timestamp: Date.now(),
      });
      runSimulationNow(999);
      timerRef.current = setTimeout(() => {
        triggerHaptic('selection');
        setGuidedDemoStep(5);
      }, 5000);
    } else if (guidedDemoStep === 5) {
      setActiveTab('proof');
      timerRef.current = setTimeout(() => {
        setGuidedDemoStep(6);
      }, 6000);
    } else if (guidedDemoStep === 6) {
      stopGuidedDemo();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGuidedDemoRunning, guidedDemoStep]);

  const simulation = useKairosStore((s) => s.simulation);
  const userState = useKairosStore((s) => s.userState);
  const activeNotification = useKairosStore((s) => s.activeNotification);
  const backtestResults = useKairosStore((s) => s.backtestResults);
  const activeProfileId = useKairosStore((s) => s.activeProfileId);
  const backtest = backtestResults[activeProfileId] || backtestResults.arjun;

  if (!isGuidedDemoRunning) return null;

  const demoCaptions: Record<number, string> = {
    1: `1/5: Arjun is ${userState.activity} at ${userState.hour}:00 in concentration (${Math.round(
      (1 - userState.fatigue) * 100
    )}% cognitive flow).`,
    2: `2/5: Distraction signal arrives: ${activeNotification.appName} "${activeNotification.body}".`,
    3: `3/5: Twin predicts ~${Math.round(simulation.expectedDetourMinutes)}m detour and ~${Math.round(
      simulation.expectedFocusLossMinutes
    )}m loss -> Verdict: ${simulation.verdict.decision}.`,
    4: `4/5: Counter-example: High-utility alert arrives -> Verdict: ${simulation.verdict.decision}.`,
    5: `5/5: Backtested on held-out test days with ${backtest?.report.score ?? 91}% Twin Fidelity.`,
  };

  return (
    <aside
      aria-label="Guided Demo Status"
      className="fixed top-14 left-4 right-4 z-40 max-w-[400px] mx-auto p-3.5 rounded-2xl bg-[#090d14]/95 border border-[#C6FF3D]/50 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6FF3D] block font-semibold">
            AUTOMOTIVE GUIDED DEMO
          </span>
          <p className="text-xs font-sans text-zinc-200 mt-1 leading-snug">
            {demoCaptions[guidedDemoStep] || 'Simulating attention economics...'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              setGuidedDemoStep(Math.min(6, guidedDemoStep + 1));
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
            title="Next step"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              stopGuidedDemo();
            }}
            className="p-1.5 rounded-lg bg-[#FF6B4A]/20 hover:bg-[#FF6B4A]/30 text-[#FF6B4A]"
            title="Stop demo"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    </aside>
  );
};
