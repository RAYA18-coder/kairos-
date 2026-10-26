/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserRole } from '../native/importanceLearner';
import {
  openNotificationAccess,
  openUsageAccess,
  isNative,
} from '../native/sensor';
import { ensureNotifyPermission } from '../native/notify';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Bell,
  Eye,
  Check,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const ROLES: { id: UserRole; title: string; example: string }[] = [
  {
    id: 'creator',
    title: 'Content Creator',
    example: 'Instagram & TikTok DMs/comments are business work; personal feeds are distraction.',
  },
  {
    id: 'developer',
    title: 'Developer',
    example: 'Slack & GitHub review mentions are work; social feeds are suppressed during flow.',
  },
  {
    id: 'student',
    title: 'Student',
    example: 'Canvas & class group announcements are priority; gaming alerts are batched.',
  },
  {
    id: 'founder',
    title: 'Founder / Exec',
    example: 'Urgent email & investor DMs bypass the shield; marketing updates are held.',
  },
  {
    id: 'other',
    title: 'Independent / Other',
    example: 'Balanced Bayesian prior calibrated from your direct feedback and reactions.',
  },
];

const WORK_APP_OPTIONS = [
  'Instagram',
  'Slack',
  'WhatsApp',
  'YouTube',
  'Gmail',
  'GitHub',
  'TikTok',
  'Twitter/X',
  'Notion',
  'VS Code',
  'LinkedIn',
  'Figma',
];

