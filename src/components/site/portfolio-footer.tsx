"use client";

import Link from "next/link";
import { Code2, Lock } from "lucide-react";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";

export function PortfolioFooter() {
  const { siteOrDefault } = useSiteContent();
  const { lang, t } = useLang();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
                <Code2 className="h-4 w-4 text-violet-300" />
              </div>
              <p className="font-bold">{siteOrDefault.profile.name}</p>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {t(siteOrDefault.seo?.description)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {lang === "bn" ? "পেজ" : "Pages"}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services" className="hover:text-foreground">{lang === "bn" ? "সার্ভিসেস" : "Services"}</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">{lang === "bn" ? "প্রাইসিং" : "Pricing"}</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">{lang === "bn" ? "ব্লগ" : "Blog"}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">{lang === "bn" ? "যোগাযোগ" : "Contact"}</Link></li>
              <li><Link href="/inbox" className="hover:text-foreground">{lang === "bn" ? "আমার মেসেজ" : "My Messages"}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {lang === "bn" ? "সোশ্যাল" : "Social"}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {siteOrDefault.contact.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {siteOrDefault.profile.name} · CODEMYST
          </p>
          <Link href="/login" className="flex items-center gap-1.5 underline-offset-4 hover:underline">
            <Lock className="h-3 w-3" />
            {lang === "bn" ? "পার্টনার পোর্টাল" : "Partner Portal"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
