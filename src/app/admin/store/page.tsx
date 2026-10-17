"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { storeAuth, storeDb } from "@/lib/firebase-store";
import { useStoreItems } from "@/hooks/use-store-items";
import { CATEGORIES, catOf, type StoreCategory, type StoreItem } from "@/lib/store";

const EMPTY = {
  nameBn: "", nameEn: "", descBn: "", descEn: "",
  category: "app" as StoreCategory, version: "", size: "", icon: "",
  screenshots: "", url: "", featured: false, published: true,
};
type Form = typeof EMPTY;

const inp = "h-10 w-full rounded-md border border-white/15 bg-white/[0.03] px-3 text-sm outline-none focus:border-violet-400";

export default function AdminStorePage() {
  const { items, loading, error } = useStoreItems(true);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(storeAuth, (u) => { setUser(u); setReady(true); }), []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const edit = (i: StoreItem) => {
    setEditId(i.id);
    setForm({
      nameBn: i.name.bn, nameEn: i.name.en, descBn: i.description.bn, descEn: i.description.en,
      category: i.category, version: i.version, size: i.size, icon: i.icon,
      screenshots: i.screenshots.join("\n"), url: i.url, featured: i.featured, published: i.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => { setEditId(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.nameEn.trim() && !form.nameBn.trim()) return setMsg("নাম দিন");
    if (!form.url.trim()) return setMsg("ডাউনলোড/ওপেন লিংক দিন");
    setBusy(true); setMsg("");
    const data = {
      name: { bn: form.nameBn.trim() || form.nameEn.trim(), en: form.nameEn.trim() || form.nameBn.trim() },
      description: { bn: form.descBn.trim() || form.descEn.trim(), en: form.descEn.trim() || form.descBn.trim() },
      category: form.category, version: form.version.trim(), size: form.size.trim(),
      icon: form.icon.trim(), url: form.url.trim(),
      screenshots: form.screenshots.split("\n").map((s) => s.trim()).filter(Boolean),
      featured: form.featured, published: form.published,
    };
    try {
      if (editId) await updateDoc(doc(storeDb, "store_items", editId), data);
      else await addDoc(collection(storeDb, "store_items"), { ...data, downloads: 0, createdAt: serverTimestamp() });
      setMsg(editId ? "আপডেট হয়েছে ✓" : "যোগ হয়েছে ✓");
      reset();
    } catch (e: any) {
      setMsg("ব্যর্থ: " + (e.code || e.message));
    }
    setBusy(false);
  };

  const remove = async (i: StoreItem) => {
    if (!confirm(`"${i.name.bn || i.name.en}" ডিলিট করবেন?`)) return;
    await deleteDoc(doc(storeDb, "store_items", i.id)).catch((e) => setMsg("ব্যর্থ: " + e.code));
  };
  const toggle = (i: StoreItem, k: "published" | "featured") =>
    updateDoc(doc(storeDb, "store_items", i.id), { [k]: !i[k] }).catch((e) => setMsg("ব্যর্থ: " + e.code));

  if (!ready) return <p className="p-6 text-sm text-muted-foreground">লোড হচ্ছে…</p>;
  if (!user)
    return (
      <div className="p-6 text-sm">
        আগে লগইন করুন → <a href="/login" className="text-violet-300 underline">/login</a>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold">Store ম্যানেজমেন্ট</h1>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="font-bold">{editId ? "আইটেম এডিট" : "নতুন আইটেম"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inp} placeholder="নাম (বাংলা)" value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} />
          <input className={inp} placeholder="Name (English)" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          <textarea className={`${inp} h-24 py-2`} placeholder="বর্ণনা (বাংলা)" value={form.descBn} onChange={(e) => set("descBn", e.target.value)} />
          <textarea className={`${inp} h-24 py-2`} placeholder="Description (English)" value={form.descEn} onChange={(e) => set("descEn", e.target.value)} />
          <select className={inp} value={form.category} onChange={(e) => set("category", e.target.value as StoreCategory)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id} className="bg-black">{c.emoji} {c.label.en}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} placeholder="Version (1.0.0)" value={form.version} onChange={(e) => set("version", e.target.value)} />
            <input className={inp} placeholder="Size (12 MB)" value={form.size} onChange={(e) => set("size", e.target.value)} />
          </div>
          <input className={`${inp} sm:col-span-2`} placeholder="ডাউনলোড / ওপেন লিংক (Cloudinary, GitHub Release, Drive, PWA URL)" value={form.url} onChange={(e) => set("url", e.target.value)} />
          <input className={`${inp} sm:col-span-2`} placeholder="আইকন ইমেজ লিংক (ঐচ্ছিক)" value={form.icon} onChange={(e) => set("icon", e.target.value)} />
          <textarea className={`${inp} h-24 py-2 sm:col-span-2`} placeholder="স্ক্রিনশট লিংক — প্রতি লাইনে একটা (ঐচ্ছিক)" value={form.screenshots} onChange={(e) => set("screenshots", e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={busy} onClick={save} className="h-10 rounded-md bg-violet-500 px-5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "…" : editId ? "আপডেট" : "যোগ করুন"}
          </button>
          {editId && <button onClick={reset} className="h-10 rounded-md border border-white/15 px-4 text-sm">বাতিল</button>}
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">সব আইটেম ({items.length})</h2>
        {loading && <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>}
        {error && <p className="text-sm text-red-400">Firestore error: {error} (Rules চেক করুন)</p>}
        {items.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="text-xl">{catOf(i.category).emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{i.name.bn || i.name.en}</p>
              <p className="text-xs text-muted-foreground">v{i.version || "—"} · ⬇ {i.downloads}</p>
            </div>
            <button onClick={() => toggle(i, "published")} className={`rounded-full border px-2.5 py-0.5 text-xs ${i.published ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-muted-foreground"}`}>
              {i.published ? "Published" : "Draft"}
            </button>
            <button onClick={() => toggle(i, "featured")} className={`rounded-full border px-2.5 py-0.5 text-xs ${i.featured ? "border-amber-400/40 text-amber-300" : "border-white/20 text-muted-foreground"}`}>
              ★
            </button>
            <button onClick={() => edit(i)} className="rounded-md border border-white/15 px-3 py-1 text-xs hover:bg-white/10">এডিট</button>
            <button onClick={() => remove(i)} className="rounded-md border border-red-400/30 px-3 py-1 text-xs text-red-300 hover:bg-red-400/10">ডিলিট</button>
          </div>
        ))}
      </section>
    </div>
  );
}
