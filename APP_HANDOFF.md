# 📱 RHB / CODEMYST — Mobile App Handoff Document

> **কীভাবে ব্যবহার করবেন:** এই ফাইলটা (পুরোটা) যেকোনো AI বা ডেভেলপারকে দিন এবং বলুন —
> "এই স্পেক অনুযায়ী আমার মোবাইল অ্যাপ বানাও"। এখানে অ্যাপ বানানোর জন্য দরকারি সব কিছু আছে:
> দুইটা Firebase প্রজেক্টের কনফিগ, পুরো ডেটাবেস স্কিমা, ফিচার তালিকা, ডিজাইন টোকেন ও নিয়ম।

---

## ১. প্রজেক্ট ওভারভিউ

Rakibul Haque Bhuiyan (Web Developer, CEO of **CODEMYST**) এর জন্য একটি **Partner Portal + Business Admin** সিস্টেম ওয়েবে চলছে (Next.js 14, Vercel-এ ডিপ্লয়ড)। এবার এর **মোবাইল অ্যাপ** (Android প্রথমে, পরে iOS) বানাতে হবে — push notification সহ, যাতে ব্যবসা মোবাইল থেকেই চালানো যায়।

**দুই ধরনের ব্যবহারকারী:**

| Role | কাজ |
|---|---|
| **Admin** (Rakib নিজে) | অর্ডার কন্ট্রোল, পার্টনার approve/reject, উইথড্র অ্যাপ্রুভ, প্রাইসিং এডিট, নতুন অর্ডার/মেসেজে push নোটিফিকেশন |
| **Partner** (অ্যাফিলিয়েট) | নিজের ব্যালান্স/আয় দেখা, নিজের ক্লায়েন্ট ট্র্যাক, উইথড্র রিকোয়েস্ট, রেফারেল লিংক শেয়ার, অ্যাপ্রুভাল নোটিফিকেশন |

---

## ২. সাজেস্টেড স্ট্যাক

- **Expo (React Native)** — রেকমেন্ডেড: Firebase JS SDK সরাসরি কাজ করে, OTA update, দ্রুত বিল্ড
- Push: **Firebase Cloud Messaging (FCM)** + `expo-notifications` (Android), iOS-এ APNs key লাগবে
- State: React Query + Firestore `onSnapshot` (রিয়েল-টাইম)
- Language: TypeScript (ওয়েবের মতোই)

---

## ৩. Firebase প্রজেক্ট (২টা)

### A) বিজনেস/পার্টনার ডেটা — project `partner-affiliation`

```js
const firebaseConfig = {
  apiKey: "AIzaSyCaZNvEPSmwK_ZOe0P84KgEoq_nECXz25o",
  authDomain: "partner-affiliation.firebaseapp.com",
  projectId: "partner-affiliation",
  storageBucket: "partner-affiliation.firebasestorage.app",
  messagingSenderId: "107743227959",
  appId: "1:107743227959:web:b2c2671cafe3353e454fb2",
  measurementId: "G-C2TNJB6Z8D",
};
```
Sign-in providers চালু: Email/Password, Google।
Auth নিয়ম: পার্টনার ফোন দিয়ে লগইন করলে সিনথেটিক ইমেইল হয় `{phone}@rhb.partners`।

### B) সাইট কনটেন্ট/মেসেজ — project `rakibul-haque`

```js
const siteConfig = {
  apiKey: "AIzaSyD9X34h9OLAxsCVaH0j4HnXbCcj5q-zMKc",
  authDomain: "rakibul-haque.firebaseapp.com",
  projectId: "rakibul-haque",
  storageBucket: "rakibul-haque.firebasestorage.app",
  messagingSenderId: "342766423420",
  appId: "1:342766423420:web:541e9fe3d8572f013628f9",
  measurementId: "G-F4VWL5PN91",
};
```
Sign-in providers চালু: Email/Password, Phone, Google, Apple।
অ্যাপে মূলত project A দরকার; B শুধু নতুন মেসেজ নোটিফিকেশনের জন্য।

---

## ৪. Firestore স্কিমা (project A: partner-affiliation)

### `users/{uid}`
| ফিল্ড | টাইপ | নোট |
|---|---|---|
| name, phone, email | string | |
| role | `"admin" \| "partner"` | |
| partnerId | string | `"CM-005"` — অ্যাডমিনেরটা `"ADMIN"` |
| commissionRate | number | ১৫ / ২০ (Gold = ৩+ পেইড অর্ডার) |
| status | `"active" \| "pending" \| "banned"` | pending = dashboard ব্লক |
| balance, totalEarnings | number | কমিশন (৳) |
| paymentMethod | `"bKash" \| "Nagad" \| ""` | |
| paymentNumber | string | |

