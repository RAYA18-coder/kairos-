/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKairosStore, GuardStreamItem } from '../store/useKairosStore';
import {
  GlassCard,
  ClayButton,
  ClayChip,
  NeuSegmented,
} from '../components/ui/ReferenceComponents';
import { BottomSheet } from '../components/BottomSheet';
import {
  Shield,
  Bell,
  ThumbsUp,
  ThumbsDown,
  Star,
  Sparkles,
  Inbox,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Info,
} from 'lucide-react';

export const GuardScreen: React.FC = () => {
  const guardStream = useKairosStore((s) => s.guardStream);
  const digestList = useKairosStore((s) => s.digestList);
  const releaseDigestNow = useKairosStore((s) => s.releaseDigestNow);
  const recordNotificationFeedback = useKairosStore((s) => s.recordNotificationFeedback);
  const toggleSenderVip = useKairosStore((s) => s.toggleSenderVip);
  const sendTestNotificationNow = useKairosStore((s) => s.sendTestNotificationNow);
  const role = useKairosStore((s) => s.role);
  const attentionSavedTodayMinutes = useKairosStore((s) => s.attentionSavedTodayMinutes);

  const [filter, setFilter] = useState<'all' | 'held' | 'allowed'>('all');
  const [selectedItem, setSelectedItem] = useState<GuardStreamItem | null>(null);
  const [isTestSending, setIsTestSending] = useState(false);

  const filteredItems = guardStream.filter((item) => {
    if (filter === 'held') {
      return item.status === 'held' || item.status === 'batched' || item.status === 'suppressed';
    }
    if (filter === 'allowed') {
      return item.status === 'sent';
    }
    return true;
  });

  const handleTestAlert = async () => {
    setIsTestSending(true);
    await sendTestNotificationNow();
    setTimeout(() => setIsTestSending(false), 800);
  };

  const getAppIcon = (appName: string) => {
    const lower = appName.toLowerCase();
    if (lower.includes('instagram')) {
      return (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-pink-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
          IG
        </div>
      );
    }
    if (lower.includes('slack')) {
      return (
        <div className="w-9 h-9 rounded-2xl bg-[#4A154B] text-[#E01E5A] border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
          #
        </div>
      );
    }
    if (lower.includes('whatsapp')) {
      return (
        <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-[#081B12] flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
          WA
        </div>
      );
    }
    if (lower.includes('system') || lower.includes('auth') || lower.includes('bank')) {
      return (
        <div className="w-9 h-9 rounded-2xl bg-[#7FE3C0] text-[#081B12] flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-[#7FE3C0]/20">
          <Shield className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-2xl bg-[#123628] text-[#7FE3C0] border border-[#7FE3C0]/30 flex items-center justify-center font-bold text-xs shrink-0">
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-28 text-left animate-in fade-in duration-200">
      {/* 1. Header with Live Status & Test Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FE3C0] animate-pulse" />
            <span className="text-xs font-semibold text-[#7FE3C0] tracking-wide uppercase">
              On-Device Firewall
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F7F3] mt-0.5">
            Attention Guard
          </h1>
        </div>

        <ClayButton
          variant="sage"
          size="sm"
          isLoading={isTestSending}
          onClick={handleTestAlert}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send Test
        </ClayButton>
      </div>

      {/* 2. Personalization & Role Badge Card */}
      <GlassCard className="p-4 flex items-center justify-between gap-3 border border-[#7FE3C0]/20 bg-[#0B2A1E]/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#0E2F22] text-[#7FE3C0] border border-[#7FE3C0]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F7F3]">
                Role Profile: <span className="text-[#7FE3C0] capitalize">{role}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7FE3C0]/15 text-[#7FE3C0] font-mono-numbers">
                Hierarchical Beta
              </span>
            </div>
            <p className="text-[11px] text-[rgba(242,247,243,0.62)] mt-0.5">
              Learns importance by content type and sender, not just app name.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-[rgba(242,247,243,0.5)] block">
            Saved Today
          </span>
          <span className="text-sm font-bold font-mono-numbers text-[#7FE3C0]">
            +{attentionSavedTodayMinutes}m
          </span>
        </div>
      </GlassCard>

      {/* 3. Scheduled Digest Banner (when items are batched) */}
      {digestList.length > 0 && (
        <GlassCard className="p-4 flex items-center justify-between gap-3 border border-[#6EC8FF]/40 bg-[#6EC8FF]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#6EC8FF]/20 text-[#6EC8FF] flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F2F7F3]">
                Scheduled Digest ({digestList.length} held)
              </p>
              <p className="text-[11px] text-[rgba(242,247,243,0.65)]">
                Queued for 21:00 or your next natural focus break
              </p>
            </div>
          </div>
          <ClayButton
            variant="mint"
            size="sm"
            onClick={releaseDigestNow}
            className="text-xs px-3"
          >
            Release Now
          </ClayButton>
        </GlassCard>
      )}

      {/* 4. Filter Switcher (Neumorphic Segmented) */}
      <NeuSegmented
        value={filter}
        onChange={(val) => setFilter(val as any)}
        options={[
          { id: 'all', label: `All Stream (${guardStream.length})` },
          { id: 'held', label: 'Held / Suppressed' },
          { id: 'allowed', label: 'Allowed' },
        ]}
      />

      {/* 5. Live Interception Stream List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <GlassCard className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-3xl bg-[#0E2F22] text-[#7FE3C0] border border-[#7FE3C0]/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#7FE3C0]" />
            </div>
            <h3 className="text-base font-bold text-[#F2F7F3]">No Interceptions Yet</h3>
            <p className="text-xs text-[rgba(242,247,243,0.62)] max-w-xs leading-relaxed">
              KAIROS is actively evaluating incoming phone signals on-device. Tap Send Test to simulate an alert.
            </p>
            <ClayButton variant="sage" size="sm" onClick={handleTestAlert} className="mt-2">
              Emit Test Alert
            </ClayButton>
          </GlassCard>
        ) : (
          filteredItems.map((item) => {
            const timeAgo = Math.max(1, Math.round((Date.now() - item.timestamp) / 60000));
            const hasConfidence = !!item.importanceConfidence;
            const isVip = item.isVip;

            return (
              <GlassCard
                key={item.id}
                className="p-4 flex flex-col gap-3 transition-colors duration-150"
              >
                {/* Top Row: App Icon, Names, Channels, Verdict Chip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getAppIcon(item.appName)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#F2F7F3] truncate">
                          {item.appName}
                        </span>
                        {item.channel && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[rgba(242,247,243,0.7)] capitalize">
                            {item.channel}
                          </span>
                        )}
                        {isVip && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFC44D]/20 text-[#FFC44D] border border-[#FFC44D]/30 font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[rgba(242,247,243,0.5)] font-mono-numbers">
                        {timeAgo}m ago
                      </span>
                    </div>
                  </div>

                  <ClayChip verdict={item.verdict} size="sm" />
                </div>

                {/* Body Text */}
                <p className="text-xs text-[#F2F7F3] line-clamp-2 leading-relaxed">
                  {item.body || item.title}
                </p>

                {/* Engine Reason + Personal Importance Box */}
                <div className="p-3 rounded-2xl bg-[#061A12]/80 border border-white/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between text-[rgba(242,247,243,0.7)]">
                    <span className="text-[11px]">
                      Importance Score:{' '}
                      <strong className="text-[#7FE3C0] font-mono-numbers">
                        {Math.round(item.senderImportance * 100)}%
                      </strong>
                      {hasConfidence && (
                        <span className="font-mono-numbers text-[10px] text-[rgba(242,247,243,0.5)] ml-1">
                          [{Math.round(item.importanceConfidence![0] * 100)}% - {Math.round(item.importanceConfidence![1] * 100)}%]
                        </span>
                      )}
                    </span>

                    {/* Transition from before -> after feedback */}
                    {item.importanceBefore !== undefined && item.importanceAfter !== undefined && (
                      <span className="text-[#C4A7E7] font-mono-numbers text-[11px] font-bold">
                        {Math.round(item.importanceBefore * 100)}% → {Math.round(item.importanceAfter * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[rgba(242,247,243,0.75)]">
                    <strong className="text-[#F2F7F3]">Reason: </strong>
                    {item.importanceWhy || item.reason}
                  </p>
                </div>

                {/* Feedback Controls & VIP Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  {/* Feedback: Worth it / Not worth it */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => recordNotificationFeedback(item.id, 'worth_it')}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-semibold transition-all ${
                        item.userFeedback === 'worth_it'
                          ? 'bg-[#7FE3C0] text-[#081B12] shadow-sm'
                          : 'bg-white/5 text-[rgba(242,247,243,0.7)] hover:text-[#F2F7F3] hover:bg-white/10'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Worth it</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => recordNotificationFeedback(item.id, 'hijacked')}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-semibold transition-all ${
                        item.userFeedback === 'hijacked'
                          ? 'bg-[#FF6B4A] text-white shadow-sm'
                          : 'bg-white/5 text-[rgba(242,247,243,0.7)] hover:text-[#F2F7F3] hover:bg-white/10'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Distracting</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* VIP Sender Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSenderVip(item.id)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                        isVip
                          ? 'bg-[#FFC44D]/25 text-[#FFC44D] border border-[#FFC44D]/40 font-bold'
                          : 'text-[rgba(242,247,243,0.6)] hover:text-[#F2F7F3] hover:bg-white/5'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isVip ? 'fill-[#FFC44D]' : ''}`} />
                      <span>{isVip ? 'VIP' : 'Mark VIP'}</span>
                    </button>

                    {/* Forensic Details button */}
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="p-1.5 rounded-xl text-[rgba(242,247,243,0.5)] hover:text-[#7FE3C0] hover:bg-white/5 transition-colors"
                      title="Forensic Audit"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Forensic Details BottomSheet */}
      <BottomSheet
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Notification Forensics"
        subtitle="On-device attention loss analysis &amp; telemetry audit"
      >
        {selectedItem && (
          <div className="flex flex-col gap-4 pb-6 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F2F7F3]">
                {selectedItem.appName}
              </span>
              <ClayChip verdict={selectedItem.verdict} size="sm" />
            </div>

            <p className="text-xs text-[rgba(242,247,243,0.85)] bg-[#0A1F17] p-3.5 rounded-2xl border border-white/10">
              "{selectedItem.body}"
            </p>

            <div className="p-3.5 rounded-2xl bg-[#061A12] text-xs text-[rgba(242,247,243,0.7)] flex flex-col gap-2 border border-white/5">
              <div className="flex justify-between items-center">
                <span>Attention Saved:</span>
                <strong className="text-[#7FE3C0] font-mono-numbers">
                  +{selectedItem.savedMinutes} min
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Sender Privacy Hash:</span>
                <strong className="font-mono-numbers text-[rgba(242,247,243,0.5)] text-[11px]">
                  {selectedItem.senderHash || 'anonymous'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Interception Status:</span>
                <span className="text-[#F2F7F3] capitalize font-semibold">
                  {selectedItem.status}
                </span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] text-[rgba(242,247,243,0.5)] block mb-1">
                  Causal Mechanism:
                </span>
                <p className="text-xs text-[#F2F7F3]">
                  {selectedItem.reason}
                </p>
              </div>
            </div>

            <ClayButton
              variant="sage"
              size="md"
              onClick={() => setSelectedItem(null)}
              className="w-full mt-2"
            >
              Close Forensics
            </ClayButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
