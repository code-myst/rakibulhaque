"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { storeDb } from "@/lib/firebase-store";
import type { StoreItem } from "@/lib/store";

export function useStoreItems(admin = false) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const col = collection(storeDb, "store_items");
    const q = admin ? col : query(col, where("published", "==", true));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const x = d.data() as Partial<StoreItem> & { createdAt?: { toMillis?: () => number } };
          return {
            id: d.id,
            name: x.name ?? { bn: "", en: "" },
            description: x.description ?? { bn: "", en: "" },
            category: x.category ?? "other",
            version: x.version ?? "",
            size: x.size ?? "",
            icon: x.icon ?? "",
            screenshots: x.screenshots ?? [],
            url: x.url ?? "",
            featured: !!x.featured,
            published: !!x.published,
            downloads: x.downloads ?? 0,
            _t: x.createdAt?.toMillis?.() ?? 0,
          } as StoreItem & { _t: number };
        });
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || b._t - a._t);
        setItems(list);
        setLoading(false);
      },
      (e) => {
        setError(e.code || "error");
        setLoading(false);
      }
    );
  }, [admin]);

  return { items, loading, error };
              }
