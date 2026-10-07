"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { subscribeBlog } from "@/lib/site-content";
import type { BlogPost } from "@/lib/types";
import { useLang } from "@/hooks/use-lang";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [post, setPost] = React.useState<BlogPost | null | "missing">(null);

  React.useEffect(() => {
    const unsub = subscribeBlog((posts) => {
      const found = posts.find((p) => p.slug === slug);
      setPost(found ?? "missing");
    }, true);
    return unsub;
  }, [slug]);

  if (post === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 sm:px-6">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (post === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <FileQuestion className="mx-auto mb-4 h-12 w-12 opacity-40" />
        <h1 className="text-xl font-bold">
          {lang === "bn" ? "পোস্ট পাওয়া যায়নি" : "Post not found"}
        </h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" /> {lang === "bn" ? "ব্লগে ফিরুন" : "Back to blog"}
          </Link>
        </Button>
      </div>
    );
  }

  const paragraphs = t(post.content).split(/\n\s*\n/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4" /> {lang === "bn" ? "সব লেখা" : "All posts"}
        </Link>
      </Button>

      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {t(post.title)}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      {post.cover && (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-xl border border-white/10">
          <Image src={post.cover} alt={t(post.title)} fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground/90">
            {p}
          </p>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 text-center">
        <p className="font-semibold text-violet-200">
          {lang === "bn" ? "এমন প্রজেক্ট দরকার?" : "Need a project like this?"}
        </p>
        <Button asChild className="mt-3">
          <Link href="/pricing">{lang === "bn" ? "প্রাইসিং দেখুন" : "View Pricing"}</Link>
        </Button>
      </div>
    </article>
  );
}
