"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { subscribeBlog } from "@/lib/site-content";
import type { BlogPost } from "@/lib/types";
import { useLang } from "@/hooks/use-lang";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogListPage() {
  const { lang, t } = useLang();
  const [posts, setPosts] = React.useState<BlogPost[] | null>(null);

  React.useEffect(() => {
    const unsub = subscribeBlog(setPosts, true);
    return unsub;
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
          {lang === "bn" ? "ব্লগ" : "Blog"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "bn"
            ? "ওয়েব, অ্যাপ ও AI নিয়ে টিপস, গাইড আর কেস স্টাডি"
            : "Tips, guides & case studies on web, apps & AI"}
        </p>
      </motion.div>

      {posts === null ? (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="mt-10 p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {lang === "bn" ? "শীঘ্রই নতুন লেখা আসছে।" : "New articles coming soon."}
          </p>
        </Card>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.07, 0.35) }}
              whileHover={{ y: -4 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <Card className="glass-hover h-full overflow-hidden">
                  <div className="relative aspect-video bg-white/[0.04]">
                    {post.cover ? (
                      <Image src={post.cover} alt={t(post.title)} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-10 w-10 text-violet-400/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] text-muted-foreground">{formatDate(post.createdAt)}</p>
                    <h2 className="mt-1.5 font-bold leading-snug">{t(post.title)}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t(post.excerpt)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                      {lang === "bn" ? "পড়ুন" : "Read"} <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
