import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_PRICING } from "@/lib/default-pricing";
import type { PricingPackage } from "@/lib/types";

function mapPackage(id: string, d: Record<string, unknown>): PricingPackage {
  return {
    id,
    category: (d.category as PricingPackage["category"]) ?? "custom",
    categoryName: (d.categoryName as string) ?? "কাস্টম প্রজেক্ট",
    name: (d.name as string) ?? "—",
    price: (d.price as number | null) ?? null,
    priceType: (d.priceType as PricingPackage["priceType"]) ?? "fixed",
    features: (d.features as string[]) ?? [],
    delivery: (d.delivery as string) ?? undefined,
    note: (d.note as string) ?? undefined,
    popular: !!d.popular,
    active: d.active !== false,
    sortOrder: (d.sortOrder as number) ?? 999,
  };
}

/** সব প্যাকেজের রিয়েল-টাইম সাবস্ক্রিপশন (পাবলিক পেজ + অ্যাডমিন দুটোতেই ব্যবহৃত) */
export function subscribePackages(
  cb: (packages: PricingPackage[]) => void,
  onError?: () => void
) {
  const q = query(collection(db, "packages"), orderBy("sortOrder", "asc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapPackage(d.id, d.data() as Record<string, unknown>))),
    () => {
      cb([]);
      onError?.();
    }
  );
}

export async function savePackage(pkg: Omit<PricingPackage, "id">, id?: string) {
  if (id) {
    await setDoc(doc(db, "packages", id), pkg, { merge: true });
    return id;
  }
  const ref = doc(collection(db, "packages"));
  await setDoc(ref, pkg);
  return ref.id;
}

export async function deletePackage(id: string) {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "packages", id));
}

/** কালেকশন খালি কি না (সিড বাটন দেখানোর সিদ্ধান্তে) */
export async function isPackagesEmpty(): Promise<boolean> {
  const snap = await getDocs(query(collection(db, "packages")));
  return snap.empty;
}

/** DEFAULT_PRICING (Codemyst_Pricing.docx) → Firestore `packages` */
export async function seedDefaultPackages() {
  const batch = writeBatch(db);
  DEFAULT_PRICING.forEach((p) => {
    const ref = doc(collection(db, "packages"));
    batch.set(ref, p);
  });
  await batch.commit();
  return DEFAULT_PRICING.length;
}
