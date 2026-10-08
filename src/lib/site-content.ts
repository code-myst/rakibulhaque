import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword as siteCreateUser,
  signInWithEmailAndPassword as siteSignIn,
  updateProfile as siteUpdateProfile,
} from "firebase/auth";
import { siteDb, siteAuth } from "@/lib/firebase-site";
import type {
  BlogPost,
  ContactMessage,
  MessageEntry,
  ProfileOrder,
  Recommendation,
  SiteContent,
} from "@/lib/types";

const CONTENT_DOC = doc(siteDb, "site", "content");

/* ---------------- Site content ---------------- */

export async function fetchSiteContent(): Promise<SiteContent | null> {
  try {
    const snap = await getDoc(CONTENT_DOC);
    if (snap.exists()) return snap.data() as SiteContent;
  } catch {
    // offline/permission → null (UI fallback ব্যবহার করবে)
  }
  return null;
}

export async function saveSiteContent(content: SiteContent) {
  await setDoc(CONTENT_DOC, { ...content, updatedAt: serverTimestamp() }, { merge: true });
}

/* ---------------- Blog ---------------- */

export function subscribeBlog(
  cb: (posts: BlogPost[]) => void,
  onlyPublished = false
) {
  const col = collection(siteDb, "blog");
  // ভিজিটরের জন্য কোয়েরিতেই published == true (rules-এর শর্ত মেলাতে)
  const q = onlyPublished
    ? query(col, where("published", "==", true))
    : query(col, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const posts = snap.docs
        .map((d) => {
          const data = d.data() as Partial<BlogPost>;
          return {
            ...data,
            id: d.id,
            createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
          } as BlogPost;
        })
        .sort((a, b) => b.createdAt - a.createdAt); // সর্টিং ব্রাউজারে, তাই নতুন ইনডেক্স লাগে না
      cb(posts);
    },
    (err) => {
      console.error("blog read failed:", err);
      cb([]);
    }
  );
}

