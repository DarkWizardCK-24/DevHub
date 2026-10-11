import type { ReactNode } from "react";
import { ProfileProvider } from "@/lib/auth/profile-context";
import type { Profile } from "@/lib/auth/types";
import { MobileHeader } from "./mobile-header";
import { MobileTabBar } from "./mobile-tab-bar";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * Layout for every signed-in page.
 *  Desktop (≥768px): sidebar + top bar.
 *  Mobile: compact app bar + bottom tab bar (content is padded so it never hides underneath).
 */
export function AppShell({ profile, children, sidebar }: { profile: Profile; children: ReactNode; sidebar?: ReactNode }) {
  return (
    <ProfileProvider initialProfile={profile}>
      <div className="flex min-h-dvh">
        {sidebar ?? <Sidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <MobileHeader />
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-8 md:pb-12 lg:px-8">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </ProfileProvider>
  );
}
