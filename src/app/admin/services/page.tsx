"use client";

import * as React from "react";
import { firebaseErrText } from "@/lib/utils";
import { Layers, Loader2, Plus, Save, Tag, Trash2 } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "@/lib/site-content";
import { fetchCategories } from "@/lib/categories";
import { SERVICE_ICON_KEYS, serviceIcon } from "@/lib/service-icons";
import type { LText, PricingCategory, SiteContent, SiteService } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { LangField } from "@/components/admin/lang-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ServicesEditor() {
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [categories, setCategories] = React.useState<PricingCategory[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSiteContent().then((c) => setContent(c ?? structuredClone({ ...({} as SiteContent), services: [], projects: [] } as SiteContent)));
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  if (!content) return <Skeleton className="h-96 w-full rounded-xl" />;

  const services = content.services ?? [];

  const update = (next: SiteService[]) => {
    setContent((prev) => (prev ? { ...prev, services: next } : prev));
    setDirty(true);
  };

  const patchService = (idx: number, p: Partial<SiteService>) =>
    update(services.map((s, i) => (i === idx ? { ...s, ...p } : s)));

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      setDirty(false);
      toast({ title: "সংরক্ষিত ✅", description: "সার্ভিসেস পেজ ও হোম পেজ আপডেট হয়েছে।" });
    } catch (err) {
      console.error("save failed:", err);
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: firebaseErrText(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Layers className="h-5 w-5 text-violet-300" /> সার্ভিসেস
          </h1>
          <p className="text-sm text-muted-foreground">
            পোর্টফোলিওর সার্ভিস — প্রতিটার সাথে pricing ক্যাটাগরি লিংক করা যায়
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              update([
                ...services,
                {
                  id: `svc-${Date.now().toString(36)}`,
                  icon: "layers",
                  title: { en: "", bn: "" },
                  description: { en: "", bn: "" },
                  features: [],
                },
              ])
            }
          >
            <Plus className="h-4 w-4" /> সার্ভিস যোগ
          </Button>
          <Button onClick={onSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "সংরক্ষণ করুন" : "সংরক্ষিত"}
          </Button>
        </div>
      </div>

      {services.map((svc, idx) => {
        const Icon = serviceIcon(svc.icon);
        return (
          <Card key={svc.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/40">
                  <Icon className="h-5 w-5 text-violet-300" />
                </div>
                <Badge variant="secondary">#{idx + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-red-400"
                  onClick={() => update(services.filter((_, i) => i !== idx))}
                  aria-label="মুছুন"
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
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-amber-300" /> প্রাইসিং ক্যাটাগরি লিংক
                  </Label>
                  <Select
                    value={svc.pricingCategory ?? ""}
                    onValueChange={(pricingCategory) => patchService(idx, { pricingCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— লিংক নেই —</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    সার্ভিস পেজে “প্রাইসিং দেখুন” এই ক্যাটাগরিতে নিয়ে যাবে
                  </p>
                </div>
              </div>

              <LangField
                label="শিরোনাম"
                value={svc.title}
                onChange={(title) => patchService(idx, { title })}
              />
              <LangField
                label="বর্ণনা"
                value={svc.description}
                multiline
                onChange={(description) => patchService(idx, { description })}
              />

              <div className="space-y-2 rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <Label>ফিচার পয়েন্ট (EN + বাং)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patchService(idx, { features: [...svc.features, { en: "", bn: "" } as LText] })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> যোগ
                  </Button>
                </div>
                {svc.features.map((f, fi) => (
                  <div key={fi} className="grid grid-cols-[1fr_1fr_36px] items-center gap-2">
                    <Input
                      value={f.en}
                      placeholder="EN point"
                      onChange={(e) => {
                        const features = [...svc.features];
                        features[fi] = { ...features[fi], en: e.target.value };
                        patchService(idx, { features });
                      }}
                    />
                    <Input
                      value={f.bn}
                      placeholder="বাংলা point"
                      onChange={(e) => {
                        const features = [...svc.features];
                        features[fi] = { ...features[fi], bn: e.target.value };
                        patchService(idx, { features });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400"
                      onClick={() =>
                        patchService(idx, { features: svc.features.filter((_, j) => j !== fi) })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminServicesPage() {
  return (
    <SiteGate>
      <ServicesEditor />
    </SiteGate>
  );
}
