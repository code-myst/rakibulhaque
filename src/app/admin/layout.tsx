"use client";

import { DashboardShell, ADMIN_NAV } from "@/components/layout/dashboard-shell";
import { RoleGate } from "@/components/auth/role-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow="admin">
      <DashboardShell nav={ADMIN_NAV} role="admin">
        {children}
      </DashboardShell>
    </RoleGate>
  );
}
