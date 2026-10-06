"use client";

import * as React from "react";
import { BookOpen, Loader2, MoveDown, MoveUp, Plus, Save, Trash2 } from "lucide-react";
import { fetchResourcesContent, saveResourcesContent } from "@/lib/content";
import { DEFAULT_RESOURCES } from "@/lib/default-resources";
import type { ResourcesContent, ResourceItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminResourcesPage() {
  const [content, setContent] = React.useState<ResourcesContent | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchResourcesContent().then((c) => setContent(c));
  }, []);

  const mutateSection = (key: string, fn: (items: ResourceItem[]) => ResourceItem[]) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.key === key ? { ...s, items: fn(s.items) } : s)),
      };
    });
    setDirty(true);
  };

  const addItem = (key: string) =>
    mutateSection(key, (items) => [...items, { title: "নতুন আইটেম", lines: [""] }]);

  const updateItem = (key: string, idx: number, patch: Partial<ResourceItem>) =>
    mutateSection(key, (items) => items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (key: string, idx: number) =>
    mutateSection(key, (items) => items.filter((_, i) => i !== idx));

  const moveItem = (key: string, idx: number, dir: -1 | 1) =>
    mutateSection(key, (items) => {
      const target = idx + dir;
      if (target < 0 || target >= items.length) return items;
      const copy = [...items];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });

  const onSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      // খালি লাইন ফিল্টার
      const cleaned: ResourcesContent = {
        ...content,
        sections: content.sections.map((s) => ({
          ...s,
          items: s.items
            .filter((it) => it.title.trim())
            .map((it) => ({ title: it.title.trim(), lines: it.lines.filter((l) => l.trim()) })),
        })),
      };
      await saveResourcesContent(cleaned);
      setContent(cleaned);
      setDirty(false);
      toast({ title: "সংরক্ষিত ✅", description: "পার্টনারদের Resources পেজ এখনই আপডেট হয়ে গেছে।" });
    } catch {
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    setConfirmReset(false);
    setContent(structuredClone(DEFAULT_RESOURCES));
    setDirty(true);
    toast({ title: "ডিফল্ট কনটেন্ট লোড হয়েছে", description: "সংরক্ষণ করলে পার্টনাররা দেখবে।" });
  };

  if (!content) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const tabLabels: Record<string, string> = {
    scripts: "সেলস গাইডলাইন",
    objections: "আপত্তি হ্যান্ডলিং",
    rules: "কমিশন রুলস",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <BookOpen className="h-5 w-5 text-violet-300" /> রিসোর্সেস এডিটর
          </h1>
          <p className="text-sm text-muted-foreground">
            পার্টনাররা যা দেখে — নতুন নিয়ম/গাইডলাইন এখানেই বসান
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            ডিফল্টে ফেরান
          </Button>
          <Button onClick={onSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "সংরক্ষণ করুন" : "সংরক্ষিত"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scripts">
        <TabsList>
          {content.sections.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {tabLabels[s.key] ?? s.label} ({s.items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {content.sections.map((section) => (
          <TabsContent key={section.key} value={section.key} className="space-y-3">
            <Button variant="outline" size="sm" onClick={() => addItem(section.key)}>
              <Plus className="h-4 w-4" /> আইটেম যোগ করুন
            </Button>

            {section.items.map((item, idx) => (
              <Card key={idx} className="glass-hover p-4">
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => moveItem(section.key, idx, -1)}
                      aria-label="উপরে সরান"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30"
                      disabled={idx === section.items.length - 1}
                      onClick={() => moveItem(section.key, idx, 1)}
                      aria-label="নিচে সরান"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0">
                        #{idx + 1}
                      </Badge>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(section.key, idx, { title: e.target.value })}
                        placeholder="শিরোনাম"
                        className="font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-red-400 hover:text-red-300"
                        onClick={() => removeItem(section.key, idx)}
                        aria-label="মুছুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <textarea
                      rows={Math.min(Math.max(item.lines.length + 1, 3), 12)}
                      value={item.lines.join("\n")}
                      onChange={(e) =>
                        updateItem(section.key, idx, { lines: e.target.value.split("\n") })
                      }
                      className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                      placeholder={"প্রতি লাইনে একটা পয়েন্ট/সংলাপ\nদ্বিতীয় লাইন"}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ডিফল্ট কনটেন্টে ফেরাবেন?</DialogTitle>
            <DialogDescription>
              এডিটরের সব আইটেম পার্টনার কার্ড ডকের মূল কনটেন্ট দিয়ে বদলে যাবে (সংরক্ষণ করার আগে বাতিল করা যাবে)।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>বাতিল</Button>
            <Button variant="destructive" onClick={onReset}>হ্যাঁ, ফেরান</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
