"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { HostileAlertBar } from "@/components/layout/HostileAlertBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubHeaderBar } from "@/components/layout/SubHeaderBar";
import { PlanetList } from "@/components/layout/PlanetList";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { NotesModal } from "@/components/modals/NotesModal";
import { BuddiesModal } from "@/components/modals/BuddiesModal";
import { GlobalSearchModal } from "@/components/modals/GlobalSearchModal";

const GameShellContext = createContext<boolean>(false);

export default function GameLayout({ children }: { children: ReactNode }) {
  const isInsideShell = useContext(GameShellContext);

  if (isInsideShell) {
    return <>{children}</>;
  }

  return (
    <GameShellContext.Provider value={true}>
      <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-[radial-gradient(ellipse_at_top,#090c12_0%,#05070b_55%,#020408_100%)] text-zinc-100">
        {/* Deep Space Starfield & Nebula Ambient Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.75) 50%, transparent 100%), radial-gradient(1.5px 1.5px at 45% 65%, rgba(34,211,238,0.6) 50%, transparent 100%), radial-gradient(1px 1px at 78% 30%, rgba(255,255,255,0.65) 50%, transparent 100%), radial-gradient(2px 2px at 88% 80%, rgba(16,185,129,0.45) 50%, transparent 100%), radial-gradient(1px 1px at 32% 85%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            backgroundSize: "320px 320px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px] z-0"
        />

        {/* Top Header (~75px height) */}
        <Header />

        {/* Hostile Fleet Raid Alert Warning Bar */}
        <HostileAlertBar />

        {/* Main 3-Column Body: Left Sidebar (~180px) + Center Stage + Right Planet Switcher (~140px) */}
        <div className="relative z-10 flex-1 flex min-h-0 overflow-hidden">
          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Secondary Sub-Header Bar (Task 05AO) */}
            <SubHeaderBar />

            <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="mx-auto w-full max-w-[1040px]">{children}</div>
            </main>
          </div>

          <PlanetList />
        </div>

        {/* Auxiliary Game Modals (Notes, Buddies, Global Search, Settings) */}
        <SettingsModal />
        <NotesModal />
        <BuddiesModal />
        <GlobalSearchModal />
      </div>
    </GameShellContext.Provider>
  );
}

