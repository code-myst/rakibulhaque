"use client";

import { DashboardShell, ADMIN_GROUPS } from "@/components/layout/dashboard-shell";
import { RoleGate } from "@/components/auth/role-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow="admin">
      <DashboardShell groups={ADMIN_GROUPS} role="admin">
        {children}
      </DashboardShell>
    </RoleGate>
  );
}
