"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";

/**
 * Client-side auth guard. `allow` restricts a subtree to one role.
 * Renders a splash while resolving and redirects unauthorized users.
 */
export function RoleGate({ allow, children }: { allow: UserRole; children: React.ReactNode }) {
  const { user, loading, profileLoading, effectiveRole } = useAuth();
  const router = useRouter();
  const ready = !loading && !profileLoading;

  useEffect(() => {
    if (loading) return; // auth still resolving
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profileLoading && effectiveRole !== allow) {
      router.replace(effectiveRole === "admin" ? "/admin" : "/partner");
    }
  }, [user, loading, profileLoading, effectiveRole, allow, router]);

  if (!user || !ready || effectiveRole !== allow) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-muted-foreground">ভেরিফাই করা হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
