import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/lib/types";

/**
 * Login convention: partners can log in with phone or email.
 * A phone like "01712345678" is mapped to the synthetic email
 * "01712345678@rhb.partners" (the account the admin created).
 */
export function normalizeLoginId(input: string): string {
  const value = input.trim();
  if (value.includes("@")) return value;
  return `${value.replace(/\s+/g, "")}@rhb.partners`;
}

/** Next partner id: counts existing partners → "CM-001", "CM-005", … */
export async function generatePartnerId(): Promise<string> {
  const snap = await getDocs(collection(db, "users"));
  const nums = snap.docs
    .map((d) => /CM-(\d+)/.exec(d.data()?.partnerId ?? "")?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CM-${String(next).padStart(3, "0")}`;
}

export async function fetchAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    name: data?.name ?? "Unnamed",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    role: (data?.role as UserRole) ?? "partner",
    partnerId: data?.partnerId ?? "",
    commissionRate: data?.commissionRate ?? 15,
    status: data?.status ?? "pending",
    balance: data?.balance ?? 0,
    totalEarnings: data?.totalEarnings ?? 0,
    createdAt: data?.createdAt?.toMillis?.() ?? undefined,
  };
}

/** Create a Firestore profile for a brand-new auth user (Google sign-up). */
export async function createUserProfile(
  uid: string,
  data: { name: string; phone: string; email?: string }
): Promise<AppUser> {
  const partnerId = await generatePartnerId();
  const profile: AppUser = {
    uid,
    name: data.name || "New Partner",
    phone: data.phone || "",
    email: data.email ?? "",
    role: "partner",
    partnerId,
    commissionRate: 15,
    status: "pending",
    balance: 0,
    totalEarnings: 0,
  };
  await setDoc(doc(db, "users", uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
  return profile;
}

/** Fetch-or-create used right after sign-in. */
export async function ensureUserProfile(
  uid: string,
  fallback: { name: string; phone: string; email?: string }
): Promise<AppUser | null> {
  const existing = await fetchAppUser(uid);
  if (existing) return existing;
  try {
    return await createUserProfile(uid, fallback);
  } catch {
    // May fail if security rules disallow while pending — surface null
    return null;
  }
}

export async function getUserByPartnerId(partnerId: string): Promise<AppUser | null> {
  const snap = await getDocs(
    query(collection(db, "users"), where("partnerId", "==", partnerId))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as AppUser), uid: d.id };
}
