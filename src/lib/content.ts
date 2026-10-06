import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_RESOURCES } from "@/lib/default-resources";
import type { ResourcesContent } from "@/lib/types";

const CONTENT_DOC = doc(db, "content", "resources");

/** DB-তে কনটেন্ট না থাকলে ডিফল্ট (Partner Card docx) রিটার্ন করে */
export async function fetchResourcesContent(): Promise<ResourcesContent> {
  try {
    const snap = await getDoc(CONTENT_DOC);
    if (snap.exists()) {
      const data = snap.data() as Partial<ResourcesContent>;
      if (Array.isArray(data.sections) && data.sections.length > 0) {
        return data as ResourcesContent;
      }
    }
  } catch {
    // permission error → fallback
  }
  return DEFAULT_RESOURCES;
}

export async function saveResourcesContent(content: ResourcesContent) {
  await setDoc(
    CONTENT_DOC,
    { ...content, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
