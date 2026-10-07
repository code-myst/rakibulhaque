import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * দ্বিতীয় Firebase project — পাবলিক portfolio website-এর কনটেন্ট,
 * ভিজিটর অ্যাকাউন্ট, কনটাক্ট মেসেজ, ব্লগ ও রেকমেন্ডেশন এখানে থাকে।
 * (প্রথম project "partner-affiliation" @/lib/firebase.ts-এ)
 */
const siteConfig = {
  apiKey: process.env.NEXT_PUBLIC_SITE_FIREBASE_API_KEY ?? "AIzaSyD9X34h9OLAxsCVaH0j4HnXbCcj5q-zMKc",
  authDomain: "rakibul-haque.firebaseapp.com",
  projectId: "rakibul-haque",
  storageBucket: "rakibul-haque.firebasestorage.app",
  messagingSenderId: "342766423420",
  appId: "1:342766423420:web:541e9fe3d8572f013628f9",
  measurementId: "G-F4VWL5PN91",
};

const SITE_APP_NAME = "site";

export const siteApp: FirebaseApp =
  getApps().find((a) => a.name === SITE_APP_NAME) ??
  initializeApp(siteConfig, SITE_APP_NAME);

export const siteAuth: Auth = getAuth(siteApp);
export const siteDb: Firestore = getFirestore(siteApp);

export { siteConfig };
