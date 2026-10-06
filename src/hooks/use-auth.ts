"use client";

import * as React from "react";
import { AuthContext } from "@/context/auth-context";
import type { AuthContextValue } from "@/lib/types";

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
