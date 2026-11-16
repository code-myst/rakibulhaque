"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Code2 } from "lucide-react";
import type { SiteProject } from "@/lib/types";
import { safeExternalUrl } from "@/lib/project-links";
import { useLang } from "@/hooks/use-lang";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ProjectDetail({ project }: { project: SiteProject }) {
  const { lang, t } = useLang();
  const liveUrl = safeExternalUrl(project.liveUrl || project.link || "");
  const sourceUrl = safeExternalUrl(project.sourceCodeUrl || "");
  const details = project.details ? t(project.details) : "";

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          {lang === "bn" ? "হোমে ফিরুন" : "Back to home"}
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card className="glass card-sheen overflow-hidden">
          <div className="relative aspect-[16/10] max-h-[34rem] bg-white/[0.04]">
            {project.image ? (
              <Image src={project.image} alt={t(project.title)} fill priority className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Code2 className="size-16 text-violet-400/30" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="p-5 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{t(project.title)}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t(project.description)}
            </p>
            {project.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label={lang === "bn" ? "প্রযুক্তি" : "Technologies"}>
                {project.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            )}

            {details && (
              <div className="mt-7 border-t border-white/10 pt-6">
                <h2 className="text-lg font-bold">
                  {lang === "bn" ? "প্রজেক্ট সম্পর্কে বিস্তারিত" : "About this project"}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                  {details}
                </p>
              </div>
            )}

            {(liveUrl || sourceUrl) && (
              <div className="mt-7 flex flex-wrap gap-3">
                {liveUrl && (
                  <Button asChild>
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                      {lang === "bn" ? "লাইভ প্রজেক্ট দেখুন" : "View live project"}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {sourceUrl && (
                  <Button asChild variant="outline">
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                      {lang === "bn" ? "সোর্স কোড দেখুন" : "View source code"}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </article>
  );
}
