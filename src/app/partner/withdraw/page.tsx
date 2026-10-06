"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Banknote, Info, Loader2, Send, Wallet } from "lucide-react";
import { Controller } from "react-hook-form";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { usePartnerWithdrawals } from "@/hooks/use-firestore-data";
import { fetchGlobalSettings } from "@/lib/settings";
import type { Withdrawal, WithdrawalMethod } from "@/lib/types";
import { formatBDT, formatDate, maskPhone } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const phoneRegex = /^01[3-9]\d{8}$/;

function useMinWithdraw() {
  const [min, setMin] = React.useState(500);
  React.useEffect(() => {
    fetchGlobalSettings()
      .then((s) => setMin(s.minWithdrawAmount || 500))
      .catch(() => setMin(500));
  }, []);
  return min;
}

function buildWithdrawSchema(min: number) {
  return z.object({
    amount: z.coerce
      .number()
      .positive("সঠিক অঙ্ক দিন")
      .min(min, `ন্যূনতম ${formatBDT(min)}`),
    method: z.enum(["bKash", "Nagad"], { required_error: "মেথড নির্বাচন করুন" }),
    accountNumber: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন"),
  });
}
type WithdrawValues = { amount: number; method: "bKash" | "Nagad"; accountNumber: string };

export default function PartnerWithdrawPage() {
  const { appUser, user } = useAuth();
  const { data: history, loading } = usePartnerWithdrawals(appUser?.partnerId);
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const minWithdraw = useMinWithdraw();
  const withdrawSchema = React.useMemo(() => buildWithdrawSchema(minWithdraw), [minWithdraw]);

  const balance = appUser?.balance ?? 0;
  const form = useForm<WithdrawValues>({
    resolver: zodResolver(withdrawSchema as unknown as z.ZodType<WithdrawValues>),
    defaultValues: { amount: 0, method: "bKash", accountNumber: "" },
  });

  const blocked = appUser?.status !== "active";

  const onSubmit = async (values: WithdrawValues) => {
    if (values.amount > balance) {
      toast({
        variant: "destructive",
        title: "অপর্যাপ্ত ব্যালান্স",
        description: `আপনার ব্যালান্স ${formatBDT(balance)} — এর বেশি উইথড্র করা যাবে না।`,
      });
      return;
    }
    if (!user || !appUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        partnerId: appUser.partnerId,
        amount: Math.round(values.amount),
        method: values.method as WithdrawalMethod,
        accountNumber: values.accountNumber,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast({
        title: "রিকোয়েস্ট জমা হয়েছে ✅",
        description: `${formatBDT(values.amount)} — অ্যাডমিন অ্যাপ্রুভ করলে ২৪–৪৮ ঘণ্টায় পেমেন্ট পাবেন।`,
      });
      form.reset({ amount: 0, method: values.method, accountNumber: values.accountNumber });
    } catch {
      toast({
        variant: "destructive",
        title: "জমা দেওয়া যায়নি",
        description: "আবার চেষ্টা করুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">উইথড্র</h1>
        <p className="text-sm text-muted-foreground">কমিশন তুলে নিন bKash/Nagad-এ</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Balance card */}
        <Card className="relative overflow-hidden lg:col-span-1">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4 text-emerald-300" /> Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold tracking-tight text-emerald-300">
              {formatBDT(balance)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              মোট উপার্জন: {formatBDT(appUser?.totalEarnings ?? 0)} · ন্যূনতম উইথড্র{" "}
              {formatBDT(minWithdraw)}
            </p>
          </CardContent>
        </Card>

        {/* Request form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-violet-300" /> উইথড্র রিকোয়েস্ট
            </CardTitle>
            <CardDescription>তথ্য সঠিকভাবে দিন — ভুল নম্বরে পাঠানো টাকা ফেরত আসবে না।</CardDescription>
          </CardHeader>
          <CardContent>
            {blocked && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
                <Info className="h-4 w-4 shrink-0" />
                অ্যাকাউন্ট অ্যাক্টিভ না হওয়া পর্যন্ত উইথড্র করা যাবে না।
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3" noValidate>
              <div className="space-y-1.5">
                <Label>অ্যামাউন্ট (৳)</Label>
                <Input type="number" placeholder="1000" {...form.register("amount")} />
                {form.formState.errors.amount && (
                  <p className="text-xs text-red-400">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>মেথড</Label>
                <Controller
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="মেথড" />
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
                <Input placeholder="01712345678" inputMode="numeric" {...form.register("accountNumber")} />
                {form.formState.errors.accountNumber && (
                  <p className="text-xs text-red-400">{form.formState.errors.accountNumber.message}</p>
                )}
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting || blocked}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  রিকোয়েস্ট পাঠান
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="p-0">
        <div className="border-b border-white/10 p-4">
          <h3 className="text-sm font-semibold">উইথড্র হিস্টোরি</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>তারিখ</TableHead>
              <TableHead>মেথড</TableHead>
              <TableHead>অ্যাকাউন্ট</TableHead>
              <TableHead className="text-right">অ্যামাউন্ট</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && history.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  এখনো কোনো উইথড্র রিকোয়েস্ট করেননি।
                </TableCell>
              </TableRow>
            )}
            {history.map((w: Withdrawal) => (
              <TableRow key={w.id}>
                <TableCell className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{w.method}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{maskPhone(w.accountNumber)}</TableCell>
                <TableCell className="text-right font-semibold">{formatBDT(w.amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      w.status === "approved"
                        ? "success"
                        : w.status === "rejected"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {w.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
