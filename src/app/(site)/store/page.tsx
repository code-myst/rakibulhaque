"use client";
import { useEffect, useMemo, useState } from "react";
import { doc, increment, updateDoc } from "firebase/firestore";
import { storeDb } from "@/lib/firebase-store";
import { useStoreItems } from "@/hooks/use-store-items";
import { CATEGORIES, DEMO_ITEMS, catOf, tr, type Lang, type StoreCategory, type StoreItem } from "@/lib/store";

export default function StorePage() {
  const { items, loading } = useStoreItems(false);
  const [lang, setLang] = useState<Lang>("bn");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<StoreCategory | "all">("all");
  const [sel, setSel] = useState<StoreItem | null>(null);

  useEffect(() => {
    const l = localStorage.getItem("lang");
    if (l === "en" || l === "bn") setLang(l);
  }, []);
  const L = (bn: string, en: string) => (lang === "bn" ? bn : en);
  const toggleLang = () => {
    const n = lang === "bn" ? "en" : "bn";
    setLang(n);
    localStorage.setItem("lang", n);
  };

  const all = !loading && items.length === 0 ? DEMO_ITEMS : items;
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter(
      (i) =>
        (cat === "all" || i.category === cat) &&
        (!s || `${i.name.bn} ${i.name.en} ${i.description.bn} ${i.description.en}`.toLowerCase().includes(s))
    );
  }, [all, q, cat]);

  const go = async (i: StoreItem) => {
    if (!i.url) return;
    if (!i.id.startsWith("demo-")) {
      updateDoc(doc(storeDb, "store_items", i.id), { downloads: increment(1) }).catch(() => {});
    }
    window.open(i.url, "_blank", "noopener,noreferrer");
  };
  const btnLabel = (i: StoreItem) =>
    i.category === "pwa" ? L("ওপেন / ইনস্টল", "Open / Install") : L("ডাউনলোড", "Download");

  const Icon = ({ i, size = "h-14 w-14" }: { i: StoreItem; size?: string }) =>
    i.icon ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={i.icon} alt="" className={`${size} rounded-2xl object-cover`} />
    ) : (
      <div className={`${size} flex items-center justify-center rounded-2xl bg-violet-500/15 text-2xl ring-1 ring-violet-500/40`}>
        {catOf(i.category).emoji}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">RHB Store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {L("আমার বানানো অ্যাপ, PWA, এক্সটেনশন ও ফাইল — ফ্রি ইনস্টল/ডাউনলোড করুন", "Apps, PWAs, extensions and files I built — install or download for free")}
          </p>
        </div>
        <button onClick={toggleLang} className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/10">
          {lang === "bn" ? "EN" : "বাং"}
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={L("সার্চ করুন…", "Search…")}
        className="mt-6 h-11 w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 text-sm outline-none focus:border-violet-400"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {[{ id: "all" as const, emoji: "✨", label: { bn: "সব", en: "All" } }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              cat === c.id ? "border-violet-400 bg-violet-500/20 text-violet-200" : "border-white/15 hover:bg-white/10"
            }`}
          >
            {c.emoji} {tr(c.label, lang)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">{L("লোড হচ্ছে…", "Loading…")}</p>
      ) : list.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{L("কিছু পাওয়া যায়নি", "Nothing found")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => (
            <div key={i.id} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
              <button onClick={() => setSel(i)} className="flex items-start gap-3 text-left">
                <Icon i={i} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{tr(i.name, lang)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {catOf(i.category).emoji} {tr(catOf(i.category).label, lang)}
                    {i.version && ` · v${i.version}`}
                    {i.size && ` · ${i.size}`}
                  </p>
                </div>
                {i.featured && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">★</span>}
              </button>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tr(i.description, lang)}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">⬇ {i.downloads}</span>
                <button onClick={() => go(i)} className="rounded-md bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500/90">
                  {btnLabel(i)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d0d14] p-5 sm:rounded-2xl">
            <div className="flex items-start gap-3">
              <Icon i={sel} size="h-16 w-16" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">{tr(sel.name, lang)}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tr(catOf(sel.category).label, lang)}
                  {sel.version && ` · v${sel.version}`}
                  {sel.size && ` · ${sel.size}`} · ⬇ {sel.downloads}
                </p>
              </div>
              <button onClick={() => setSel(null)} className="rounded-md px-2 py-1 hover:bg-white/10" aria-label="Close">✕</button>
            </div>
            {sel.screenshots.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {sel.screenshots.map((s, k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={k} src={s} alt="" className="h-40 rounded-lg border border-white/10 object-cover" />
                ))}
              </div>
            )}
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{tr(sel.description, lang)}</p>
            <button onClick={() => go(sel)} className="mt-5 h-11 w-full rounded-md bg-violet-500 text-sm font-semibold text-white hover:bg-violet-500/90">
              {btnLabel(sel)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
    }
