import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { siteFirebaseConfig } from "@/lib/site-firebase-config";

/**
 * দ্বিতীয় Firebase project — পাবলিক portfolio website-এর কনটেন্ট,
 * ভিজিটর অ্যাকাউন্ট, কনটাক্ট মেসেজ, ব্লগ ও রেকমেন্ডেশন এখানে থাকে।
 * (প্রথম project "partner-affiliation" @/lib/firebase.ts-এ)
 */
const siteConfig = siteFirebaseConfig;

const SITE_APP_NAME = "site";

export const siteApp: FirebaseApp =
  getApps().find((a) => a.name === SITE_APP_NAME) ??
  initializeApp(siteConfig, SITE_APP_NAME);

export const siteAuth: Auth = getAuth(siteApp);
export const siteDb: Firestore = getFirestore(siteApp);

export { siteConfig };
