import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Firestore/Auth error থেকে বাংলা ব্যবসায়িক বার্তা —
 * save ব্যর্থ হলে toast-এ আসল কারণ দেখায় (যেমন permission-denied = rules deploy হয়নি)।
 */
export function firebaseErrText(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("permission-denied"))
    return "অনুমতি নেই (permission-denied) — নতুন Firestore rules deploy করা হয়নি অথবা আপনি এই প্রজেক্টে admin নন।";
  if (code.includes("unauthenticated"))
    return "লগইন সেশন শেষ — আবার লগইন করুন।";
  if (code.includes("failed-precondition"))
    return "Firestore ডাটাবেস তৈরি নেই — Firebase Console → Firestore Database তৈরি করুন।";
  if (code.includes("network"))
    return "নেটওয়ার্ক সমস্যা — ইন্টারনেট চেক করুন।";
  return code ? `Error: ${code}` : "অজানা সমস্যা — আবার চেষ্টা করুন।";
}

/** 12345 -> "017***123" ধাঁচে ফোন নম্বর mask করে (পার্টনার privacy) */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}

/** 1500 -> "৳1,500" */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-IN")}`;
}

/** প্যাকেজ দাম টাইপ অনুযায়ী: quote → "কোটেশন", from → "৳5,000+", monthly → "৳200/মাস" */
export function formatPrice(
  price: number | null,
  priceType: "fixed" | "from" | "quote" | "monthly"
): string {
  if (priceType === "quote" || price === null) return "কোটেশন";
  if (priceType === "monthly") return `${formatBDT(price)}/মাস`;
  if (priceType === "from") return `${formatBDT(price)}+`;
  return formatBDT(price);
}

/** 1728230453000 -> "06/10/2026" */
export function formatDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
