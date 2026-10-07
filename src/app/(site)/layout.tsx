"use client";

import * as React from "react";
import { SiteContentProvider } from "@/context/site-content";
import { PortfolioNavbar } from "@/components/site/portfolio-navbar";
import { PortfolioFooter } from "@/components/site/portfolio-footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteContentProvider>
      <div className="flex min-h-screen flex-col">
        <PortfolioNavbar />
        <main className="flex-1">{children}</main>
        <PortfolioFooter />
      </div>
    </SiteContentProvider>
  );
}
