"use client";

import {
  ArrowRight,
  Banknote,
  Clock,
  Loader2,
  ReceiptText,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useAllClients, useAllUsers, useAllWithdrawals } from "@/hooks/use-firestore-data";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatBDT, maskPhone } from "@/lib/utils";

export default function AdminOverviewPage() {
  const { appUser } = useAuth();
  const { data: clients, loading: cLoading } = useAllClients();
  const { data: users, loading: uLoading } = useAllUsers();
  const { data: withdrawals, loading: wLoading } = useAllWithdrawals();

  const partners = users.filter((u) => u.role === "partner");
  const activePartners = partners.filter((p) => p.status === "active");
  const activeClients = clients.filter((c) => c.status !== "paid");
  const paidClients = clients.filter((c) => c.status === "paid");
  const totalRevenue = paidClients.reduce((s, c) => s + c.amount, 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const pendingAmount = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);
  const totalCommissionOwed = partners.reduce((s, p) => s + p.balance, 0);

  // Merged recent activity feed
  const activity = [
    ...clients.map((c) => ({
      at: c.createdAt,
      icon: UserPlus,
      title: `নতুন ক্লায়েন্ট: ${c.name}`,
      sub: `${c.referredBy || "—"} · ${formatBDT(c.amount)} · ${c.package}`,
      badge: c.status,
      tone:
        c.status === "paid"
          ? "success"
          : c.status === "working"
            ? "default"
            : ("warning" as const),
    })),
    ...withdrawals.map((w) => ({
      at: w.createdAt,
      icon: Banknote,
      title: `উইথড্র রিকোয়েস্ট: ${w.partnerId}`,
      sub: `${w.method} · ${maskPhone(w.accountNumber)} · ${formatBDT(w.amount)}`,
      badge: w.status,
      tone:
        w.status === "approved"
          ? "success"
          : w.status === "rejected"
            ? "destructive"
            : ("warning" as const),
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  const loading = cLoading || uLoading || wLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            স্বাগতম, <span className="text-gradient">{appUser?.name ?? "Admin"}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            আজকের পোর্টাল সামারি — এক নজরে সব কিছু।
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/clients">
            ক্লায়েন্ট ম্যানেজ <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total Partners"
          value={partners.length}
          icon={UsersRound}
          accent="violet"
          hint={`${activePartners.length} জন অ্যাক্টিভ`}
          loading={loading}
        />
        <StatCard
          index={1}
          label="Active Clients"
          value={activeClients.length}
          icon={Clock}
          accent="sky"
          hint={`${paidClients.length} টি পেইড সম্পন্ন`}
          loading={loading}
        />
        <StatCard
          index={2}
          label="Total Revenue"
          value={formatBDT(totalRevenue)}
          icon={TrendingUp}
          accent="emerald"
          hint="পেইড প্রজেক্ট থেকে"
          loading={loading}
        />
        <StatCard
          index={3}
          label="Pending Withdrawals"
          value={formatBDT(pendingAmount)}
          icon={Banknote}
          accent="amber"
          hint={`${pendingWithdrawals.length} টি রিকোয়েস্ট`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent activity */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">সাম্প্রতিক অ্যাক্টিভিটি</CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="space-y-1">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            {!loading && activity.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                এখনো কোনো অ্যাক্টিভিটি নেই। পার্টনার যুক্ত করে শুরু করুন।
              </p>
            )}
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-violet-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.sub}</p>
                  </div>
                  <Badge variant={a.tone as "success" | "warning" | "default" | "destructive"}>
                    {a.badge}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick figures */}
        <div className="space-y-4">
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4 text-emerald-300" />
                কমিশন হিসাব
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">পার্টনারদের মোট ব্যালান্স</span>
                <span className="font-bold text-emerald-300">
                  {formatBDT(totalCommissionOwed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">পেন্ডিং উইথড্র</span>
                <span className="font-bold text-amber-300">{formatBDT(pendingAmount)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">সর্বমোট উপার্জন (সব পার্টনার)</span>
                <span className="font-bold">
                  {formatBDT(partners.reduce((s, p) => s + p.totalEarnings, 0))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="text-base">দ্রুত অ্যাকশন</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/admin/services">সার্ভিসেস ও প্রাইসিং</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/admin/withdrawals">উইথড্র রিভিউ</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/admin/partners">+ পার্টনার যোগ</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/admin/resources">রিসোর্সেস এডিট</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