### `clients/{id}`
| ফিল্ড | টাইপ | নোট |
|---|---|---|
| name, phone | string | |
| package | string | প্যাকেজের নাম |
| amount | number | ৳; ০ = ফ্রি/কোটেশন লিড |
| referredBy | string | `"CM-005"` বা `"DIRECT"` (ডিরেক্ট = কমিশন নেই) |
| status | `"pending" \| "working" \| "paid"` | paid হলে কমিশন ক্রেডিট |
| source | `"pricing" \| "admin"` | pricing = ওয়েবসাইট অর্ডার |
| isFree | boolean | ফ্রি লিড |
| followUps[] | `{at:number, note:string}` | লিড ফলো-আপ টাইমলাইন |
| commissionRate | number\|null | null = পার্টনারের রেট (রিপিট ক্লায়েন্টে ১০ সেট করা হয়) |
| note | string | |
| createdAt | Timestamp | |

**কমিশন লজিক (অ্যাপে দেখানোর সময়):** paid হলে partner-এর `balance` ও `totalEarnings` += `amount × (client.commissionRate ?? partner.commissionRate) / 100`। DIRECT বা amount=০ হলে কমিশন নেই।

### `withdrawals/{id}`
partnerId, amount, method (`"bKash"|"Nagad"`), accountNumber, status (`"pending"|"approved"|"rejected"`), createdAt।
Approved হলে admin panel transaction-এ partner-এর balance কেটে দেয়।

### `packages/{id}` (public read)
category, categoryName, name, price (null = quote), priceType (`"fixed"|"from"|"quote"|"monthly"`), originalPrice?, features[], delivery?, note?, popular?, active, sortOrder।

### `settings/{doc}`
- `global`: defaultCommissionRate, premiumCommissionRate, minWithdrawAmount, referralBaseUrl
- `public`: whatsappNumber, supportEmail, announcementText, announcementEnabled, pricingRules[]
- `categories`: list[] of `{key, label, sortOrder}` — pricing ট্যাব

### `content/resources`
পার্টনার গাইডলাইন: sections[] `{key: "scripts"|"objections"|"rules", label, items[{title, lines[]}]}`

### `settings` নয় — project B-তে (rakibul-haque)
- `site/content`: পোর্টফোলিও কনটেন্ট (hero, about, services, contact — সব টেক্সট `{en, bn}`)
- `blog/{id}`: slug, title{en,bn}, excerpt{en,bn}, content{en,bn}, cover?, tags[], published, createdAt
- `messages/{id}`: name, email, visitorUid?, thread[{from:"visitor"|"admin", text, at}], status("new"|"read"|"replied")
- `recommendations/{id}`: name, role, text, rating(1-5), status("pending"|"approved")

---

## ৫. সিকিউরিটি রুলস

সম্পূর্ণ রুলস রিপোতে আছে: `firestore.rules` (project A) ও `firestore.site.rules` (project B)। মূল সারাংশ:
- users: নিজের ডক পড়া যায়; pending পার্টনার শুধু নিজের payment ফিল্ড লিখতে পারে; money ফিল্ড শুধু admin
- clients: admin সব; partner শুধু `referredBy == নিজের partnerId` পড়ে; public শুধু validated pricing-order create করতে পারে
- withdrawals: partner নিজেরটা পড়ে + pending create; approve/reject শুধু admin
- messages (site): guest create; ভিজিটর নিজের থ্রেড পড়ে; admin সব + reply

---

## ৬. অ্যাপ ফিচার স্পেক

### Partner App (Bottom tabs: Home, Clients, Withdraw, More)
1. **লগইন** — email/phone + password (Firebase Auth)
2. **Home:** Available Balance, Total Earnings, Active Clients কার্ড; রেফারেল লিংক + share button (`https://<domain>/pricing?ref=CM-XXX`); announcement banner (settings/public)
3. **Clients:** নিজের ক্লায়েন্ট লিস্ট (onSnapshot), status badge, ফোন মাস্কড (`017***678`), প্রতি ক্লায়েন্টে expected commission
4. **Withdraw:** ব্যালান্স + রিকোয়েস্ট ফর্ম (amount ≥ settings.global.minWithdrawAmount, method, accountNumber) + হিস্টোরি
5. **Notifications (FCM):** ক্লায়েন্ট paid → "কমিশন ক্রেডিট হয়েছে"; withdrawal approved/rejected; অ্যাকাউন্ট approved

