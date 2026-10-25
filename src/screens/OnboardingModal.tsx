/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { ShieldCheck, ArrowRight, Sparkles, Check, Cpu } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const OnboardingModal: React.FC = () => {
  const onboardingStep = useKairosStore((s) => s.onboardingStep);
  const setOnboardingStep = useKairosStore((s) => s.setOnboardingStep);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);
  const startExperiment = useKairosStore((s) => s.startExperiment);

  const [trainingIndex, setTrainingIndex] = useState(0);

  const trainingModules = [
    'Initializing Circadian FocusCurve (24h)...',
    'Fitting InterruptionTriggers & Open Probability...',
    'Fitting Lognormal StickyContent distributions...',
    'Calibrating Utility & NotificationValue...',
    'Estimating Cognitive Fatigue Accumulator...',
    'Synthesizing Attention Fragmentation Index...',
  ];

  useEffect(() => {
    if (onboardingStep === 'training') {
      const interval = setInterval(() => {
        setTrainingIndex((prev) => {
          if (prev < trainingModules.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setOnboardingStep('completed');
            }, 800);
            return prev;
          }
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [onboardingStep]);

  if (onboardingStep === 'completed') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-[400px] bg-[#090d14] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
        {/* Step 1: Welcome */}
        {onboardingStep === 'welcome' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>All on-device. Nothing leaves your phone.</span>
            </div>

            <h1 className="text-3xl font-light font-sans tracking-tight text-white">
              KAIROS
              <span className="block text-sm font-mono text-zinc-400 font-normal tracking-normal mt-1">
                Your attention, simulated.
              </span>
            </h1>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              We built an Attention Digital Twin that models when you focus best and simulates the
              cognitive cost before any notification interrupts you.
            </p>

            <button
              onClick={() => {
                triggerHaptic('light');
                setOnboardingStep('archetype');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>GET STARTED</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Choose Persona or Experiment */}
        {onboardingStep === 'archetype' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
                INITIALIZE TWIN
              </span>
              <h2 className="text-lg font-light text-white font-sans mt-0.5">
                Select Your Twin Profile
              </h2>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActivePersona('arjun');
                  setOnboardingStep('training');
                }}
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono text-white">
                  <span>Arjun</span>
                  <span className="text-[10px] text-[#C6FF3D]">CS Student & Coder</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Peak late-night focus, high Instagram detour vulnerability.
                </p>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActivePersona('meera');
                  setOnboardingStep('training');
                }}
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono text-white">
                  <span>Meera</span>
                  <span className="text-[10px] text-[#C6FF3D]">Freelance Designer</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Mid-morning peak, sticky YouTube & client DM pull.
                </p>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setActivePersona('kabir');
                  setOnboardingStep('training');
                }}
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono text-white">
                  <span>Kabir</span>
                  <span className="text-[10px] text-[#C6FF3D]">Exam Aspirant</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Split circadian peaks, fast fatigue, Reddit pull.
                </p>
              </button>

              <div className="pt-2">
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    setOnboardingStep('completed');
                    startExperiment();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#C6FF3D]" />
                  <span>Build My Own Twin (90-Sec Trial)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Twin Training Animation */}
        {onboardingStep === 'training' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C6FF3D]">
              <Cpu className="w-4 h-4 animate-spin" />
              <span>ASSEMBLING ATTENTION TWIN...</span>
            </div>

            <div className="space-y-2">
              {trainingModules.map((mod, i) => {
                const isDone = i <= trainingIndex;
                const isCurrent = i === trainingIndex;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs font-mono transition-opacity duration-300 ${
                      isDone ? 'opacity-100 text-zinc-200' : 'opacity-20 text-zinc-600'
                    }`}
                  >
                    {isDone && !isCurrent ? (
                      <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-ping" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-700" />
                    )}
                    <span>{mod}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
