"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { subscribePackages } from "@/lib/packages";
import { fetchPublicSettings } from "@/lib/settings";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { serviceIcon } from "@/lib/service-icons";
import type { PricingPackage } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDialog, PackageCard, RefBadge } from "@/components/site/pricing-ui";

function PricingPageInner() {
  const searchParams = useSearchParams();
  const ref = (searchParams.get("ref") ?? "").toUpperCase();
  const validRef = /^CM-\d{3,}$/.test(ref) ? ref : null;

  const [packages, setPackages] = React.useState<PricingPackage[] | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [rules, setRules] = React.useState<string[]>([]);
  const [ordering, setOrdering] = React.useState<PricingPackage | null>(null);
  const { siteOrDefault: site } = useSiteContent();
  const { lang } = useLang();

  React.useEffect(() => {
    const unsub = subscribePackages((pkgs) => setPackages(pkgs.filter((p) => p.active)));
    fetchPublicSettings().then((s) => {
      setWhatsapp(s.whatsappNumber);
      setRules(s.pricingRules ?? []);
    });
    return unsub;
  }, []);

  const all = packages ?? [];

  return (
    <div className="dot-grid relative">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            শুরুতেই একটা সাইট একদম ফ্রি
          </div>
          <h1 className="text-gradient mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            সার্ভিস বেছে নিন, প্যাকেজ বাছুন
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            প্রতিটা সার্ভিসের অধীনে ক্যাটাগরি ও প্যাকেজ — যেটা দরকার সেটাতেই অর্ডার করুন।
          </p>
          <div className="mt-4 flex justify-center">
            <RefBadge referral={validRef} />
          </div>
          {validRef && (
            <p className="mt-2 text-xs text-emerald-400">
              অর্ডার করলে সেটা অটো <span className="font-semibold">{validRef}</span> পার্টনারের নামে রেকর্ড হবে ✅
            </p>
          )}
        </motion.div>
      </section>

      {/* Service sections */}
      <section className="mx-auto max-w-6xl space-y-14 px-4 py-8 sm:px-6">
        {packages === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {site.services.map((svc) => {
              const items = all.filter((p) =>
                (svc.categories ?? []).some((c) => c.key === p.category)
              );
              if (items.length === 0) return null;
              const Icon = serviceIcon(svc.icon);
              return (
                <div key={svc.id}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/40">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight sm:text-xl">{lang === "bn" ? svc.title.bn || svc.title.en : svc.title.en}</h2>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{lang === "bn" ? svc.description.bn || svc.description.en : svc.description.en}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {items.length} টি প্ল্যান
                    </span>
                  </div>

                  {(svc.categories ?? []).map((cat) => {
                    const catItems = items
                      .filter((p) => p.category === cat.key)
                      .sort((a, b) => Number(!!b.popular) - Number(!!a.popular));
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat.key} className="mb-6">
                        <h3 className="mb-3 text-sm font-bold text-violet-300">— {cat.label}</h3>
                        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {catItems.map((pkg, i) => (
                            <PackageCard key={pkg.id} pkg={pkg} onOrder={setOrdering} index={i} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* কোনো সার্ভিসে ম্যাপ হয়নি এমন প্যাকেজ */}
            {(() => {
              const mappedKeys = new Set(
                site.services.flatMap((s) => (s.categories ?? []).map((c) => c.key))
              );
              const others = all.filter((p) => !mappedKeys.has(p.category));
              if (others.length === 0) return null;
              return (
                <div>
                  <h2 className="mb-5 text-lg font-bold tracking-tight sm:text-xl">
                    {lang === "bn" ? "অন্যান্য প্যাকেজ" : "Other Packages"}
                  </h2>
                  <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {others.map((pkg, i) => (
                      <PackageCard key={pkg.id} pkg={pkg} onOrder={setOrdering} index={i} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {all.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  এখনো কোনো প্যাকেজ যোগ করা হয়নি। খুব দ্রুত যোগ করা হবে — ততক্ষণ WhatsApp-এ যোগাযোগ করুন।
                </p>
              </Card>
            )}
          </>
        )}
      </section>

      {/* Rules */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Card className="p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-violet-300" /> সব প্ল্যানের সাধারণ নিয়ম
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

      <OrderDialog ordering={ordering} whatsapp={whatsapp} referral={validRef} onClose={() => setOrdering(null)} />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="dot-grid flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      }
    >
      <PricingPageInner />
    </Suspense>
  );
}
