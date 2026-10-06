"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "violet",
  loading,
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  accent?: "violet" | "emerald" | "amber" | "sky";
  loading?: boolean;
  index?: number;
}) {
  const accents: Record<string, string> = {
    violet: "text-violet-300 bg-violet-500/15 ring-violet-500/30",
    emerald: "text-emerald-300 bg-emerald-500/15 ring-emerald-500/30",
    amber: "text-amber-300 bg-amber-500/15 ring-amber-500/30",
    sky: "text-sky-300 bg-sky-500/15 ring-sky-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -3 }}
    >
      <Card className="glass-hover h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1.5 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                {value}
              </p>
            )}
            {hint && !loading && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
              accents[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
