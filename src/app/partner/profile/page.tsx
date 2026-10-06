"use client";

import { BadgeCheck, IdCard, Mail, Percent, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function PartnerProfilePage() {
  const { appUser, signOut } = useAuth();
  const router = useRouter();

  if (!appUser) return null;

  const rows = [
    { icon: IdCard, label: "পার্টনার আইডি", value: appUser.partnerId, mono: true },
    { icon: BadgeCheck, label: "নাম", value: appUser.name },
    { icon: Phone, label: "ফোন", value: appUser.phone || "—" },
    { icon: Mail, label: "ইমেইল", value: appUser.email || "—" },
    { icon: Percent, label: "কমিশন রেট", value: `${appUser.commissionRate}%` },
    { icon: ShieldCheck, label: "স্ট্যাটাস", value: appUser.status },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">প্রোফাইল</h1>
        <p className="text-sm text-muted-foreground">আপনার অ্যাকাউন্টের তথ্য</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/20 text-2xl font-extrabold text-violet-100 ring-1 ring-white/20">
            {appUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-lg">{appUser.name}</CardTitle>
            <Badge
              variant={
                appUser.status === "active"
                  ? "success"
                  : appUser.status === "pending"
                    ? "warning"
                    : "destructive"
              }
              className="mt-1"
            >
              {appUser.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" /> {r.label}
                </span>
                <span
                  className={
                    r.mono
                      ? "rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-xs text-violet-300"
                      : "text-sm font-medium"
                  }
                >
                  {r.value}
                </span>
              </div>
            );
          })}
          <div className="!mt-4 grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-xs text-muted-foreground">বর্তমান ব্যালান্স</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-300">{formatBDT(appUser.balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট উপার্জন</p>
              <p className="mt-1 text-xl font-extrabold">{formatBDT(appUser.totalEarnings)}</p>
            </div>
          </div>

          <Button variant="outline" className="mt-4 w-full" onClick={() => signOut().then(() => router.replace("/login"))}>
            <LogOut className="h-4 w-4" /> লগআউট
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
