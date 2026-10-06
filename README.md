# RHB / CODEMYST Partner Portal

Dark-mode SaaS-style **Partner Portal + Admin Dashboard** for **Rakibul Haque Bhuiyan** (Web Developer, CEO of CODEMYST) — referrals, dynamic pricing, orders, commissions & withdrawals.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Shadcn-style UI · Firebase (Auth + Firestore) · Framer Motion · React Hook Form + Zod**.

## ✨ Features

### Public
- **`/pricing`** — dynamic pricing page driven by the Firestore `packages` collection (categories, features, popular badges, quote/monthly/from pricing). Order form writes straight to Firestore. Referral links (`/pricing?ref=CM-003`) are tracked automatically. WhatsApp CTA after ordering.

### Admin (`/admin`)
- **Dashboard** — live stats (partners, clients, revenue, pending withdrawals) + activity feed
- **Pricing** — full CRUD for packages + one-click "load default pricing"
- **Partners** — add (creates Firebase Auth account on a secondary app), edit everything incl. **Partner ID** (with reference migration), Gold Partner hints (3+ paid orders → 20%)
- **Clients & Orders** — tabs for all clients / website orders / free & quote leads; follow-up note timelines; convert leads to paid; per-client commission override (e.g. 10% repeat rule); **DIRECT** orders (no commission — admin keeps 100%); WhatsApp contact buttons
- **Withdrawals** — approve (transactionally deducts balance) / reject
- **Resources** — fully editable sales guidelines, objection handling & commission rules (seeded from the partner card document)
- **Settings** — commission rates, min withdraw, referral base URL, WhatsApp number, support email, announcement banner, pricing-page rules

### Partner (`/partner`)
- Dashboard with **referral link** (`{base}/pricing?ref=ID`), balance & earnings stats
- **My Clients** (masked phone numbers), Withdraw (bKash/Nagad), editable **Partner Card** (copy/share ready pitch), Resources, Profile

## 🚀 Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. [Vercel](https://vercel.com) → **Add New Project** → import `code-myst/rakibulhaque`.
3. Framework preset: **Next.js** (auto-detected). No build overrides needed.
4. Environment variables (all optional — the app has safe fallbacks):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_REFERRAL_BASE_URL`
5. Deploy. Set **রেফারেল বেজ URL** in the admin settings to your Vercel domain (or leave empty — the app uses its own origin).

## 🔐 Firebase Console Setup (one-time, required)

1. **Authentication** → enable **Email/Password** and **Google** providers. Add your Vercel domain under *Authorized domains*.
2. **Firestore** → create database, then paste [`firestore.rules`](./firestore.rules) into *Rules* and publish (or `firebase deploy --only firestore:rules`).
3. **First admin**: log in once, then in Firestore edit `users/{your-uid}`: set `role: "admin"`, `partnerId: "ADMIN"`.
4. In the admin panel: **প্রাইসিং → ডকের ডিফল্ট প্রাইসিং লোড করুন** to seed all packages.

## 🗂 Firestore Schema

| Collection | Key fields |
|---|---|
| `users` | uid, name, phone, role (`admin`/`partner`), partnerId (CM-00X), commissionRate, status, balance, totalEarnings |
| `clients` | name, phone, package, amount, referredBy (`CM-00X`/`DIRECT`), status, source (`pricing`/`admin`), isFree, followUps[], commissionRate?, note |
| `withdrawals` | partnerId, amount, method (bKash/Nagad), accountNumber, status, createdAt |
| `packages` | category, name, price, priceType (fixed/from/quote/monthly), features[], delivery, note, popular, active, sortOrder |
| `content/resources` | editable sections (scripts / objections / rules) |
| `settings/global`, `settings/public` | commission rates, min withdraw, referral base / whatsapp, announcement, pricing rules |

## 💻 Local Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

---

© Rakibul Haque Bhuiyan · Web Developer · CODEMYST
