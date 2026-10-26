/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKairosStore } from '../store/useKairosStore';
import { Sparkles, ArrowRight, X, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

export const GuidedDemoController: React.FC = () => {
  const isGuidedDemoRunning = useKairosStore((s) => s.isGuidedDemoRunning);
  const guidedDemoStep = useKairosStore((s) => s.guidedDemoStep);
  const setGuidedDemoStep = useKairosStore((s) => s.setGuidedDemoStep);
  const stopGuidedDemo = useKairosStore((s) => s.stopGuidedDemo);
  const setRole = useKairosStore((s) => s.setRole);
  const setUserState = useKairosStore((s) => s.setUserState);
  const setActiveNotification = useKairosStore((s) => s.setActiveNotification);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);
  const runSimulationNow = useKairosStore((s) => s.runSimulationNow);

  if (!isGuidedDemoRunning) return null;

  const handleNext = () => {
    if (guidedDemoStep === 1) {
      // Transition from Step 1 to Step 2: Switch to Creator Role
      setRole('creator');
      setUserState({ hour: 22, activity: 'writing' as any, minutesIntoFocusBlock: 20 });
      setActiveNotification({
        id: 'notif_creator_brand',
        appName: 'Instagram',
        type: 'dm',
        title: 'Instagram DM',
        body: 'Acme Studio: We loved your latest release, can we sponsor next week?',
        senderImportance: 0.85,
        timestamp: Date.now(),
      });
      runSimulationNow(777);
      setActiveTab('simulate');
      setGuidedDemoStep(2);
    } else if (guidedDemoStep === 2) {
      // Transition to Step 3: Check Guard and Proof
      setActiveTab('proof');
      setGuidedDemoStep(3);
    } else {
      // Finish
      stopGuidedDemo();
    }
  };

  const handleRestart = () => {
    setRole('developer');
    setUserState({ hour: 22, activity: 'coding' as any, minutesIntoFocusBlock: 35 });
    setActiveNotification({
      id: 'notif_default',
      appName: 'Instagram',
      type: 'social_like',
      title: 'Instagram',
      body: 'sarah_k and 14 others liked your post',
      senderImportance: 0.12,
      timestamp: Date.now(),
    });
    runSimulationNow(1337);
    setActiveTab('simulate');
    setGuidedDemoStep(1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-14 inset-x-0 z-40 px-3 max-w-[460px] mx-auto pointer-events-none"
      >
        <div className="pointer-events-auto clay-card p-3.5 bg-[#1A1824]/95 border border-[#C6FF3D]/30 shadow-2xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#C6FF3D]/15 text-[#C6FF3D] flex items-center justify-center text-xs font-bold">
                {guidedDemoStep}/3
              </span>
              <span className="text-xs font-semibold text-[#F3F1FA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D]" />
                {guidedDemoStep === 1 && 'Step 1: Developer at 10pm — Instagram Like'}
                {guidedDemoStep === 2 && 'Step 2: Creator at 10pm — Brand Collab DM'}
                {guidedDemoStep === 3 && 'Step 3: Empirical Proof & Held-Out Rigor'}
              </span>
            </div>
            <button
              onClick={stopGuidedDemo}
              className="text-[#9A96AD] hover:text-[#F3F1FA] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#9A96AD]">
            {guidedDemoStep === 1 &&
              'For a Developer, an Instagram like during deep coding carries high detour risk. The twin automatically simulates and decides to SUPPRESS.'}
            {guidedDemoStep === 2 &&
              'Importance is personal. For a Creator, an Instagram DM is business-critical work. The exact same app now flips to ALLOW / BATCH.'}
            {guidedDemoStep === 3 &&
              'The twin is verified with held-out statistical accuracy and Expected Calibration Error (ECE ±3.8%), with zero fake numbers.'}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleRestart}
              className="text-xs text-[#9A96AD] hover:text-[#F3F1FA] flex items-center gap-1 px-2 py-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restart</span>
            </button>
            <Button
              size="sm"
              variant="lime"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {guidedDemoStep === 1
                ? 'Switch to Creator Role'
                : guidedDemoStep === 2
                ? 'Inspect Calibration Proof'
                : 'Complete Demo'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
