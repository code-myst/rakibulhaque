"use client";

import * as React from "react";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { anonAuth, anonDb } from "@/lib/firebase-anon";
import { siteDb } from "@/lib/firebase-site";
import type { ProfileOrder } from "@/lib/types";

type OrderDoc = Record<string, unknown>;

function mapOrderDoc(id: string, d: OrderDoc): ProfileOrder {
  return {
    id,
    package: (d.package as string) ?? "—",
    amount: (d.amount as number) ?? 0,
    status: (d.status as ProfileOrder["status"]) ?? "pending",
    referredBy: (d.referredBy as string) ?? "",
    createdAt: (d.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

/**
 * ক্লায়েন্ট প্রোফাইলের অর্ডার — দুই source merge করে:
 *
 * 1. "live": আলাদা anonymous app instance দিয়ে project A-র `clients`
 *    থেকে নিজের (anonUid ম্যাচ) অর্ডার real-time — অ্যাডমিন status
 *    বদলালে সাথে সাথে আপডেট হয়। (orderBy নেই — index লাগে না)
 *
 * 2. "mirror": project B-র `users/{uid}/orders/*` স্ন্যাপশট —
 *    পুরনো অর্ডারগুলো (anonUid-এর আগের) এখান থেকে দেখা যায়।
 *
 * merge: একই id থাকলে live জেতে; শুধু mirror-এ থাকলে mirror-এরটা যোগ হয়।
 */
export function useLiveOrders(siteUid: string | undefined) {
  const [live, setLive] = React.useState<ProfileOrder[] | null>(null);
  const [mirror, setMirror] = React.useState<ProfileOrder[] | null>(null);

  // anonymous session নিশ্চিত (আলাদা instance — মূল লগইন নিরাপদ)
  React.useEffect(() => {
    let alive = true;
    signInAnonymously(anonAuth)
      .then(() => alive && setLive((prev) => prev ?? []))
      .catch((e) => {
        console.error("anonymous sign-in failed — mirror fallback:", e);
        if (alive) setLive((prev) => prev ?? []);
      });
    return () => {
      alive = false;
    };
  }, []);

  // live: project A থেকে নিজের অর্ডার
  React.useEffect(() => {
    const anonUid = anonAuth.currentUser?.uid;
    if (live === null || !anonUid) return;

    const q = query(collection(anonDb, "clients"), where("anonUid", "==", anonUid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLive(
          snap.docs
            .map((d) => mapOrderDoc(d.id, d.data() as OrderDoc))
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      },
      (err) => {
        console.error("live orders read failed:", err);
        setLive((prev) => prev ?? []);
      }
    );
    return unsub;
  }, [live === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // mirror: project B স্ন্যাপশট
  React.useEffect(() => {
    if (!siteUid) return;
    const unsub = onSnapshot(
      collection(siteDb, "users", siteUid, "orders"),
      (snap) => {
        setMirror(
          snap.docs
            .map((d) => {
              const data = d.data() as OrderDoc;
              return {
                id: d.id,
                package: (data.package as string) ?? "—",
                amount: (data.amount as number) ?? 0,
                status: (data.status as ProfileOrder["status"]) ?? "pending",
                referredBy: (data.referredBy as string) ?? "",
                createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
              } satisfies ProfileOrder;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      },
      () => setMirror([])
    );
    return unsub;
  }, [siteUid]);

  // merge: live-এ থাকা id গুলো live থেকে, বাকিগুলো mirror থেকে
  const orders = React.useMemo(() => {
    if (live === null && mirror === null) return null;
    const base = live ?? [];
    const extra = (mirror ?? []).filter((m) => !base.some((l) => l.id === m.id));
    return [...base, ...extra].sort((a, b) => b.createdAt - a.createdAt);
  }, [live, mirror]);

  return { orders, isLive: live !== null };
}

/** প্রথম অর্ডার থাকলে visitor → client role self-upgrade (rules-এ অনুমোদিত) */
export function useClientRoleHeal(
  siteUid: string | undefined,
  orders: ProfileOrder[] | null
) {
  const healed = React.useRef(false);
  React.useEffect(() => {
    if (!siteUid || healed.current || !orders || orders.length === 0) return;
    healed.current = true;
    updateDoc(doc(siteDb, "users", siteUid), { role: "client" }).catch(() => undefined);
  }, [siteUid, orders]);
}
