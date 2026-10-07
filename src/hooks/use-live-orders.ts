"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { siteAuth, siteDb } from "@/lib/firebase-site";
import type { ProfileOrder } from "@/lib/types";

/**
 * ক্লায়েন্ট প্রোফাইলের অর্ডার — সরাসরি project A (partner-affiliation) থেকে লাইভ।
 * anonymous auth দিয়ে নিজের (siteUserId == নিজের uid) অর্ডার পড়ে —
 * অ্যাডমিন status বদলালে ১ সেকেন্ডে প্রোফাইলে দেখা যায়।
 *
 * Fallback: anonymous provider বন্ধ থাকলে project B-র মিরর স্ন্যাপশট (stale হতে পারে)।
 */
export function useLiveOrders(siteUid: string | undefined) {
  const [orders, setOrders] = React.useState<ProfileOrder[] | null>(null);
  const [source, setSource] = React.useState<"live" | "mirror" | null>(null);

  // anonymous auth (একবার)
  React.useEffect(() => {
    signInAnonymously(auth).catch((e) => {
      console.error("anonymous sign-in failed (mirror fallback):", e);
      setSource("mirror");
    });
  }, []);

  React.useEffect(() => {
    if (!siteUid) {
      setOrders(null);
      return;
    }
    if (source !== "live") return;

    const q = query(
      collection(db, "clients"),
      where("siteUserId", "==", siteUid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              package: (data.package as string) ?? "—",
              amount: (data.amount as number) ?? 0,
              status: (data.status as ProfileOrder["status"]) ?? "pending",
              referredBy: (data.referredBy as string) ?? "",
              createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
            };
          })
        );
      },
      (err) => {
        console.error("live orders read failed (mirror fallback):", err);
        setSource("mirror");
      }
    );
    return unsub;
  }, [siteUid, source]);

  // Fallback: project B মিরর স্ন্যাপশট
  React.useEffect(() => {
    if (source !== "mirror" || !siteUid) return;
    const unsub = onSnapshot(
      doc(siteDb, "users", siteUid),
      (d) => {
        const data = d.data() as { orders?: Record<string, ProfileOrder> } | undefined;
        const list = Object.values(data?.orders ?? {}).sort(
          (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
        );
        setOrders(list);
      },
      () => setOrders([])
    );
    return unsub;
  }, [source, siteUid]);

  return { orders, source };
}

/** প্রথম অর্ডার থাকলে visitor → client role self-upgrade (rules-এ অনুমোদিত) */
export function useClientRoleHeal(
  siteUid: string | undefined,
  orders: ProfileOrder[] | null,
  onUpgraded?: () => void
) {
  React.useEffect(() => {
    if (!siteUid || !orders || orders.length === 0) return;
    const userRef = doc(siteDb, "users", siteUid);
    onSnapshot(userRef, (d) => {
      if (d.exists() && d.data().role === "visitor") {
        updateDoc(userRef, { role: "client" })
          .then(() => onUpgraded?.())
          .catch(() => undefined);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteUid, orders?.length]);
}

/** site auth listener helper — profile পেজ দুইবার লিখতে হবে না */
export function useSiteAuthState(cb: (u: import("firebase/auth").User | null) => void) {
  React.useEffect(() => {
    const unsub = onAuthStateChanged(siteAuth, cb);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
