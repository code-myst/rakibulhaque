import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { siteDb, siteAuth } from "@/lib/firebase-site";
import type {
  BlogPost,
  ContactMessage,
  MessageEntry,
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
      const cred = await createUserWithEmailAndPassword(
        siteAuth,
        input.email,
        input.password
      );
      visitorUid = cred.user.uid;
      accountCreated = true;
      await updateProfile(cred.user, { displayName: input.name });
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
          const cred = await signInWithEmailAndPassword(
            siteAuth,
            input.email,
            input.password
          );
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
