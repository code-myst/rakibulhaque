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
import { doc, onSnapshot } from "firebase/firestore";
import { siteAuth, siteDb } from "@/lib/firebase-site";

type SiteRole = "admin" | "client" | "visitor";

export interface SiteAuthContextValue {
  siteUser: SiteUser | null;
  siteRole: SiteRole | null;
  siteLoading: boolean;
  signInSite: (email: string, password: string) => Promise<UserCredential>;
  signInSiteGoogle: () => Promise<UserCredential>;
  signOutSite: () => Promise<void>;
}

const SiteAuthContext = React.createContext<SiteAuthContextValue | undefined>(undefined);

export function SiteAuthProvider({ children }: { children: React.ReactNode }) {
  const [siteUser, setSiteUser] = React.useState<SiteUser | null>(null);
  const [siteRole, setSiteRole] = React.useState<SiteRole | null>(null);
  const [siteLoading, setSiteLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubRole: (() => void) | undefined;
    const unsub = onAuthStateChanged(siteAuth, (u) => {
      setSiteUser(u);
      unsubRole?.();
      if (u) {
        // role live — SiteGate-এর অটো-admin আপগ্রেড সাথে সাথে ধরা পড়ে
        unsubRole = onSnapshot(
          doc(siteDb, "users", u.uid),
          (d) => {
            const r = d.exists() ? ((d.data().role as string) ?? "visitor") : "visitor";
            setSiteRole((r === "admin" || r === "client" ? r : "visitor") as SiteRole);
          },
          () => setSiteRole("visitor")
        );
      } else {
        setSiteRole(null);
      }
      setSiteLoading(false);
    });
    return () => {
      unsubRole?.();
      unsub();
    };
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
