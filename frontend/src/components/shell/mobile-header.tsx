"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/lib/auth/profile-context";
import { displayName } from "@/lib/auth/types";
import { AccountSheet } from "./account-sheet";
import { LogoMark } from "./logo";
import { UserAvatar } from "./user-avatar";

/** Compact mobile app bar; the large page title lives in each page's PageHeader. */
export function MobileHeader() {
  const { profile } = useProfile();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 pt-safe backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" aria-label="DevHub home">
            <LogoMark className="size-7" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full text-muted active:bg-raised">
              <Search className="size-5" />
            </Link>
            <button type="button" onClick={() => setAccountOpen(true)} aria-label="Account" className="rounded-full p-1">
              <UserAvatar name={displayName(profile)} src={profile.avatar_url} className="size-8" />
            </button>
          </div>
        </div>
      </header>
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
