"use client";

import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Database,
  Layers,
  Loader2,
  Package as PackageIcon,
  Pencil,
  Plus,
  Save,
  Tag,
  Trash2,
} from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "@/lib/site-content";
import { deletePackage, seedDefaultPackages, subscribePackages } from "@/lib/packages";
import { DEFAULT_SITE_CONTENT } from "@/lib/default-site-content";
import { SERVICE_ICON_KEYS, serviceIcon } from "@/lib/service-icons";
import type { PricingPackage, SiteContent, SiteService } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LangField } from "@/components/admin/lang-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  name: z.string().min(1, "প্যাকেজের নাম দিন"),
  priceType: z.enum(["fixed", "from", "quote", "monthly"]),
  price: z.coerce.number().min(0).nullable(),
  originalPrice: z.coerce.number().min(0).nullable(),
  featuresText: z.string().min(1, "কমপক্ষে একটা ফিচার দিন (প্রতি লাইনে একটা)"),
  delivery: z.string().optional(),
  note: z.string().optional(),
  popular: z.boolean(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(1),
});
type PkgValues = z.infer<typeof pkgSchema>;

export default function AdminServicesPage() {
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [pkgDialog, setPkgDialog] = React.useState<{
    categoryKey: string;
    categoryLabel: string;
    pkg: PricingPackage | null;
  } | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSiteContent().then((c) => setContent(c ?? structuredClone(DEFAULT_SITE_CONTENT)));
    const unsub = subscribePackages(setPackages);
    return unsub;
  }, []);

  if (!content) return <Skeleton className="h-96 w-full rounded-xl" />;

  const services = content.services ?? [];

  const updateServices = (next: SiteService[]) => {
    setContent((prev) => (prev ? { ...prev, services: next } : prev));
    setDirty(true);
  };

  const patchService = (idx: number, p: Partial<SiteService>) =>
    updateServices(services.map((s, i) => (i === idx ? { ...s, ...p } : s)));

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      setDirty(false);
      toast({ title: "সংরক্ষিত ✅", description: "সার্ভিস ও ক্যাটাগরি সাইটে আপডেট হয়েছে।" });
    } catch (err) {
      console.error("services save failed:", err);
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setSaving(false);
    }
  };

  const onSeed = async () => {
    if (
      !confirm(
        "প্রতিটা সার্ভিসে ডিফল্ট ক্যাটাগরি যোগ হবে এবং ডকের সব প্যাকেজ (Web, Apps, AI সহ) Firestore-এ যোগ হবে। চালিয়ে যাবেন?"
      )
    )
      return;
    setBusy(true);
    try {
      const base = structuredClone(DEFAULT_SITE_CONTENT);
      const next: SiteContent = {
        ...content,
        services: services.map((svc) => {
          const def = base.services.find((d) => d.id === svc.id);
          return def && (!svc.categories || svc.categories.length === 0)
            ? { ...svc, categories: structuredClone(def.categories) }
            : svc;
        }),
      };
      await saveSiteContent(next);
      setContent(next);
      setDirty(false);
      const n = await seedDefaultPackages();
      toast({
        title: "ডিফল্ট লোড হয়েছে ✅",
        description: `${n}টা প্যাকেজ + ক্যাটাগরি সার্ভিসের অধীনে যোগ হয়েছে।`,
      });
    } catch (err) {
      console.error("seed failed:", err);
      toast({ variant: "destructive", title: "সিড ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Layers className="h-5 w-5 text-violet-300" /> সার্ভিসেস ও প্রাইসিং
          </h1>
          <p className="text-sm text-muted-foreground">
            প্রতিটা সার্ভিসের ভিতরে ক্যাটাগরি, আর ক্যাটাগরির ভিতরে প্যাকেজ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {packages !== null && packages.length === 0 && (
            <Button variant="outline" onClick={onSeed} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              ডিফল্ট ক্যাটাগরি ও প্রাইসিং লোড
            </Button>
          )}
          <Button onClick={onSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "সংরক্ষণ করুন" : "সংরক্ষিত"}
          </Button>
        </div>
      </div>

      {services.map((svc, idx) => {
        const Icon = serviceIcon(svc.icon);
        const cats = svc.categories ?? [];
        return (
          <Card key={svc.id}>
            <CardContent className="space-y-5 p-5">
              {/* Service header fields */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/40">
                  <Icon className="h-5 w-5 text-violet-300" />
                </div>
                <Badge variant="secondary">#{idx + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-red-400"
                  onClick={() => updateServices(services.filter((_, i) => i !== idx))}
                  aria-label="সার্ভিস মুছুন"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>আইকন</Label>
                  <Select value={svc.icon} onValueChange={(icon) => patchService(idx, { icon })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ICON_KEYS.map((k) => {
                        const I = serviceIcon(k);
                        return (
                          <SelectItem key={k} value={k}>
                            <span className="flex items-center gap-2">
                              <I className="h-4 w-4" /> {k}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <LangField
                  label="শিরোনাম"
                  value={svc.title}
                  onChange={(title) => patchService(idx, { title })}
                />
              </div>
              <LangField
                label="বর্ণনা"
                value={svc.description}
                multiline
                onChange={(description) => patchService(idx, { description })}
              />

              {/* ── Categories & packages ── */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-amber-300" /> ক্যাটাগরি ও প্রাইসিং
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patchService(idx, {
                        categories: [
                          ...cats,
                          { key: `cat-${Date.now().toString(36)}`, label: "নতুন ক্যাটাগরি", sortOrder: cats.length + 1 },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> ক্যাটাগরি যোগ
                  </Button>
                </div>

                {cats.length === 0 && (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    এই সার্ভিসে এখনো ক্যাটাগরি নেই — “ক্যাটাগরি যোগ” করুন বা উপরের ডিফল্ট লোড বাটন চাপুন।
                  </p>
                )}

                <div className="space-y-3">
                  {cats.map((cat, ci) => {
                    const catPkgs = (packages ?? []).filter((p) => p.category === cat.key);
                    return (
                      <div key={cat.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex shrink-0 flex-col">
                            <button
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={ci === 0}
                              onClick={() => {
                                const next = [...cats];
                                [next[ci - 1], next[ci]] = [next[ci], next[ci - 1]];
                                patchService(idx, { categories: next.map((c, i) => ({ ...c, sortOrder: i + 1 })) });
                              }}
                              aria-label="উপরে"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={ci === cats.length - 1}
                              onClick={() => {
                                const next = [...cats];
                                [next[ci + 1], next[ci]] = [next[ci], next[ci + 1]];
                                patchService(idx, { categories: next.map((c, i) => ({ ...c, sortOrder: i + 1 })) });
                              }}
                              aria-label="নিচে"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Input
                            value={cat.label}
                            onChange={(e) => {
                              const next = [...cats];
                              next[ci] = { ...next[ci], label: e.target.value };
                              patchService(idx, { categories: next });
                            }}
                            placeholder="ক্যাটাগরির নাম (যেমন: বিজনেস)"
                          />
                          <Badge variant="secondary" className="shrink-0">
                            {catPkgs.length} প্যাকেজ
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-red-400"
                            onClick={() => {
                              if (catPkgs.length > 0) {
                                toast({
                                  variant: "destructive",
                                  title: "ডিলিট করা যাবে না",
                                  description: "আগে এই ক্যাটাগরির প্যাকেজগুলো মুছুন।",
                                });
                                return;
                              }
                              patchService(idx, { categories: cats.filter((_, j) => j !== ci) });
                            }}
                            aria-label="ক্যাটাগরি মুছুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* packages of this category */}
                        <div className="mt-2 space-y-1.5 pl-2">
                          {catPkgs.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1.5"
                            >
                              <PackageIcon className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                              <span className="min-w-0 flex-1 truncate text-xs">
                                {p.name}
                                {p.popular && <span className="ml-1 text-amber-400">🔥</span>}
                                {!p.active && <span className="ml-1 text-muted-foreground">(নিষ্ক্রিয়)</span>}
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-violet-300">
                                {formatPrice(p.price, p.priceType)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  setPkgDialog({ categoryKey: cat.key, categoryLabel: cat.label, pkg: p })
                                }
                                aria-label="প্যাকেজ এডিট"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400"
                                onClick={async () => {
                                  if (!confirm(`“${p.name}” মুছে ফেলবেন?`)) return;
                                  try {
                                    await deletePackage(p.id);
                                    toast({ title: "মুছে ফেলা হয়েছে" });
                                  } catch {
                                    toast({ variant: "destructive", title: "ডিলিট ব্যর্থ" });
                                  }
                                }}
                                aria-label="প্যাকেজ মুছুন"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPkgDialog({ categoryKey: cat.key, categoryLabel: cat.label, pkg: null })}
                          >
                            <Plus className="h-3.5 w-3.5" /> প্যাকেজ যোগ
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button
        variant="outline"
        onClick={() =>
          updateServices([
            ...services,
            {
              id: `svc-${Date.now().toString(36)}`,
              icon: "layers",
              title: { en: "", bn: "" },
              description: { en: "", bn: "" },
              features: [],
              categories: [],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> নতুন সার্ভিস
      </Button>

      {/* Package add/edit dialog */}
      <PackageDialog state={pkgDialog} onClose={() => setPkgDialog(null)} />
    </div>
  );
}

/* ---------------- Package dialog ---------------- */

function PackageDialog({
  state,
  onClose,
}: {
  state: { categoryKey: string; categoryLabel: string; pkg: PricingPackage | null } | null;
  onClose: () => void;
}) {
  const form = useForm<PkgValues>({ resolver: zodResolver(pkgSchema) });
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (state) {
      const p = state.pkg;
      form.reset({
        name: p?.name ?? "",
        priceType: p?.priceType ?? "fixed",
        price: p?.price ?? 0,
        originalPrice: p?.originalPrice ?? null,
        featuresText: p?.features.join("\n") ?? "",
        delivery: p?.delivery ?? "",
        note: p?.note ?? "",
        popular: !!p?.popular,
        active: p?.active !== false,
        sortOrder: p?.sortOrder ?? 1,
      });
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const onSubmit = async (values: PkgValues) => {
    setBusy(true);
    try {
      await savePackageWrapper(
        {
          category: state.categoryKey,
          categoryName: state.categoryLabel,
          name: values.name.trim(),
          price: values.priceType === "quote" ? null : Math.round(values.price ?? 0),
          priceType: values.priceType,
          originalPrice:
            values.originalPrice && values.originalPrice > 0 ? Math.round(values.originalPrice) : null,
          features: values.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
          delivery: values.delivery?.trim() || undefined,
          note: values.note?.trim() || undefined,
          popular: values.popular,
          active: values.active,
          sortOrder: values.sortOrder,
        },
        state.pkg?.id
      );
      toast({ title: "সংরক্ষিত ✅", description: `${values.name} — ${state.categoryLabel} ক্যাটাগরিতে।` });
      onClose();
    } catch (err) {
      console.error("package save failed:", err);
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setBusy(false);
    }
  };

  const priceType = form.watch("priceType");

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-violet-300" />
            {state.pkg ? "প্যাকেজ এডিট" : "নতুন প্যাকেজ"} — {state.categoryLabel}
          </DialogTitle>
          <DialogDescription>ফিচারের প্রতিটা লাইন পাবলিক পেজে আলাদা বুলেট হবে</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Input type="number" disabled={priceType === "quote"} {...form.register("price")} />
            </div>
            <div className="space-y-1.5">
              <Label>আগের দাম (৳) — ঐচ্ছিক</Label>
              <Input type="number" placeholder="স্ট্রাইকথ্রুর জন্য" {...form.register("originalPrice")} />
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
            <Button type="button" variant="ghost" onClick={onClose}>
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
  );
}

async function savePackageWrapper(pkg: Omit<PricingPackage, "id">, id?: string) {
  const { savePackage } = await import("@/lib/packages");
  return savePackage(pkg, id);
}
