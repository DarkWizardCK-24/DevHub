"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Profile } from "./types";

interface ProfileContextValue {
  profile: Profile;
  setProfile: (profile: Profile) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Makes the signed-in profile available to client components (avatar, menus, forms). */
export function ProfileProvider({ initialProfile, children }: { initialProfile: Profile; children: ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside <ProfileProvider>");
  return value;
}
