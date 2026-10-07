"use client";

import { AuthProvider } from "@/context/auth-context";
import { SiteAuthProvider } from "@/context/site-auth";
import { LangProvider } from "@/context/site-lang";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteAuthProvider>
        <LangProvider>{children}</LangProvider>
      </SiteAuthProvider>
    </AuthProvider>
  );
}
