import {
  addDoc,
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
  const q = query(collection(siteDb, "blog"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => {
      const data = d.data() as Partial<BlogPost>;
      return {
        ...data,
        id: d.id,
        createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
      } as BlogPost;
    });
    cb(onlyPublished ? posts.filter((p) => p.published) : posts);
  });
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
  const q = query(
    collection(siteDb, "messages"),
    where("visitorUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as Partial<ContactMessage>;
        return {
          ...(data as ContactMessage),
          id: d.id,
          createdAt:
            (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
        };
      })
    );
  });
}

/** ভিজিটর follow-up পাঠালে thread-এ যোগ */
export async function visitorFollowUp(messageId: string, text: string) {
  const entry: MessageEntry = { from: "visitor", text: text.trim(), at: Date.now() };
  const { arrayUnion } = await import("firebase/firestore");
  await updateDoc(doc(siteDb, "messages", messageId), {
    thread: arrayUnion(entry),
    status: "new",
  });
}

/* ---------------- Recommendations (guest submissions) ---------------- */

export function subscribeRecommendations(
  cb: (recs: Recommendation[]) => void,
  onlyApproved = false
) {
  const q = query(collection(siteDb, "recommendations"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const recs = snap.docs.map((d) => {
        const data = d.data() as Partial<Recommendation>;
        return {
          ...(data as Recommendation),
          id: d.id,
          createdAt:
            (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
        };
      });
      cb(onlyApproved ? recs.filter((r) => r.status === "approved") : recs);
    },
    () => cb([])
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
  try {
    const cred = await siteCreateUser(siteAuth, input.email, input.password);
    await siteUpdateProfile(cred.user, { displayName: input.name });
    await setDoc(doc(siteDb, "users", cred.user.uid), {
      name: input.name.trim(),
      email: input.email.trim(),
      role: "client",
      createdAt: serverTimestamp(),
    });
    return { uid: cred.user.uid, created: true };
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/email-already-in-use") {
      // আগের অ্যাকাউন্ট — দেওয়া পাসওয়ার্ডে লগইন
      const cred = await siteSignIn(siteAuth, input.email, input.password);
      return { uid: cred.user.uid, created: false };
    }
    throw err;
  }
}

/** লগইন থাকলে অর্ডার অ্যাকাউন্টের সাথে লিংক: project A client id দিয়ে মিরর */
export async function saveProfileOrder(
  uid: string,
  order: { id: string; package: string; amount: number; status: "pending" | "working" | "paid"; referredBy: string }
) {
  const { getDoc } = await import("firebase/firestore");
  const userSnap = await getDoc(doc(siteDb, "users", uid));
  const role = userSnap.exists() ? (userSnap.data().role as string) : "visitor";
  // visitor → client upgrade
  if (role === "visitor") {
    await setDoc(doc(siteDb, "users", uid), { role: "client" }, { merge: true });
  }
  await setDoc(
    doc(siteDb, "users", uid, "orders", order.id),
    { ...order, updatedAt: serverTimestamp() },
    { merge: true }
  );
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
  const q = query(
    collection(siteDb, "recommendations"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Partial<Recommendation>;
          return {
            ...(data as Recommendation),
            id: d.id,
            createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
          };
        })
      );
    },
    () => cb([])
  );
}

/** অ্যাডমিন সাইড: ক্লায়েন্টের email দিয়ে সাইট অ্যাকাউন্ট খুঁজে অর্ডার স্ট্যাটাস মিরর আপডেট */
export async function syncOrderStatusToSiteAccount(
  client: { id: string; email?: string; name?: string; package?: string; amount?: number; referredBy?: string },
  status: "pending" | "working" | "paid"
) {
  if (!siteAuth.currentUser) return; // সাইট প্রজেক্টে অ্যাডমিন লগইন না থাকলে স্কিপ
  const email = client.email?.trim();
  if (!email) return;
  const { collection } = await import("firebase/firestore");
  const userSnaps = await getDocs(
    query(collection(siteDb, "users"), where("email", "==", email))
  );
  if (userSnaps.empty) return;
  const uid = userSnaps.docs[0].id;
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
}
