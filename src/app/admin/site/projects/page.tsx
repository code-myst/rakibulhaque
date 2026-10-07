"use client";

import * as React from "react";
import { FolderKanban, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "@/lib/site-content";
import type { SiteContent, SiteProject } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { LangField } from "@/components/admin/lang-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { firebaseErrText } from "@/lib/utils";

function ProjectsEditor() {
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSiteContent().then((c) => setContent(c ?? structuredClone({
      ...({} as SiteContent),
      services: [],
      projects: [],
    } as SiteContent)));
  }, []);

  if (!content) return <Skeleton className="h-96 w-full rounded-xl" />;

  const projects = content.projects ?? [];

  const update = (next: SiteProject[]) => {
    setContent((prev) => (prev ? { ...prev, projects: next } : prev));
    setDirty(true);
  };

  const patchProject = (idx: number, p: Partial<SiteProject>) =>
    update(projects.map((pr, i) => (i === idx ? { ...pr, ...p } : pr)));

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      setDirty(false);
      toast({ title: "সংরক্ষিত ✅", description: `${projects.length}টা প্রজেক্ট সাইটে আপডেট হয়েছে।` });
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
            <FolderKanban className="h-5 w-5 text-sky-300" /> প্রজেক্টস
          </h1>
          <p className="text-sm text-muted-foreground">পোর্টফোলিওর কাজের নমুনাগুলো</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              update([
                ...projects,
                { id: `prj-${Date.now().toString(36)}`, title: { en: "", bn: "" }, description: { en: "", bn: "" }, tags: [], featured: false },
              ])
            }
          >
            <Plus className="h-4 w-4" /> প্রজেক্ট যোগ
          </Button>
          <Button onClick={onSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "সংরক্ষণ করুন" : "সংরক্ষিত"}
          </Button>
        </div>
      </div>

      {projects.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            এখনো কোনো প্রজেক্ট নেই — “প্রজেক্ট যোগ” চাপুন।
          </p>
        </Card>
      )}

      {projects.map((prj, idx) => (
        <Card key={prj.id}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">#{idx + 1}</Badge>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={prj.featured}
                    onCheckedChange={(v) => patchProject(idx, { featured: v })}
                  />
                  Featured (হোম পেজে)
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400"
                  onClick={() => update(projects.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <LangField
              label="শিরোনাম"
              value={prj.title}
              onChange={(title) => patchProject(idx, { title })}
            />
            <LangField
              label="বর্ণনা"
              value={prj.description}
              multiline
              onChange={(description) => patchProject(idx, { description })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ছবির URL (ঐচ্ছিক)</Label>
                <Input
                  value={prj.image ?? ""}
                  placeholder="https://…/screenshot.jpg"
                  onChange={(e) => patchProject(idx, { image: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>লাইভ লিংক (ঐচ্ছিক)</Label>
                <Input
                  value={prj.link ?? ""}
                  placeholder="https://…"
                  onChange={(e) => patchProject(idx, { link: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ট্যাগ (কমা দিয়ে)</Label>
              <Input
                value={prj.tags.join(", ")}
                placeholder="Next.js, Firebase, E-commerce"
                onChange={(e) =>
                  patchProject(idx, {
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminProjectsPage() {
  return (
    <SiteGate>
      <ProjectsEditor />
    </SiteGate>
  );
}
