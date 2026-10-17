import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: "AIzaSyD9X34h9OLAxsCVaH0j4HnXbCcj5q-zMKc",
  authDomain: "rakibul-haque.firebaseapp.com",
  projectId: "rakibul-haque",
  storageBucket: "rakibul-haque.firebasestorage.app",
  messagingSenderId: "342766423420",
  appId: "1:342766423420:web:541e9fe3d8572f013628f9",
};

// আগে থেকে rakibul-haque অ্যাপ চালু থাকলে সেটাই ব্যবহার করবে (একই লগইন সেশন)
const app: FirebaseApp =
  getApps().find((a) => a.options.projectId === "rakibul-haque") ??
  initializeApp(config, "rhb-store");

export const storeDb = getFirestore(app);
export const storeAuth = getAuth(app);
