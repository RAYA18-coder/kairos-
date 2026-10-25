/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore } from '../store/useKairosStore';
import {
  Shield,
  Check,
  X,
  Clock,
  Layers,
  Bell,
  BellRing,
  Send,
  Database,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { NotificationItem } from '../engine/types';

export const GuardScreen: React.FC = () => {
  const guardStream = useKairosStore((s) => s.guardStream);
  const digestItems = useKairosStore((s) => s.digestItems);
  const attentionSavedTodayMinutes = useKairosStore((s) => s.attentionSavedTodayMinutes);
  const overrideGuardDecision = useKairosStore((s) => s.overrideGuardDecision);
  const notificationPermission = useKairosStore((s) => s.notificationPermission);
  const requestNotificationPermission = useKairosStore((s) => s.requestNotificationPermission);
  const sendRealNotification = useKairosStore((s) => s.sendRealNotification);
  const syncWithIndexedDbTelemetry = useKairosStore((s) => s.syncWithIndexedDbTelemetry);

  const [activeTab, setActiveTab] = useState<'stream' | 'lab'>('stream');
  const [isSyncing, setIsSyncing] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState<string | null>(null);

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'ALLOW NOW':
        return 'text-[#C6FF3D] border-[#C6FF3D]/30 bg-[#C6FF3D]/10';
      case 'HOLD UNTIL NEXT BREAK':
        return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'BATCH IN DIGEST':
        return 'text-sky-400 border-sky-400/30 bg-sky-400/10';
      case 'SUPPRESS':
        return 'text-[#FF6B4A] border-[#FF6B4A]/30 bg-[#FF6B4A]/10';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-800/40';
    }
  };

  const handleSendTestAlert = async (type: 'distraction' | 'urgent') => {
    triggerHaptic('heavy');
    const notif: NotificationItem =
      type === 'urgent'
        ? {
            id: `real_${Date.now()}`,
            appName: 'System',
            type: 'otp',
            title: 'Security Verification',
            body: '739104 is your temporary authentication passcode.',
            senderImportance: 1.0,
            timestamp: Date.now(),
          }
        : {
            id: `real_${Date.now()}`,
            appName: 'Instagram',
            type: 'social_like',
            title: 'Instagram',
            body: 'sarah_m and 3 others liked your recent photo.',
            senderImportance: 0.1,
            timestamp: Date.now(),
          };

    await sendRealNotification(notif);
    setTestNotificationSent(type);
    setTimeout(() => setTestNotificationSent(null), 3000);
  };

  const handleSyncTelemetry = async () => {
    triggerHaptic('medium');
    setIsSyncing(true);
    await syncWithIndexedDbTelemetry();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="relative z-10 min-h-[calc(100dvh-130px)] px-4 py-3 pb-32 space-y-4">
      {/* Top Banner */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
              ACTIVE DEFENSE
            </span>
            <h2 className="text-lg font-light text-white font-sans">Attention Guard Stream</h2>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[#C6FF3D]">
            +{attentionSavedTodayMinutes}m saved
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-sans mt-1">
          Real-time cognitive firewall. Suppresses algorithmic hooks, batches digests, and admits high-utility alerts.
        </p>
      </div>

      {/* Mode Switcher: Live Stream vs Real Notification Lab */}
      <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06] text-xs font-mono">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('stream');
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'stream'
              ? 'bg-white/10 text-white font-medium shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Guard Stream ({guardStream.length})
        </button>
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('lab');
          }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'lab'
              ? 'bg-white/10 text-white font-medium shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BellRing className="w-3.5 h-3.5 text-[#C6FF3D]" />
          <span>Real Notification Lab</span>
        </button>
      </div>

      {activeTab === 'lab' ? (
        /* REAL NOTIFICATION LAB */
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#090d14]/90 border border-[#C6FF3D]/30 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#C6FF3D]" />
                <span className="text-xs font-mono uppercase tracking-wider text-white">
                  DEVICE NOTIFICATION INTEGRATION
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300">
                STATUS: {notificationPermission.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              KAIROS connects directly to your device Service Worker (<code className="text-[#C6FF3D] font-mono text-[11px]">/public/sw.js</code>). Real notifications dispatched here log your actual dismissals and tap latencies into an encrypted on-device IndexedDB store.
            </p>

            {notificationPermission !== 'granted' ? (
              <button
                onClick={async () => {
                  triggerHaptic('heavy');
                  await requestNotificationPermission();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#C6FF3D] hover:bg-[#b2eb30] text-black font-mono text-xs font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-3.5 h-3.5 fill-current" />
                <span>REQUEST SYSTEM PERMISSION</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-[#C6FF3D] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Native Notification API permissions granted & active.</span>
              </div>
            )}
          </div>

          {/* Test Signal Triggers */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              FIRE TEST SIGNALS THROUGH TWIN ENGINE
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSendTestAlert('distraction')}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-[#FF6B4A]/30 text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#FF6B4A]">Social Like</span>
                  <Send className="w-3 h-3 text-[#FF6B4A] opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Predicted detour ~17m. Twin triggers <strong className="text-white">SUPPRESS</strong>.
                </p>
              </button>

              <button
                onClick={() => handleSendTestAlert('urgent')}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-[#C6FF3D]/30 text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#C6FF3D]">OTP / Security</span>
                  <Send className="w-3 h-3 text-[#C6FF3D] opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Utility = 1.0. Twin triggers <strong className="text-white">ALLOW NOW</strong>.
                </p>
              </button>
            </div>

            {testNotificationSent && (
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[#C6FF3D] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Dispatched through engine. Guard list updated below.</span>
              </div>
            )}
          </div>

          {/* IndexedDB Telemetry Sync Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono uppercase text-white">
                  LOCAL INDEXEDDB TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Reads offline tap/dismiss events and applies online Bayesian weighting (2.0x).
              </p>
            </div>

            <button
              onClick={handleSyncTelemetry}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white shrink-0 transition-all flex items-center gap-1.5"
            >
              <span>{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* STREAM & DIGEST LIST */
        <>
          {/* DIGEST CARD: Batching held items for next break */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-white">
                  COGNITIVE DIGEST BATCH
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" /> Release ~22:50
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              {digestItems.length} notifications held to maintain uninterrupted neural state.
            </p>

            <div className="space-y-1.5 pt-1">
              {digestItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-zinc-300 block truncate">{item.appName}</span>
                    <span className="text-[11px] text-zinc-500 truncate block">{item.body}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 shrink-0">
                    BATCHED
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* INCOMING STREAM LIST */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block">
              SIGNAL INTERCEPTION STREAM ({guardStream.length})
            </span>

            {guardStream.map((item) => {
              const isOverridden = !!item.userOverride;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#090d14]/90 border border-white/[0.06] backdrop-blur-md space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium font-sans text-white">{item.appName}</span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-white/[0.04]">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans mt-0.5 truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-500 font-sans mt-0.5 line-clamp-2">
                        "{item.body}"
                      </p>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold tracking-wider uppercase shrink-0 ${getVerdictStyle(
                        item.userOverride || item.verdict
                      )}`}
                    >
                      {item.userOverride ? `OVERRIDE: ${item.userOverride}` : item.verdict}
                    </div>
                  </div>

                  {/* Engine Reason */}
                  <div className="text-[11px] text-zinc-400 font-sans bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                    {item.reason}
                  </div>

                  {/* Override / Teach Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {isOverridden ? 'Twin updated with feedback' : 'Did twin judge correctly?'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          overrideGuardDecision(item.id, 'ALLOWED');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 border transition-all ${
                          item.userOverride === 'ALLOWED'
                            ? 'bg-[#C6FF3D]/20 border-[#C6FF3D] text-[#C6FF3D]'
                            : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Allow</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          overrideGuardDecision(item.id, 'SUPPRESSED');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 border transition-all ${
                          item.userOverride === 'SUPPRESSED'
                            ? 'bg-[#FF6B4A]/20 border-[#FF6B4A] text-[#FF6B4A]'
                            : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Suppress</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
