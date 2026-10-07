"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  type Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser, Client, Withdrawal } from "@/lib/types";

type DocWithId<T> = T;

function useCollection<T>(
  q: Query | null,
  mapDoc: (id: string, data: Record<string, unknown>) => DocWithId<T>
): { data: T[]; loading: boolean } {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)));
        setLoading(false);
      },
      () => setLoading(false) // permission errors etc. — show empty state
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return { data, loading };
}

const mapClient = (id: string, d: Record<string, unknown>): Client => ({
  id,
  name: (d.name as string) ?? "—",
  phone: (d.phone as string) ?? "",
  package: (d.package as string) ?? "—",
  amount: (d.amount as number) ?? 0,
  referredBy: (d.referredBy as string) ?? "",
  status: (d.status as Client["status"]) ?? "pending",
  createdAt: (d.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  source: (d.source as Client["source"]) ?? "admin",
  isFree: !!d.isFree,
  followUps: (d.followUps as Client["followUps"]) ?? [],
  commissionRate: (d.commissionRate as number | null) ?? null,
  note: (d.note as string) ?? "",
});

const mapWithdrawal = (id: string, d: Record<string, unknown>): Withdrawal => ({
  id,
  partnerId: (d.partnerId as string) ?? "",
  amount: (d.amount as number) ?? 0,
  method: (d.method as Withdrawal["method"]) ?? "bKash",
  accountNumber: (d.accountNumber as string) ?? "",
  status: (d.status as Withdrawal["status"]) ?? "pending",
  createdAt: (d.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
});

const mapUser = (id: string, d: Record<string, unknown>): AppUser => ({
  uid: id,
  name: (d.name as string) ?? "—",
  phone: (d.phone as string) ?? "",
  email: (d.email as string) ?? "",
  role: (d.role as AppUser["role"]) ?? "partner",
  partnerId: (d.partnerId as string) ?? "",
  commissionRate: (d.commissionRate as number) ?? 15,
  status: (d.status as AppUser["status"]) ?? "pending",
  balance: (d.balance as number) ?? 0,
  totalEarnings: (d.totalEarnings as number) ?? 0,
  paymentMethod: (d.paymentMethod as AppUser["paymentMethod"]) ?? "",
  paymentNumber: (d.paymentNumber as string) ?? "",
  createdAt: (d.createdAt as { toMillis?: () => number })?.toMillis?.() ?? undefined,
});

/* ---------------- Admin ---------------- */

export function useAllClients() {
  const q = React.useMemo(
    () => query(collection(db, "clients"), orderBy("createdAt", "desc")),
    []
  );
  return useCollection<Client>(q, mapClient);
}

export function useAllUsers() {
  const q = React.useMemo(() => collection(db, "users"), []);
  return useCollection<AppUser>(q, mapUser);
}

export function useAllWithdrawals() {
  const q = React.useMemo(
    () => query(collection(db, "withdrawals"), orderBy("createdAt", "desc")),
    []
  );
  return useCollection<Withdrawal>(q, mapWithdrawal);
}

/* ---------------- Partner ---------------- */

export function usePartnerClients(partnerId: string | undefined) {
  const q = React.useMemo(
    () =>
      partnerId
        ? query(
            collection(db, "clients"),
            where("referredBy", "==", partnerId),
            orderBy("createdAt", "desc")
          )
        : null,
    [partnerId]
  );
  return useCollection<Client>(q, mapClient);
}

export function usePartnerWithdrawals(partnerId: string | undefined) {
  const q = React.useMemo(
    () =>
      partnerId
        ? query(
            collection(db, "withdrawals"),
            where("partnerId", "==", partnerId),
            orderBy("createdAt", "desc")
          )
        : null,
    [partnerId]
  );
  return useCollection<Withdrawal>(q, mapWithdrawal);
}
