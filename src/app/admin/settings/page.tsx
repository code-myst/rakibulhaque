"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  Globe,
  Loader2,
  MessageCircle,
  Megaphone,
  Percent,
  Save,
} from "lucide-react";
import {
  fetchGlobalSettings,
  fetchPublicSettings,
  saveGlobalSettings,
  savePublicSettings,
} from "@/lib/settings";
import type { PortalSettings, PublicSettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const globalSchema = z.object({
  defaultCommissionRate: z.coerce.number().min(1).max(90),
  premiumCommissionRate: z.coerce.number().min(1).max(90),
  minWithdrawAmount: z.coerce.number().min(0),
  referralBaseUrl: z.string().trim(),
});
type GlobalValues = z.infer<typeof globalSchema>;

const publicSchema = z.object({
  whatsappNumber: z
    .string()
    .regex(/^\d{10,15}$/, "আন্তর্জাতিক ফরম্যাটে দিন, যেমন 8801752845182 (+ ছাড়া)"),
  supportEmail: z.string().email("সঠিক ইমেইল").optional().or(z.literal("")),
  announcementEnabled: z.boolean(),
  announcementText: z.string().max(300).optional(),
  pricingRulesText: z.string().min(1, "কমপক্ষে একটা নিয়ম দিন (প্রতি লাইনে একটা)"),
});
type PublicValues = z.infer<typeof publicSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [savingGlobal, setSavingGlobal] = React.useState(false);
  const [savingPublic, setSavingPublic] = React.useState(false);

  const globalForm = useForm<GlobalValues>({ resolver: zodResolver(globalSchema) });
  const publicForm = useForm<PublicValues>({ resolver: zodResolver(publicSchema) });

  React.useEffect(() => {
    (async () => {
      try {
        const [g, p] = await Promise.all([fetchGlobalSettings(), fetchPublicSettings()]);
        globalForm.reset(g);
        publicForm.reset({
          whatsappNumber: p.whatsappNumber,
          supportEmail: p.supportEmail,
          announcementEnabled: p.announcementEnabled,
          announcementText: p.announcementText,
          pricingRulesText: (p.pricingRules ?? []).join("\n"),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSaveGlobal = async (values: GlobalValues) => {
    if (values.premiumCommissionRate < values.defaultCommissionRate) {
      toast({
        variant: "destructive",
        title: "ভ্যালিডেশন সমস্যা",
        description: "Gold রেট স্ট্যান্ডার্ড রেটের কম হতে পারে না।",
      });
      return;
    }
    setSavingGlobal(true);
    try {
      const payload: PortalSettings = { ...values, referralBaseUrl: values.referralBaseUrl ?? "" };
      await saveGlobalSettings(payload);
      toast({ title: "সেটিংস সংরক্ষিত ✅" });
    } catch {
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ" });
    } finally {
      setSavingGlobal(false);
    }
  };

  const onSavePublic = async (values: PublicValues) => {
    setSavingPublic(true);
    try {
      const payload: PublicSettings = {
        whatsappNumber: values.whatsappNumber,
        supportEmail: values.supportEmail ?? "",
        announcementEnabled: values.announcementEnabled,
        announcementText: values.announcementText ?? "",
        pricingRules: values.pricingRulesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await savePublicSettings(payload);
      toast({ title: "পাবলিক সেটিংস সংরক্ষিত ✅", description: "Pricing পেজ ও ব্যানার সাথে সাথে আপডেট হবে।" });
    } catch {
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ" });
    } finally {
      setSavingPublic(false);
    }
  };

  const announcementOn = publicForm.watch("announcementEnabled");

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">সেটিংস</h1>
        <p className="text-sm text-muted-foreground">কমিশন, পেমেন্ট, পাবলিক পেজ ও ঘোষণা</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Global (admin) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4 text-violet-300" /> কমিশন ও পেমেন্ট
            </CardTitle>
            <CardDescription>নতুন পার্টনারের ডিফল্ট রেট ও উইথড্র সীমা</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={globalForm.handleSubmit(onSaveGlobal)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>স্ট্যান্ডার্ড রেট (%)</Label>
                  <Input type="number" {...globalForm.register("defaultCommissionRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gold রেট (%)</Label>
                  <Input type="number" {...globalForm.register("premiumCommissionRate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>ন্যূনতম উইথড্র (৳)</Label>
                  <Input type="number" {...globalForm.register("minWithdrawAmount")} />
                </div>
                <div className="space-y-1.5">
                  <Label>রেফারেল বেজ URL</Label>
                  <Input placeholder="https://আপনার-ডোমেইন.com" {...globalForm.register("referralBaseUrl")} />
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                খালি রেখে দিলে রেফারেল লিংক এই অ্যাপের নিজের ডোমেইনে{" "}
                <code className="font-mono">/pricing?ref=ID</code> পেজে যাবে।
              </p>
              <Button type="submit" disabled={savingGlobal}>
                {savingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                সংরক্ষণ করুন
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Public ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-sky-300" /> পাবলিক পেজ ও ঘোষণা
            </CardTitle>
            <CardDescription>Pricing পেজ, WhatsApp ও পার্টনার ব্যানার</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={publicForm.handleSubmit(onSavePublic)} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp নম্বর
                  </Label>
                  <Input placeholder="8801752845182" inputMode="numeric" {...publicForm.register("whatsappNumber")} />
                  {publicForm.formState.errors.whatsappNumber && (
                    <p className="text-xs text-red-400">{publicForm.formState.errors.whatsappNumber.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>সাপোর্ট ইমেইল</Label>
                  <Input type="email" placeholder="support@mail.com" {...publicForm.register("supportEmail")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-amber-400" /> ঘোষণা (পার্টনার ড্যাশবোর্ডে ব্যানার)
                </Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={publicForm.watch("announcementEnabled")}
                    onCheckedChange={(v) => publicForm.setValue("announcementEnabled", v)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {announcementOn ? "চালু — সব পার্টনার দেখবে" : "বন্ধ"}
                  </span>
                </div>
                <Input
                  placeholder="যেমন: ঈদ অফার — এই মাসে প্রতিটি পেইড অর্ডারে বোনাস ৳১০০"
                  {...publicForm.register("announcementText")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Pricing পেজের নিয়ম (প্রতি লাইনে একটা)</Label>
                <textarea
                  rows={4}
                  className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                  {...publicForm.register("pricingRulesText")}
                />
              </div>

              <Button type="submit" disabled={savingPublic}>
                {savingPublic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                সংরক্ষণ করুন
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
