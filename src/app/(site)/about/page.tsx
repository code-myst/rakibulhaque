"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Languages, UserCircle } from "lucide-react";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  const { siteOrDefault: site } = useSiteContent();
  const { lang, t } = useLang();

  const skillGroups = Array.from(
    new Set(site.about.skills.map((s) => s.group ?? "Skills"))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t(site.about.title)}
        </h1>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {site.about.paragraphs.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="mb-4 text-base leading-relaxed text-muted-foreground"
            >
              {t(p)}
            </motion.p>
          ))}

          {/* Languages */}
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Languages className="h-5 w-5 text-sky-300" />
              {lang === "bn" ? "ভাষা" : "Languages"}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {site.about.languages.map((l) => (
                <Badge key={l} variant="secondary" className="px-3 py-1.5 text-sm">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Card className="glass card-sheen overflow-hidden">
            <div className="relative aspect-square">
              {site.profile.photoUrl ? (
                <Image
                  src={site.profile.photoUrl}
                  alt={site.profile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <UserCircle className="h-32 w-32 text-violet-400/40" />
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="font-bold">{site.profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {t(site.profile.roles[0])} · CODEMYST
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">
          {lang === "bn" ? "স্কিলস" : "Skills"}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group}
              </p>
              <div className="mt-4 space-y-4">
                {site.about.skills
                  .filter((s) => (s.group ?? "Skills") === group)
                  .map((skill, i) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{skill.name}</span>
                        {skill.level != null && (
                          <span className="text-xs text-muted-foreground">{skill.level}%</span>
                        )}
                      </div>
                      {skill.level != null && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 lg:grid-cols-4">
        {site.about.stats.map((s) => (
          <div key={s.value} className="text-center">
            <p className="text-gradient text-3xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(s.label)}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Button asChild size="lg">
          <Link href="/contact">
            {lang === "bn" ? "কথা বলি" : "Let's Talk"} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
