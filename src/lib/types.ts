import type {
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";

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
  | "personal"
  | "business"
  | "lms"
  | "news"
  | "update"
  | "maintenance"
  | "custom";

export type PriceType = "fixed" | "from" | "quote" | "monthly";

export interface PricingPackage {
  id: string;
  category: PackageCategory;
  categoryName: string;
  name: string;
  /** null = quote-based */
  price: number | null;
  priceType: PriceType;
  features: string[];
  delivery?: string;
  note?: string;
  popular?: boolean;
  active: boolean;
  sortOrder: number;
}

export const PACKAGE_CATEGORIES: { key: PackageCategory; label: string }[] = [
  { key: "free", label: "ফ্রি সার্ভিস" },
  { key: "personal", label: "Personal (Portfolio)" },
  { key: "business", label: "Business Website" },
  { key: "lms", label: "LMS (Course Platform)" },
  { key: "news", label: "Newspaper / Blog" },
  { key: "update", label: "Update Service" },
  { key: "maintenance", label: "Maintenance & Support" },
  { key: "custom", label: "কাস্টম প্রজেক্ট" },
];

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
