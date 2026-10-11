"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await api.post("/activity/auth", { event: "logout" }).catch(() => undefined); // needs the token, so before signOut
    const { error } = await createClient().auth.signOut();
    if (error) {
      setSigningOut(false);
      toast.error("Couldn't sign out", { description: error.message });
      return;
    }
    // refresh() drops server-rendered data cached for the old session.
    router.replace("/login");
    router.refresh();
  }

  return { signOut, signingOut };
}