export async function saveBlogPost(
  post: Omit<BlogPost, "id" | "createdAt"> & { createdAt?: number },
  id?: string
) {
  if (id) {
    await setDoc(doc(siteDb, "blog", id), post, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(siteDb, "blog"), {
    ...post,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteBlogPost(id: string) {
  await deleteDoc(doc(siteDb, "blog", id));
}

/* ---------------- Contact messages ---------------- */

/**
 * গেস্ট বা (পাসওয়ার্ড দিলে) নতুন ভিজিটর অ্যাকাউন্ট খুলে মেসেজ পাঠায়।
 * অ্যাকাউন্ট খুললে visitorUid সেট হয় — পরে /inbox-এ রিপ্লাই দেখতে পারবে।
 */
export async function sendContactMessage(input: {
  name: string;
  email: string;
  text: string;
  password?: string;
}): Promise<{ accountCreated: boolean; error?: string }> {
  let visitorUid: string | null = null;
  let accountCreated = false;

  if (input.password && input.password.length >= 6) {
    try {
      const cred = await siteCreateUser(
        siteAuth,
        input.email,
        input.password
      );
      visitorUid = cred.user.uid;
      accountCreated = true;
      await siteUpdateProfile(cred.user, { displayName: input.name });
      await setDoc(doc(siteDb, "users", cred.user.uid), {
        name: input.name,
        email: input.email,
        role: "visitor",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use") {
        // আগের অ্যাকাউন্ট আছে — লগইন করে মেসেজ জমা দেওয়ার চেষ্টা
        try {
          const cred = await siteSignIn(siteAuth, input.email, input.password);
          visitorUid = cred.user.uid;
        } catch {
          return {
            accountCreated: false,
            error: "এই ইমেইলে অ্যাকাউন্ট আছে — পাসওয়ার্ড মিলেনি। পাসওয়ার্ড বক্স খালি রেখে গেস্ট হিসেবে পাঠাতে পারেন।",
          };
        }
      } else if (code === "auth/weak-password") {
        return { accountCreated: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" };
      } else {
        return { accountCreated: false, error: "অ্যাকাউন্ট খোলা যায়নি — গেস্ট হিসেবে পাঠান।" };
      }
    }
  }

  const entry: MessageEntry = { from: "visitor", text: input.text.trim(), at: Date.now() };
  await addDoc(collection(siteDb, "messages"), {
    name: input.name.trim(),
    email: input.email.trim(),
    visitorUid,
    thread: [entry],
    status: "new",
    createdAt: serverTimestamp(),
  });
  return { accountCreated };
}

/** ভিজিটরের নিজের থ্রেড (real-time) */
export function subscribeMyMessages(uid: string, cb: (msgs: ContactMessage[]) => void) {
  const q = query(collection(siteDb, "messages"), where("visitorUid", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs
          .map((d) => {
            const data = d.data() as Partial<ContactMessage>;
            return {
              ...(data as ContactMessage),
              id: d.id,
              createdAt:
                (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    },
    (err) => {
      console.error("my messages read failed:", err);
      cb([]);
    }
  );
}

/** ভিজিটর follow-up পাঠালে thread-এ যোগ */
export async function visitorFollowUp(messageId: string, text: string) {
  const entry: MessageEntry = { from: "visitor", text: text.trim(), at: Date.now() };
  await updateDoc(doc(siteDb, "messages", messageId), {
    thread: arrayUnion(entry),
    status: "new",
  });
}

/* ---------------- Recommendations ---------------- */

export function subscribeRecommendations(
  cb: (recs: Recommendation[]) => void,
  onlyApproved = false
) {
  const col = collection(siteDb, "recommendations");
  // ভিজিটরের জন্য কোয়েরিতেই status == "approved" (rules-এর শর্ত মেলাতে)
  const q = onlyApproved
    ? query(col, where("status", "==", "approved"))
    : query(col, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const recs = snap.docs
        .map((d) => {
          const data = d.data() as Partial<Recommendation>;
          return {
            ...(data as Recommendation),
            id: d.id,
            createdAt:
              (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt); // সর্টিং ব্রাউজারে, নতুন ইনডেক্স লাগে না
      cb(recs);
    },
    (err) => {
      console.error("recommendations read failed:", err);
      cb([]);
    }
  );
}

export async function submitRecommendation(input: {
  name: string;
  role: string;
  text: string;
  rating: number;
}) {
  await addDoc(collection(siteDb, "recommendations"), {
    ...input,
    name: input.name.trim(),
    role: input.role.trim(),
    text: input.text.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function setRecommendationStatus(id: string, status: Recommendation["status"]) {
  await updateDoc(doc(siteDb, "recommendations", id), { status });
}

export async function deleteRecommendation(id: string) {
  await deleteDoc(doc(siteDb, "recommendations", id));
}

/* ---------------- Site account: orders & profile ---------------- */

/** নতুন অ্যাকাউন্ট খোলা বা আছে হলে লগইন — অর্ডার ফর্ম থেকে (পাসওয়ার্ড আবশ্যক) */
export async function ensureSiteAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ uid: string; created: boolean }> {
  let uid: string;
  let created = false;
  try {
    const cred = await siteCreateUser(siteAuth, input.email, input.password);
    uid = cred.user.uid;
    created = true;
    await siteUpdateProfile(cred.user, { displayName: input.name });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/email-already-in-use") {
      // আগের অ্যাকাউন্ট — দেওয়া পাসওয়ার্ডে লগইন
      const cred = await siteSignIn(siteAuth, input.email, input.password);
      uid = cred.user.uid;
    } else {
      throw err;
    }
  }

  // প্রোফাইল ডক — rules-অনুযায়ী নতুন অ্যাকাউন্ট সবসময় "visitor" দিয়ে শুরু হয়
  // (client upgrade হয় অর্ডারের সময় saveProfileOrder থেকে)। best-effort।
  try {
    const snap = await getDoc(doc(siteDb, "users", uid));
    if (!snap.exists()) {
      await setDoc(doc(siteDb, "users", uid), {
        name: input.name.trim(),
        email: input.email.trim(),
        role: "visitor",
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error("site profile doc ensure failed (non-blocking):", e);
  }

  return { uid, created };
}

/** লগইন থাকলে অর্ডার অ্যাকাউন্টের সাথে লিংক: project A client id দিয়ে মিরর */
export async function saveProfileOrder(
  uid: string,
  order: { id: string; package: string; amount: number; status: "pending" | "working" | "paid"; referredBy: string }
) {
  // ⚠️ সব কিছু best-effort — অর্ডার (project A) ইতিমধ্যে সেভ হয়ে গেছে;
  // মিরর ব্যর্থ হলেও ইউজারকে "failed" দেখানো হবে না।
  try {
    const userRef = doc(siteDb, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // ডক নেই → আগে visitor দিয়ে তৈরি (create rule ✓)
      await setDoc(userRef, { role: "visitor", createdAt: serverTimestamp() });
    }
    if (!snap.exists() || snap.data().role === "visitor") {
      // visitor → client upgrade (update rule ✓ — affectedKeys ['role'])
      await updateDoc(userRef, { role: "client" });
    }

    await setDoc(
      doc(siteDb, "users", uid, "orders", order.id),
      { ...order, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.error("profile order mirror failed (non-blocking):", e);
  }
}

/** অ্যাকাউন্টের অর্ডার হিস্টোরি (real-time) */
export function subscribeMyOrders(uid: string, cb: (orders: ProfileOrder[]) => void) {
  const q = query(collection(siteDb, "users", uid, "orders"), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Partial<ProfileOrder>;
          return {
            ...(data as ProfileOrder),
            id: d.id,
            createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
            updatedAt: (data.updatedAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
          };
        })
      );
    },
    () => cb([])
  );
}

/** ক্লায়েন্ট রেকমেন্ডেশন জমা (শুধু লগইন করা client) */
export async function submitClientRecommendation(input: {
  uid: string;
  name: string;
  role: string;
  text: string;
  rating: number;
}) {
  await addDoc(collection(siteDb, "recommendations"), {
    ...input,
    uid: input.uid,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/** নিজের জমা করা রেকমেন্ডেশনগুলো */
export function subscribeMyRecommendations(uid: string, cb: (recs: Recommendation[]) => void) {
  const q = query(collection(siteDb, "recommendations"), where("uid", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs
          .map((d) => {
            const data = d.data() as Partial<Recommendation>;
            return {
              ...(data as Recommendation),
              id: d.id,
              createdAt:
                (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    },
    (err) => {
      console.error("my recommendations read failed:", err);
      cb([]);
    }
  );
}

/**
 * অ্যাডমিন সাইড: অর্ডারের status সাইট অ্যাকাউন্টে (প্রোফাইলে) মিরর করে।
 * খোঁজার ক্রম: client.siteUserId (সরাসরি) → client.siteEmail → client.email।
 * Returns: { ok, reason? } — reason দিয়ে UI-তে সমস্যা দেখানো যায়।
 */
export async function syncOrderStatusToSiteAccount(
  client: {
    id: string;
    siteUserId?: string;
    siteEmail?: string;
    email?: string;
    name?: string;
    package?: string;
    amount?: number;
    referredBy?: string;
  },
  status: "pending" | "working" | "paid"
): Promise<{ ok: boolean; reason?: string }> {
  if (!siteAuth.currentUser) {
    return { ok: false, reason: "not-logged-in" };
  }
  try {
    let uid = client.siteUserId || "";
    if (!uid) {
      const email = (client.siteEmail ?? client.email)?.trim();
      if (!email) return { ok: false, reason: "no-link" };
      const userSnaps = await getDocs(
        query(collection(siteDb, "users"), where("email", "==", email))
      );
      if (userSnaps.empty) return { ok: false, reason: "account-not-found" };
      uid = userSnaps.docs[0].id;
    }
    const userRef = doc(siteDb, "users", uid);
    // পুরনো ভাঙা অ্যাকাউন্ট heal — visitor থাকলে client করে দাও (admin users write ✓)
    const roleSnap = await getDoc(userRef);
    if (roleSnap.exists() && roleSnap.data().role === "visitor") {
      await updateDoc(userRef, { role: "client" });
    }
    await setDoc(
      doc(siteDb, "users", uid, "orders", client.id),
      {
        id: client.id,
        package: client.package ?? "",
        amount: client.amount ?? 0,
        status,
        referredBy: client.referredBy ?? "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e) {
    const code = (e as { code?: string })?.code ?? "";
    console.error("order status sync failed:", e);
    if (code.includes("permission-denied")) {
      return { ok: false, reason: "not-admin" };
    }
    return { ok: false, reason: "error" };
  }
}