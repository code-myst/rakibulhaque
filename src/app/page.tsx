"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Code2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/** Root page: routes by role — /login, /admin or /partner */
export default function RootRedirectPage() {
  const { user, loading, effectiveRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? (effectiveRole === "admin" ? "/admin" : "/partner") : "/login");
  }, [user, loading, effectiveRole, router]);

  return (
    <main className="dot-grid flex min-h-screen flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass flex h-16 w-16 items-center justify-center rounded-2xl"
      >
        <Code2 className="h-8 w-8 text-violet-400" />
      </motion.div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
        <span>RHB Partner Portal লোড হচ্ছে…</span>
      </div>
    </main>
  );
}
