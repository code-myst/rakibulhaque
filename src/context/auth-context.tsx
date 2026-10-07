"use client";

import * as React from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/users";
import type { AuthContextValue, AppUser, UserRole } from "@/lib/types";

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoading, setProfileLoading] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      // প্রোফাইলের anonymous read session মূল পোর্টালকে প্রভাবিত করবে না
      if (fbUser?.isAnonymous) {
        setUser(null);
        setAppUser(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }
      setUser(fbUser);
      setProfileLoading(!!fbUser);
      if (fbUser) {
        const profile = await ensureUserProfile(fbUser.uid, {
          name: fbUser.displayName ?? "New Partner",
          phone: fbUser.phoneNumber ?? "",
          email: fbUser.email ?? "",
        });
        setAppUser(profile);
        setProfileLoading(false);
      } else {
        setAppUser(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = React.useCallback(
    (emailOrPhone: string, password: string) =>
      signInWithEmailAndPassword(auth, emailOrPhone, password),
    []
  );

  const signInWithGoogle = React.useCallback(async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }, []);

  const signOut = React.useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const effectiveRole: UserRole =
    appUser?.role === "admin" ? "admin" : "partner";

  const value: AuthContextValue = {
    user,
    appUser,
    loading,
    profileLoading,
    effectiveRole,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
