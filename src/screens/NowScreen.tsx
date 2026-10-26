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
import { FocusClockChart } from '../components/charts/FocusClockChart';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  Shield,
  Coffee,
  Battery,
  Flame,
  CheckCircle2,
  ArrowRight,
  User,
  Sliders,
  Send,
  Bell,
} from 'lucide-react';
import { ActivityType } from '../engine/types';

const CONTEXT_ACTIVITIES: { id: ActivityType; label: string; icon: string }[] = [
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'studying', label: 'Studying', icon: '📚' },
  { id: 'writing', label: 'Creating', icon: '🎨' },
  { id: 'reading', label: 'Reading', icon: '📖' },
  { id: 'idle', label: 'Resting', icon: '☕' },
];

export const NowScreen: React.FC = () => {
  const userState = useKairosStore((s) => s.userState);
  const setUserState = useKairosStore((s) => s.setUserState);
  const role = useKairosStore((s) => s.role);
  const activeProfileId = useKairosStore((s) => s.activeProfileId);
  const twins = useKairosStore((s) => s.twins);
  const attentionSavedTodayMinutes = useKairosStore((s) => s.attentionSavedTodayMinutes);
  const guardStream = useKairosStore((s) => s.guardStream);
  const setActiveTab = useKairosStore((s) => s.setActiveTab);
  const simulateNaturalLanguageWhatIf = useKairosStore((s) => s.simulateNaturalLanguageWhatIf);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const twin = twins[activeProfileId] || twins.arjun;
  const provenance = twin.focusCurve.provenance;

  // Hourly curve data
  const hourlyCurve = twin.focusCurve.data.weekday.map((p) => p.probDeepFocus);
  const currentHourProb = hourlyCurve[userState.hour] || 0.78;
  const currentFocusPct = Math.round(
    currentHourProb * (1 - userState.fatigue * 0.4) * 100
  );

  const fatiguePct = Math.round(userState.fatigue * 100);

  // Predicted break minutes
  const minutesUntilBreak = Math.max(
    5,
    Math.round(twin.meanFocusBlockMinutes - userState.minutesIntoFocusBlock)
  );

  const savedLow = Math.max(0, Math.round(attentionSavedTodayMinutes * 0.85));
  const savedHigh = Math.round(attentionSavedTodayMinutes * 1.25);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    await simulateNaturalLanguageWhatIf(searchQuery);
    setIsSearching(false);
    setActiveTab('simulate');
  };

  // 3 high-importance notifications to watch
  const notificationsToWatch = guardStream.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28 text-left animate-in fade-in duration-200">
      {/* 1. Greeting + Avatar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0E2F22] border border-[#7FE3C0]/30 flex items-center justify-center font-bold text-sm text-[#7FE3C0] shadow-md">
            <User className="w-5 h-5 text-[#7FE3C0]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[rgba(242,247,243,0.62)] uppercase tracking-wider">
              {role === 'creator' ? 'Creator Twin' : 'Developer Twin'} · Online
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#F2F7F3]">
              Good evening, {activeProfileId === 'meera' ? 'Meera' : 'Arjun'}
            </h1>
          </div>
        </div>

        <Badge label="Twin Sync 64%" variant="accent" />
      </div>

      {/* 2. NeuSearch Natural Language What-If Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit();
        }}
        className="w-full"
      >
        <NeuSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Ask your twin: what if my manager DMs me at 11pm?"
        />
      </form>

      {/* 3. Context Activity Chip Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CONTEXT_ACTIVITIES.map((act) => {
          const isActive = userState.activity === act.id;
          return (
            <button
              key={act.id}
              onClick={() => setUserState({ activity: act.id })}
              className={`text-xs px-3.5 py-2 rounded-2xl border flex items-center gap-1.5 shrink-0 transition-all ${
                isActive
                  ? 'bg-[#7FE3C0] text-[#081B12] font-bold border-[#7FE3C0] shadow-md shadow-[#7FE3C0]/20'
                  : 'bg-[#0D241B] text-[rgba(242,247,243,0.65)] border-white/10 hover:text-[#F2F7F3]'
              }`}
            >
              <span>{act.icon}</span>
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Bento Dashboard Layout */}
      <BentoGrid>
        {/* HERO TILE: Merged Brains + Focus + Attention Saved (4x2 on mobile) */}
        <BentoTile span="4x2" className="p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0F3B2C]/40 to-[#0B2A1E]/80">
          <div className="flex items-center justify-between z-10">
            <div>
              <span className="text-[11px] font-bold text-[#7FE3C0] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>On-Device Attention Twin</span>
              </span>
              <p className="text-sm font-semibold text-[#F2F7F3] mt-0.5 capitalize">
                {userState.activity} session · {userState.minutesIntoFocusBlock}m active
              </p>
            </div>

            <div className="px-3 py-1 rounded-full bg-[#0E2F22] border border-[#7FE3C0]/30 text-xs font-mono-numbers text-[#7FE3C0] font-bold">
              {currentFocusPct}% Focus
            </div>
          </div>

          {/* Interactive Merged Brains Scene */}
          <div className="w-full my-1">
            <BrainsScene merge={0.64} pulse={currentFocusPct / 100} size={200} />
          </div>

          {/* Bottom Bar inside Hero Tile */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3 z-10">
            <div>
              <span className="text-[10px] text-[rgba(242,247,243,0.6)] uppercase font-semibold">
                Saved Today
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono-numbers text-[#7FE3C0]">
                  +{attentionSavedTodayMinutes}m
                </span>
                <span className="text-[10px] text-[rgba(242,247,243,0.5)] font-mono-numbers">
                  [{savedLow}m, {savedHigh}m]
                </span>
              </div>
            </div>

            <ClayButton
              variant="sage"
              size="sm"
              onClick={() => setActiveTab('simulate')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Simulate
            </ClayButton>
          </div>
        </BentoTile>

        {/* Focus Clock Tile: 24 bars (4x1) */}
        <BentoTile span="4x1" className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F2F7F3] flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[#FFC44D]" />
              <span>Diurnal Focus Clock</span>
            </span>
            <span className="text-[11px] font-mono-numbers text-[#7FE3C0]">
              Peak: <strong>{userState.hour}:00</strong>
            </span>
          </div>
          <FocusClockChart
            hourlyFocus={hourlyCurve}
            currentHour={userState.hour}
            onSelectHour={(h) => setUserState({ hour: h })}
          />
        </BentoTile>

        {/* Fatigue Dial Tile (2x1) */}
        <BentoTile span="2x1" className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[rgba(242,247,243,0.65)] uppercase flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-[#FFC44D]" />
            <span>Fatigue Load</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono-numbers text-[#FFC44D]">
              {fatiguePct}%
            </span>
            <span className="text-[11px] text-[rgba(242,247,243,0.5)]">Accumulated</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7FE3C0] via-[#FFC44D] to-[#FF6B4A]"
              style={{ width: `${fatiguePct}%` }}
            />
          </div>
        </BentoTile>

        {/* Next Break Tile (2x1) */}
        <BentoTile span="2x1" className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[rgba(242,247,243,0.65)] uppercase flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-[#6EC8FF]" />
            <span>Next Break</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono-numbers text-[#6EC8FF]">
              ~{minutesUntilBreak}
            </span>
            <span className="text-[11px] text-[rgba(242,247,243,0.5)]">minutes</span>
          </div>
          <span className="text-[10px] text-[rgba(242,247,243,0.45)] mt-2">
            Natural focus block boundary
          </span>
        </BentoTile>
      </BentoGrid>

      {/* 5. Horizontal "Notifications to Watch" Cards */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[rgba(242,247,243,0.65)] uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#7FE3C0]" />
            <span>Notifications To Watch</span>
          </h3>
          <button
            onClick={() => setActiveTab('guard')}
            className="text-xs text-[#7FE3C0] hover:underline font-semibold"
          >
            View All ({guardStream.length})
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {notificationsToWatch.map((item) => (
            <GlassCard
              key={item.id}
              onClick={() => setActiveTab('guard')}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#0E2F22] text-[#7FE3C0] flex items-center justify-center font-bold text-xs shrink-0 border border-[#7FE3C0]/30">
                  {item.appName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F2F7F3] truncate">
                      {item.appName}
                    </span>
                    <span className="text-[10px] text-[rgba(242,247,243,0.5)] font-mono-numbers">
                      {item.senderImportance ? `${Math.round(item.senderImportance * 100)}% imp` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(242,247,243,0.65)] truncate max-w-[220px]">
                    {item.body}
                  </p>
                </div>
              </div>

              <ClayChip verdict={item.verdict} size="sm" />
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
