import type { SiteContent } from "@/lib/types";

/**
 * পোর্টফোলিওর ডিফল্ট কনটেন্ট (EN + বাংলা)।
 * rakibul-haque প্রজেক্টের `site/content` ডক খালি হলে fallback;
 * /admin → জেনারেল → সাইট কনটেন্ট থেকে যেকোনো সময় এডিট করা যায়।
 */
export const DEFAULT_SITE_CONTENT: SiteContent = {
  profile: {
    name: "Rakibul Haque Bhuiyan",
    photoUrl: "",
    badge: { en: "Available for new projects", bn: "নতুন প্রজেক্টের জন্য উন্মুক্ত" },
    roles: [
      { en: "Web Developer", bn: "ওয়েব ডেভেলপার" },
      { en: "Mobile & Desktop Apps", bn: "মোবাইল ও ডেস্কটপ অ্যাপ" },
      { en: "AI Automation Expert", bn: "AI অটোমেশন এক্সপার্ট" },
      { en: "AI Agent Builder", bn: "AI এজেন্ট বিল্ডার" },
    ],
    tagline: {
      en: "I build websites, apps and AI systems that grow your business — fast, affordable and reliable. Start free, scale when you're ready.",
      bn: "আমি বানাই ওয়েবসাইট, অ্যাপ আর AI সিস্টেম — যেগুলো আপনার ব্যবসাকে বাড়ায়। দ্রুত, সাধ্যের মধ্যে, নির্ভরযোগ্য। ফ্রি শুরু করুন, প্রয়োজনে বাড়ান।",
    },
  },
  cta: {
    primaryLabel: { en: "View Pricing & Order", bn: "প্রাইসিং দেখুন ও অর্ডার করুন" },
    primaryHref: "/pricing",
    secondaryLabel: { en: "Free Starter Site", bn: "ফ্রি স্টার্টার সাইট" },
    secondaryHref: "/pricing?category=free",
  },
  about: {
    title: { en: "About Me", bn: "আমার সম্পর্কে" },
    paragraphs: [
      {
        en: "I'm Rakibul Haque Bhuiyan — web developer and founder of CODEMYST. I help small businesses, shops, coaches, schools and creators get online with fast, professional websites.",
        bn: "আমি রাকিবুল হক ভূঁইয়া — ওয়েব ডেভেলপার এবং CODEMYST-এর প্রতিষ্ঠাতা। ছোট ব্যবসা, দোকান, কোচিং, স্কুল আর ক্রিয়েটরদের অনলাইনে আনতে সাহায্য করি দ্রুতগতির, প্রফেশনাল ওয়েবসাইট দিয়ে।",
      },
      {
        en: "Beyond websites, I build Android/iOS/desktop apps and AI automations & agents that save hours of manual work — WhatsApp sales bots, workflow automation, knowledge assistants.",
        bn: "ওয়েবসাইটের পাশাপাশি বানাই Android/iOS/ডেস্কটপ অ্যাপ আর AI অটোমেশন ও এজেন্ট — যা ঘণ্টার কাজ মিনিটে নামায়: WhatsApp সেলস বট, ওয়ার্কফ্লো অটোমেশন, নলেজ অ্যাসিস্ট্যান্ট।",
      },
      {
        en: "My promise: honest pricing, fast delivery, and support that actually answers. Every project starts with a free 1-page site if you want to test the waters.",
        bn: "আমার প্রতিশ্রুতি: সৎ দাম, দ্রুত ডেলিভারি, আর এমন সাপোর্ট যেটা সত্যিই উত্তর দেয়। চাইলে প্রতিটা প্রজেক্ট শুরু হয় একদম ফ্রি ১ পেজের সাইট দিয়ে।",
      },
    ],
    skills: [
      { name: "Next.js / React", level: 95, group: "Web" },
      { name: "TypeScript", level: 90, group: "Web" },
      { name: "Firebase / Firestore", level: 92, group: "Web" },
      { name: "Tailwind CSS", level: 95, group: "Web" },
      { name: "Flutter (Android/iOS)", level: 85, group: "Apps" },
      { name: "Electron / Desktop", level: 80, group: "Apps" },
      { name: "AI Automation (n8n/Make)", level: 88, group: "AI" },
      { name: "AI Agents & RAG", level: 85, group: "AI" },
      { name: "Prompt Engineering", level: 90, group: "AI" },
      { name: "SEO & Performance", level: 85, group: "Web" },
    ],
    languages: ["বাংলা (Native)", "English (Fluent)", "হিন্দি (Conversational)"],
    stats: [
      { value: "50+", label: { en: "Projects Delivered", bn: "প্রজেক্ট ডেলিভারি" } },
      { value: "40+", label: { en: "Happy Clients", bn: "সন্তুষ্ট ক্লায়েন্ট" } },
      { value: "24h", label: { en: "Avg. Response", bn: "গড় রেসপন্স টাইম" } },
      { value: "7d", label: { en: "Free Bug Fix", bn: "ফ্রি বাগ ফিক্স" } },
    ],
  },
  services: [
    {
      id: "svc-web",
      icon: "globe",
      title: { en: "Web Development", bn: "ওয়েব ডেভেলপমেন্ট" },
      description: {
        en: "Business sites, portfolios, LMS, news portals & e-commerce — fast, SEO-ready and mobile-first.",
        bn: "বিজনেস সাইট, পোর্টফোলিও, LMS, নিউজ পোর্টাল ও ই-কমার্স — দ্রুতগতির, SEO-রেডি, মোবাইল-ফার্স্ট।",
      },
      features: [
        { en: "7-day delivery on most plans", bn: "বেশিরভাগ প্ল্যানে ৭ দিনে ডেলিভারি" },
        { en: "Admin panel to edit content", bn: "নিজের content বদলানোর admin panel" },
        { en: "Payment gateway (bKash/SSLCommerz)", bn: "পেমেন্ট গেটওয়ে (bKash/SSLCommerz)" },
      ],
      pricingCategory: "web",
    },
    {
      id: "svc-apps",
      icon: "smartphone",
      title: { en: "Mobile & Desktop Apps", bn: "মোবাইল ও ডেস্কটপ অ্যাপ" },
      description: {
        en: "Android, iOS (Apple) and Windows/macOS apps — from idea to Play Store & App Store.",
        bn: "Android, iOS (Apple) আর Windows/macOS অ্যাপ — আইডিয়া থেকে Play Store ও App Store পর্যন্ত।",
      },
      features: [
        { en: "One codebase, both platforms", bn: "এক কোডবেসে দুই প্ল্যাটফর্ম" },
        { en: "Push notifications ready", bn: "Push notification রেডি" },
        { en: "Store publishing included", bn: "Store publish করাও হয়ে যায়" },
      ],
      pricingCategory: "apps",
    },
    {
      id: "svc-automation",
      icon: "workflow",
      title: { en: "AI Automation", bn: "AI অটোমেশন" },
      description: {
        en: "Automate repetitive work — data entry, reports, auto-replies, CRM sync — with AI-powered workflows.",
        bn: "একঘেয়ে কাজ অটোমেট করুন — ডেটা এন্ট্রি, রিপোর্ট, অটো-রিপ্লাই, CRM সিঙ্ক — AI-চালিত ওয়ার্কফ্লো দিয়ে।",
      },
      features: [
        { en: "n8n / Make workflows", bn: "n8n / Make ওয়ার্কফ্লো" },
        { en: "AI document parsing", bn: "AI ডকুমেন্ট পার্সিং" },
        { en: "Saves hours every week", bn: "প্রতি সপ্তাহে ঘণ্টার কাজ বাঁচে" },
      ],
      pricingCategory: "ai-automation",
    },
    {
      id: "svc-agents",
      icon: "bot",
      title: { en: "AI Agents", bn: "AI এজেন্ট" },
      description: {
        en: "Custom AI agents that sell and support 24/7 — WhatsApp sales agent, knowledge assistant (RAG), custom task agents.",
        bn: "কাস্টম AI এজেন্ট যা ২৪/৭ সেল ও সাপোর্ট করে — WhatsApp সেলস এজেন্ট, নলেজ অ্যাসিস্ট্যান্ট (RAG), কাস্টম টাস্ক এজেন্ট।",
      },
      features: [
        { en: "Trained on your business data", bn: "আপনার বিজনেস ডেটায় ট্রেইনড" },
        { en: "Bangla + English", bn: "বাংলা + English" },
        { en: "Works 24/7 without salary", bn: "বেতন ছাড়াই ২৪/৭ কাজ করে" },
      ],
      pricingCategory: "ai-agents",
    },
    {
      id: "svc-support",
      icon: "wrench",
      title: { en: "Updates & Maintenance", bn: "আপডেট ও মেইনটেন্যান্স" },
      description: {
        en: "Content updates, new pages, bug fixes, speed optimization and monthly care plans.",
        bn: "কনটেন্ট আপডেট, নতুন পেজ, বাগ ফিক্স, স্পিড অপটিমাইজেশন আর মাসিক কেয়ার প্ল্যান।",
      },
      features: [
        { en: "From ৳300 per update", bn: "প্রতি আপডেট ৳৩০০ থেকে" },
        { en: "Monthly care from ৳200", bn: "মাসিক কেয়ার ৳২০০ থেকে" },
        { en: "7-day free bug fix", bn: "৭ দিন ফ্রি বাগ ফিক্স" },
      ],
      pricingCategory: "update",
    },
  ],
  projects: [
    {
      id: "prj-sample-1",
      title: { en: "Furniture Business Website", bn: "ফার্নিচার ব্যবসার ওয়েবসাইট" },
      description: {
        en: "Product catalog with WhatsApp ordering, admin panel and Google SEO — delivered in 7 days.",
        bn: "প্রোডাক্ট ক্যাটালগ, WhatsApp অর্ডার, admin panel ও Google SEO — ৭ দিনে ডেলিভারি।",
      },
      tags: ["Next.js", "Firebase", "E-commerce"],
      featured: true,
    },
    {
      id: "prj-sample-2",
      title: { en: "Coaching Center LMS", bn: "কোচিং সেন্টার LMS" },
      description: {
        en: "Online course platform with student login, video lessons, quizzes and certificates.",
        bn: "স্টুডেন্ট লগইন, ভিডিও লেসন, কুইজ ও সার্টিফিকেটসহ অনলাইন কোর্স প্ল্যাটফর্ম।",
      },
      tags: ["LMS", "Payments", "Dashboard"],
      featured: true,
    },
    {
      id: "prj-sample-3",
      title: { en: "WhatsApp AI Sales Agent", bn: "WhatsApp AI সেলস এজেন্ট" },
      description: {
        en: "24/7 AI agent that answers customers, shows catalog and qualifies leads automatically.",
        bn: "২৪/৭ AI এজেন্ট — কাস্টমারের উত্তর দেয়, ক্যাটালগ দেখায়, লিড কোয়ালিফাই করে।",
      },
      tags: ["AI Agent", "WhatsApp", "Automation"],
      featured: true,
    },
  ],
  contact: {
    email: "hello@rakibulhaque.com",
    phone: "01752845182",
    whatsapp: "8801752845182",
    location: { en: "Dhaka, Bangladesh (Remote worldwide)", bn: "ঢাকা, বাংলাদেশ (রিমোট — সারাবিশ্বে)" },
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/rakibul-haque-bhuiyan" },
      { label: "GitHub", url: "https://github.com/code-myst" },
      { label: "Facebook", url: "https://facebook.com/rakibulhaquebd" },
    ],
  },
  seo: {
    title: { en: "Rakibul Haque — Web, Apps & AI Solutions", bn: "রাকিবুল হক — ওয়েব, অ্যাপ ও AI সলিউশন" },
    description: {
      en: "Websites, mobile/desktop apps, AI automation and AI agents for growing businesses. Start free with a 1-page site.",
      bn: "ব্যবসার বৃদ্ধির জন্য ওয়েবসাইট, মোবাইল/ডেস্কটপ অ্যাপ, AI অটোমেশন ও AI এজেন্ট। ১ পেজের সাইট দিয়ে ফ্রি শুরু।",
    },
  },
};
