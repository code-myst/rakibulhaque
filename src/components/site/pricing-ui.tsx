"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BadgeCheck, Check, Flame, Loader2, MessageCircle, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import type { PricingPackage } from "@/lib/types";
import { formatBDT, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------- Price (Hostinger-style) ---------------- */

export function PriceBlock({ pkg, big }: { pkg: PricingPackage; big?: boolean }) {
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

/* ---------------- Package card ---------------- */

export function PackageCard({
  pkg,
  onOrder,
  index = 0,
}: {
  pkg: PricingPackage;
  onOrder: (pkg: PricingPackage) => void;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.35) }}
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
          onClick={() => onOrder(pkg)}
        >
          {pkg.price === 0 ? "ফ্রি নিন" : pkg.priceType === "quote" ? "কোটেশন চাই" : "অর্ডার করুন"}
        </Button>
      </Card>
    </motion.div>
  );
}

/* ---------------- Order dialog + success ---------------- */

const orderSchema = z.object({
  name: z.string().min(2, "আপনার নাম লিখুন").max(99),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 01712345678)"),
  note: z.string().max(500).optional(),
});
type OrderValues = z.infer<typeof orderSchema>;

export function OrderDialog({
  ordering,
  whatsapp,
  referral,
  onClose,
}: {
  ordering: PricingPackage | null;
  whatsapp: string;
  /** পার্টনার রেফারেল আইডি (CM-XXX) বা null */
  referral?: string | null;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [ordered, setOrdered] = React.useState<PricingPackage | null>(null);
  const { toast } = useToast();

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { name: "", phone: "", note: "" },
  });

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
        referredBy: referral ?? "DIRECT",
        status: "pending",
        source: "pricing",
        isFree: amount === 0 && ordering.priceType === "fixed",
        followUps: [],
        note: values.note?.trim() || "",
        createdAt: serverTimestamp(),
      });
      setOrdered(ordering);
      onClose();
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
      ? `আসসালামু আলাইকুম! আমি ${name ?? "…"}। আমি ${pkg.name} প্যাকেজে আগ্রহী (${formatPrice(pkg.price, pkg.priceType)})।${referral ? ` (Ref: ${referral})` : ""}`
      : "আসসালামু আলাইকুম! ওয়েবসাইট সার্ভিস নিয়ে কথা বলতে চাই।";
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      {/* Order form */}
      <Dialog open={!!ordering} onOpenChange={(o) => !o && onClose()}>
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

      {/* Success */}
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
    </>
  );
}

/* ---------------- Ref badge ---------------- */

export function RefBadge({ referral }: { referral: string | null }) {
  if (!referral) return null;
  return (
    <Badge variant="success" className="gap-1">
      <BadgeCheck className="h-3 w-3" /> Ref: {referral}
    </Badge>
  );
}
