"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  Check,
  Flame,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { subscribePackages } from "@/lib/packages";
import { subscribeCategories } from "@/lib/categories";
import { fetchPublicSettings } from "@/lib/settings";
import type { PricingCategory, PricingPackage } from "@/lib/types";
import { formatBDT, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const orderSchema = z.object({
  name: z.string().min(2, "আপনার নাম লিখুন").max(99),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 01712345678)"),
  note: z.string().max(500).optional(),
});
type OrderValues = z.infer<typeof orderSchema>;

/** Hostinger-স্টাইল দাম: স্ট্রাইকথ্রু + Save ব্যাজ */
function PriceBlock({ pkg, big }: { pkg: PricingPackage; big?: boolean }) {
  const saving =
    pkg.originalPrice && pkg.price && pkg.originalPrice > pkg.price
      ? pkg.originalPrice - pkg.price
      : null;
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2">
        {saving && (
          <span className="text-sm text-muted-foreground line-through">
            {formatBDT(pkg.originalPrice!)}
          </span>
        )}
        <span className={big ? "text-4xl font-extrabold tracking-tight" : "text-3xl font-extrabold tracking-tight"}>
          {formatPrice(pkg.price, pkg.priceType)}
        </span>
        {pkg.priceType === "monthly" && (
          <span className="text-sm font-normal text-muted-foreground">প্রতি মাস</span>
        )}
      </div>
      {saving && (
        <Badge variant="success" className="mt-1.5">
          Save {formatBDT(saving)}
        </Badge>
      )}
      {pkg.priceType === "quote" && pkg.price != null && (
        <p className="mt-1 text-xs text-muted-foreground">স্কোপ অনুযায়ী ফাইনাল কোটেশন</p>
      )}
      {pkg.delivery && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
          <Zap className="h-3 w-3" /> {pkg.delivery}
        </p>
      )}
    </div>
  );
}

