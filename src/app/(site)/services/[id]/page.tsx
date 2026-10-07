"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, FileQuestion, ShieldCheck } from "lucide-react";
import { subscribePackages } from "@/lib/packages";
import { fetchPublicSettings } from "@/lib/settings";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { serviceIcon } from "@/lib/service-icons";
import type { PricingPackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDialog, PackageCard } from "@/components/site/pricing-ui";

export default function ServicePricingPage() {
  const { id } = useParams<{ id: string }>();
  const { siteOrDefault: site } = useSiteContent();
  const { lang, t } = useLang();
  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [rules, setRules] = React.useState<string[]>([]);
  const [ordering, setOrdering] = React.useState<PricingPackage | null>(null);

  React.useEffect(() => {
    const unsub = subscribePackages((pkgs) => setPackages(pkgs.filter((p) => p.active)));
    fetchPublicSettings().then((s) => {
      setWhatsapp(s.whatsappNumber);
      setRules(s.pricingRules ?? []);
    });
    return unsub;
  }, []);

  const svc = site.services.find((s) => s.id === id);

  if (!svc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <FileQuestion className="mx-auto mb-4 h-12 w-12 opacity-40" />
        <h1 className="text-xl font-bold">
          {lang === "bn" ? "সার্ভিস পাওয়া যায়নি" : "Service not found"}
        </h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" /> {lang === "bn" ? "সব সার্ভিস" : "All services"}
          </Link>
        </Button>
      </div>
    );
  }

  const Icon = serviceIcon(svc.icon);
  const all = packages ?? [];
  const categories = svc.categories ?? [];

  return (
    <div>
      {/* Service hero */}
      <section className="dot-grid relative border-b border-white/10">
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="mb-5">
            <Link href="/services">
              <ArrowLeft className="h-4 w-4" /> {lang === "bn" ? "সব সার্ভিস" : "All services"}
            </Link>
          </Button>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/40">
              <Icon className="h-8 w-8 text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t(svc.title)}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t(svc.description)}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                {svc.features.map((f, i) => (
                  <li key={i} className="flex gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {t(f)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Categories → packages */}
      <section className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {packages === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {categories.map((cat) => {
              const items = all
                .filter((p) => p.category === cat.key)
                .sort((a, b) => Number(!!b.popular) - Number(!!a.popular));
              if (items.length === 0) return null;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight">{cat.label}</h2>
                    <span className="h-px flex-1 bg-white/10" />
                    <Badge variant="secondary">{items.length} টি</Badge>
                  </div>
                  <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((pkg, i) => (
                      <PackageCard key={pkg.id} pkg={pkg} onOrder={setOrdering} index={i} />
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {all.filter((p) => categories.some((c) => c.key === p.category)).length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {lang === "bn"
                    ? "এই সার্ভিসে এখনো প্যাকেজ যোগ করা হয়নি।"
                    : "No packages in this service yet."}
                </p>
              </Card>
            )}
          </>
        )}

        {/* Rules */}
        <Card className="p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-violet-300" />
            {lang === "bn" ? "সাধারণ নিয়ম" : "General rules"}
          </h4>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <OrderDialog ordering={ordering} whatsapp={whatsapp} onClose={() => setOrdering(null)} />
    </div>
  );
}
