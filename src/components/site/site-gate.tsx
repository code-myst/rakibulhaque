"use client";

import * as React from "react";
import { Globe, KeyRound, Loader2, LogIn } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useSiteAuth } from "@/hooks/use-site-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Admin-এর General (সাইট) সেকশনের গেট —
 * rakibul-haque প্রজেক্টে একবার লগইন (Email/Google), localStorage-এ থেকে যায়।
 */
export function SiteGate({ children }: { children: React.ReactNode }) {
  const { siteUser, siteLoading, signInSite, signInSiteGoogle } = useSiteAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const friendly = (err: unknown) => {
    const code = err instanceof FirebaseError ? err.code : "";
    if (code === "auth/invalid-credential" || code === "auth/user-not-found")
      return "ভুল ইমেইল বা পাসওয়ার্ড।";
    if (code === "auth/popup-closed-by-user") return "Google পপআপ বন্ধ হয়েছে।";
    return "লগইন করা যায়নি। আবার চেষ্টা করুন।";
  };

  const onEmail = async () => {
    setBusy(true);
    try {
      await signInSite(email, password);
    } catch (err) {
      toast({ variant: "destructive", title: "সাইট লগইন ব্যর্থ", description: friendly(err) });
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      await signInSiteGoogle();
    } catch (err) {
      toast({ variant: "destructive", title: "Google লগইন ব্যর্থ", description: friendly(err) });
    } finally {
      setBusy(false);
    }
  };

  if (siteLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!siteUser) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
            <Globe className="h-6 w-6 text-sky-300" />
          </div>
          <CardTitle>সাইট কনটেন্ট লগইন</CardTitle>
          <CardDescription>
            পোর্টফোলিও ওয়েবসাইটের কনটেন্ট এডিট করতে আলাদা Firebase প্রজেক্টে
            (rakibul-haque) একবার লগইন করুন — পরে আর লাগবে না।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site-email">ইমেইল</Label>
            <Input
              id="site-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-pass">পাসওয়ার্ড</Label>
            <Input
              id="site-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && onEmail()}
            />
          </div>
          <Button className="w-full" onClick={onEmail} disabled={busy || !email || !password}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
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
          <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <KeyRound className="h-3 w-3" />
            এই প্রজেক্টের অ্যাকাউন্ট না থাকলে Firebase Console → rakibul-haque →
            Authentication থেকে তৈরি করুন।
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
