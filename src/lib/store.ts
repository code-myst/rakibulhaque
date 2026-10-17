export type Lang = "bn" | "en";
export type Bi = { bn: string; en: string };

export type StoreCategory = "app" | "pwa" | "extension" | "word" | "excel" | "other";

export interface StoreItem {
  id: string;
  name: Bi;
  description: Bi;
  category: StoreCategory;
  version: string;
  size: string;
  icon: string; // ইমেজ URL (ফাঁকা হলে ইমোজি দেখাবে)
  screenshots: string[];
  url: string; // ডাউনলোড বা ওপেন লিংক
  featured: boolean;
  published: boolean;
  downloads: number;
}

export const CATEGORIES: { id: StoreCategory; emoji: string; label: Bi }[] = [
  { id: "app", emoji: "📱", label: { bn: "অ্যাপ", en: "Apps" } },
  { id: "pwa", emoji: "🌐", label: { bn: "PWA", en: "PWA" } },
  { id: "extension", emoji: "🧩", label: { bn: "এক্সটেনশন", en: "Extensions" } },
  { id: "word", emoji: "📄", label: { bn: "Word ফাইল", en: "Word files" } },
  { id: "excel", emoji: "📊", label: { bn: "Excel ফাইল", en: "Excel files" } },
  { id: "other", emoji: "📦", label: { bn: "অন্যান্য", en: "Others" } },
];

export const catOf = (id: StoreCategory) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[5];
export const tr = (b: Bi | undefined, lang: Lang) => (b ? b[lang] || b.en || b.bn : "");

export const DEMO_ITEMS: StoreItem[] = [
  {
    id: "demo-1",
    name: { bn: "ডেমো PWA অ্যাপ", en: "Demo PWA App" },
    description: { bn: "এটা একটা ডেমো আইটেম। অ্যাডমিন প্যানেল থেকে আসল আইটেম যোগ করলে এটা আর দেখাবে না।", en: "This is a demo item. It disappears once you add real items from the admin panel." },
    category: "pwa", version: "1.0.0", size: "—", icon: "", screenshots: [], url: "https://example.com", featured: true, published: true, downloads: 0,
  },
  {
    id: "demo-2",
    name: { bn: "ডেমো Excel টেমপ্লেট", en: "Demo Excel Template" },
    description: { bn: "হিসাব রাখার একটা নমুনা টেমপ্লেট।", en: "A sample bookkeeping template." },
    category: "excel", version: "1.2", size: "45 KB", icon: "", screenshots: [], url: "https://example.com/file.xlsx", featured: false, published: true, downloads: 0,
  },
  {
    id: "demo-3",
    name: { bn: "ডেমো ক্রোম এক্সটেনশন", en: "Demo Chrome Extension" },
    description: { bn: "ব্রাউজারের জন্য ছোট একটা টুল।", en: "A small tool for your browser." },
    category: "extension", version: "0.3.1", size: "120 KB", icon: "", screenshots: [], url: "https://example.com/ext.zip", featured: false, published: true, downloads: 0,
  },
];
