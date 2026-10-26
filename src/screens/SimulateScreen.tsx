/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  GlassCard,
  ClayButton,
  ClayChip,
  ClayStat,
  NeuSearch,
  BentoGrid,
  BentoTile,
} from '../components/ui/ReferenceComponents';
import { BrainsScene } from '../components/BrainsScene';
import { SplitTimelineChart } from '../components/charts/SplitTimelineChart';
import { Sheet } from '../components/ui/Sheet';
import {
  Sparkles,
  Send,
  HelpCircle,
  GitFork,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { NotificationItem, AppName, NotificationType } from '../engine/types';
import { importanceLearner } from '../native/importanceLearner';

const SCENARIO_PRESETS = [
  {
    id: 'sc_ig_like',
    label: 'Instagram Like',
    appName: 'Instagram' as AppName,
    type: 'social_like' as NotificationType,
    title: 'Instagram',
    body: 'elena_v and 24 others liked your story',
  },
  {
    id: 'sc_ig_dm',
    label: 'Instagram Brand DM',
    appName: 'Instagram' as AppName,
    type: 'dm' as NotificationType,
    title: 'Instagram Direct',
    body: 'Brand Studio: Would love to partner on our summer campaign!',
  },
  {
    id: 'sc_slack_deploy',
    label: 'Slack Deploy Ping',
    appName: 'Slack' as AppName,
    type: 'work_msg' as NotificationType,
    title: 'Slack #core-team',
    body: 'Sarah: Deploy v2.4 passed QA, need final review.',
  },
  {
    id: 'sc_whatsapp_mom',
    label: 'WhatsApp Family',
    appName: 'WhatsApp' as AppName,
    type: 'dm' as NotificationType,
    title: 'WhatsApp',
    body: 'Mom: Let me know when you finish work tonight.',
  },
  {
    id: 'sc_bank_otp',
    label: 'Banking OTP Code',
    appName: 'System' as AppName,
    type: 'otp' as NotificationType,
    title: 'Auth Verification',
    body: 'Security code: 829104 for payment authorization.',
  },
];

export const SimulateScreen: React.FC = () => {
  const simulation = useKairosStore((s) => s.simulation);
  const userState = useKairosStore((s) => s.userState);
  const activeNotification = useKairosStore((s) => s.activeNotification);
  const simulationSeed = useKairosStore((s) => s.simulationSeed);
  const aiExplanation = useKairosStore((s) => s.aiExplanation);
  const isAiGenerating = useKairosStore((s) => s.isAiGenerating);
  const aiOnline = useKairosStore((s) => s.aiOnline);

  const setActiveNotification = useKairosStore((s) => s.setActiveNotification);
  const runSimulationNow = useKairosStore((s) => s.runSimulationNow);
  const requestAiExplanation = useKairosStore((s) => s.requestAiExplanation);
  const simulateNaturalLanguageWhatIf = useKairosStore((s) => s.simulateNaturalLanguageWhatIf);
  const overrideGuardDecision = useKairosStore((s) => s.overrideGuardDecision);

  const [customText, setCustomText] = useState('');
  const [isSimulatingNl, setIsSimulatingNl] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof SCENARIO_PRESETS[0]) => {
    const scoreRes = importanceLearner.score(preset.appName, preset.type);
    const item: NotificationItem = {
      id: preset.id,
      appName: preset.appName,
      type: preset.type,
      title: preset.title,
      body: preset.body,
      senderImportance: scoreRes.value,
      timestamp: Date.now(),
    };
    setActiveNotification(item);
  };

  const handleNlSubmit = async () => {
    if (!customText.trim()) return;
    setIsSimulatingNl(true);
    await simulateNaturalLanguageWhatIf(customText.trim());
    setIsSimulatingNl(false);
  };

  const detourMins = Math.round(simulation.expectedDetourMinutes);
  const lossMins = Math.round(simulation.expectedFocusLossMinutes);
  const savedMins = Math.round(simulation.counterfactual.focusMinutesSaved);
  const pDetour = Math.round(simulation.pDetour * 100);

  const savedCiLow = Math.round(simulation.counterfactual.focusMinutesSavedInterval[0]);
  const savedCiHigh = Math.round(simulation.counterfactual.focusMinutesSavedInterval[1]);

  // Abstain rule: If net-benefit interval crosses zero
  const isUnsureAbstain = savedCiLow <= 0 && savedCiHigh > 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28 text-left animate-in fade-in duration-200">
      {/* 1. Header */}
      <div>
        <span className="text-[11px] font-semibold text-[rgba(242,247,243,0.62)] uppercase tracking-wider">
          Counterfactual Engine · Monte Carlo Rollout
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F7F3]">
          Interruption Simulator
        </h1>
      </div>

      {/* 2. NeuSearch for What-If Scenarios */}
      <div className="flex flex-col gap-2">
        <NeuSearch
          value={customText}
          onChange={setCustomText}
          onSubmit={handleNlSubmit}
          placeholder="What if my brand manager DMs me at 11pm while I edit?"
        />

        {/* Quick Scenario Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {SCENARIO_PRESETS.map((p) => {
            const isSelected = activeNotification.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#7FE3C0] text-[#081B12] font-bold border-[#7FE3C0]'
                    : 'bg-[#0D241B] text-[rgba(242,247,243,0.65)] border-white/10 hover:text-[#F2F7F3]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hero Visual: Brain Particle Transfer (YOU -> TWIN) */}
      <GlassCard tilt className="p-5 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-br from-[#0F3B2C]/40 to-[#0B2A1E]/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F7F3]">
                {activeNotification.appName}
              </span>
              <span className="text-xs text-[rgba(242,247,243,0.5)]">·</span>
              <span className="text-xs text-[rgba(242,247,243,0.65)] truncate max-w-[150px]">
                {activeNotification.title}
              </span>
            </div>
            <p className="text-xs text-[rgba(242,247,243,0.65)] mt-0.5 line-clamp-1">
              "{activeNotification.body}"
            </p>
          </div>

          {isUnsureAbstain ? (
            <ClayChip verdict="ALLOW NOW" size="md" />
          ) : (
            <ClayChip verdict={simulation.verdict.decision} size="md" />
          )}
        </div>

        {/* Brain absorbing the hit */}
        <div className="w-full my-1">
          <BrainsScene merge={0.72} pulse={0.9} transferParticles size={180} />
        </div>

        {/* D3 Split-Timeline Ribbon Chart */}
        <div className="p-2.5 rounded-2xl bg-[#091D15] border border-white/10">
          <SplitTimelineChart simulation={simulation} />
        </div>

        {/* Abstain Rule Notice */}
        {isUnsureAbstain && (
          <div className="p-3 rounded-2xl bg-[#FFC44D]/10 border border-[#FFC44D]/30 flex items-center gap-2 text-xs text-[#FFC44D]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Twin Unsure:</strong> Not enough data. Net benefit interval crosses zero [{savedCiLow}m, {savedCiHigh}m], allowing by default.
            </span>
          </div>
        )}

        {/* 3 Key Stats: Focus preserved, Detour risk, Friction loss */}
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
          <ClayStat
            label="Focus Preserved"
            value={`${savedMins >= 0 ? '+' : '\u2212'}${Math.abs(savedMins)}m`}
            ci={[savedCiLow, savedCiHigh]}
            accent="mint"
          />
          <ClayStat
            label="Detour Risk"
            value={`${pDetour}%`}
            accent={pDetour > 50 ? 'coral' : 'amber'}
          />
          <ClayStat
            label="Friction Loss"
            value={`~${lossMins}m`}
            accent="coral"
          />
        </div>

        {/* Plain Language AI Explanation */}
        <div className="flex flex-col gap-2 pt-1">
          {aiExplanation ? (
            <div className="p-3.5 rounded-2xl bg-[#091D15] border border-white/10 text-xs text-[#F2F7F3] leading-relaxed flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#7FE3C0] font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Plain-Language Synthesis
                </span>
                {!aiOnline && (
                  <span className="text-[10px] text-[rgba(242,247,243,0.5)]">Template Offline</span>
                )}
              </div>
              <p>{aiExplanation}</p>
            </div>
          ) : (
            <button
              onClick={requestAiExplanation}
              disabled={isAiGenerating}
              className="py-2.5 px-4 rounded-2xl bg-[#0E2F22] hover:bg-[#153D2D] text-[#7FE3C0] border border-[#7FE3C0]/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiGenerating ? 'Synthesizing...' : 'Explain Verdict with AI'}</span>
            </button>
          )}
        </div>

        {/* Action Controls: Suppress vs Allow Once */}
        <div className="flex items-center gap-2 pt-1">
          <ClayButton
            variant="coral"
            size="md"
            className="flex-1"
            onClick={() => {
              overrideGuardDecision(activeNotification.id, 'SUPPRESSED');
              setActionNotice('Firewall enforced: Interruption suppressed.');
              setTimeout(() => setActionNotice(null), 2500);
            }}
          >
            Suppress Alert
          </ClayButton>
          <button
            onClick={() => {
              overrideGuardDecision(activeNotification.id, 'ALLOWED');
              setActionNotice('Permitted: Notification passed through.');
              setTimeout(() => setActionNotice(null), 2500);
            }}
            className="px-5 py-3 rounded-3xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-semibold text-[rgba(242,247,243,0.7)]"
          >
            Allow Once
          </button>
        </div>

        {actionNotice && (
          <div className="text-center text-xs font-semibold text-[#7FE3C0] flex items-center justify-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> {actionNotice}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            onClick={() => runSimulationNow()}
            className="text-xs text-[rgba(242,247,243,0.6)] hover:text-[#F2F7F3]"
          >
            Re-run Monte Carlo ({simulationSeed})
          </button>
          <button
            onClick={() => setIsDetailSheetOpen(true)}
            className="text-xs text-[#7FE3C0] font-bold flex items-center gap-1 hover:underline"
          >
            <span>Branch Breakdown</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassCard>

      {/* 4. Branch Breakdown Details Bottom Sheet */}
      <Sheet
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        title="Counterfactual Branch Decomposition"
        description="Side-by-side comparison of the two simulated futures."
      >
        <div className="flex flex-col gap-4 pb-6 text-left">
          {/* Branch A: Shown */}
          <div className="p-4 rounded-2xl bg-[#FF6B4A]/10 border border-[#FF6B4A]/25 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF6B4A] uppercase tracking-wider">
                Future A: Shown Immediately
              </span>
              <span className="text-xs font-mono-numbers text-[#FF6B4A]">
                P(Open) = {pDetour}%
              </span>
            </div>
            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Alert triggers an immediate context switch. You spend an expected {detourMins} minutes in the app, followed by ~{Math.round(simulation.expectedResumptionDelay)}m of cognitive resumption lag before re-entering deep focus.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#FF6B4A]/20 text-xs">
              <div>
                <span className="text-[rgba(242,247,243,0.6)]">Detour Duration:</span>
                <p className="font-bold text-[#F2F7F3]">~{detourMins} min</p>
              </div>
              <div>
                <span className="text-[rgba(242,247,243,0.6)]">Total Focus Lost:</span>
                <p className="font-bold text-[#FF6B4A]">~{lossMins} min</p>
              </div>
            </div>
          </div>

          {/* Branch B: Suppressed */}
          <div className="p-4 rounded-2xl bg-[#7FE3C0]/10 border border-[#7FE3C0]/25 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7FE3C0] uppercase tracking-wider">
                Future B: Held / Batched
              </span>
              <span className="text-xs font-mono-numbers text-[#7FE3C0]">
                Flow Continuity = 100%
              </span>
            </div>
            <p className="text-xs text-[rgba(242,247,243,0.65)]">
              Flow is preserved uninterrupted until your predicted focus block conclusion. The notification is safely delivered at your natural cognitive break.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#7FE3C0]/20 text-xs">
              <div>
                <span className="text-[rgba(242,247,243,0.6)]">Focus Preserved:</span>
                <p className="font-bold text-[#7FE3C0]">{savedMins >= 0 ? '+' : '\u2212'}{Math.abs(savedMins)} min</p>
              </div>
              <div>
                <span className="text-[rgba(242,247,243,0.6)]">Regret Cost:</span>
                <p className="font-bold text-[#F2F7F3]">Low (Safe to defer)</p>
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
