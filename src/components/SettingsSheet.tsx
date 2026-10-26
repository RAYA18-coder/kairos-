/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useKairosStore } from '../store/useKairosStore';
import {
  isNative,
  permissionState,
  openNotificationAccess,
  openUsageAccess,
} from '../native/sensor';
import { ensureNotifyPermission } from '../native/notify';
import { UserRole } from '../native/importanceLearner';
import { Smartphone, Bell, Eye, RefreshCw, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Brain, Sliders } from 'lucide-react';

const COMMON_APPS = [
  'Instagram',
  'Slack',
  'YouTube',
  'WhatsApp',
  'Gmail',
  'TikTok',
  'Twitter/X',
  'Notion',
  'VS Code',
  'GitHub',
  'LinkedIn',
];

export const SettingsSheet: React.FC = () => {
  const isSettingsOpen = useKairosStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useKairosStore((s) => s.setIsSettingsOpen);
  const role = useKairosStore((s) => s.role);
  const setRole = useKairosStore((s) => s.setRole);
  const activePersona = useKairosStore((s) => s.activePersona);
  const setActivePersona = useKairosStore((s) => s.setActivePersona);
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const workApps = useKairosStore((s) => s.workApps);
  const setWorkApps = useKairosStore((s) => s.setWorkApps);
  const dataSource = useKairosStore((s) => s.dataSource);
  const setDataSource = useKairosStore((s) => s.setDataSource);
  const deleteEverything = useKairosStore((s) => s.deleteEverything);
  const sendTestNotificationNow = useKairosStore((s) => s.sendTestNotificationNow);

  const isAndroid = isNative();

  const [permState, setPermState] = useState<{
    notificationAccess: boolean;
    usageAccess: boolean;
    mock: boolean;
  }>({
    notificationAccess: false,
    usageAccess: false,
    mock: true,
  });

  const [appNotifGranted, setAppNotifGranted] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  const checkPermissions = async () => {
    const s = await permissionState();
    setPermState(s);
  };

  useEffect(() => {
    if (isSettingsOpen) {
      checkPermissions();
      if (typeof Notification !== 'undefined') {
        setAppNotifGranted(Notification.permission === 'granted');
      }
    }
  }, [isSettingsOpen]);

  const handleGrantAppNotif = async () => {
    const ok = await ensureNotifyPermission();
    setAppNotifGranted(ok);
  };

  const handleSendTestNotification = async () => {
    setIsTestingNotif(true);
    await sendTestNotificationNow('Team Standup', 'Meeting starting in 5 minutes');
    setTimeout(() => setIsTestingNotif(false), 800);
  };

  const toggleWorkApp = (app: string) => {
    if (workApps.includes(app)) {
      setWorkApps(workApps.filter((a) => a !== app));
    } else {
      setWorkApps([...workApps, app]);
    }
  };

  const handleSelectPersona = (id: 'arjun' | 'meera' | 'kabir' | 'rohan', r: UserRole) => {
    setActivePersona(id);
    setRole(r);
  };

  return (
    <Sheet
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      title="Settings & Admin Control"
      description="Select persona profiles, tune attention priors, and manage data sovereignty."
    >
      <div className="flex flex-col gap-6 pb-6 text-left">
        
        {/* 1. Admin Active Persona Selector */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#7FE3C0]" />
              <span>Active Persona Profile</span>
            </h4>
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setCurrentView('builder');
              }}
              className="text-[11px] text-[#00f5ff] hover:underline flex items-center gap-1 font-semibold"
            >
              <Sliders className="w-3 h-3" />
              <span>Custom Builder</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'arjun' as const, name: 'Arjun', role: 'developer' as const, label: 'Deep Work Coder', color: '#00f5ff' },
              { id: 'meera' as const, name: 'Meera', role: 'creator' as const, label: 'Content Creator', color: '#FF6B4A' },
              { id: 'kabir' as const, name: 'Kabir', role: 'student' as const, label: 'Exam Aspirant', color: '#38BDF8' },
              { id: 'rohan' as const, name: 'Rohan', role: 'founder' as const, label: 'Startup Founder', color: '#F59E0B' },
            ].map((p) => {
              const isSelected = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p.id, p.role)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#7FE3C0]/20 border-[#7FE3C0] shadow-md shadow-[#5FD1AB]/20'
                      : 'bg-[#0B2A1E] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8b8988] block mt-1">{p.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Connect Your Phone Panel */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#00f5ff]" />
              <span>Connect Your Phone</span>
            </h4>
            <button
              onClick={checkPermissions}
              className="text-[11px] text-[#B8F27A] hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Check status</span>
            </button>
          </div>

          <Card variant="clay" className="p-4 flex flex-col gap-3.5 bg-[#06120D]/80 border border-white/10">
            {/* Status Row 1: Notification Access */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#8b8988]" />
                <div>
                  <p className="font-semibold text-white text-xs">Notification Listener</p>
                  <p className="text-[11px] text-[#8b8988]">Intercepts phone signals locally</p>
                </div>
              </div>
              {permState.notificationAccess && !permState.mock ? (
                <span className="text-[11px] font-medium text-[#45b558] flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Granted
                </span>
              ) : permState.mock ? (
                <span className="text-[11px] font-medium text-[#00f5ff] bg-[#00f5ff]/10 px-2 py-0.5 rounded-full">
                  Browser Mock (~9s)
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={openNotificationAccess}>
                  Grant
                </Button>
              )}
            </div>

            {/* Status Row 2: Usage Access */}
            <div className="flex items-center justify-between gap-3 text-sm border-t border-white/5 pt-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#8b8988]" />
                <div>
                  <p className="font-semibold text-white text-xs">Usage Access</p>
                  <p className="text-[11px] text-[#8b8988]">Detects app open duration</p>
                </div>
              </div>
              {permState.usageAccess && !permState.mock ? (
                <span className="text-[11px] font-medium text-[#45b558] flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Granted
                </span>
              ) : permState.mock ? (
                <span className="text-[11px] font-medium text-[#00f5ff] bg-[#00f5ff]/10 px-2 py-0.5 rounded-full">
                  Simulated
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={openUsageAccess}>
                  Grant
                </Button>
              )}
            </div>

            {/* Status Row 3: App Notifications */}
            <div className="flex items-center justify-between gap-3 text-sm border-t border-white/5 pt-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8b8988]" />
                <div>
                  <p className="font-semibold text-white text-xs">App Notifications</p>
                  <p className="text-[11px] text-[#8b8988]">Deliver released digests</p>
                </div>
              </div>
              {appNotifGranted ? (
                <span className="text-[11px] font-medium text-[#45b558] flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Allowed
                </span>
              ) : (
                <Button size="sm" variant="lime" onClick={handleGrantAppNotif}>
                  Allow
                </Button>
              )}
            </div>

            {/* Test Notification Button */}
            <div className="pt-1">
              <Button
                variant="raised"
                size="md"
                className="w-full btn-violet"
                isLoading={isTestingNotif}
                onClick={handleSendTestNotification}
                leftIcon={<Bell className="w-4 h-4 text-white" />}
              >
                Send Test Notification (APK & Web)
              </Button>
            </div>
          </Card>
        </section>

        {/* 3. Data Source Selector */}
        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider">
            Data Source
          </h4>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#06120D] rounded-2xl border border-white/10">
            <button
              onClick={() => setDataSource('simulated')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                dataSource === 'simulated'
                  ? 'bg-[#7FE3C0] text-white shadow-sm'
                  : 'text-[#8b8988] hover:text-white'
              }`}
            >
              Simulated Persona
            </button>
            <button
              onClick={() => {
                if (isAndroid) setDataSource('live');
              }}
              disabled={!isAndroid}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                dataSource === 'live'
                  ? 'bg-[#00f5ff] text-black shadow-sm'
                  : isAndroid
                  ? 'text-[#8b8988] hover:text-white'
                  : 'text-[#8b8988]/40 cursor-not-allowed'
              }`}
            >
              Live Device {isAndroid ? '(Active)' : '(Android Only)'}
            </button>
          </div>
        </section>

        {/* 4. Personal Role Prior */}
        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider">
            Personal Archetype Prior
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(['creator', 'developer', 'student', 'founder', 'other'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  role === r
                    ? 'bg-[#7FE3C0]/20 border-[#7FE3C0] text-white font-bold'
                    : 'bg-[#0B2A1E] border-white/10 text-[#8b8988] hover:text-white'
                }`}
              >
                <p className="text-xs font-bold capitalize text-white">{r}</p>
                <p className="text-[10px] text-[#8b8988] mt-0.5">
                  {r === 'creator'
                    ? 'Instagram DMs = Work'
                    : r === 'developer'
                    ? 'Slack & Code = Work'
                    : r === 'student'
                    ? 'Assignments = Work'
                    : r === 'founder'
                    ? 'Urgent Comms = Work'
                    : 'Balanced priors'}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 5. Apps Declared as Work for Me */}
        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider">
            Apps Declared as Work for Me
          </h4>
          <div className="flex flex-wrap gap-2">
            {COMMON_APPS.map((app) => {
              const isSelected = workApps.includes(app);
              return (
                <button
                  key={app}
                  onClick={() => toggleWorkApp(app)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#7FE3C0] to-[#3FB58F] text-white font-bold border-[#7FE3C0]'
                      : 'bg-[#0B2A1E] text-[#8b8988] border-white/10 hover:text-white'
                  }`}
                >
                  {isSelected ? `✓ ${app}` : `+ ${app}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. Privacy & Data Deletion */}
        <section className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
          <h4 className="text-xs font-semibold text-[#8b8988] uppercase tracking-wider">
            Data Sovereignty & Privacy
          </h4>
          <p className="text-xs text-[#8b8988]">
            All predictive cognitive twin models run 100% on-device. No telemetry, raw message texts, or personal communications are ever transmitted or stored in the cloud.
          </p>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              if (window.confirm('Erase all learned twin models and reset to default?')) {
                deleteEverything();
                setIsSettingsOpen(false);
              }
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Erase All Data &amp; Reset Models
          </Button>
        </section>
      </div>
    </Sheet>
  );
};