### Admin App (Bottom tabs: Dashboard, Orders, Withdrawals, More)
1. **লগইন** — শুধু `role == "admin"` ইউজার ঢুকতে পারবে (না হলে ব্লক স্ক্রিন)
2. **Dashboard:** Total Partners, Active Clients, Total Revenue, Pending Withdrawals + recent activity
3. **Orders/Clients:** ট্যাব (সব / ওয়েবসাইট অর্ডার / ফ্রি লিডস); status বদলানো (paid হলে কমিশন transaction); WhatsApp কল বাটন; follow-up নোট
4. **Withdrawals:** Approve (transaction: status + balance deduct) / Reject — push ট্যাপ করে সরাসরি এখানে
5. **Partners:** pending approve/reject (payment number দেখা), রেট/স্ট্যাটাস এডিট
6. **Notifications (FCM):** নতুন pricing order, নতুন কনটাক্ট মেসেজ (site project-ও লিসেন করতে হবে), নতুন উইথড্র রিকোয়েস্ট

### Push বাস্তবায়ন নোট
- ওয়েব অ্যাপে FCM এখনো নেই — অ্যাপ সাইড থেকেই শুরু করা সহজ: Expo-তে `expo-notifications` + FCM v1 credentials
- Trigger দরকার হলে **Firebase Cloud Functions** (`onCreate` on clients/withdrawals/messages) → FCM send। Functions এখনো নেই — নতুন করে যোগ করতে হবে (project A-তে)
- Topic সাজেশন: `admin-alerts` (admin ডিভাইস), `partner-{partnerId}` (প্রতি পার্টনার)

---

## ৭. ডিজাইন টোকেন (ওয়েবের সাথে ম্যাচ করতে)

- **Theme:** dark only; background `#0a0a0f`; card `#0d0d13` @ 90% + backdrop-blur (glass); border `rgba(255,255,255,0.1)`
- **Primary:** violet `#8b5cf6` (হালকা: `#a78bfa`); accent fuchsia `#e879f9`; success `#10b981`; warning `#f59e0b`; danger `#ef4444`
- **Radius:** 16px cards, 12px inputs; **Font:** Geist Sans (fallback: Inter)
- **Money format:** `৳1,500` (en-IN locale); ফোন মাস্ক: `017***678`
- ব্যবহারকারীর ভাষা: বাংলা (প্রাইমারি) + English

---

## ৮. গুরুত্বপূর্ণ বিজনেস নিয়ম (অ্যাপেও একই)

1. নতুন পার্টনার (Google sign-up) `pending` — admin approve না করা পর্যন্ত dashboard ব্লক; bKash/Nagad নম্বর জমা বাধ্যতামূলক
2. Gold Partner = ৩+ পেইড অর্ডার → ২০% রেট (admin ম্যানুয়ালি সেট করে)
3. ফ্রি অর্ডারে কমিশন নেই; ৩০ দিনে paid-এ গেলে কমিশন
4. ৬ মাসের মধ্যে রিপিট ক্লায়েন্ট → client doc-এ `commissionRate: 10` override
5. `referredBy: "DIRECT"` = admin-এর নিজের অর্ডার, কমিশন নেই
6. ন্যূনতম উইথড্র ও রেট `settings/global` থেকে পড়তে হবে (hardcode নয়)

---

## ৯. ওয়েব রেফারেন্স কোড

পুরো রেপো: `github.com/code-myst/rakibulhaque` — টাইপ ও লজিক কপি করার জন্য:
- `src/lib/types.ts` — সব TypeScript ইন্টারফেস (একদম একই শেপ)
- `src/hooks/use-firestore-data.ts` — mapper ফাংশন (doc → model)
- `src/app/admin/clients/page.tsx` — কমিশন transaction লজিক
- `firestore.rules` / `firestore.site.rules` — সিকিউরিটি

**⚠️ শেষ কথা:** অ্যাপে কোনো ডেটা লোকালি সেভ করে auth bypass করার চেষ্টা করবে না — সব পড়া/লেখা Firestore rules দিয়ে গার্ডেড। নতুন ফিচার যোগ করলে আগে rules আপডেট, পরে UI।
