"use client";

import * as React from "react";
import { SiteAuthContext } from "@/context/site-auth";

export function useSiteAuth() {
  const ctx = React.useContext(SiteAuthContext);
  if (!ctx) throw new Error("useSiteAuth must be used inside <SiteAuthProvider>");
  return ctx;
}
