"use client";

import * as React from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User as SiteUser,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { siteAuth, siteDb } from "@/lib/firebase-site";

export interface SiteAuthContextValue {
  siteUser: SiteUser | null;
  siteRole: "admin" | "visitor" | null;
  siteLoading: boolean;
  signInSite: (email: string, password: string) => Promise<UserCredential>;
  signInSiteGoogle: () => Promise<UserCredential>;
  signOutSite: () => Promise<void>;
}

const SiteAuthContext = React.createContext<SiteAuthContextValue | undefined>(undefined);

export function SiteAuthProvider({ children }: { children: React.ReactNode }) {
  const [siteUser, setSiteUser] = React.useState<SiteUser | null>(null);
  const [siteRole, setSiteRole] = React.useState<"admin" | "visitor" | null>(null);
  const [siteLoading, setSiteLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(siteAuth, async (u) => {
      setSiteUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(siteDb, "users", u.uid));
          const role = (snap.exists() ? snap.data().role : "visitor") as
            | "admin"
            | "visitor";
          setSiteRole(role ?? "visitor");
        } catch {
          setSiteRole(null);
        }
      } else {
        setSiteRole(null);
      }
      setSiteLoading(false);
    });
    return unsub;
  }, []);

  const signInSite = React.useCallback(
    (email: string, password: string) => signInWithEmailAndPassword(siteAuth, email, password),
    []
  );

  const signInSiteGoogle = React.useCallback(async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(siteAuth, provider);
  }, []);

  const signOutSite = React.useCallback(async () => {
    await fbSignOut(siteAuth);
  }, []);

  const value: SiteAuthContextValue = {
    siteUser,
    siteRole,
    siteLoading,
    signInSite,
    signInSiteGoogle,
    signOutSite,
  };

  return <SiteAuthContext.Provider value={value}>{children}</SiteAuthContext.Provider>;
}

export { SiteAuthContext };
