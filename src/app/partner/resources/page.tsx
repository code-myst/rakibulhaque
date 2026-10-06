"use client";

import * as React from "react";
import { BookOpen, Check, Copy, Crown, Share2 } from "lucide-react";
import { fetchResourcesContent } from "@/lib/content";
import { fetchPublicSettings } from "@/lib/settings";
import type { ResourcesContent } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_LABELS: Record<string, string> = {
  scripts: "সেলস গাইডলাইন",
  objections: "আপত্তি হ্যান্ডলিং",
  rules: "কমিশন রুলস",
};

export default function PartnerResourcesPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = React.useState<ResourcesContent | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetchResourcesContent().then(setContent);
    fetchPublicSettings().then((s) => setWhatsapp(s.whatsappNumber));
  }, []);

  const pitch = `আমার পরিচিত একজন ওয়েবসাইট বানায় (Rakibul Haque)। ছোট ব্যবসা, দোকান, কোচিং, ব্লগ, কোর্স সাইট সব বানায়। দাম সাধ্যের মধ্যে, আর শুরুতে একটা ১ পেজের সাইট ফ্রিতে চালু করে দেয়। যোগাযোগ করার সময় আমার নাম (${appUser?.name ?? ""}) বা ID (${appUser?.partnerId ?? ""}) বলবেন।`;

  const onCopyPitch = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      toast({ title: "কপি হয়েছে!", description: "রেডি পিচ — এখন যেকোনো চ্যাটে পেস্ট করুন।" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "কপি করা যায়নি" });
    }
  };

  const onShareCard = async () => {
    const text = `🎟️ RHB Partner Card\n\nPartner ID: ${appUser?.partnerId}\nনাম: ${appUser?.name}\nফোন: ${appUser?.phone}\n\nক্লায়েন্ট আনুন, ১৫–২০% কমিশন পান!\n\n${pitch}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "RHB Partner Card", text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "কার্ড কপি হয়েছে!", description: "যেকোনো মেসেঞ্জারে পেস্ট করে শেয়ার করুন।" });
    }
  };

  const isGold = (appUser?.commissionRate ?? 15) === 20;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <BookOpen className="h-5 w-5 text-violet-300" /> রিসোর্সেস
        </h1>
        <p className="text-sm text-muted-foreground">সেলস মাস্টার হতে প্রয়োজনীয় সব গাইড — বাংলায়</p>
      </div>

      <Tabs defaultValue="card">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="card">🎟️ আমার পার্টনার কার্ড</TabsTrigger>
          {(content?.sections ?? []).map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {TAB_LABELS[s.key] ?? s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Partner card ── */}
        <TabsContent value="card" className="space-y-4">
          <Card className="relative mx-auto max-w-lg overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
            <CardHeader className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Rakib Web Service Partner Card
              </p>
              <CardTitle className="text-gradient mt-2 text-2xl font-extrabold">
                ক্লায়েন্ট আনুন, ১৫–২০% কমিশন পান
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="glass mx-auto max-w-xs space-y-2.5 rounded-xl p-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Partner ID</span>
                  <code className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-violet-300">
                    {appUser?.partnerId ?? "…"}
                  </code>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">নাম</span>
                  <span className="font-medium">{appUser?.name ?? "…"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">ফোন</span>
                  <span className="font-mono">{appUser?.phone || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">কমিশন</span>
                  <Badge variant={isGold ? "warning" : "default"} className="gap-1">
                    {isGold && <Crown className="h-3 w-3" />}
                    {appUser?.commissionRate ?? 15}%{isGold ? " · Gold" : ""}
                  </Badge>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">রেডি পিচ — ক্লায়েন্টকে এভাবে বলুন:</p>
                <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
                  “{pitch}”
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={copied ? "success" : "outline"} onClick={onCopyPitch}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "কপি হয়েছে!" : "পিচ কপি"}
                  </Button>
                  <Button variant="outline" onClick={onShareCard}>
                    <Share2 className="h-4 w-4" /> কার্ড শেয়ার
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">কমিশন কত?</p>
                <p>সাধারণ Partner — ১৫% · Gold Partner (৩টা+ অর্ডার) — ২০%</p>
                <p className="font-semibold text-foreground">কীভাবে কাজ করে?</p>
                <p>
                  ১) পরিচিত কারও ওয়েবসাইট দরকার হলে এগিয়ে দিন ২) সে প্রথম কথায় আপনার ID বলবে ৩) কাজ
                  শেষে টাকা দিলেই আপনার কমিশন।
                </p>
                {whatsapp && (
                  <a
                    className="inline-flex items-center gap-1 pt-1 text-emerald-400 underline-offset-4 hover:underline"
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`আসসালামু আলাইকুম! আমি ${appUser?.name} (${appUser?.partnerId}) — একজন ক্লায়েন্ট এগিয়ে দিতে চাই।`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ক্লায়েন্ট এগিয়ে দিতে অ্যাডমিনকে WhatsApp করুন →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DB-driven sections ── */}
        {(content?.sections ?? []).map((section) => (
          <TabsContent key={section.key} value={section.key} className="space-y-3">
            {!content && <Skeleton className="h-40 w-full rounded-xl" />}
            {section.items.map((item, i) => (
              <Card key={i} className="glass-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.lines.map((line, j) => (
                    <p
                      key={j}
                      className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-foreground/90"
                    >
                      {line}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
