import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_PUBLIC_SETTINGS,
  DEFAULT_SETTINGS,
  type PortalSettings,
  type PublicSettings,
} from "@/lib/types";

const GLOBAL_DOC = "global";
const PUBLIC_DOC = "public";

/** পাবলিক সেটিংস (WhatsApp, announcement, pricing rules) — pricing পেজ থেকেও পড়া হয় */
export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", PUBLIC_DOC));
    if (snap.exists()) {
      return { ...DEFAULT_PUBLIC_SETTINGS, ...(snap.data() as Partial<PublicSettings>) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PUBLIC_SETTINGS;
}

export async function savePublicSettings(settings: PublicSettings) {
  await setDoc(
    doc(db, "settings", PUBLIC_DOC),
    { ...settings, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** গ্লোবাল সেটিংস (কমিশন রেট, min withdraw, referral base) */
export async function fetchGlobalSettings(): Promise<PortalSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", GLOBAL_DOC));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<PortalSettings>) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export async function saveGlobalSettings(settings: PortalSettings) {
  await setDoc(
    doc(db, "settings", GLOBAL_DOC),
    { ...settings, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
