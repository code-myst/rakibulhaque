"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBlogPost, saveBlogPost, subscribeBlog } from "@/lib/site-content";
import type { BlogPost } from "@/lib/types";
import { formatDate , firebaseErrText} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { LangField } from "@/components/admin/lang-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const postSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "ছোট হাতের a-z, 0-9 আর ড্যাশ (-) ব্যবহার করুন"),
  cover: z.string().optional(),
  tagsText: z.string().optional(),
  published: z.boolean(),
});
type PostValues = z.infer<typeof postSchema>;

function BlogEditor() {
  const [posts, setPosts] = React.useState<BlogPost[] | null>(null);
  const [editing, setEditing] = React.useState<BlogPost | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = subscribeBlog(setPosts);
    return unsub;
  }, []);

  const form = useForm<PostValues>({ resolver: zodResolver(postSchema) });

  React.useEffect(() => {
    if (adding) {
      form.reset({ slug: "", cover: "", tagsText: "", published: false });
      setEditing(null);
    }
  }, [adding]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (post: BlogPost) => {
    setAdding(false);
    setEditing(post);
    form.reset({
      slug: post.slug,
      cover: post.cover ?? "",
      tagsText: post.tags.join(", "),
      published: post.published,
    });
  };

  // লোকাল ড্রাফট — LangField গুলো ডায়ালগের ভেতরে state-এ
  const [draftTitle, setDraftTitle] = React.useState({ en: "", bn: "" });
  const [draftExcerpt, setDraftExcerpt] = React.useState({ en: "", bn: "" });
  const [draftContent, setDraftContent] = React.useState({ en: "", bn: "" });

  React.useEffect(() => {
    if (editing) {
      setDraftTitle({ ...editing.title });
      setDraftExcerpt({ ...editing.excerpt });
      setDraftContent({ ...editing.content });
    } else if (adding) {
      setDraftTitle({ en: "", bn: "" });
      setDraftExcerpt({ en: "", bn: "" });
      setDraftContent({ en: "", bn: "" });
    }
  }, [editing, adding]);

  const dialogOpen = adding || !!editing;

  const onSave = async (values: PostValues) => {
    if (!draftTitle.en && !draftTitle.bn) {
      toast({ variant: "destructive", title: "শিরোনাম দিন" });
      return;
    }
    setBusy(true);
    try {
      await saveBlogPost(
        {
          slug: values.slug,
          title: draftTitle,
          excerpt: draftExcerpt,
          content: draftContent,
          cover: values.cover || undefined,
          tags: (values.tagsText ?? "").split(",").map((t) => t.trim()).filter(Boolean),
          published: values.published,
        },
        editing?.id
      );
      toast({ title: "সংরক্ষিত ✅", description: values.published ? "ব্লগে লাইভ হয়েছে।" : "ড্রাফট হিসেবে সেভ হয়েছে।" });
      setEditing(null);
      setAdding(false);
    } catch (err) {
      console.error("save failed:", err);
      toast({ variant: "destructive", title: "সংরক্ষণ ব্যর্থ", description: firebaseErrText(err) });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (post: BlogPost) => {
    if (!confirm(`“${post.title.en || post.title.bn}” মুছে ফেলবেন?`)) return;
    try {
      await deleteBlogPost(post.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
    } catch {
      toast({ variant: "destructive", title: "ডিলিট ব্যর্থ" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <FileText className="h-5 w-5 text-sky-300" /> ব্লগ
          </h1>
          <p className="text-sm text-muted-foreground">
            পোর্টফোলিওর ব্লগ — লিখুন EN/বাংলা দুই ভাষায়
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> নতুন পোস্ট
        </Button>
      </div>

      {posts === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}
      {posts !== null && posts.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">এখনো কোনো পোস্ট নেই।</p>
        </Card>
      )}
      {posts?.map((post) => (
        <Card key={post.id} className="glass-hover flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              <span className="truncate">{post.title.en || post.title.bn}</span>
              {post.published ? <Badge variant="success">লাইভ</Badge> : <Badge variant="warning">ড্রাফট</Badge>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              /blog/{post.slug} · {formatDate(post.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => openEdit(post)} aria-label="এডিট">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400"
            onClick={() => onDelete(post)}
            aria-label="মুছুন"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null); } }}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "পোস্ট এডিট" : "নতুন ব্লগ পোস্ট"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input placeholder="my-first-post" {...form.register("slug")} />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-400">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>কভার ছবির URL (ঐচ্ছিক)</Label>
                <Input placeholder="https://…" {...form.register("cover")} />
              </div>
            </div>
            <LangField label="শিরোনাম" value={draftTitle} onChange={setDraftTitle} />
            <LangField label="সংক্ষিপ্তসার (excerpt)" value={draftExcerpt} onChange={setDraftExcerpt} multiline rows={2} />
            <LangField
              label="মূল লেখা (ফাঁকা লাইন = নতুন প্যারাগ্রাফ)"
              value={draftContent}
              onChange={setDraftContent}
              multiline
              rows={10}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ট্যাগ (কমা দিয়ে)</Label>
                <Input placeholder="Web, AI, Tutorial" {...form.register("tagsText")} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.watch("published")} onCheckedChange={(v) => form.setValue("published", v)} />
                  পাবলিশ করুন
                </label>
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
    </div>
  );
}

export default function AdminBlogPage() {
  return (
    <SiteGate>
      <BlogEditor />
    </SiteGate>
  );
}
