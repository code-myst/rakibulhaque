"use client";

import { PendingGate } from "@/components/auth/pending-gate";
import { RoleGate } from "@/components/auth/role-gate";
import { DashboardShell, PARTNER_NAV } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPublicSettings } from "@/lib/settings";
import type { PublicSettings } from "@/lib/types";

function AnnouncementBanner() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  useEffect(() => {
    fetchPublicSettings().then(setSettings).catch(() => setSettings(null));
  }, []);
  if (!settings?.announcementEnabled || !settings.announcementText.trim()) return null;
  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200 sm:mx-6">
      <Megaphone className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">ঘোষণা: </span>
        {settings.announcementText}
      </p>
    </div>
  );
}

/**
 * Partner layout — approve না হওয়া পর্যন্ত dashboard নয়,
 * PendingGate (payment form + waiting) দেখাবে।
 */
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { appUser, loading, profileLoading } = useAuth();

  return (
    <RoleGate allow="partner">
      {appUser && appUser.status !== "active" ? (
        loading || profileLoading ? null : (
          <PendingGate />
        )
      ) : (
        <DashboardShell nav={PARTNER_NAV} role="partner" banner={<AnnouncementBanner />}>
          {children}
        </DashboardShell>
      )}
    </RoleGate>
  );
}
