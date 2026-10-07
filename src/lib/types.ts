import type {
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";

/* ---------------- Portfolio site (rakibul-haque project) ---------------- */

/** দ্বিভাষিক টেক্সট — পোর্টফোলিওতে EN/বাং টগল */
export interface LText {
  en: string;
  bn: string;
}

export interface SiteSkill {
  name: string;
  /** 0–100 progress bar-এর জন্য */
  level?: number;
  group?: string;
}

export interface SiteServiceCategory {
  key: string;
  label: string;
  sortOrder: number;
}

export interface SiteService {
  id: string;
  /** lucide icon key — services page-এ ম্যাপ হয় */
  icon: string;
  title: LText;
  description: LText;
  features: LText[];
  /** সার্ভিসের অধীনে ক্যাটাগরি — প্রতিটা ক্যাটাগরির নিচে প্যাকেজ (packages.category = key) */
  categories: SiteServiceCategory[];
}

export interface SiteProject {
  id: string;
  title: LText;
  description: LText;
  image?: string;
  link?: string;
  tags: string[];
  featured: boolean;
}

export interface SiteContent {
  profile: {
    name: string;
    /** URL দিয়ে প্রোফাইল ছবি */
    photoUrl?: string;
    badge: LText;
    roles: LText[];
    tagline: LText;
  };
  cta: {
    primaryLabel: LText;
    primaryHref: string;
    secondaryLabel: LText;
    secondaryHref: string;
  };
  about: {
    title: LText;
    paragraphs: LText[];
    skills: SiteSkill[];
    languages: string[];
    stats: { value: string; label: LText }[];
  };
  services: SiteService[];
  projects: SiteProject[];
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    location: LText;
    socials: { label: string; url: string }[];
  };
  seo?: { title: LText; description: LText };
  updatedAt?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: LText;
  excerpt: LText;
  /** plain text — ফাঁকা লাইন = নতুন প্যারাগ্রাফ */
  content: LText;
  cover?: string;
  tags: string[];
  published: boolean;
  createdAt: number;
}

export interface MessageEntry {
  from: "visitor" | "admin";
  text: string;
  at: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  /** অ্যাকাউন্ট খুলে পাঠালে সেট; গেস্ট হলে null */
  visitorUid?: string | null;
  thread: MessageEntry[];
  status: "new" | "read" | "replied";
  createdAt: number;
}

export interface Recommendation {
  id: string;
  name: string;
  role: string;
  text: string;
  /** 1–5 */
  rating: number;
  status: "pending" | "approved";
  /** জমা দেওয়া ক্লায়েন্ট অ্যাকাউন্টের uid */
  uid?: string;
  createdAt: number;
}

/* ---------------- Site account (rakibul-haque project) ---------------- */

export type SiteRole = "admin" | "client" | "visitor";

export interface ProfileOrder {
  id: string; // = project A clients doc id
  package: string;
  amount: number;
  status: ClientStatus;
  referredBy: string;
  createdAt: number;
  updatedAt?: number;
}

/* ---------------- Pricing categories (editable) ---------------- */

/* ---------------- Firestore document types ---------------- */

export type UserRole = "admin" | "partner";
export type UserStatus = "active" | "pending" | "banned";
export type ClientStatus = "pending" | "working" | "paid";
export type WithdrawalStatus = "pending" | "approved" | "rejected";
export type WithdrawalMethod = "bKash" | "Nagad";
/** 'pricing' = public pricing page থেকে এসেছে, 'admin' = অ্যাডমিন/পার্টনার নিজে যোগ করেছে */
export type ClientSource = "pricing" | "admin";

export interface AppUser {
  uid: string; // doc id in `users`
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  /** e.g. "CM-005"; admins use "ADMIN" */
  partnerId: string;
  /** 15 or 20 (percent) — Gold Partner (৩+ অর্ডার) হলে ২০ */
  commissionRate: number;
  status: UserStatus;
  /** available commission balance (৳) */
  balance: number;
  totalEarnings: number;
  /** কমিশন তোলার মাধ্যম — নতুন পার্টনার অ্যাপ্রুভের আগে জমা দেয় */
  paymentMethod?: WithdrawalMethod | "";
  paymentNumber?: string;
  createdAt?: number;
}

export interface ClientFollowUp {
  at: number;
  note: string;
}

