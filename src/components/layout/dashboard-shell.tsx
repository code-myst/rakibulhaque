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
  FileText,
  FolderKanban,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareHeart,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle,
  Users,
  UsersRound,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "কমার্শিয়াল",
    items: [
      { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
      { href: "/admin/services", label: "সার্ভিসেস", icon: Layers },
      { href: "/admin/pricing", label: "প্রাইসিং", icon: Tag },
      { href: "/admin/partners", label: "পার্টনারস", icon: UsersRound },
      { href: "/admin/clients", label: "ক্লায়েন্টস ও অর্ডার", icon: Users },
      { href: "/admin/withdrawals", label: "উইথড্র", icon: Banknote },
      { href: "/admin/resources", label: "রিসোর্সেস", icon: BookOpen },
      { href: "/admin/settings", label: "সেটিংস", icon: Settings },
    ],
  },
  {
    label: "জেনারেল",
    items: [
      { href: "/admin/site", label: "সাইট কনটেন্ট", icon: Globe },
      { href: "/admin/site/projects", label: "প্রজেক্টস", icon: FolderKanban },
      { href: "/admin/site/blog", label: "ব্লগ", icon: FileText },
      { href: "/admin/site/messages", label: "মেসেজেস", icon: Inbox },
      { href: "/admin/site/recommendations", label: "রেকমেন্ডেশনস", icon: MessageSquareHeart },
    ],
  },
];

export const PARTNER_NAV: NavItem[] = [
  { href: "/partner", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/partner/clients", label: "আমার ক্লায়েন্ট", icon: Users },
  { href: "/partner/withdraw", label: "উইথড্র", icon: Banknote },
  { href: "/partner/resources", label: "রিসোর্সেস", icon: BookOpen },
  { href: "/partner/profile", label: "প্রোফাইল", icon: UserCircle },
];

/* ---------------- Sidebar (desktop) ---------------- */

function SidebarContent({
  groups,
  role,
}: {
  groups: NavGroup[];
  role: UserRole;
}) {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <Link href={`/${role}`} className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
          <Code2 className="h-5 w-5 text-violet-300" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">
            {role === "admin" ? "RHB Admin" : "RHB Partner"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {role === "admin" ? "Commercial + Site" : "Affiliation Portal"}
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi} className="space-y-1">
            {group.label && (
              <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  item.href !== "/partner" &&
                  pathname.startsWith(item.href));
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
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
                      active && "text-violet-300"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Public site link */}
      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="glass-hover flex h-8 items-center gap-2 rounded-md border border-white/15 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5 text-sky-300" />
          পোর্টফোলিও সাইট দেখুন
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
            <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={() => signOut()}>
              <LogOut /> লগআউট
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ---------------- Mobile bottom tab bar ---------------- */

function BottomTabBar({ groups, role }: { groups: NavGroup[]; role: UserRole }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const flat = groups.flatMap((g) => g.items);
  const primary = flat.slice(0, 4);
  const rest = flat.slice(4);

  const ItemLink = ({ item }: { item: NavItem }) => {
    const active =
      pathname === item.href ||
      (item.href !== "/admin" && item.href !== "/partner" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
          active ? "text-violet-300" : "text-muted-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_hsl(258_90%_66%/0.7)]")} />
        <span className="w-full truncate text-center">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[hsl(240_8%_6%)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-1.5">
          {primary.map((item) => (
            <ItemLink key={item.href} item={item} />
          ))}
          {rest.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>আরও</span>
            </button>
          )}
        </div>
      </nav>

      {/* More sheet */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-xs pb-[env(safe-area-inset-bottom)]">
          <DialogHeader>
            <DialogTitle>সব পেজ</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {rest.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
            <SignOutRow />
          </div>
        </DialogContent>
      </Dialog>
      {/* role kept for future per-role tab configs */}
      <span className="hidden">{role}</span>
    </>
  );
}

function SignOutRow() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut()}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-white/[0.06]"
    >
      <LogOut className="h-4 w-4" /> লগআউট
    </button>
  );
}

/* ---------------- Shell ---------------- */

export function DashboardShell({
  nav,
  groups,
  role,
  banner,
  children,
}: {
  nav?: NavItem[];
  groups?: NavGroup[];
  role: UserRole;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const resolvedGroups: NavGroup[] =
    groups ?? (nav ? [{ label: role === "admin" ? "" : "", items: nav }] : []);
  const flat = resolvedGroups.flatMap((g) => g.items);
  const pathname = usePathname();

  const activeLabel =
    [...flat]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ?? "ড্যাশবোর্ড";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 lg:block">
        <SidebarContent groups={resolvedGroups} role={role} />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-background/60 px-4 backdrop-blur-xl sm:px-6">
          <h2 className="truncate text-sm font-semibold sm:text-base">{activeLabel}</h2>
          <Badge
            variant={role === "admin" ? "default" : "secondary"}
            className="ml-auto hidden sm:inline-flex"
          >
            {role === "admin" ? (
              <>
                <ShieldCheck className="h-3 w-3" /> Admin
              </>
            ) : (
              "Partner"
            )}
          </Badge>
        </header>

        {banner}

        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">
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

      {/* Mobile bottom tabs */}
      <BottomTabBar groups={resolvedGroups} role={role} />
    </div>
  );
}
