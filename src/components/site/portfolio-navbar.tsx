"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Globe, Menu, UserCircle, X } from "lucide-react";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "home", en: "Home", bn: "হোম" },
  { href: "/services", key: "services", en: "Services", bn: "সার্ভিসেস" },
  { href: "/about", key: "about", en: "About", bn: "আমার সম্পর্কে" },
  { href: "/blog", key: "blog", en: "Blog", bn: "ব্লগ" },
  { href: "/contact", key: "contact", en: "Contact", bn: "যোগাযোগ" },
];

export function PortfolioNavbar() {
  const { siteOrDefault } = useSiteContent();
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
            <Code2 className="h-5 w-5 text-violet-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight">{siteOrDefault.profile.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">CODEMYST</p>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.key}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-white/[0.06] text-violet-200" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lang === "bn" ? l.bn : l.en}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle */}
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="glass-hover flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            aria-label="ভাষা পরিবর্তন"
          >
            <Globe className="h-3.5 w-3.5 text-sky-300" />
            {lang === "bn" ? "বাং" : "EN"}
          </button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/profile">
              <UserCircle className="h-4 w-4" /> প্রোফাইল
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((s) => !s)}
            aria-label="মেনু"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-background/90 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {LINKS.map((l) => (
                <Link
                  key={l.key}
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                >
                  {lang === "bn" ? l.bn : l.en}
                </Link>
              ))}
              <Button asChild className="mt-2 w-full">
                <Link href="/profile">
                  <UserCircle className="h-4 w-4" /> প্রোফাইল / অ্যাকাউন্ট
                </Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