export const OnboardingModal: React.FC = () => {
  const onboardingStep = useKairosStore((s) => s.onboardingStep);
  const setOnboardingStep = useKairosStore((s) => s.setOnboardingStep);
  const role = useKairosStore((s) => s.role);
  const setRole = useKairosStore((s) => s.setRole);
  const workApps = useKairosStore((s) => s.workApps);
  const setWorkApps = useKairosStore((s) => s.setWorkApps);
  const sendTestNotificationNow = useKairosStore((s) => s.sendTestNotificationNow);

  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0: Role, 1: Work apps, 2: Permissions
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [selectedApps, setSelectedApps] = useState<string[]>(workApps);
  const [notifGranted, setNotifGranted] = useState(false);
  const isAndroid = isNative();

  if (onboardingStep === 'completed') return null;

  const toggleApp = (app: string) => {
    if (selectedApps.includes(app)) {
      setSelectedApps(selectedApps.filter((a) => a !== app));
    } else {
      setSelectedApps([...selectedApps, app]);
    }
  };

  const handleNextFromRole = () => {
    setRole(selectedRole);
    // Preset sensible work apps by role
    if (selectedRole === 'creator' && !selectedApps.includes('Instagram')) {
      setSelectedApps(['Instagram', 'YouTube', 'TikTok']);
    } else if (selectedRole === 'developer' && !selectedApps.includes('Slack')) {
      setSelectedApps(['Slack', 'GitHub']);
    }
    setCurrentStepIndex(1);
  };

  const handleNextFromApps = () => {
    setWorkApps(selectedApps);
    setCurrentStepIndex(2);
  };

  const handleFinish = async () => {
    await sendTestNotificationNow('KAIROS Twin Active', 'Focus firewall initialized with your personal archetype prior.');
    setOnboardingStep('completed');
  };

  const requestNotif = async () => {
    const ok = await ensureNotifyPermission();
    setNotifGranted(ok);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-[420px] flex flex-col gap-4">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-8 bg-[#C6FF3D]'
                  : idx < currentStepIndex
                  ? 'w-2 bg-[#C6FF3D]/50'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* CARD 1: Choose Role */}
        {currentStepIndex === 0 && (
          <Card variant="clay" className="p-6 flex flex-col gap-4 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C6FF3D] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 1 of 3</span>
              </div>
              <h2 className="text-xl font-semibold text-[#F3F1FA]">
                What is your primary archetype?
              </h2>
              <p className="text-xs text-[#9A96AD] mt-1">
                Importance is personal. This establishes your initial Bayesian prior.
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto no-scrollbar py-1">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#C6FF3D]/12 border-[#C6FF3D] shadow-md shadow-[#C6FF3D]/10'
                        : 'bg-[#242134] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-[#C6FF3D]' : 'text-[#F3F1FA]'
                        }`}
                      >
                        {r.title}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#C6FF3D]" />}
                    </div>
                    <p className="text-xs text-[#9A96AD] mt-1 leading-relaxed">
                      {r.example}
                    </p>
                  </button>
                );
              })}
            </div>

            <Button
              variant="lime"
              size="md"
              className="w-full mt-2"
              onClick={handleNextFromRole}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Work Apps
            </Button>
          </Card>
        )}

        {/* CARD 2: Pick Apps that are Work */}
        {currentStepIndex === 1 && (
          <Card variant="clay" className="p-6 flex flex-col gap-4 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6EC8FF] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 2 of 3</span>
              </div>
              <h2 className="text-xl font-semibold text-[#F3F1FA]">
                Which apps are work for you?
              </h2>
              <p className="text-xs text-[#9A96AD] mt-1">
                Selected apps receive elevated baseline utility for communication and task completion.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto no-scrollbar py-2">
              {WORK_APP_OPTIONS.map((app) => {
                const isSelected = selectedApps.includes(app);
                return (
                  <button
                    key={app}
                    onClick={() => toggleApp(app)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-[#C6FF3D] text-[#0F0E14] font-semibold border-[#C6FF3D] shadow-sm'
                        : 'bg-[#242134] text-[#9A96AD] border-white/[0.08] hover:text-[#F3F1FA]'
                    }`}
                  >
                    {isSelected ? `✓ ${app}` : `+ ${app}`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="raised"
                size="md"
                onClick={() => setCurrentStepIndex(0)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="lime"
                size="md"
                className="flex-1"
                onClick={handleNextFromApps}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Sensors
              </Button>
            </div>
          </Card>
        )}

        {/* CARD 3: Permissions Panel */}
        {currentStepIndex === 2 && (
          <Card variant="clay" className="p-6 flex flex-col gap-4 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A78BFA] mb-1">
                <Smartphone className="w-4 h-4" />
                <span>Step 3 of 3</span>
              </div>
              <h2 className="text-xl font-semibold text-[#F3F1FA]">
                Connect Phone Sensors
              </h2>
              <p className="text-xs text-[#9A96AD] mt-1">
                KAIROS needs sensor access to detect incoming signals and measure app session friction locally.
              </p>
            </div>

            <div className="flex flex-col gap-3 py-1">
              {/* Row 1: Notification Access */}
              <div className="p-3.5 rounded-2xl bg-[#242134] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-[#C6FF3D]" />
                  <div>
                    <p className="text-xs font-semibold text-[#F3F1FA]">Notification Listener</p>
                    <p className="text-[11px] text-[#9A96AD]">Read incoming sender headers</p>
                  </div>
                </div>
                {isAndroid ? (
                  <Button size="sm" variant="secondary" onClick={openNotificationAccess}>
                    Grant
                  </Button>
                ) : (
                  <span className="text-[11px] text-[#6EC8FF] font-medium bg-[#6EC8FF]/10 px-2.5 py-0.5 rounded-full">
                    Mock active
                  </span>
                )}
              </div>

              {/* Row 2: Usage Access */}
              <div className="p-3.5 rounded-2xl bg-[#242134] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-[#6EC8FF]" />
                  <div>
                    <p className="text-xs font-semibold text-[#F3F1FA]">App Usage Stats</p>
                    <p className="text-[11px] text-[#9A96AD]">Detects detour session minutes</p>
                  </div>
                </div>
                {isAndroid ? (
                  <Button size="sm" variant="secondary" onClick={openUsageAccess}>
                    Grant
                  </Button>
                ) : (
                  <span className="text-[11px] text-[#6EC8FF] font-medium bg-[#6EC8FF]/10 px-2.5 py-0.5 rounded-full">
                    Simulated
                  </span>
                )}
              </div>

              {/* Row 3: Allow Notifications */}
              <div className="p-3.5 rounded-2xl bg-[#242134] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A78BFA]" />
                  <div>
                    <p className="text-xs font-semibold text-[#F3F1FA]">Delivery Channel</p>
                    <p className="text-[11px] text-[#9A96AD]">Receive scheduled digests</p>
                  </div>
                </div>
                {notifGranted ? (
                  <span className="text-[11px] text-[#C6FF3D] font-medium bg-[#C6FF3D]/10 px-2 py-0.5 rounded-full">
                    Enabled
                  </span>
                ) : (
                  <Button size="sm" variant="lime" onClick={requestNotif}>
                    Allow
                  </Button>
                )}
              </div>

              {/* Android Notice */}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#9A96AD] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFC44D] shrink-0 mt-0.5" />
                <span>
                  Android tip: If toggles are disabled, tap <strong>App info &gt; menu (⋮) &gt; Allow restricted settings</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="raised"
                size="md"
                onClick={() => setCurrentStepIndex(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="lime"
                size="md"
                className="flex-1"
                onClick={handleFinish}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Using KAIROS
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
