"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  BadgeCheck,
  Check,
  Code2,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { subscribePackages } from "@/lib/packages";
import { fetchPublicSettings } from "@/lib/settings";
import { PACKAGE_CATEGORIES, type PricingPackage } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
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

function PriceLabel({ pkg }: { pkg: PricingPackage }) {
  if (pkg.priceType === "quote")
    return (
      <span className="text-2xl font-extrabold text-violet-300">
        কোটেশন <span className="text-sm font-normal text-muted-foreground">· ৳{pkg.price}+ থেকে</span>
      </span>
    );
  return (
    <span className="text-3xl font-extrabold tracking-tight">
      {formatPrice(pkg.price, pkg.priceType)}
      {pkg.priceType === "monthly" && (
        <span className="ml-1 text-sm font-normal text-muted-foreground">প্রতি মাস</span>
      )}
    </span>
  );
}

function PricingPageInner() {
  const searchParams = useSearchParams();
  const ref = (searchParams.get("ref") ?? "").toUpperCase();
  const validRef = /^CM-\d{3,}$/.test(ref) ? ref : null;

  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [rules, setRules] = React.useState<string[]>([]);
  const [tab, setTab] = React.useState("all");
  const [ordering, setOrdering] = React.useState<PricingPackage | null>(null);
  const [ordered, setOrdered] = React.useState<PricingPackage | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = subscribePackages((pkgs) => setPackages(pkgs.filter((p) => p.active)));
    return unsub;
  }, []);

  React.useEffect(() => {
    fetchPublicSettings().then((s) => {
      setWhatsapp(s.whatsappNumber);
      setRules(s.pricingRules ?? []);
    });
  }, []);

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { name: "", phone: "", note: "" },
  });

  const activeCategories = PACKAGE_CATEGORIES.filter((c) =>
    (packages ?? []).some((p) => p.category === c.key)
  );
  // "সব" ট্যাবে ক্যাটাগরি-ওয়াইজ আলাদা সেকশন; নির্দিষ্ট ট্যাবে শুধু সেটাই
  const sections =
    tab === "all"
      ? activeCategories.map((c) => ({
          key: c.key,
          label: c.label,
          items: (packages ?? []).filter((p) => p.category === c.key),
        }))
      : activeCategories
          .filter((c) => c.key === tab)
          .map((c) => ({
            key: c.key,
            label: c.label,
            items: (packages ?? []).filter((p) => p.category === c.key),
          }));

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
    <main className="dot-grid relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
              <Code2 className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Rakibul Haque</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Web Developer · CODEMYST
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {validRef && (
              <Badge variant="success" className="hidden gap-1 sm:inline-flex">
                <BadgeCheck className="h-3 w-3" /> Ref: {validRef}
              </Badge>
            )}
            <Button asChild variant="outline" size="sm">
              <a
                href={whatsapp ? waLink(null) : "#"}
                target="_blank"
                rel="noreferrer"
                className="gap-1.5"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            শুরুতেই একটা সাইট একদম ফ্রি
          </div>
          <h1 className="text-gradient mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            আপনার ব্যবসার জন্য প্রফেশনাল ওয়েবসাইট
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ছোট ব্যবসা, দোকান, কোচিং, ব্লগ, কোর্স সাইট — সব বানানো হয়। সাধ্যের মধ্যে দাম,
            দ্রুত ডেলিভারি। পছন্দের প্যাকেজ বেছে অর্ডার করুন — আমরা কল দিয়ে বাকি সব সাজিয়ে নেব।
          </p>
          {validRef && (
            <p className="mt-3 text-xs text-emerald-400">
              আপনি <span className="font-semibold">{validRef}</span> পার্টনারের রেফারেলে এসেছেন —
              অর্ডার করলে সেটা অটো রেকর্ড হবে ✅
            </p>
          )}
        </motion.div>
      </section>

      {/* Category tabs */}
      {activeCategories.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="all">সব</TabsTrigger>
              {activeCategories.map((c) => (
                <TabsTrigger key={c.key} value={c.key}>
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {packages === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (packages ?? []).length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            শীঘ্রই প্যাকেজ যোগ করা হবে। এখনই WhatsApp-এ যোগাযোগ করুন।
          </p>
        ) : (
          /* ক্যাটাগরি-ওয়াইজ আলাদা সেকশন — মাঝে পর্যাপ্ত ফাঁকা */
          <div className="space-y-14 sm:space-y-16">
            {sections.map((section) => (
              <div key={section.key}>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                    {section.label}
                  </h2>
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-muted-foreground">
                    {section.items.length} টি প্ল্যান
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((pkg, i) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card
                        className={`glass-hover card-sheen flex h-full flex-col p-6 ${
                          pkg.popular
                            ? "border-violet-500/40 shadow-[0_0_40px_-12px_hsl(258_90%_66%/0.4)]"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold">{pkg.name}</h3>
                          </div>
                          {pkg.popular && <Badge>🔥 জনপ্রিয়</Badge>}
                        </div>

                        <div className="mt-3">
                          <PriceLabel pkg={pkg} />
                          {pkg.delivery && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                              <Zap className="h-3 w-3" /> {pkg.delivery}
                            </p>
                          )}
                        </div>

                        <ul className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-muted-foreground">
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer rules */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Rakibul Haque Bhuiyan · Web Developer · CODEMYST</p>
            <Link href="/login" className="underline-offset-4 hover:underline">
              Partner Portal
            </Link>
          </div>
        </div>
      </footer>

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
                  <Label>কী ধরনের সাইট দরকার? (ঐচ্ছিক)</Label>
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
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="dot-grid flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </main>
      }
    >
      <PricingPageInner />
    </Suspense>
  );
}
