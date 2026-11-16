import type { SiteContent } from "@/lib/types";
import { siteFirebaseConfig } from "@/lib/site-firebase-config";

type FirestoreValue = Record<string, unknown>;

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return Date.parse(String(value.timestampValue));
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: FirestoreValue[] }).values ?? [];
    return values.map(decodeValue);
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, FirestoreValue> }).fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, decodeValue(item)]));
  }
  return undefined;
}

function firestoreApiUrl(path: string) {
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${siteFirebaseConfig.projectId}/databases/(default)/documents/${path}`
  );
  url.searchParams.set("key", siteFirebaseConfig.apiKey);
  return url;
}

export async function fetchPublicSiteContent(): Promise<SiteContent | null> {
  const url = firestoreApiUrl("site/content");

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const document = (await response.json()) as {
      fields?: Record<string, FirestoreValue>;
    };
    if (!document.fields) return null;
    return Object.fromEntries(
      Object.entries(document.fields).map(([key, value]) => [key, decodeValue(value)])
    ) as unknown as SiteContent;
  } catch {
    return null;
  }
}

export async function fetchPublishedBlogSlugs(): Promise<string[]> {
  try {
    const response = await fetch(firestoreApiUrl(":runQuery"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "blog" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "published" },
              op: "EQUAL",
              value: { booleanValue: true },
            },
          },
          select: { fields: [{ fieldPath: "slug" }] },
        },
      }),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const rows = (await response.json()) as Array<{
      document?: { fields?: Record<string, FirestoreValue> };
    }>;
    return rows
      .map((row) => row.document?.fields?.slug)
      .filter((value): value is FirestoreValue => Boolean(value))
      .map((value) => decodeValue(value))
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch {
    return [];
  }
}