export interface Client {
  id: string; // doc id in `clients`
  name: string;
  phone: string;
  package: string;
  amount: number;
  /** "CM-005" অথবা "DIRECT" (অ্যাডমিনের নিজের অর্ডার — কমিশন নেই) */
  referredBy: string;
  status: ClientStatus;
  createdAt: number;
  source?: ClientSource;
  /** ফ্রি সার্ভিস লিড (amount = 0) */
  isFree?: boolean;
  /** ফলো-আপ নোট টাইমলাইন (ফ্রি লিডস ট্যাব) */
  followUps?: ClientFollowUp[];
  /** পার্টনার রেটের ওভাররাইড (যেমন ৬ মাসের মধ্যে রিপিট ক্লায়েন্ট = ১০%); null = পার্টনারের রেট */
  commissionRate?: number | null;
  /** সাইট অ্যাকাউন্টের uid (rakibul-haque project) — প্রোফাইলে অর্ডার হিস্টোরি দেখানোর জন্য */
  siteUserId?: string;
  /** সাইট অ্যাকাউন্টের ইমেইল */
  siteEmail?: string;
  /** pricing পেজের অর্ডার ফর্মে ক্লায়েন্টের লেখা নোট */
  note?: string;
}

export interface Withdrawal {
  id: string; // doc id in `withdrawals`
  partnerId: string;
  amount: number;
  method: WithdrawalMethod;
  accountNumber: string;
  status: WithdrawalStatus;
  createdAt: number;
}

/* ---------------- Pricing (`packages`) ---------------- */

export type PackageCategory =
  | "free"
  | "web"
  | "apps"
  | "ai-automation"
  | "ai-agents"
  | "update"
  | "maintenance"
  | "custom";

export type PriceType = "fixed" | "from" | "quote" | "monthly";

export interface PricingPackage {
  id: string;
  category: PackageCategory | string;
  categoryName: string;
  name: string;
  /** null = quote-based */
  price: number | null;
  priceType: PriceType;
  /** আগের দাম (স্ট্রাইকথ্রু + "Save ৳X" ব্যাজের জন্য) */
  originalPrice?: number | null;
  features: string[];
  delivery?: string;
  note?: string;
  popular?: boolean;
  active: boolean;
  sortOrder: number;
}

/** ডিফল্ট ক্যাটাগরি — DB-র settings/categories খালি হলে fallback */
/* ---------------- Pricing categories ----------------
 * ক্যাটাগরি এখন সার্ভিসের অধীনে (SiteService.categories) —
 * packages.category = সেই ক্যাটাগরির key। */

export type PricingCategory = SiteServiceCategory;

/* ---------------- Editable content (`content/resources`) ---------------- */

export interface ResourceItem {
  title: string;
  lines: string[];
}

export interface ResourcesContent {
  sections: {
    key: "scripts" | "objections" | "rules";
    label: string;
    items: ResourceItem[];
  }[];
  updatedAt?: number;
}

/* ---------------- Settings ---------------- */

export interface PortalSettings {
  defaultCommissionRate: number; // 15
  premiumCommissionRate: number; // 20 (Gold Partner)
  minWithdrawAmount: number;
  referralBaseUrl: string; // রেফারেল লিংকের বেজ — এই অ্যাপের ডোমেইন হলে /pricing পেজে যাবে
}

export const DEFAULT_SETTINGS: PortalSettings = {
  defaultCommissionRate: 15,
  premiumCommissionRate: 20,
  minWithdrawAmount: 500,
  referralBaseUrl: "",
};

/** settings/public — পাবলিক পেজ (pricing ইত্যাদি) থেকেও পড়া যায় */
export interface PublicSettings {
  whatsappNumber: string; // international format, e.g. "8801752845182"
  supportEmail: string;
  announcementText: string;
  announcementEnabled: boolean;
  /** pricing পেজের ফুটার নিয়ম, প্রতি লাইন একটা নিয়ম */
  pricingRules: string[];
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  whatsappNumber: "8801752845182",
  supportEmail: "",
  announcementText: "",
  announcementEnabled: false,
  pricingRules: [
    "Domain ও hosting এর খরচ ক্লায়েন্টের",
    "Delivery এর পর ৭ দিন ফ্রি bug fix",
    "Paid প্ল্যানে ২টা revision ফ্রি",
    "অতিরিক্ত পেজ: প্রতি পেজ ৳২০০–৫০০",
  ],
};

/* ---------------- Auth context ---------------- */

export interface AuthContextValue {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean; // auth state resolving
  profileLoading: boolean; // firestore profile resolving
  /** Firestore প্রোফাইলের role — admin অথবা partner */
  effectiveRole: UserRole;
  signIn: (emailOrPhone: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}