function PricingPageInner() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";
  const ref = (searchParams.get("ref") ?? "").toUpperCase();
  const validRef = /^CM-\d{3,}$/.test(ref) ? ref : null;

  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [categories, setCategories] = React.useState<PricingCategory[]>([]);
  const [tab, setTab] = React.useState(initialCategory);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [rules, setRules] = React.useState<string[]>([]);
  const [ordering, setOrdering] = React.useState<PricingPackage | null>(null);
  const [ordered, setOrdered] = React.useState<PricingPackage | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubs = [
      subscribePackages((pkgs) => setPackages(pkgs.filter((p) => p.active))),
      subscribeCategories(setCategories),
    ];
    fetchPublicSettings().then((s) => {
      setWhatsapp(s.whatsappNumber);
      setRules(s.pricingRules ?? []);
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  React.useEffect(() => {
    if (categories.length && !categories.some((c) => c.key === tab)) {
      setTab(categories[0].key);
    }
  }, [categories, tab]);

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { name: "", phone: "", note: "" },
  });

  const activeCategories = categories.filter((c) =>
    (packages ?? []).some((p) => p.category === c.key)
  );
  const shown = (packages ?? []).filter((p) => p.category === tab);

  const onSubmit = async (values: OrderValues) => {
    if (!ordering) return;
    setSubmitting(true);
    try {
      const amount = ordering.price ?? 0;
      await addDoc(collection(db, "clients"), {
        name: values.name.trim(),
        phone: values.phone,
        package: ordering.name,
        amount,
        referredBy: validRef ?? "DIRECT",
        status: "pending",
        source: "pricing",
        isFree: amount === 0 && ordering.priceType === "fixed",
        followUps: [],
        note: values.note?.trim() || "",
        createdAt: serverTimestamp(),
      });
      setOrdered(ordering);
      setOrdering(null);
      form.reset();
    } catch {
      toast({
        variant: "destructive",
        title: "অর্ডার জমা হয়নি",
        description: "ইন্টারনেট চেক করে আবার চেষ্টা করুন, অথবা WhatsApp-এ সরাসরি যোগাযোগ করুন।",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const waLink = (pkg: PricingPackage | null, name?: string) => {
    const msg = pkg
      ? `আসসালামু আলাইকুম! আমি ${name ?? "…"}। আমি ${pkg.name} প্যাকেজে আগ্রহী (${formatPrice(pkg.price, pkg.priceType)})।${validRef ? ` (Ref: ${validRef})` : ""}`
      : "আসসালামু আলাইকুম! ওয়েবসাইট সার্ভিস নিয়ে কথা বলতে চাই।";
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="dot-grid relative">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            শুরুতেই একটা সাইট একদম ফ্রি
          </div>
          <h1 className="text-gradient mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            আপনার ব্যবসার জন্য সঠিক প্ল্যানটি বেছে নিন
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ওয়েবসাইট, মোবাইল অ্যাপ, AI অটোমেশন — ক্যাটাগরি বেছে নিন, প্যাকেজ বাছুন, অর্ডার করুন।
            খুব দ্রুত আমরা যোগাযোগ করব।
          </p>
          {validRef && (
            <p className="mt-3 text-xs text-emerald-400">
              আপনি <span className="font-semibold">{validRef}</span> পার্টনারের রেফারেলে এসেছেন —
              অর্ডার করলে সেটা অটো রেকর্ড হবে ✅
            </p>
          )}
          {whatsapp && (
            <div className="mt-6 flex justify-center">
              <Button asChild variant="outline">
                <a href={waLink(null)} target="_blank" rel="noreferrer" className="gap-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  WhatsApp-এ কথা বলুন
                </a>
              </Button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Category tabs (All নেই — ক্যাটাগরিগুলোই) */}
      {activeCategories.length > 0 && (
        <div className="sticky top-[57px] z-20 border-y border-white/5 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                {activeCategories.map((c) => (
                  <TabsTrigger key={c.key} value={c.key}>
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Packages — Hostinger-style grid */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {packages === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            শীঘ্রই এই ক্যাটাগরিতে প্যাকেজ যোগ হবে। এখনই WhatsApp-এ যোগাযোগ করুন।
          </p>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {shown
              .slice()
              .sort((a, b) => Number(!!b.popular) - Number(!!a.popular))
              .map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.35) }}
                  whileHover={{ y: -5 }}
                  className={`h-full ${pkg.popular ? "md:-my-2 md:py-2" : ""}`}
                >
                  <Card
                    className={`glass-hover relative flex h-full flex-col p-6 ${
                      pkg.popular
                        ? "border-2 border-violet-500/60 shadow-[0_0_50px_-12px_hsl(258_90%_66%/0.5)]"
                        : ""
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1 border-violet-400/50 bg-violet-600 px-3 py-1 shadow-lg">
                          <Flame className="h-3 w-3" /> সবচেয়ে জনপ্রিয়
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                    <div className="mt-3">
                      <PriceBlock pkg={pkg} big={pkg.popular} />
                    </div>
                    <ul className="mt-4 flex-1 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                      {pkg.features.map((f, j) => (
                        <li key={j} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {pkg.note && (
                      <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                        {pkg.note}
                      </p>
                    )}
                    <Button
                      className="mt-5 w-full"
                      size={pkg.popular ? "lg" : "default"}
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => setOrdering(pkg)}
                    >
                      {pkg.price === 0
                        ? "ফ্রি নিন"
                        : pkg.priceType === "quote"
                          ? "কোটেশন চাই"
                          : "অর্ডার করুন"}
                    </Button>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </section>

      {/* Rules */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Card className="p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-violet-300" /> সব প্ল্যানের সাধারণ নিয়ম
          </h4>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Order dialog */}
      <Dialog open={!!ordering} onOpenChange={(o) => !o && setOrdering(null)}>
        <DialogContent className="max-w-md">
          {ordering && (
            <>
              <DialogHeader>
                <DialogTitle>অর্ডার করুন — {ordering.name}</DialogTitle>
                <DialogDescription>
                  দাম: {formatPrice(ordering.price, ordering.priceType)} · খুব দ্রুত আপনার সাথে
                  যোগাযোগ করা হবে
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label>আপনার নাম</Label>
                  <Input placeholder="নাম" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>মোবাইল নম্বর</Label>
                  <Input placeholder="01712345678" inputMode="numeric" {...form.register("phone")} />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>কী দরকার? (ঐচ্ছিক)</Label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                    placeholder="যেমন: আমার ফার্নিচারের দোকানের জন্য সাইট চাই…"
                    {...form.register("note")}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    অর্ডার কনফার্ম করুন
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={!!ordered} onOpenChange={(o) => !o && setOrdered(null)}>
        <DialogContent className="max-w-sm text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40"
          >
            <Check className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <DialogHeader className="items-center">
            <DialogTitle>অর্ডার জমা হয়েছে! 🎉</DialogTitle>
            <DialogDescription>
              ধন্যবাদ! আপনার <span className="font-semibold text-foreground">{ordered?.name}</span>{" "}
              অর্ডার আমরা পেয়েছি — খুব দ্রুত কল/WhatsApp-এ যোগাযোগ করা হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {whatsapp && (
              <Button asChild variant="success" size="lg">
                <a href={waLink(ordered, form.getValues("name"))} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp-এ এখনই কথা বলুন
                </a>
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOrdered(null)}>
              ঠিক আছে
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="dot-grid flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      }
    >
      <PricingPageInner />
    </Suspense>
  );
}
