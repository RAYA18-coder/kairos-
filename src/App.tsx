/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useKairosStore } from './store/useKairosStore';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { GuidedDemoController } from './components/GuidedDemoController';
import { SettingsSheet } from './components/SettingsSheet';
import { InAppBanner } from './components/ui/InAppBanner';
import { LockScreen } from './components/LockScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PersonaBuilder } from './screens/PersonaBuilder';
import { NowScreen } from './screens/NowScreen';
import { SimulateScreen } from './screens/SimulateScreen';
import { GuardScreen } from './screens/GuardScreen';
import { TwinScreen } from './screens/TwinScreen';
import { ProofScreen } from './screens/ProofScreen';
import { ExperimentScreen } from './screens/ExperimentScreen';
import { OnboardingModal } from './screens/OnboardingModal';
import { NeuroBrainBackground } from './components/NeuroBrainBackground';

export default function App() {
  const currentView = useKairosStore((s) => s.currentView);
  const setCurrentView = useKairosStore((s) => s.setCurrentView);
  const activeTab = useKairosStore((s) => s.activeTab);
  const isExperimentActive = useKairosStore((s) => s.isExperimentActive);
  const isDeviceLocked = useKairosStore((s) => s.isDeviceLocked);


  // 1. Welcome Splash View (Signature 3D Holographic Two Brains Merging Screen)
  if (currentView === 'welcome') {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#05060F] text-[#f7f7f8] flex justify-center selection:bg-[#5FD1AB]/30 selection:text-[#7FE3C0] overflow-hidden">
        <NeuroBrainBackground />
        <div className="relative z-10 w-full max-w-[480px] min-h-[100dvh] nexus-frame flex flex-col overflow-x-hidden">
          <InAppBanner />
          <WelcomeScreen
            onStart={() => setCurrentView('app')}
            onExploreLanding={() => setCurrentView('landing')}
          />
        </div>
      </div>
    );
  }

  // 2. Landing View: Full-width responsive SaaS showcase with 3D Brain & Glassmorphism
  if (currentView === 'landing') {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#05060F] text-[#f7f7f8] selection:bg-[#5FD1AB]/30 selection:text-[#7FE3C0] overflow-x-hidden">
        <NeuroBrainBackground />
        <div className="relative z-10 w-full">
          <InAppBanner />
          <LandingScreen />
          <GuidedDemoController />
        </div>
      </div>
    );
  }

  // 3. Persona Builder View
  if (currentView === 'builder') {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#05060F] text-[#f7f7f8] flex justify-center selection:bg-[#5FD1AB]/30 selection:text-[#7FE3C0] overflow-hidden">
        <NeuroBrainBackground />
        <div className="relative z-10 w-full max-w-[480px] min-h-[100dvh] nexus-frame flex flex-col overflow-x-hidden">
          <InAppBanner />
          <PersonaBuilder />
        </div>
      </div>
    );
  }

  // 4. Main App View: Mobile-first 480px centered column on desktop, 100dvh fluid on mobile
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#05060F] text-[#f7f7f8] flex justify-center selection:bg-[#5FD1AB]/30 selection:text-[#7FE3C0] overflow-hidden">
      {/* Dynamic 3D Neuro Brain Background Canvas */}
      <NeuroBrainBackground />

      {/* Main Centered Mobile Frame */}
      <div className="relative z-10 w-full max-w-[480px] min-h-[100dvh] nexus-frame flex flex-col overflow-x-hidden">
        {/* In-app notification toast banner */}
        <InAppBanner />

        {/* Top Header with Persona Chooser & Settings Triggers */}
        <Header />

        {/* 60s Guided Demo Controller */}
        <GuidedDemoController />

        {/* Main Tab Screen Area */}
        <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar pb-24">
          {isExperimentActive ? (
            <ExperimentScreen />
          ) : (
            <>
              {activeTab === 'now' && <NowScreen />}
              {activeTab === 'simulate' && <SimulateScreen />}
              {activeTab === 'guard' && <GuardScreen />}
              {activeTab === 'twin' && <TwinScreen />}
              {activeTab === 'proof' && <ProofScreen />}
            </>
          )}
        </main>

        {/* Bottom Tab Bar (hidden during active 90s behavioral experiment) */}
        {!isExperimentActive && <TabBar />}

        {/* First-run 3-card onboarding modal */}
        <OnboardingModal />
      </div>

      {/* Global Modals & Sheets Mounted at Root for Unobstructed z-index Stacking */}
      <SettingsSheet />

      {/* Passcode Security Lock Screen Modal */}
      {isDeviceLocked && <LockScreen />}
    </div>
  );
}
