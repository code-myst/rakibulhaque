"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  BookOpen,
  Code2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/admin/pricing", label: "প্রাইসিং", icon: Tag },
  { href: "/admin/partners", label: "পার্টনারস", icon: UsersRound },
  { href: "/admin/clients", label: "ক্লায়েন্টস ও অর্ডার", icon: Users },
  { href: "/admin/withdrawals", label: "উইথড্র", icon: Banknote },
  { href: "/admin/resources", label: "রিসোর্সেস", icon: BookOpen },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings },
];

export const PARTNER_NAV: NavItem[] = [
  { href: "/partner", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/partner/clients", label: "আমার ক্লায়েন্ট", icon: Users },
  { href: "/partner/withdraw", label: "উইথড্র", icon: Banknote },
  { href: "/partner/resources", label: "রিসোর্সেস", icon: BookOpen },
  { href: "/partner/profile", label: "প্রোফাইল", icon: UserCircle },
];

function SidebarContent({ nav, role }: { nav: NavItem[]; role: UserRole }) {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href={`/${role}`} className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
          <Code2 className="h-5 w-5 text-violet-300" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">RHB Partner</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {role === "admin" ? "Admin Console" : "Partner Portal"}
          </p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/admin` && item.href !== `/partner` && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/15 text-violet-200 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.06)]"
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-400" />
              )}
              <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-violet-300")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Public pricing link */}
      <div className="border-t border-white/10 p-3">
        <a
          href="/pricing"
          target="_blank"
          rel="noreferrer"
          className="glass-hover flex h-8 items-center gap-2 rounded-md border border-white/15 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5 text-sky-300" />
          পাবলিক Pricing পেজ
        </a>
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="glass-hover flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/20 ring-1 ring-white/20">
                <span className="text-sm font-bold text-violet-100">
                  {(appUser?.name ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{appUser?.name ?? "Guest"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {appUser?.partnerId ?? "—"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-300" />
              {appUser?.role === "admin" ? "Admin অ্যাকাউন্ট" : "Partner অ্যাকাউন্ট"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300"
              onClick={() => signOut()}
            >
              <LogOut /> লগআউট
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Sidebar + topbar frame used by both /admin and /partner layouts */
export function DashboardShell({
  nav,
  role,
  banner,
  children,
}: {
  nav: NavItem[];
  role: UserRole;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const activeLabel =
    [...nav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ?? "ড্যাশবোর্ড";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 lg:block">
        <SidebarContent nav={nav} role={role} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass fixed inset-y-0 left-0 z-50 w-64 border-r border-white/15 bg-[hsl(240_8%_6%)]/95 lg:hidden"
            >
              <button
                className="absolute right-3 top-4 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
                aria-label="মেনু বন্ধ করুন"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent nav={nav} role={role} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-background/60 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="মেনু খুলুন"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="truncate text-sm font-semibold sm:text-base">{activeLabel}</h2>
          <Badge variant={role === "admin" ? "default" : "secondary"} className="ml-auto hidden sm:inline-flex">
            {role === "admin" ? (
              <>
                <ShieldCheck className="h-3 w-3" /> Admin View
              </>
            ) : (
              "Partner View"
            )}
          </Badge>
        </header>

        {banner}

        {/* Page content with subtle route transition */}
        <main className="flex-1 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto w-full max-w-6xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
