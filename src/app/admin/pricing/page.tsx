"use client";

import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  Database,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import {
  deletePackage,
  isPackagesEmpty,
  savePackage,
  seedDefaultPackages,
  subscribePackages,
} from "@/lib/packages";
import { PACKAGE_CATEGORIES, type PricingPackage } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pkgSchema = z.object({
  category: z.string().min(1, "ক্যাটাগরি নির্বাচন করুন"),
  name: z.string().min(1, "প্যাকেজের নাম দিন"),
  priceType: z.enum(["fixed", "from", "quote", "monthly"]),
  price: z.coerce.number().min(0).nullable(),
  featuresText: z.string().min(1, "কমপক্ষে একটা ফিচার দিন (প্রতি লাইনে একটা)"),
  delivery: z.string().optional(),
  note: z.string().optional(),
  popular: z.boolean(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(1),
});
type PkgValues = z.infer<typeof pkgSchema>;

export default function AdminPricingPage() {
  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [editing, setEditing] = React.useState<PricingPackage | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [deleting, setDeleting] = React.useState<PricingPackage | null>(null);
  const [canSeed, setCanSeed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = subscribePackages(
      (pkgs) => setPackages(pkgs),
      () => setPackages([])
    );
    isPackagesEmpty().then(setCanSeed).catch(() => setCanSeed(false));
    return unsub;
  }, []);

  const form = useForm<PkgValues>({ resolver: zodResolver(pkgSchema) });

  React.useEffect(() => {
    if (adding) {
      form.reset({
        category: "business",
        name: "",
        priceType: "fixed",
        price: 0,
        featuresText: "",
        delivery: "",
        note: "",
        popular: false,
        active: true,
        sortOrder: (packages?.length ?? 0) + 1,
      });
    }
  }, [adding]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (editing) {
      form.reset({
        category: editing.category,
        name: editing.name,
        priceType: editing.priceType,
        price: editing.price ?? 0,
        featuresText: editing.features.join("\n"),
        delivery: editing.delivery ?? "",
        note: editing.note ?? "",
        popular: !!editing.popular,
        active: editing.active,
        sortOrder: editing.sortOrder,
      });
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const dialogOpen = adding || !!editing;

  const onSave = async (values: PkgValues) => {
    setBusy(true);
    try {
      const categoryLabel =
        PACKAGE_CATEGORIES.find((c) => c.key === values.category)?.label ?? "কাস্টম";
      await savePackage(
        {
          category: values.category as PricingPackage["category"],
          categoryName: categoryLabel,
          name: values.name.trim(),
          price: values.priceType === "quote" ? null : Math.round(values.price ?? 0),
          priceType: values.priceType,
          features: values.featuresText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          delivery: values.delivery?.trim() || undefined,
          note: values.note?.trim() || undefined,
          popular: values.popular,
          active: values.active,
          sortOrder: values.sortOrder,
        },
        editing?.id
      );
      toast({ title: "সংরক্ষিত ✅", description: `${values.name} আপডেট হয়েছে।` });
      setEditing(null);
      setAdding(false);
    } catch {
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deletePackage(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে", description: deleting.name });
      setDeleting(null);
    } catch {
      toast({ variant: "destructive", title: "ডিলিট ব্যর্থ" });
    } finally {
      setBusy(false);
    }
  };

  const onSeed = async () => {
    setBusy(true);
    try {
      const n = await seedDefaultPackages();
      setCanSeed(false);
      toast({ title: `${n}টা প্যাকেজ লোড হয়েছে ✅`, description: "ডকের সম্পূর্ণ প্রাইসিং যোগ হয়েছে — এখন থেকে সব এডিটেবল।" });
    } catch {
      toast({ variant: "destructive", title: "সিড ব্যর্থ", description: "Rules deploy করা আছে কিনা দেখুন।" });
    } finally {
      setBusy(false);
    }
  };

  const priceType = form.watch("priceType");
  const grouped = PACKAGE_CATEGORIES.map((cat) => ({
    ...cat,
    items: (packages ?? []).filter((p) => p.category === cat.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Tag className="h-5 w-5 text-violet-300" /> প্রাইসিং
          </h1>
          <p className="text-sm text-muted-foreground">
            পাবলিক pricing পেজ এখান থেকেই তৈরি হয় — দাম, ফিচার, সব এডিটেবল
          </p>
        </div>
        <div className="flex gap-2">
          {canSeed && (
            <Button variant="outline" onClick={onSeed} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              ডকের ডিফল্ট প্রাইসিং লোড করুন
            </Button>
          )}
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> নতুন প্যাকেজ
          </Button>
        </div>
      </div>

      {packages === null && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {packages !== null && packages.length === 0 && (
        <Card className="p-10 text-center">
          <Database className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm text-muted-foreground">
            এখনো কোনো প্যাকেজ নেই। উপরের <span className="font-semibold text-violet-300">“ডকের ডিফল্ট প্রাইসিং লোড করুন”</span>{" "}
            বাটনে ক্লিক করলে আপনার প্রাইসিং ডকের সব ১৮টা প্যাকেজ এক ক্লিকে ঢুকে যাবে।
          </p>
        </Card>
      )}

      {grouped.map((group) => (
        <div key={group.key} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {group.label}
            <span className="ml-2 text-xs font-normal">({group.items.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((p) => (
              <Card key={p.id} className={`glass-hover p-4 ${!p.active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold">{p.name}</p>
                      {p.popular && <Badge>🔥 জনপ্রিয়</Badge>}
                      {!p.active && <Badge variant="secondary">নিষ্ক্রিয়</Badge>}
                    </div>
                    <p className="mt-1 text-lg font-extrabold text-violet-300">
                      {formatPrice(p.price, p.priceType)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" aria-label="এডিট" onClick={() => setEditing(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="ডিলিট"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => setDeleting(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
                  {p.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                      <span className="line-clamp-1">{f}</span>
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="text-violet-300/70">+ আরও {p.features.length - 4}টা ফিচার</li>
                  )}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-300" />
              {editing ? "প্যাকেজ এডিট" : "নতুন প্যাকেজ"}
            </DialogTitle>
            <DialogDescription>
              ফিচারের প্রতিটা লাইন পাবলিক পেজে আলাদা বুলেট হিসেবে দেখাবে
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ক্যাটাগরি</Label>
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PACKAGE_CATEGORIES.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input placeholder="যেমন: Standard" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>দামের ধরন</Label>
                <Controller
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">নির্দিষ্ট (৳X)</SelectItem>
                        <SelectItem value="from">শুরু (৳X+)</SelectItem>
                        <SelectItem value="monthly">মাসিক (৳X/মাস)</SelectItem>
                        <SelectItem value="quote">কোটেশন</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>দাম (৳){priceType === "quote" && " — কোটেশনে প্রযোজ্য না"}</Label>
                <Input
                  type="number"
                  disabled={priceType === "quote"}
                  {...form.register("price")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>ফিচার (প্রতি লাইনে একটা)</Label>
                <textarea
                  rows={5}
                  className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                  placeholder={"৭ পেজ\nAdmin panel\nBasic SEO"}
                  {...form.register("featuresText")}
                />
                {form.formState.errors.featuresText && (
                  <p className="text-xs text-red-400">{form.formState.errors.featuresText.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>ডেলিভারি (ঐচ্ছিক)</Label>
                <Input placeholder="৭ দিনে" {...form.register("delivery")} />
              </div>
              <div className="space-y-1.5">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Input placeholder="Revision ২ বার" {...form.register("note")} />
              </div>
              <div className="space-y-1.5">
                <Label>সর্ট অর্ডার</Label>
                <Input type="number" {...form.register("sortOrder")} />
              </div>
              <div className="flex items-end gap-6 pb-1">
                <Controller
                  control={form.control}
                  name="popular"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      জনপ্রিয়
                    </label>
                  )}
                />
                <Controller
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      Active
                    </label>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setAdding(false); setEditing(null); }}>
                বাতিল
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>প্যাকেজ ডিলিট করবেন?</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{deleting?.name}</span> পাবলিক
              pricing পেজ থেকেও সরে যাবে।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={onDelete} disabled={busy}>
              <Trash2 className="h-4 w-4" /> ডিলিট
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
