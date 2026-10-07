"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Code2, MessageSquareHeart, Sparkles, Star, UserCircle } from "lucide-react";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { serviceIcon } from "@/lib/service-icons";
import { subscribeRecommendations } from "@/lib/site-content";
import type { Recommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PortfolioHomePage() {
  const { siteOrDefault: site } = useSiteContent();
  const { lang, t } = useLang();
  const [roleIdx, setRoleIdx] = React.useState(0);
  const [recs, setRecs] = React.useState<Recommendation[]>([]);

  React.useEffect(() => {
    const unsub = subscribeRecommendations(setRecs, true);
    return unsub;
  }, []);

  React.useEffect(() => {
    if (site.profile.roles.length < 2) return;
    const id = setInterval(() => setRoleIdx((i) => (i + 1) % site.profile.roles.length), 2600);
    return () => clearInterval(id);
  }, [site.profile.roles.length]);

  const featured = (site.projects ?? []).filter((p) => p.featured).slice(0, 3);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="dot-grid relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="success" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              {t(site.profile.badge)}
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              {site.profile.name}
            </h1>

            <div className="mt-4 h-8 text-lg font-semibold text-violet-300 sm:text-xl">
              <AnimatePresence mode="wait">
                <motion.span
                  key={roleIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                >
                  {t(site.profile.roles[roleIdx])}
                </motion.span>
              </AnimatePresence>
            </div>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t(site.profile.tagline)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={site.cta.primaryHref || "/pricing"}>
                  {t(site.cta.primaryLabel)} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={site.cta.secondaryHref || "/pricing"}>
                  {t(site.cta.secondaryLabel)}
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 blur-2xl" />
            <div className="glass card-sheen relative aspect-square overflow-hidden rounded-3xl">
              {site.profile.photoUrl ? (
                <Image
                  src={site.profile.photoUrl}
                  alt={site.profile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserCircle className="h-40 w-40 text-violet-400/40" />
                </div>
              )}
            </div>
            <div className="glass absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
              <Code2 className="h-4 w-4 text-violet-300" />
              CODEMYST
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {site.about.stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-gradient text-3xl font-extrabold sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t(s.label)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Services teaser ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {lang === "bn" ? "যা যা করি" : "What I Do"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "bn" ? "ওয়েব থেকে AI — এক ছাদের নিচে" : "From web to AI — all in one place"}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/services">
              {lang === "bn" ? "সব দেখুন" : "View all"} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.services.slice(0, 6).map((svc, i) => {
            const Icon = serviceIcon(svc.icon);
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.07, 0.4) }}
                whileHover={{ y: -4 }}
              >
                <Card className="glass-hover card-sheen h-full p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/40">
                    <Icon className="h-5 w-5 text-violet-300" />
                  </div>
                  <h3 className="mt-4 font-bold">{t(svc.title)}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {t(svc.description)}
                  </p>
                  {svc.pricingCategory && (
                    <Link
                      href={`/pricing?category=${svc.pricingCategory}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:underline"
                    >
                      {lang === "bn" ? "প্রাইসিং দেখুন" : "View pricing"} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Featured projects ── */}
      {featured.length > 0 && (
        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {lang === "bn" ? "কাজের নমুনা" : "Featured Work"}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/services">
                  {lang === "bn" ? "সার্ভিসেস" : "Services"} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featured.map((prj, i) => (
                <motion.div
                  key={prj.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="glass-hover h-full overflow-hidden">
                    <div className="relative aspect-video bg-white/[0.04]">
                      {prj.image ? (
                        <Image src={prj.image} alt={t(prj.title)} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Code2 className="h-10 w-10 text-violet-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold">{t(prj.title)}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t(prj.description)}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {prj.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recommendations ── */}
      {recs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <MessageSquareHeart className="h-6 w-6 text-sky-300" />
            {lang === "bn" ? "ক্লায়েন্টরা যা বলেন" : "What Clients Say"}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {recs.slice(0, 6).map((r) => (
              <Card key={r.id} className="glass-hover p-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">“{r.text}”</p>
                <p className="mt-3 text-xs font-semibold">
                  {r.name}
                  {r.role && <span className="font-normal text-muted-foreground"> · {r.role}</span>}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA banner ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Card className="card-sheen relative overflow-hidden p-10 text-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <h2 className="text-gradient text-2xl font-extrabold sm:text-3xl">
            {lang === "bn" ? "প্রজেক্ট শুরু করতে প্রস্তুত?" : "Ready to start your project?"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {lang === "bn"
              ? "ফ্রি ১ পেজের সাইট দিয়েই শুরু করুন — ঝুঁকি শূন্য।"
              : "Start with a free 1-page site — zero risk."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/pricing">
                {lang === "bn" ? "প্রাইসিং দেখুন" : "View Pricing"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                {lang === "bn" ? "মেসেজ পাঠান" : "Send a Message"}
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
