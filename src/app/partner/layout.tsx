"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Megaphone } from "lucide-react";
import { DashboardShell, PARTNER_NAV } from "@/components/layout/dashboard-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/hooks/use-auth";
import { fetchPublicSettings } from "@/lib/settings";
import type { PublicSettings } from "@/lib/types";

function PendingBanner() {
  const { appUser } = useAuth();
  if (!appUser || appUser.status !== "pending") return null;
  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 sm:mx-6">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">অ্যাকাউন্ট পেন্ডিং।</span> অ্যাডমিন অ্যাপ্রুভ করার আগে
        রেফারেল লিংক ব্যবহার করে ক্লায়েন্ট সাবমিট করা যাবে না। অনুগ্রহ করে অপেক্ষা করুন।
      </p>
    </div>
  );
}

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

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow="partner">
      <DashboardShell
        nav={PARTNER_NAV}
        role="partner"
        banner={
          <>
            <AnnouncementBanner />
            <PendingBanner />
          </>
        }
      >
        {children}
      </DashboardShell>
    </RoleGate>
  );
}
