"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { serviceIcon } from "@/lib/service-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ServicesPage() {
  const { siteOrDefault: site } = useSiteContent();
  const { lang, t } = useLang();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
          {lang === "bn" ? "সার্ভিসেস" : "Services"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {lang === "bn"
            ? "প্রতিটা সার্ভিসের নিচে সেই সার্ভিসের প্রাইসিং — সার্ভিস বেছে নিন, প্যাকেজ দেখুন, অর্ডার করুন।"
            : "Each service links to its own pricing — pick a service, view packages, order."}
        </p>
      </motion.div>

      <div className="mt-10 space-y-6">
        {site.services.map((svc, i) => {
          const Icon = serviceIcon(svc.icon);
          return (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
            >
              <Card className="glass-hover card-sheen p-6 sm:p-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/40">
                    <Icon className="h-7 w-7 text-violet-300" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{t(svc.title)}</h2>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {t(svc.description)}
                    </p>
                    <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-muted-foreground sm:grid-cols-3">
                      {svc.features.map((f, j) => (
                        <li key={j} className="flex gap-1.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          {t(f)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44">
                    {svc.pricingCategory ? (
                      <Button asChild>
                        <Link href={`/pricing?category=${svc.pricingCategory}`}>
                          {lang === "bn" ? "প্রাইসিং দেখুন" : "View Pricing"}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link href="/contact">{lang === "bn" ? "যোগাযোগ করুন" : "Contact"}</Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/contact">{lang === "bn" ? "প্রশ্ন করুন" : "Ask a question"}</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 text-center">
        <p className="font-semibold text-violet-200">
          {lang === "bn" ? "কোন সার্ভিস আপনার জন্য সঠিক — নিশ্চিত নন?" : "Not sure which service fits you?"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "bn"
            ? "ফ্রি Starter সাইট দিয়ে শুরু করুন — পছন্দ হলে বাড়ান।"
            : "Start with the free Starter site — scale if you like it."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/pricing?category=free">
            {lang === "bn" ? "ফ্রি প্যাকেজ দেখুন" : "See the Free Package"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
