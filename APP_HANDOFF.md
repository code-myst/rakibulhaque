# 📱 RHB / CODEMYST — Mobile App Handoff Document (v2)

> **কীভাবে ব্যবহার করবেন:** এই ফাইলটা (পুরোটা) যেকোনো AI বা ডেভেলপারকে দিন এবং বলুন —
> "এই স্পেক অনুযায়ী আমার মোবাইল অ্যাপ বানাও"। এখানে দরকারি সব কিছু আছে: দুইটা Firebase
> প্রজেক্টের কনফিগ, সম্পূর্ণ ডেটাবেস স্কিমা, ফিচার স্পেক, বিজনেস লজিক, ডিজাইন টোকেন ও নিয়ম।
>
> **লক্ষ্য:** এমন অ্যাপ যেটা দিয়ে (১) Rakib (Admin) নিজের পুরো ব্যবসা চালাতে পারবে এবং
> (২) তার Partner-রা নিজেদের প্যানেল মোবাইল থেকেই চালাতে পারবে — push notification সহ।

---

## ১. ব্যবহারকারী ও অ্যাপের ধরন

| Role | কোথায় লগইন | অ্যাপে যা করবে |
|---|---|---|
| **Admin** (Rakib) | partner-affiliation project (Email/Password) | অর্ডার কন্ট্রোল (status: pending→working→paid = কমিশন ক্রেডিট), পার্টনার approve/reject, উইথড্র approve/reject, প্রাইসিং/সার্ভিস এডিট, নতুন অর্ডার/মেসেজ/উইথড্রে push |
| **Partner** (অ্যাফিলিয়েট) | একই project (Email/Password বা ফোন → synthetic email) | ব্যালান্স/আয়, নিজের ক্লায়েন্ট, উইথড্র রিকোয়েস্ট, রেফারেল লিংক শেয়ার, অ্যাপ্রুভাল নোটিফিকেশন |

⚠️ **পেন্ডিং পার্টনার:** নতুন রেজিস্ট্রেশনে `status: "pending"` — admin approve না করা পর্যন্ত
dashboard ব্লক থাকবে (অ্যাপে "অপেক্ষা করুন" স্ক্রিন দেখাবে)। `partnerId` খালি থাকলে
approve-এর সময় admin বরাদ্দ করে (`CM-XXX`)।

⚠️ **সাইটের ভিজিটর/ক্লায়েন্ট অ্যাকাউন্ট** (project B) অ্যাপের এই স্পেকে শুধু রেফারেন্স —
অ্যাপে দরকার হলে নতুন অর্ডারের পুশ-ট্রিগারে ব্যবহার হবে।

---

## ২. সাজেস্টেড স্ট্যাক

- **Expo (React Native) + TypeScript** — Firebase JS SDK সরাসরি চলে, OTA update, দ্রুত বিল্ড
- **Push:** `expo-notifications` + **Firebase Cloud Messaging (FCM v1)** (Android আগে; iOS-এ APNs key)
- **Data:** Firestore `onSnapshot` (রিয়েল-টাইম) — ওয়েবের মতোই
- **Status sync trigger:** Firebase Cloud Functions (project A) — নিচে §৮

---

## ৩. Firebase প্রজেক্ট (২টা)

### A) বিজনেস/পার্টনার — project `partner-affiliation` (অ্যাপের মূল)

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
Providers চালু: Email/Password, Google।
**লগইন কনভেনশন:** পার্টনার ফোন দিয়ে লগইন করলে synthetic email `{phone}@rhb.partners` হয়।

### B) সাইট/ক্লায়েন্ট — project `rakibul-haque` (শুধু রেফারেন্স)

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

---

## ৪. Firestore স্কিমা — project A (`partner-affiliation`)

### `users/{uid}`
| ফিল্ড | টাইপ | নোট |
|---|---|---|
| name, phone, email | string | |
| role | `"admin" \| "partner"` | |
| partnerId | string | `"CM-005"`; admin = `"ADMIN"`; **রেজিস্ট্রেশনে খালি `""`** (approve-এ বরাদ্দ) |
| commissionRate | number | ১৫ (স্ট্যান্ডার্ড) / ২০ (Gold = ৩+ পেইড অর্ডার) / ১০ (রিপিট ক্লায়েন্ট কেস) |
| status | `"active" \| "pending" \| "banned"` | pending = প্যানেল ব্লক |
| balance, totalEarnings | number | কমিশন (৳) |
| paymentMethod | `"bKash" \| "Nagad" \| ""` | |
| paymentNumber | string | |
| createdAt | Timestamp | |

