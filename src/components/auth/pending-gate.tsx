"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { doc, updateDoc } from "firebase/firestore";
import {
  Banknote,
  Check,
  Hourglass,
  Loader2,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { WithdrawalMethod } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

const phoneRegex = /^01[3-9]\d{8}$/;

const paymentSchema = z.object({
  paymentMethod: z.enum(["bKash", "Nagad"], { required_error: "মেথড নির্বাচন করুন" }),
  paymentNumber: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন"),
});
type PaymentValues = z.infer<typeof paymentSchema>;

/**
 * Pending/banned পার্টনারের জন্য ফুল-স্ক্রিন গেট —
 * অ্যাপ্রুভ না হওয়া পর্যন্ত dashboard দেখা যাবে না।
 * Pending হলে bKash/Nagad নম্বর জমা দেওয়ার ফর্ম দেখাবে।
 */
export function PendingGate() {
  const { appUser, signOut } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: (appUser?.paymentMethod as WithdrawalMethod) || "bKash",
      paymentNumber: appUser?.paymentNumber ?? "",
    },
  });

  if (appUser?.status === "banned") {
    return (
      <main className="dot-grid flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/40">
              <ShieldAlert className="h-7 w-7 text-red-400" />
            </div>
            <CardTitle>অ্যাকাউন্ট ব্যান করা হয়েছে</CardTitle>
            <CardDescription>
              আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /> লগআউট
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const hasPayment = !!appUser?.paymentMethod && !!appUser?.paymentNumber;

  const onSubmit = async (values: PaymentValues) => {
    if (!appUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", appUser.uid), {
        paymentMethod: values.paymentMethod,
        paymentNumber: values.paymentNumber,
      });
      toast({
        title: "পেমেন্ট তথ্য জমা হয়েছে ✅",
        description: "অ্যাডমিন অ্যাপ্রুভ করলেই আপনার ড্যাশবোর্ড খুলে যাবে।",
      });
    } catch {
      toast({ variant: "destructive", title: "জমা দেওয়া যায়নি", description: "আবার চেষ্টা করুন।" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dot-grid flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/40">
            <Hourglass className="h-7 w-7 animate-pulse text-amber-400" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            অ্যাকাউন্ট পেন্ডিং
            <Badge variant="warning">{appUser?.partnerId ?? "…"}</Badge>
          </CardTitle>
          <CardDescription>
            {hasPayment
              ? "আপনার তথ্য অ্যাডমিনের কাছে পৌঁছেছে — অ্যাপ্রুভ হলেই ড্যাশবোর্ড খুলে যাবে। সাধারণত ২৪ ঘণ্টার মধ্যে।"
              : "শুধুমাত্র অ্যাডমিন অ্যাপ্রুভ করার পরেই ড্যাশবোর্ড দেখা যাবে। কমিশন তোলার জন্য আগে আপনার পেমেন্ট নম্বর জমা দিন।"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-emerald-400" /> পেমেন্ট মেথড
                </Label>
                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="bKash / Nagad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bKash">bKash</SelectItem>
                        <SelectItem value="Nagad">Nagad</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>অ্যাকাউন্ট নম্বর</Label>
                <Input placeholder="01712345678" inputMode="numeric" {...form.register("paymentNumber")} />
                {form.formState.errors.paymentNumber && (
                  <p className="text-xs text-red-400">{form.formState.errors.paymentNumber.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {hasPayment ? "আপডেট করুন" : "পেমেন্ট তথ্য জমা দিন"}
            </Button>
          </form>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">এরপর কী হবে?</p>
            অ্যাডমিন আপনার আবেদন রিভিউ করবে → অ্যাপ্রুভ হলে এই পেজ অটো ড্যাশবোর্ডে বদলে যাবে
            (রিফ্রেশ করলেই) → রেফারেল লিংক শেয়ার করে কমিশন আয় শুরু করুন।
          </div>

          <Button variant="ghost" className="w-full" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> লগআউট
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
