import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "@/lib/firebase";

/**
 * পাবলিক প্রোফাইলের জন্য আলাদা anonymous session (project A-র সেকেন্ডারি instance)।
 * মূল `auth` instance-কে ধ্বংস করে না — admin/partner লগইন নিরাপদ থাকে।
 */
const ANON_APP_NAME = "anon-read";

export const anonApp: FirebaseApp =
  getApps().find((a) => a.name === ANON_APP_NAME) ??
  initializeApp(firebaseConfig, ANON_APP_NAME);

export const anonAuth: Auth = getAuth(anonApp);
export const anonDb: Firestore = getFirestore(anonApp);