### `clients/{id}` — অর্ডার/ক্লায়েন্ট
| ফিল্ড | টাইপ | নোট |
|---|---|---|
| name, phone | string | |
| package | string | প্যাকেজের নাম |
| amount | number | ৳; ০ = ফ্রি/কোটেশন লিড |
| referredBy | string | `"CM-005"` বা `"DIRECT"` (DIRECT = কমিশন নেই, ১০০% admin) |
| status | `"pending" \| "working" \| "paid"` | paid = কমিশন ক্রেডিট |
| source | `"pricing" \| "admin"` | pricing = ওয়েবসাইট অর্ডার |
| isFree | boolean | |
| followUps[] | `{at, note}` | লিড ফলো-আপ |
| commissionRate | number\|null | null = পার্টনারের রেট; রিপিট ক্লায়েন্টে ১০ |
| siteUserId, siteEmail | string | সাইট অ্যাকাউন্ট লিংক (project B uid) |
| note | string | |
| createdAt | Timestamp | |

**কমিশন লজিক (paid করার সময় transaction):**
`earned = round(amount × (client.commissionRate ?? partner.commissionRate) / 100)`
→ partner `balance` ও `totalEarnings` += earned। DIRECT বা amount=০ হলে কমিশন নেই।

### `withdrawals/{id}`
partnerId, amount, method (`"bKash"|"Nagad"`), accountNumber, status (`"pending"|"approved"|"rejected"`), createdAt।
**Approve = transaction:** status → approved এবং partner-এর `balance -= amount`।

### `packages/{id}` — প্রাইসিং (public read)
| ফিল্ড | নোট |
|---|---|
| category | **ক্যাটাগরির key — ক্যাটাগরি এখন সার্ভিসের অধীনে** (project B-র `site/content.services[].categories`) |
| categoryName | ডিনরমালাইজড লেবেল |
| name, price (null = quote), priceType (`"fixed"|"from"|"quote"|"monthly"`), originalPrice? | দাম; originalPrice থাকলে স্ট্রাইকথ্রু + "Save ৳X" |
| features[] | বুলেট লিস্ট |
| delivery?, note?, popular?, active, sortOrder | |

### `settings/…`
- `global`: defaultCommissionRate (15), premiumCommissionRate (20), minWithdrawAmount (500), referralBaseUrl
- `public`: whatsappNumber ("8801752845182"), supportEmail, announcementText, announcementEnabled, pricingRules[]

⚠️ ক্যাটাগরি লিস্ট আর সার্ভিস এখন **project B-র `site/content`-এ** — অ্যাপে প্রাইসিং গ্রুপ করতে হলে ওখান থেকে পড়তে হবে (§৫)।

---

## ৫. Firestore স্কিমা — project B (`rakibul-haque`)

### `site/content` (public read)
```
profile:  { name, photoUrl, badge{en,bn}, roles[{en,bn}], tagline{en,bn} }
cta:      { primaryLabel{en,bn}, primaryHref, secondaryLabel{en,bn}, secondaryHref }
about:    { title{en,bn}, paragraphs[{en,bn}], skills[{name, level, group}], languages[], stats[{value, label{en,bn}}] }
services: [ { id, icon, title{en,bn}, description{en,bn}, features[{en,bn}],
              categories: [ {key, label, sortOrder} ] } ]   ← প্রাইসিং ক্যাটাগরি এখানে
projects: [ { id, title{en,bn}, description{en,bn}, image?, link?, tags[], featured } ]
contact:  { email, phone, whatsapp, location{en,bn}, socials[{label,url}] }
seo:      { title{en,bn}, description{en,bn} }
```
**প্রাইসিং গ্রুপিং:** service.categories[].key = `packages.category` — এইভাবে সার্ভিস → ক্যাটাগরি → প্যাকেজ।

### `blog/{id}` (published public)
slug, title{en,bn}, excerpt{en,bn}, content{en,bn}, cover?, tags[], published, createdAt

### `users/{uid}` — সাইট অ্যাকাউন্ট
role: `"admin" | "client" | "visitor"`, name, email, phone?
**অর্ডার ফর্মে পাসওয়ার্ড আবশ্যক** — প্রতিটা অর্ডার অ্যাকাউন্টে লিংক হয়; প্রথম অর্ডারে visitor → client

