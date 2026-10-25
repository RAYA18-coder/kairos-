/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useKairosStore } from './store/useKairosStore';
import { SceneContainer } from './scene/SceneContainer';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { GuidedDemoController } from './components/GuidedDemoController';
import { LockScreen } from './components/LockScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PersonaBuilder } from './screens/PersonaBuilder';
import { NowScreen } from './screens/NowScreen';
import { SimulateScreen } from './screens/SimulateScreen';
import { GuardScreen } from './screens/GuardScreen';
import { TwinScreen } from './screens/TwinScreen';
import { ProofScreen } from './screens/ProofScreen';
import { ExperimentScreen } from './screens/ExperimentScreen';
import { OnboardingModal } from './screens/OnboardingModal';

export default function App() {
  const currentView = useKairosStore((s) => s.currentView);
  const activeTab = useKairosStore((s) => s.activeTab);
  const isExperimentActive = useKairosStore((s) => s.isExperimentActive);
  const isDeviceLocked = useKairosStore((s) => s.isDeviceLocked);

  return (
    <div className="min-h-[100dvh] w-full bg-[#020305] text-[#e6e8eb] flex justify-center selection:bg-[#C6FF3D]/20 selection:text-[#C6FF3D]">
      {/* Centered Mobile Frame (Max 430px, simulating high-end mobile viewport on desktop) */}
      <div className="relative w-full max-w-[430px] min-h-[100dvh] bg-[#050608] flex flex-col shadow-2xl border-x border-white/[0.04] overflow-x-hidden">
        {/* Fixed 3D WebGL Canvas Layer */}
        <SceneContainer />

        {/* View Switcher: Landing vs Persona Builder vs Main App */}
        {currentView === 'landing' ? (
          <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar">
            <LandingScreen />
          </main>
        ) : currentView === 'builder' ? (
          <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar">
            <PersonaBuilder />
          </main>
        ) : (
          <>
            {/* Top Header */}
            <Header />

            {/* Guided Demo floating prompt */}
            <GuidedDemoController />

            {/* Main View Area */}
            <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar">
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

            {/* Bottom Tab Bar (hidden when taking active 90-second experiment) */}
            {!isExperimentActive && <TabBar />}

            {/* First-time onboarding / persona selection modal */}
            <OnboardingModal />
          </>
        )}

        {/* Local Passcode Lock Screen Modal (PBKDF2) */}
        {isDeviceLocked && <LockScreen />}
      </div>
    </div>
  );
}
