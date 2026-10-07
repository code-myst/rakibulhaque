"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { CheckCircle2, Handshake, Loader2, LockKeyhole } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const schema = z.object({
  name: z.string().min(2, "নাম লিখুন"),
  phone: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন"),
  email: z.string().email("সঠিক ইমেইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর"),
  paymentMethod: z.enum(["bKash", "Nagad"]),
  paymentNumber: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন"),
});
type Values = z.infer<typeof schema>;

export default function PartnerRegisterPage() {
  const { toast } = useToast();
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      paymentMethod: "bKash",
      paymentNumber: "",
    },
  });

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      // project A (partner-affiliation)-এ অ্যাকাউন্ট + pending প্রোফাইল
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: values.name.trim(),
        phone: values.phone,
        email: values.email,
        role: "partner",
        partnerId: "", // অ্যাডমিন অ্যাপ্রুভ করলে বরাদ্দ হবে
        commissionRate: 15,
        status: "pending",
        balance: 0,
        totalEarnings: 0,
        paymentMethod: values.paymentMethod,
        paymentNumber: values.paymentNumber,
        createdAt: serverTimestamp(),
      });
      // সাইট ভিজিটর থাকা উচিত নয় — লগআউট করে দিই
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use") {
        toast({
          variant: "destructive",
          title: "ইমেইল ব্যবহৃত",
          description: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন পেজ থেকে ঢুকুন।",
        });
      } else {
        console.error("partner register failed:", err);
        toast({ variant: "destructive", title: "রেজিস্ট্রেশন ব্যর্থ", description: "আবার চেষ্টা করুন।" });
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <CardTitle>রেজিস্ট্রেশন সম্পন্ন! 🎉</CardTitle>
            <CardDescription>
              আপনার পার্টনার আবেদন অ্যাডমিনের কাছে পৌঁছেছে। অ্যাপ্রুভ হলে{" "}
              <Link href="/login" className="font-semibold text-violet-300 hover:underline">
                /login
              </Link>{" "}
              থেকে ইমেইল+পাসওয়ার্ড দিয়ে লগইন করতে পারবেন — তখনই আপনার রেফারেল লিংক ও
              ড্যাশবোর্ড চালু হবে।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">← হোম পেজে ফিরুন</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/40">
            <Handshake className="h-6 w-6 text-violet-300" />
          </div>
          <CardTitle>পার্টনার রেজিস্ট্রেশন</CardTitle>
          <CardDescription>
            ক্লায়েন্ট রেফার করে <span className="font-semibold text-violet-300">১৫–২০% কমিশন</span>{" "}
            আয় করুন — রেজিস্ট্রেশনের পর অ্যাডমিন অ্যাপ্রুভ করলেই চালু
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>নাম</Label>
              <Input placeholder="আপনার নাম" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ফোন</Label>
                <Input placeholder="01712345678" inputMode="numeric" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>ইমেইল</Label>
                <Input type="email" placeholder="you@mail.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <LockKeyhole className="h-3.5 w-3.5 text-violet-300" /> পাসওয়ার্ড
                </Label>
                <Input type="password" placeholder="কমপক্ষে ৬ অক্ষর" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>কমিশন তোলার মেথড</Label>
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label>অ্যাকাউন্ট নম্বর (কমিশন পাঠানো হবে এখানে)</Label>
                <Input
                  placeholder="01712345678"
                  inputMode="numeric"
                  {...form.register("paymentNumber")}
                />
                {form.formState.errors.paymentNumber && (
                  <p className="text-xs text-red-400">{form.formState.errors.paymentNumber.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
              আবেদন জমা দিন
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              আবেদন জমা দিলে অ্যাকাউন্ট তৈরি হবে (status: pending) — অ্যাডমিন অ্যাপ্রুভ করলেই
              ড্যাশবোর্ড ও রেফারেল লিংক চালু হবে। ইতিমধ্যে পার্টনার থাকলে{" "}
              <Link href="/login" className="text-violet-300 hover:underline">
                লগইন
              </Link>{" "}
              করুন।
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