### `users/{uid}/orders/{clientDocId}` — অর্ডার স্ন্যাপশট
`{ id (project A clients id), package, amount, status, referredBy, createdAt, updatedAt }`
- ক্লায়েন্ট অর্ডারের সময় নিজে তৈরি করে (status pending)
- **admin panel status বদলালে mirror sync** হয় (§৭)

### `messages/{id}` — কনটাক্ট থ্রেড
name, email, visitorUid?, thread[{from: "visitor"|"admin", text, at}], status("new"|"read"|"replied")

### `recommendations/{id}` — শুধু ক্লায়েন্টরা জমা দেয়
name, role, text, rating(1-5), **uid** (জমাদাতা), status("pending"|"approved"), createdAt
Rules: create শুধু signed-in **client** (uid ম্যাচ); পাবলিক শুধু approved পড়ে।

---

## ৬. Auth ফ্লো সারাংশ

| কে | কোন project | কীভাবে |
|---|---|---|
| Admin | A | Email/Password (`/login`) |
| Partner | A | Email/Password বা `{phone}@rhb.partners` |
| সাইট ভিজিটর/ক্লায়েন্ট | B | Email/Password + Google (অর্ডারে পাসওয়ার্ড আবশ্যক) |

**দুই প্রজেক্টের লগইন সম্পূর্ণ আলাদা** — একটা আরেকটাকে প্রভাবিত করে না।

---

## ৭. Admin প্যানেল ফিচার স্পেক (Admin App)

**Bottom tabs:** ড্যাশবোর্ড · অর্ডারস · উইথড্র · আরও

1. **ড্যাশবোর্ড:** Total Partners, Active Clients, Total Revenue (paid clients sum), Pending Withdrawals (count + sum) + recent activity (clients + withdrawals merged, sorted by createdAt)
2. **অর্ডারস/ক্লায়েন্টস:** ৩ ফিল্টার — সব / ওয়েবসাইট অর্ডার (`source=="pricing"`) / ফ্রি-লিডস (`amount==0 && status!="paid"`)
   - status change: pending↔working সরাসরি update; **paid হলে transaction** (§৪ কমিশন লজিক) — paid থেকে আর বদলানো যায় না
   - DIRECT / amount=০ হলে কমিশন ছাড়াই paid
   - প্রতি রো-তে WhatsApp বাটন: `https://wa.me/88{phone}`
   - status বদলালে **mirror sync**: project B-তে email দিয়ে user খুঁজে `users/{uid}/orders/{client.id}.status` আপডেট (admin site-project-এ লগইন থাকলে)
3. **পার্টনারস:** pending লিস্ট (payment info দেখা) → **Approve** (status active + খালি partnerId হলে `CM-{max+1}` বরাদ্দ) / **Reject** (profile delete); টেবিলে Gold হিন্ট (পেইড ৩+)
4. **উইথড্র:** Approve (transaction: status + balance deduct) / Reject
5. **সার্ভিসেস ও প্রাইসিং:** সার্ভিস → ক্যাটাগরি → প্যাকেজ CRUD (project B content + project A packages)
6. **মেসেজেস/রেকমেন্ডেশনস (project B):** থ্রেড reply, রেকমেন্ডেশন approve/pending/delete

### Push ট্রিগার (Cloud Functions — project A, নতুন যোগ করতে হবে)
| Trigger | পাঠাবে | Topic |
|---|---|---|
| clients onCreate (source=pricing) | "নতুন অর্ডার — {package}" | `admin-alerts` |
| withdrawals onCreate | "নতুন উইথড্র রিকোয়েস্ট" | `admin-alerts` |
| clients status→paid | "কমিশন ক্রেডিট {amount}" | `partner-{partnerId}` |
| withdrawals update | "উইথড্র approved/rejected" | `partner-{partnerId}` |
| users update (pending→active) | "অ্যাকাউন্ট অ্যাপ্রুভ হয়েছে" | `partner-{partnerId}` |

## ৮. Partner প্যানেল ফিচার স্পেক (Partner App)

