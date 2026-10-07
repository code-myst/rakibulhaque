"use client";

import { PendingGate } from "@/components/auth/pending-gate";
import { RoleGate } from "@/components/auth/role-gate";
import { useAuth } from "@/hooks/use-auth";

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
        children
      )}
    </RoleGate>
  );
}
