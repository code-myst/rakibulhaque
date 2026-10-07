import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PACKAGE_CATEGORIES, type PricingCategory } from "@/lib/types";

const CAT_DOC = "categories";

function normalize(list: unknown): PricingCategory[] {
  if (!Array.isArray(list) || list.length === 0) {
    return PACKAGE_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i + 1 }));
  }
  return (list as PricingCategory[])
    .filter((c) => c?.key && c?.label)
    .map((c, i) => ({ key: c.key, label: c.label, sortOrder: c.sortOrder ?? i + 1 }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** ক্যাটাগরি পাবলিক pricing পেজ থেকেও পড়ে (rules-এ settings read public) */
export function subscribeCategories(cb: (cats: PricingCategory[]) => void) {
  return onSnapshot(
    doc(db, "settings", CAT_DOC),
    (snap) => cb(normalize(snap.exists() ? snap.data().list : null)),
    () => cb(normalize(null))
  );
}

export async function fetchCategories(): Promise<PricingCategory[]> {
  const snap = await getDoc(doc(db, "settings", CAT_DOC));
  return normalize(snap.exists() ? snap.data().list : null);
}

export async function saveCategories(list: PricingCategory[]) {
  await setDoc(
    doc(db, "settings", CAT_DOC),
    { list, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