**Bottom tabs:** হোম · ক্লায়েন্টস · উইথড্র · আরও
1. **লগইন** — email/phone + password; `status=="pending"` হলে ব্লক স্ক্রিন; `"banned"` হলে লগআউট স্ক্রিন
2. **হোম:** Available Balance (users.balance), Total Earnings, Active Clients; **রেফারেল লিংক** `{referralBaseUrl||origin}/pricing?ref={partnerId}` + share button; announcement (settings/public)
3. **ক্লায়েন্টস:** `clients` where `referredBy == partnerId` (onSnapshot) — status badge, ফোন মাস্কড `017***678`, expected commission
4. **উইথড্র:** ব্যালান্স + ফর্ম (amount ≥ settings.global.minWithdrawAmount, method, accountNumber) + হিস্টোরি
5. **রিসোর্সেস:** project B `content/resources` থেকে সেলস গাইড
6. **Notifications:** উপরের টেবিল অনুযায়ী

---

## ৯. ডিজাইন টোকেন

- **Theme:** dark only — background `#0a0a0f`, glass card `bg-white/3% + blur + border white/10%`
- **Primary:** violet `#8b5cf6` / `#a78bfa`; fuchsia `#e879f9`; success `#10b981`; warning `#f59e0b`; danger `#ef4444`
- **Radius:** 16px card, 12px input; **Font:** Geist Sans (fallback Inter)
- **Money:** `৳1,500` (en-IN); **ফোন মাস্ক:** `017***678`
- **ভাষা:** বাংলা প্রাইমারি + English (সাইটে EN/BN টগল আছে; অ্যাপে বাংলা যথেষ্ট)

---

## ১০. গুরুত্বপূর্ণ বিজনেস নিয়ম (অ্যাপেও হুবহু)

1. নতুন পার্টনার (রেজিস্ট্রেশন/Google) `pending` + bKash/Nagad নম্বর জমা বাধ্যতামূলক — approve হলেই প্যানেল
2. Gold Partner = ৩+ পেইড অর্ডার → রেট ২০% (admin ম্যানুয়ালি সেট করে)
3. ফ্রি অর্ডারে কমিশন নেই; ৩০ দিনে paid-এ গেলে কমিশন
4. ৬ মাসের মধ্যে রিপিট ক্লায়েন্ট → client doc-এ `commissionRate: 10` override
5. `referredBy: "DIRECT"` = admin-এর নিজের অর্ডার, কমিশন নেই
6. minWithdraw, রেট — `settings/global` থেকে পড়তে হবে (hardcode নয়)
7. ক্যাটাগরি সার্ভিসের অধীনে — নতুন প্যাকেজে অবশ্যই কোনো সার্ভিসের ক্যাটাগরি key দিতে হবে

---

## ১১. ওয়েব রেফারেন্স কোড (github.com/code-myst/rakibulhaque — main branch)

| ফাইল | কী পাবেন |
|---|---|
| `src/lib/types.ts` | সব TypeScript ইন্টারফেস (হুবহু একই শেপ) |
| `src/lib/firebase.ts` + `src/lib/firebase-site.ts` | দুই প্রজেক্ট init (নাম ধরে guard — দুই অ্যাপ একসাথে) |
| `src/hooks/use-firestore-data.ts` | doc → model mapper ফাংশন |
| `src/app/admin/clients/page.tsx` | কমিশন transaction + mirror sync লজিক |
| `src/app/admin/partners/page.tsx` | approve/reject + partnerId বরাদ্দ |
| `src/lib/site-content.ts` | সাইট অ্যাকাউন্ট/অর্ডার মিরর/রেকমেন্ডেশন helpers |
| `firestore.rules` + `firestore.site.rules` | সম্পূর্ণ সিকিউরিটি (deploy করা হয়ে গেছে) |
| `public/manifest.json` | PWA (ওয়েব ভার্সন এখনই installable) |

---

## ১২. সাবধানতা

- সব পড়া/লেখা Firestore rules দিয়ে গার্ডেড — অ্যাপে local data দিয়ে auth bypass-এর চেষ্টা করবে না
- নতুন ফিচার যোগ করলে **আগে rules, পরে UI**
- `siteUserId`/`siteEmail`-এর মতো লিংক ফিল্ড নতুন ডক-এ রাখলে rules-এ validation আপডেট করতে ভুলবেন না
- ওয়েব অ্যাপটা PWA — অ্যাপ লঞ্চের আগে ইমার্জেন্সি fallback হিসেবে ব্যবহার করা যায়
- নতুন পুশ-টোপিক যোগ করলে Cloud Functions deploy করতে হবে (`firebase deploy --only functions`)

---

*সর্বশেষ আপডেট: client/visitor account system, service-based pricing, partner registration — সহ v2*
*Rakibul Haque Bhuiyan · Web Developer · CEO of CODEMYST · 01752845182 (WhatsApp only)*
