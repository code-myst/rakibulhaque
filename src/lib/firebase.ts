import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCaZNvEPSmwK_ZOe0P84KgEoq_nECXz25o",
  authDomain: "partner-affiliation.firebaseapp.com",
  projectId: "partner-affiliation",
  storageBucket: "partner-affiliation.firebasestorage.app",
  messagingSenderId: "107743227959",
  appId: "1:107743227959:web:b2c2671cafe3353e454fb2",
  measurementId: "G-C2TNJB6Z8D",
};

/**
 * Guard against re-initialization during Next.js HMR.
 * NOTE: `getApps().length` দিয়ে গার্ড করা যায় না — "site" অ্যাপ থাকলে
 * [DEFAULT] না থাকলেও পাস করে; তাই নাম ধরে খোঁজা হয়।
 */
const app: FirebaseApp =
  getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
export default app;
