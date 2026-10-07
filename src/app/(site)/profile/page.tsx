"use client";

import * as React from "react";
import Link from "next/link";
import {
  arrayUnion,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as siteSignOut,
  type User as SiteUser,
} from "firebase/auth";
import {
  BadgeCheck,
  Inbox,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageSquareHeart,
  Package,
  Send,
  Settings,
  Star,
} from "lucide-react";
import { siteAuth, siteDb } from "@/lib/firebase-site";
import {
  subscribeMyMessages,
  subscribeMyRecommendations,
  submitClientRecommendation,
} from "@/lib/site-content";
import { useClientRoleHeal, useLiveOrders } from "@/hooks/use-live-orders";
import type { ContactMessage, Recommendation, SiteRole } from "@/lib/types";
import { formatDate, formatBDT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Login gate ── */

function LoginGate() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const onEmail = async () => {
    setBusy(true);
    try {
      await signInWithEmailAndPassword(siteAuth, email, password);
    } catch {
      toast({
        variant: "destructive",
        title: "লগইন ব্যর্থ",
        description: "ভুল ইমেইল বা পাসওয়ার্ড। অ্যাকাউন্ট না থাকলে প্রথমে অর্ডার করুন।",
      });
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      const cred = await signInWithPopup(siteAuth, new GoogleAuthProvider());
      // Google লগইনে প্রোফাইল ডক না থাকলে তৈরি (visitor)
      await setDoc(
        doc(siteDb, "users", cred.user.uid),
        {
          name: cred.user.displayName ?? "",
          email: cred.user.email ?? "",
          role: "visitor",
        },
        { merge: true }
      );
    } catch {
      toast({ variant: "destructive", title: "Google লগইন ব্যর্থ" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
            <LockKeyhole className="h-6 w-6 text-sky-300" />
          </div>
          <CardTitle>আপনার অ্যাকাউন্ট</CardTitle>
          <CardDescription>
            অর্ডারের সময় দেওয়া ইমেইল + পাসওয়ার্ড দিয়ে লগইন করুন — অর্ডার স্ট্যাটাস,
            ইনবক্স আর রেকমেন্ডেশন এক জায়গায়।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>ইমেইল</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>পাসওয়ার্ড</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              onKeyDown={(e) => e.key === "Enter" && onEmail()}
            />
          </div>
          <Button className="w-full" onClick={onEmail} disabled={busy || !email || !password}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            লগইন করুন
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-white/10" />
            অথবা
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <Button variant="outline" className="w-full" onClick={onGoogle} disabled={busy}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
              />
            </svg>
            Google দিয়ে লগইন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Status badge ── */

function StatusBadge({ status }: { status: "pending" | "working" | "paid" }) {
  return (
    <Badge variant={status === "paid" ? "success" : status === "working" ? "default" : "warning"}>
      {status === "paid" ? "পেইড ✅" : status === "working" ? "কাজ চলছে" : "পেন্ডিং"}
    </Badge>
  );
}

/* ── Recommendation form (client only) ── */

function RecommendationSection({ uid, name }: { uid: string; name: string }) {
  const { toast } = useToast();
  const [recs, setRecs] = React.useState<Recommendation[] | null>(null);
  const [rating, setRating] = React.useState(5);
  const [role, setRole] = React.useState("");
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const unsub = subscribeMyRecommendations(uid, setRecs);
    return unsub;
  }, [uid]);

  const onSubmit = async () => {
    if (text.trim().length < 5) {
      toast({ variant: "destructive", title: "মতামত লিখুন" });
      return;
    }
    setBusy(true);
    try {
      await submitClientRecommendation({
        uid,
        name,
        role: role.trim(),
        text: text.trim(),
        rating,
      });
      setText("");
      setRole("");
      setRating(5);
      toast({
        title: "জমা হয়েছে ✅",
        description: "অ্যাডমিন অ্যাপ্রুভ করলে হোম পেজে দেখা যাবে।",
      });
    } catch {
      toast({ variant: "destructive", title: "জমা দেওয়া যায়নি" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareHeart className="h-4 w-4 text-sky-300" /> রেকমেন্ডেশন
        </CardTitle>
        <CardDescription>সার্ভিস নিয়ে আপনার অভিজ্ঞতা লিখুন — অ্যাপ্রুভ হলে সাইটে দেখা যাবে</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} onClick={() => setRating(i + 1)} aria-label={`${i + 1} স্টার`}>
              <Star
                className={`h-7 w-7 transition-colors ${
                  i < rating ? "fill-amber-400 text-amber-400" : "text-white/25"
                }`}
              />
            </button>
          ))}
        </div>
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="আপনার পরিচয় (যেমন: দোকান মালিক)"
        />
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          placeholder="সার্ভিস নিয়ে অভিজ্ঞতা লিখুন…"
        />
        <Button onClick={onSubmit} disabled={busy || text.trim().length < 5}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareHeart className="h-4 w-4" />}
          জমা দিন
        </Button>

        {recs !== null && recs.length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-muted-foreground">আমার জমা করা:</p>
            {recs.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 text-xs">
                <p className="line-clamp-1 flex-1 text-muted-foreground">“{r.text}”</p>
                <Badge variant={r.status === "approved" ? "success" : "warning"}>
                  {r.status === "approved" ? "লাইভ" : "পেন্ডিং"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Inbox section ── */

function InboxSection({ uid }: { uid: string }) {
  const [msgs, setMsgs] = React.useState<ContactMessage[] | null>(null);
  const [replyFor, setReplyFor] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = subscribeMyMessages(uid, setMsgs);
    return unsub;
  }, [uid]);

  const onFollowUp = async (messageId: string) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(siteDb, "messages", messageId), {
        thread: arrayUnion({ from: "visitor", text: replyText.trim(), at: Date.now() }),
        status: "new",
      });
      setReplyText("");
      setReplyFor(null);
      toast({ title: "পাঠানো হয়েছে ✅" });
    } catch {
      toast({ variant: "destructive", title: "পাঠানো যায়নি" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-sky-300" /> ইনবক্স
        </CardTitle>
        <CardDescription>
          কনটাক্ট পেজে পাঠানো মেসেজ ও অ্যাডমিনের রিপ্লাই
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {msgs === null && <Skeleton className="h-20 w-full" />}
        {msgs !== null && msgs.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            কোনো মেসেজ নেই —{" "}
            <Link href="/contact" className="text-violet-300 hover:underline">
              কনটাক্ট পেজ
            </Link>{" "}
            থেকে পাঠান।
          </p>
        )}
        {msgs?.map((m) => (
          <div key={m.id} className="rounded-lg border border-white/10 p-3">
            <div className="space-y-2">
              {m.thread.map((entry, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    entry.from === "admin"
                      ? "ml-auto bg-violet-600/25 text-violet-100"
                      : "bg-white/[0.06] text-foreground/90"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] opacity-60">
                    {entry.from === "admin" ? "Rakibul Haque" : "আপনি"} · {formatDate(entry.at)}
                  </p>
                  {entry.text}
                </div>
              ))}
            </div>
            {replyFor === m.id ? (
              <div className="mt-2 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="লিখুন…"
                  onKeyDown={(e) => e.key === "Enter" && onFollowUp(m.id)}
                  autoFocus
                />
                <Button size="icon" onClick={() => onFollowUp(m.id)} disabled={!replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setReplyFor(m.id);
                  setReplyText("");
                }}
              >
                উত্তর দিন
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Main profile page ── */

export default function ProfilePage() {
  const [user, setUser] = React.useState<SiteUser | null>(null);
  const [role, setRole] = React.useState<SiteRole | null>(null);
  const [ready, setReady] = React.useState(false);
  const { orders, source: orderSource } = useLiveOrders(user?.uid ?? undefined);
  useClientRoleHeal(user?.uid ?? undefined, orders);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(siteAuth, (u) => {
      setUser(u);
      if (!u) setRole(null);
      setReady(true);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    const unsubRole = onSnapshot(
      doc(siteDb, "users", user.uid),
      (d) => {
        setRole(d.exists() ? ((d.data().role as SiteRole) ?? "visitor") : "visitor");
      },
      () => setRole("visitor")
    );
    return unsubRole;
  }, [user]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) return <LoginGate />;

  const isClient = role === "client" || role === "admin";
  const pendingCount = (orders ?? []).filter((o) => o.status !== "paid").length;
  const totalPaid = (orders ?? []).filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-12 sm:px-6">
      {/* Account summary */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/20 text-xl font-extrabold text-violet-100 ring-1 ring-white/20">
            {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg">{user.displayName || "স্বাগতম!"}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={isClient ? "success" : "secondary"}>
                <BadgeCheck className="mr-1 h-3 w-3" />
                {role === "admin" ? "Admin" : isClient ? "Client" : "Visitor"}
              </Badge>
              {role === "admin" && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/site">
                    <Settings className="h-3.5 w-3.5" /> সাইট অ্যাডমিন প্যানেল
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-red-400"
            onClick={() => siteSignOut(siteAuth)}
            aria-label="লগআউট"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-violet-300" /> আমার অর্ডার ও পেমেন্ট
          </CardTitle>
          <CardDescription>
            {isClient
              ? `মোট পেইড: ${formatBDT(totalPaid)} · চলমান: ${pendingCount} টি`
              : "অর্ডার করলেই আপনি ক্লায়েন্ট হয়ে যাবেন — হিস্টোরি এখানে দেখা যাবে"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {orderSource === "mirror" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              লাইভ স্ট্যাটাস বন্ধ — partner-affiliation প্রজেক্টে Authentication → Sign-in method →
              <span className="font-semibold"> Anonymous</span> চালু করুন এবং নতুন rules deploy করুন।
            </p>
          )}
          {orders === null && <Skeleton className="h-16 w-full" />}
          {orders !== null && orders.length === 0 && (
            <div className="py-6 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-xs text-muted-foreground">
                এখনো কোনো অর্ডার নেই —{" "}
                <Link href="/services" className="text-violet-300 hover:underline">
                  সার্ভিসেস দেখুন
                </Link>
              </p>
            </div>
          )}
          {orders?.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.package}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</p>
              </div>
              <p className="text-sm font-bold text-violet-300">{formatBDT(o.amount)}</p>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {!isClient && (orders ?? []).length === 0 && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/services">
                <Package className="h-4 w-4" /> সার্ভিসেস ব্রাউজ করুন
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recommendations (client only) */}
      {isClient ? (
        <RecommendationSection uid={user.uid} name={user.displayName || user.email || "কাস্টমার"} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <MessageSquareHeart className="h-5 w-5 shrink-0 text-sky-300" />
            রেকমেন্ডেশন দেওয়ার সুবিধা শুধু <span className="font-semibold text-foreground">ক্লায়েন্টদের</span> জন্য —
            প্রথম অর্ডার করলেই আনলক হবে।
          </CardContent>
        </Card>
      )}

      {/* Inbox */}
      <InboxSection uid={user.uid} />
    </div>
  );
}
