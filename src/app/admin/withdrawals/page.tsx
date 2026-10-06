"use client";

import * as React from "react";
import {
  Banknote,
  Ban,
  Check,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  doc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAllUsers, useAllWithdrawals } from "@/hooks/use-firestore-data";
import type { Withdrawal } from "@/lib/types";
import { formatBDT, formatDate, maskPhone } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusVariant(s: Withdrawal["status"]) {
  return s === "approved" ? "success" : s === "rejected" ? "destructive" : "warning";
}

export default function AdminWithdrawalsPage() {
  const { data: withdrawals, loading } = useAllWithdrawals();
  const { data: users } = useAllUsers();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const partnerByPid = React.useMemo(
    () => new Map(users.filter((u) => u.role === "partner").map((p) => [p.partnerId, p])),
    [users]
  );

  const pending = withdrawals.filter((w) => w.status === "pending");
  const pendingAmount = pending.reduce((s, w) => s + w.amount, 0);

  /** Approve: atomically flip status AND deduct partner balance */
  const onApprove = async (w: Withdrawal) => {
    setBusyId(w.id);
    try {
      const partner = partnerByPid.get(w.partnerId);
      if (!partner) throw new Error("partner-missing");

      await runTransaction(db, async (tx) => {
        const wSnap = await tx.get(doc(db, "withdrawals", w.id));
        const uSnap = await tx.get(doc(db, "users", partner.uid));
        if (!wSnap.exists() || wSnap.data().status !== "pending") return;
        if (!uSnap.exists()) throw new Error("partner-missing");

        const balance = (uSnap.data().balance as number) ?? 0;
        if (balance < w.amount) throw new Error("insufficient");

        tx.update(doc(db, "withdrawals", w.id), { status: "approved" });
        tx.update(doc(db, "users", partner.uid), { balance: balance - w.amount });
      });

      toast({
        title: "উইথড্র অ্যাপ্রুভ ✅",
        description: `${w.partnerId}-কে ${formatBDT(w.amount)} পাঠান ${w.method} (${maskPhone(w.accountNumber)}) এ।`,
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "insufficient"
          ? "পার্টনারের ব্যালান্স পর্যাপ্ত নয়।"
          : err instanceof Error && err.message === "partner-missing"
            ? "পার্টনার পাওয়া যায়নি।"
            : "অ্যাপ্রুভ ব্যর্থ হয়েছে।";
      toast({ variant: "destructive", title: "সমস্যা!", description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (w: Withdrawal) => {
    setBusyId(w.id);
    try {
      await updateDoc(doc(db, "withdrawals", w.id), { status: "rejected" });
      toast({ title: "রিকোয়েস্ট রিজেক্ট করা হয়েছে", description: `${w.partnerId} — ${formatBDT(w.amount)}` });
    } catch {
      toast({ variant: "destructive", title: "রিজেক্ট ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">উইথড্র রিকোয়েস্ট</h1>
          <p className="text-sm text-muted-foreground">
            অ্যাপ্রুভ করলে পার্টনারের ব্যালান্স থেকে অর্থ কাটা হবে
          </p>
        </div>
        <Badge variant="warning" className="gap-1.5 px-3 py-1.5 text-sm">
          <Banknote className="h-4 w-4" />
          {pending.length} টি পেন্ডিং · {formatBDT(pendingAmount)}
        </Badge>
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>পার্টনার</TableHead>
              <TableHead>মেথড</TableHead>
              <TableHead>অ্যাকাউন্ট</TableHead>
              <TableHead className="text-right">অ্যামাউন্ট</TableHead>
              <TableHead>রিকোয়েস্টের তারিখ</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && withdrawals.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  <Banknote className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  কোনো উইথড্র রিকোয়েস্ট নেই।
                </TableCell>
              </TableRow>
            )}
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <p className="font-medium">{partnerByPid.get(w.partnerId)?.name ?? w.partnerId}</p>
                  <code className="font-mono text-xs text-muted-foreground">{w.partnerId}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{w.method}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{maskPhone(w.accountNumber)}</TableCell>
                <TableCell className="text-right font-bold text-emerald-300">
                  {formatBDT(w.amount)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(w.status)}>{w.status}</Badge>
                </TableCell>
                <TableCell>
                  {w.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        disabled={busyId === w.id}
                        onClick={() => onApprove(w)}
                      >
                        {busyId === w.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        অ্যাপ্রুভ
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === w.id}
                        onClick={() => onReject(w)}
                      >
                        <XCircle className="h-4 w-4" />
                        রিজেক্ট
                      </Button>
                    </div>
                  ) : (
                    <p className="flex justify-end items-center gap-1.5 text-xs text-muted-foreground">
                      {w.status === "approved" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> পেমেন্ট সম্পন্ন
                        </>
                      ) : (
                        <>
                          <Ban className="h-3.5 w-3.5 text-red-400" /> রিজেক্টেড
                        </>
                      )}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
