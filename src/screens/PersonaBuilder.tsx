/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  ArchetypeId,
  Chronotype,
  Sensitivity,
  AppName,
  PersonaProfileConfig,
} from '../engine/types';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Cpu,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export const PersonaBuilder: React.FC = () => {
  const createProfile = useKairosStore((s) => s.createProfile);
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const startExperiment = useKairosStore((s) => s.startExperiment);

  const [step, setStep] = useState<number>(1);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingIndex, setTrainingIndex] = useState<number>(0);

  // Configuration form state
  const [profileName, setProfileName] = useState<string>('My Persona');
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId>('coder');
  const [selectedChronotype, setSelectedChronotype] = useState<Chronotype>('night');
  const [selectedSinkApp, setSelectedSinkApp] = useState<AppName>('Instagram');
  const [selectedSensitivity, setSelectedSensitivity] = useState<Sensitivity>('high');
  const [selectedSenders, setSelectedSenders] = useState<string[]>(['bank', 'boss']);
  const [optionalPasscode, setOptionalPasscode] = useState<string>('');

  const archetypes: { id: ArchetypeId; title: string; desc: string }[] = [
    { id: 'coder', title: 'Coder / Engineer', desc: 'Late night focus, terminal & editor flow' },
    { id: 'exam_aspirant', title: 'Exam Aspirant', desc: 'Split peaks, high cognitive workload' },
    { id: 'designer', title: 'Visual Designer', desc: 'Mid-morning peak, visual canvas flow' },
    { id: 'creator', title: 'Content Creator', desc: 'High interaction rate, creative sprints' },
    { id: 'founder', title: 'Founder / PM', desc: 'Frequent cross-team context shifts' },
    { id: 'med_student', title: 'Med Resident', desc: 'Early shifts, intense recall blocks' },
    { id: 'shift_worker', title: 'Shift Worker', desc: 'Variable sleep windows, late peaks' },
    { id: 'researcher', title: 'Writer / Researcher', desc: 'Long deep reading & synthesis blocks' },
  ];

  const chronotypes: { id: Chronotype; label: string; desc: string }[] = [
    { id: 'early', label: 'Early Bird', desc: 'Peak cognitive sharpness 07:00 – 12:00' },
    { id: 'night', label: 'Night Owl', desc: 'Peak cognitive sharpness 20:00 – 02:00' },
    { id: 'split', label: 'Split Rhythm', desc: 'Dual peaks: early morning & late evening' },
  ];

  const sinkApps: AppName[] = [
    'Instagram',
    'YouTube',
    'Reddit',
    'WhatsApp',
    'Slack',
    'Telegram',
    'Chrome',
  ];

  const senderOptions = [
    { id: 'bank', label: 'Bank & OTP' },
    { id: 'boss', label: 'Boss / Lead' },
    { id: 'partner', label: 'Partner / Family' },
    { id: 'calendar', label: 'Calendar Alerts' },
    { id: 'classmates', label: 'Teammates / Class' },
  ];

  const trainingModules = [
    'Generating 30-day circadian logs from archetype prior...',
    'Fitting FocusCurve Beta credible distributions...',
    'Training L2 logistic interruption weights...',
    'Fitting lognormal duration parameters...',
    'Computing fragmentation resumption metrics...',
    'Synthesizing on-device attention twin...',
  ];

  const toggleSender = (id: string) => {
    triggerHaptic('selection');
    setSelectedSenders((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    triggerHaptic('heavy');
    setIsTraining(true);

    const config: PersonaProfileConfig = {
      id: `profile_${Date.now()}`,
      name: profileName || 'Personal Twin',
      archetype: selectedArchetype,
      chronotype: selectedChronotype,
      biggestSinkApp: selectedSinkApp,
      sensitivity: selectedSensitivity,
      importantSenders: selectedSenders,
      accentColor: selectedArchetype === 'coder' ? '#C6FF3D' : '#FF6B4A',
    };

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTrainingIndex(idx);
      if (idx >= trainingModules.length - 1) {
        clearInterval(interval);
        setTimeout(async () => {
          await createProfile(config, optionalPasscode);
        }, 600);
      }
    }, 400);
  };

  if (isTraining) {
    return (
      <div className="relative z-20 min-h-screen px-6 py-12 flex flex-col justify-center items-center text-left space-y-6 max-w-[400px] mx-auto">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C6FF3D]">
          <Cpu className="w-5 h-5 animate-spin" />
          <span>TRAINING ATTENTION TWIN...</span>
        </div>

        <div className="w-full space-y-2.5">
          {trainingModules.map((mod, i) => {
            const isDone = i <= trainingIndex;
            const isCurrent = i === trainingIndex;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs font-mono transition-opacity duration-300 ${
                  isDone ? 'opacity-100 text-zinc-200' : 'opacity-25 text-zinc-600'
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
    );
  }

  return (
    <div className="relative z-20 min-h-screen px-5 py-6 pb-24 flex flex-col justify-between max-w-[430px] mx-auto text-left space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (step > 1) setStep(step - 1);
              else setCurrentView('landing');
            }}
            className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            STEP {step} OF 5
          </span>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setCurrentView('app');
              startExperiment();
            }}
            className="text-xs font-mono text-[#C6FF3D] flex items-center gap-1 hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            <span>90s Test</span>
          </button>
        </div>

        <h1 className="text-xl font-light text-white font-sans mt-3">
          {step === 1 && 'Select Your Cognitive Archetype'}
          {step === 2 && 'Circadian Chronotype'}
          {step === 3 && 'Primary Extraction Sink'}
          {step === 4 && 'Signal Sensitivity'}
          {step === 5 && 'High Utility Senders & Passcode'}
        </h1>
      </div>

      {/* STEP 1: ARCHETYPE (8 Cards) */}
      {step === 1 && (
        <div className="space-y-2 overflow-y-auto max-h-[60dvh] no-scrollbar pr-1">
          {archetypes.map((arch) => {
            const isSelected = selectedArchetype === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedArchetype(arch.id);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 border-[#C6FF3D]/50 text-white shadow-[0_0_15px_rgba(198,255,61,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-white">
                  <span>{arch.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />}
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">{arch.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 2: CHRONOTYPE */}
      {step === 2 && (
        <div className="space-y-3">
          {chronotypes.map((chrono) => {
            const isSelected = selectedChronotype === chrono.id;
            return (
              <button
                key={chrono.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedChronotype(chrono.id);
                }}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 border-[#C6FF3D]/50 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-white">
                  <span>{chrono.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />}
                </div>
                <p className="text-xs text-zinc-400 font-sans mt-1">{chrono.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 3: BIGGEST SINK APP */}
      {step === 3 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 font-sans mb-3">
            Which application presents the highest risk of algorithmic infinite scrolling?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sinkApps.map((app) => {
              const isSelected = selectedSinkApp === app;
              return (
                <button
                  key={app}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedSinkApp(app);
                  }}
                  className={`p-3 rounded-xl border text-xs font-mono text-center transition-all ${
                    isSelected
                      ? 'bg-white/10 border-[#C6FF3D]/50 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400'
                  }`}
                >
                  {app}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: SENSITIVITY */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 font-sans mb-2">
            How easily does your flow shatter when an alert chime or banner arrives?
          </p>
          {(['low', 'med', 'high'] as Sensitivity[]).map((sens) => {
            const isSelected = selectedSensitivity === sens;
            return (
              <button
                key={sens}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedSensitivity(sens);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 border-[#C6FF3D]/50 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono uppercase text-white">
                  <span>{sens} SENSITIVITY</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />}
                </div>
                <p className="text-xs text-zinc-400 font-sans mt-1">
                  {sens === 'high'
                    ? 'Immediate urge to glance; high resumption friction penalty'
                    : sens === 'med'
                    ? 'Moderate focus resistance; vulnerable when tired'
                    : 'Disciplined task adherence; resistant to non-critical pings'}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 5: SENDERS & PASSCODE */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              PROFILE NAME
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-sans text-xs focus:outline-none focus:border-[#C6FF3D]"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
              CRITICAL SENDERS (ALWAYS ALLOW / SHORT LINGER)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {senderOptions.map((opt) => {
                const isSelected = selectedSenders.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleSender(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                      isSelected
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.05] text-zinc-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1 mb-1">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>OPTIONAL LOCAL PASSCODE (4–6 DIGITS)</span>
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="Leave empty for open profile"
              value={optionalPasscode}
              onChange={(e) => setOptionalPasscode(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-[#C6FF3D]"
            />
            <p className="text-[10px] text-zinc-500 font-sans mt-1">
              Hashed locally via WebCrypto PBKDF2 (150k iterations). No cloud recovery.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-4">
        {step < 5 ? (
          <button
            onClick={() => {
              triggerHaptic('medium');
              setStep(step + 1);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
          >
            <span>CONTINUE TO STEP {step + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
          >
            <span>TRAIN DIGITAL TWIN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
