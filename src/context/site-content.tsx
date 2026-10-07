"use client";

import * as React from "react";
import { fetchSiteContent } from "@/lib/site-content";
import { DEFAULT_SITE_CONTENT } from "@/lib/default-site-content";
import type { SiteContent } from "@/lib/types";

interface SiteContentContextValue {
  /** null = লোড হচ্ছে */
  site: SiteContent | null;
  /** লাইভ কনটেন্ট বা ডিফল্ট — UI সবসময় এটা রেন্ডার করে */
  siteOrDefault: SiteContent;
}

const SiteContentContext = React.createContext<SiteContentContextValue | undefined>(undefined);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [site, setSite] = React.useState<SiteContent | null>(null);

  React.useEffect(() => {
    fetchSiteContent().then((c) => setSite(c));
  }, []);

  const siteOrDefault = site ?? DEFAULT_SITE_CONTENT;

  return (
    <SiteContentContext.Provider value={{ site, siteOrDefault }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = React.useContext(SiteContentContext);
  if (!ctx) throw new Error("useSiteContent must be used inside <SiteContentProvider>");
  return ctx;
}

export { SiteContentContext };
