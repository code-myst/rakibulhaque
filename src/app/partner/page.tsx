"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Check,
  Copy,
  Link2,
  Loader2,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePartnerClients } from "@/hooks/use-firestore-data";
import { fetchGlobalSettings } from "@/lib/settings";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PartnerOverviewPage() {
  const { appUser } = useAuth();
  const { data: clients, loading } = usePartnerClients(appUser?.partnerId);
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [referralBase, setReferralBase] = React.useState("");

  React.useEffect(() => {
    fetchGlobalSettings()
      .then((s) => setReferralBase(s.referralBaseUrl.replace(/\/+$/, "")))
      .catch(() => setReferralBase(""));
  }, []);

  const base = referralBase ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const referralLink = `${base}/pricing?ref=${appUser?.partnerId ?? ""}`;
  const activeClients = clients.filter((c) => c.status !== "paid");
  const paidClients = clients.filter((c) => c.status === "paid");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "কপি হয়েছে!", description: "রেফারেল লিংক ক্লিপবোর্ডে নেওয়া হয়েছে।" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "কপি করা যায়নি",
        description: "লিংকটি ম্যানুয়ালি সিলেক্ট করে কপি করুন।",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            স্বাগতম, <span className="text-gradient">{appUser?.name ?? "Partner"}</span> 👋
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            আপনার আইডি:
            <code className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-xs text-violet-300">
              {appUser?.partnerId ?? "…"}
            </code>
            <Badge variant="secondary" className="gap-1">
              <Percent className="h-3 w-3" />
              {appUser?.commissionRate ?? 15}% কমিশন
            </Badge>
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/partner/withdraw">
            উইথড্র করুন <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Referral link */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-violet-300" />
              আপনার ইউনিক রেফারেল লিংক
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 flex-1 items-center rounded-md border border-white/10 bg-black/30 px-3">
                <code className="truncate font-mono text-xs text-violet-200 sm:text-sm">
                  {referralLink}
                </code>
              </div>
              <Button
                onClick={onCopy}
                variant={copied ? "success" : "default"}
                size="lg"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "কপি হয়েছে!" : "লিংক কপি করুন"}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              এই লিংক শেয়ার করুন — ক্লায়েন্ট সরাসরি প্রাইসিং পেজে গিয়ে অর্ডার করলে আপনার আইডি ({appUser?.partnerId}) অটো
              রেকর্ড হয়ে ড্যাশবোর্ডে চলে আসবে।
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          index={0}
          label="Available Balance"
          value={formatBDT(appUser?.balance ?? 0)}
          icon={Wallet}
          accent="emerald"
          hint="উইথড্র করা যাবে এমন অর্থ"
          loading={false}
        />
        <StatCard
          index={1}
          label="Total Earnings"
          value={formatBDT(appUser?.totalEarnings ?? 0)}
          icon={TrendingUp}
          accent="violet"
          hint="এখন পর্যন্ত মোট কমিশন"
          loading={false}
        />
        <StatCard
          index={2}
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          accent="sky"
          hint={`${paidClients.length} টি পেইড সম্পন্ন`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Client progress */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">ক্লায়েন্ট প্রোগ্রেস</CardTitle>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/partner/clients">
                  সব দেখুন <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            {!loading && clients.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  এখনো কোনো ক্লায়েন্ট রেফার করেননি।
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/partner/resources">সেলস স্ক্রিপ্ট দেখুন</Link>
                </Button>
              </div>
            )}
            {clients.slice(0, 6).map((c) => {
              const commission = Math.round((c.amount * (appUser?.commissionRate ?? 15)) / 100);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
                    <Users className="h-4 w-4 text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.package} · {formatBDT(c.amount)} · কমিশন ~{formatBDT(commission)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      c.status === "paid"
                        ? "success"
                        : c.status === "working"
                          ? "default"
                          : "warning"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Earnings explainer */}
        <div className="space-y-4">
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4 text-amber-300" />
                কমিশন কীভাবে কাজ করে?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { rate: "১৫%", desc: "স্ট্যান্ডার্ড প্যাকেজে প্রতিটি পেইড প্রজেক্টে" },
                { rate: "২০%", desc: "প্রিমিয়াম পার্টনারদের জন্য প্রতি পেইড প্রজেক্টে" },
              ].map((row) => (
                <div
                  key={row.rate}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-xs leading-relaxed text-muted-foreground">{row.desc}</span>
                  <span className="shrink-0 rounded-md bg-violet-500/15 px-2 py-1 font-bold text-violet-300">
                    {row.rate}
                  </span>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-muted-foreground">
                ক্লায়েন্টের পেমেন্ট <span className="font-semibold text-emerald-300">“Paid”</span>{" "}
                হলেই কমিশন আপনার ব্যালান্সে যোগ হয়।
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="text-base">উইথড্র নিয়মাবলি</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  ন্যূনতম উইথড্র ৳৫০০
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  bKash / Nagad — পার্সোনাল নম্বরে
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  অ্যাডমিন অ্যাপ্রুভ করলে ২৪–৪৮ ঘণ্টায় পেমেন্ট
                </li>
              </ul>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/partner/withdraw">
                  <Banknote className="h-4 w-4" /> উইথড্র রিকোয়েস্ট
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
