"use client";

import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import Link from "next/link";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowRightCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { syncOrderStatusToSiteAccount } from "@/lib/site-content";
import { useSiteAuth } from "@/hooks/use-site-auth";
import { useAllClients, useAllUsers } from "@/hooks/use-firestore-data";
import type { Client, ClientStatus } from "@/lib/types";
import { formatBDT, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const phoneRegex = /^01[3-9]\d{8}$/;

const PACKAGES = [
  "Starter Launch (Free)",
  "Personal — Starter",
  "Personal — Standard",
  "Personal — Premium",
  "Business — Starter",
  "Business — Standard",
  "Business — Premium",
  "LMS — Basic",
  "LMS — Standard",
  "LMS — Multi-tenant",
  "Blog",
  "News Portal",
  "Update Service",
  "Maintenance",
  "Custom Project",
];

const clientSchema = z.object({
  name: z.string().min(2, "ক্লায়েন্টের নাম দিন"),
  phone: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন"),
  package: z.string().min(1, "প্যাকেজ নির্বাচন করুন"),
  amount: z.coerce.number().min(0, "০ বা তার বেশি দিন"),
  referredBy: z.string().min(1, "পার্টনার বা DIRECT নির্বাচন করুন"),
  commissionRate: z.string().optional(), // "" = পার্টনারের রেট
  note: z.string().max(500).optional(),
});
type ClientValues = z.infer<typeof clientSchema>;

const convertSchema = z.object({
  amount: z.coerce.number().positive("সঠিক অঙ্ক দিন"),
  markPaidNow: z.boolean(),
});
type ConvertValues = z.infer<typeof convertSchema>;

const followUpSchema = z.object({
  note: z.string().min(2, "নোট লিখুন").max(400),
});
type FollowUpValues = z.infer<typeof followUpSchema>;

const STATUS_META: Record<
  ClientStatus,
  { label: string; badge: "warning" | "default" | "success"; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Pending", badge: "warning", icon: Clock },
  working: { label: "Working", badge: "default", icon: Wrench },
  paid: { label: "Paid", badge: "success", icon: CheckCircle2 },
};

type ClientTab = "all" | "orders" | "leads";


/** অর্ডারের status ক্লায়েন্টের সাইট প্রোফাইলে মিরর — ব্যর্থ হলে কারণ জানায় */
async function mirrorSync(
  client: Client,
  status: "pending" | "working" | "paid",
  toast: ReturnType<typeof useToast>["toast"]
) {
  const res = await syncOrderStatusToSiteAccount(client, status);
  if (!res.ok) {
    const reasons: Record<string, string> = {
      "not-logged-in": "সাইট প্রজেক্টে (rakibul-haque) লগইন নেই — জেনারেল → যেকোনো পেজে একবার লগইন করুন।",
      "not-admin": "সাইট প্রজেক্টে আপনার role 'admin' নেই — সেই প্রজেক্টের users/{আপনার-uid}-এ role দিন।",
      "account-not-found": "এই ইমেইলে সাইট অ্যাকাউন্ট পাওয়া যায়নি।",
      "no-link": "এই পুরনো অর্ডারটি কোনো অ্যাকাউন্টের সাথে লিংক করা নেই।",
      error: "সিঙ্ক ব্যর্থ — console দেখুন।",
    };
    toast({
      variant: "destructive",
      title: "প্রোফাইল সিঙ্ক হয়নি",
      description: reasons[res.reason ?? "error"],
    });
  }
}

export default function AdminClientsPage() {
  const { data: clients, loading } = useAllClients();
  const { data: users } = useAllUsers();
  const { toast } = useToast();
  const { siteUser } = useSiteAuth();
  const [tab, setTab] = React.useState<ClientTab>("all");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ClientStatus>("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [following, setFollowing] = React.useState<Client | null>(null);
  const [converting, setConverting] = React.useState<Client | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const partners = users.filter((u) => u.role === "partner");
  const partnerByPid = React.useMemo(
    () => new Map(partners.map((p) => [p.partnerId, p])),
    [partners]
  );

  const filtered = clients
    .filter((c) => {
      if (tab === "orders") return c.source === "pricing";
      if (tab === "leads") return c.amount === 0 && c.status !== "paid";
      return true;
    })
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.referredBy.toLowerCase().includes(search.toLowerCase())
    );

  const addForm = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", package: "", amount: 0, referredBy: "DIRECT", commissionRate: "", note: "" },
  });

  const editForm = useForm<ClientValues>({ resolver: zodResolver(clientSchema) });
  const convertForm = useForm<ConvertValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: { amount: 0, markPaidNow: false },
  });
  const followUpForm = useForm<FollowUpValues>({ resolver: zodResolver(followUpSchema) });

  React.useEffect(() => {
    if (editing) {
      editForm.reset({
        name: editing.name,
        phone: editing.phone,
        package: editing.package,
        amount: editing.amount,
        referredBy: editing.referredBy || "DIRECT",
        commissionRate:
          editing.commissionRate === null || editing.commissionRate === undefined
            ? ""
            : String(editing.commissionRate),
        note: editing.note ?? "",
      });
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (converting) {
      convertForm.reset({ amount: converting.amount || 0, markPaidNow: false });
    }
  }, [converting]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAdd = async (values: ClientValues) => {
    try {
      await addDoc(collection(db, "clients"), {
        name: values.name.trim(),
        phone: values.phone,
        package: values.package,
        amount: Math.round(values.amount),
        referredBy: values.referredBy,
        status: "pending",
        source: "admin",
        isFree: Math.round(values.amount) === 0,
        commissionRate: values.commissionRate ? Number(values.commissionRate) : null,
        followUps: [],
        note: values.note?.trim() || "",
        createdAt: serverTimestamp(),
      });
      toast({
        title: "ক্লায়েন্ট যোগ হয়েছে ✅",
        description:
          values.referredBy === "DIRECT"
            ? `${values.name} — অ্যাডমিনের নিজের অর্ডার (কমিশন নেই)`
            : `${values.name} — ${values.referredBy}`,
      });
      addForm.reset({ name: "", phone: "", package: "", amount: 0, referredBy: "DIRECT", commissionRate: "", note: "" });
      setAddOpen(false);
    } catch {
      toast({ variant: "destructive", title: "যোগ করা যায়নি", description: "আবার চেষ্টা করুন।" });
    }
  };

  const onEdit = async (values: ClientValues) => {
    if (!editing) return;
    const isPaid = editing.status === "paid";
    setBusyId(editing.id);
    try {
      await updateDoc(doc(db, "clients", editing.id), {
        name: values.name.trim(),
        phone: values.phone,
        package: values.package,
        // paid হলে amount/referredBy/রেট লক — কমিশন ইন্টেগ্রিটি
        ...(isPaid
          ? {}
          : {
              amount: Math.round(values.amount),
              referredBy: values.referredBy,
              commissionRate: values.commissionRate ? Number(values.commissionRate) : null,
              isFree: Math.round(values.amount) === 0,
            }),
        ...(values.note ? { note: values.note.trim() } : {}),
      });
      toast({ title: "আপডেট হয়েছে ✅", description: `${values.name}-এর তথ্য সংরক্ষিত।` });
      setEditing(null);
    } catch {
      toast({ variant: "destructive", title: "আপডেট ব্যর্থ" });
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Status change. 'paid' → transaction: client paid + partner
   * balance/totalEarnings += amount × rate (client রেট override > পার্টনার রেট)।
   * DIRECT হলে কমিশন হিসাবই হয় না — ১০০% অ্যাডমিনের।
   */
  const changeStatus = async (client: Client, next: ClientStatus) => {
    if (client.status === next) return;
    if (client.status === "paid") {
      toast({
        variant: "destructive",
        title: "পরিবর্তন করা যাবে না",
        description: "পেইড ক্লায়েন্টের স্ট্যাটাস আর পরিবর্তন করা যায় না (কমিশন ইতিমধ্যে ক্রেডিট)।",
      });
      return;
    }

    setBusyId(client.id);
    try {
      if (next !== "paid" || client.referredBy === "DIRECT" || client.amount <= 0) {
        await runTransaction(db, async (tx) => {
          tx.update(doc(db, "clients", client.id), { status: next });
        });
        await mirrorSync(client, next, toast);
        toast({
          title: "স্ট্যাটাস আপডেট",
          description:
            next === "paid" && (client.referredBy === "DIRECT" || client.amount <= 0)
              ? `${client.name} → Paid (কমিশন নেই: ${client.referredBy === "DIRECT" ? "DIRECT অর্ডার" : "৳০ অর্ডার"})`
              : `${client.name} → ${next}`,
        });
        return;
      }

      const partner = partnerByPid.get(client.referredBy);
      if (!partner) {
        toast({
          variant: "destructive",
          title: "পার্টনার পাওয়া যায়নি",
          description: `আইডি ${client.referredBy} দিয়ে কোনো পার্টনার নেই।`,
        });
        return;
      }

      const commission = await runTransaction(db, async (tx) => {
        const cSnap = await tx.get(doc(db, "clients", client.id));
        const uSnap = await tx.get(doc(db, "users", partner.uid));
        if (!cSnap.exists() || cSnap.data().status === "paid") return 0;
        if (!uSnap.exists()) throw new Error("partner-missing");

        const liveAmount = (cSnap.data().amount as number) ?? client.amount;
        const rate =
          (cSnap.data().commissionRate as number | null) ??
          (uSnap.data().commissionRate as number) ??
          15;
        const earned = Math.round((liveAmount * rate) / 100);
        tx.update(doc(db, "clients", client.id), { status: "paid" });
        tx.update(doc(db, "users", partner.uid), {
          balance: ((uSnap.data().balance as number) ?? 0) + earned,
          totalEarnings: ((uSnap.data().totalEarnings as number) ?? 0) + earned,
        });
        return earned;
      });

      await mirrorSync(client, "paid", toast);
      if (commission > 0) {
        toast({
          title: "পেমেন্ট সম্পন্ন ✅",
          description: `${partner.name}-এর ব্যালান্সে ${formatBDT(commission)} কমিশন যোগ হয়েছে।`,
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "partner-missing"
          ? "পার্টনার প্রোফাইল পাওয়া যায়নি।"
          : "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।";
      toast({ variant: "destructive", title: "সমস্যা!", description: msg });
    } finally {
      setBusyId(null);
    }
  };

  /** ফ্রি/কোটেশন লিড → পেইড প্রজেক্টে কনভার্ট */
  const onConvert = async (values: ConvertValues) => {
    if (!converting) return;
    const client = converting;
    setBusyId(client.id);
    const amount = Math.round(values.amount);
    try {
      if (values.markPaidNow) {
        // সরাসরি paid — রেফারাল থাকলে কমিশন ক্রেডিট
        if (client.referredBy === "DIRECT") {
          await updateDoc(doc(db, "clients", client.id), {
            amount,
            status: "paid",
            isFree: false,
          });
          await mirrorSync(client, "paid", toast);
          toast({ title: "কনভার্ট সম্পন্ন ✅", description: `${client.name} → Paid (DIRECT, কমিশন নেই)` });
        } else {
          const partner = partnerByPid.get(client.referredBy);
          if (!partner) throw new Error("partner-missing");
          const commission = await runTransaction(db, async (tx) => {
            const cSnap = await tx.get(doc(db, "clients", client.id));
            const uSnap = await tx.get(doc(db, "users", partner.uid));
            if (!cSnap.exists() || cSnap.data().status === "paid") return 0;
            if (!uSnap.exists()) throw new Error("partner-missing");
            const rate =
              (cSnap.data().commissionRate as number | null) ??
              (uSnap.data().commissionRate as number) ??
              15;
            const earned = Math.round((amount * rate) / 100);
            tx.update(doc(db, "clients", client.id), { amount, status: "paid", isFree: false });
            tx.update(doc(db, "users", partner.uid), {
              balance: ((uSnap.data().balance as number) ?? 0) + earned,
              totalEarnings: ((uSnap.data().totalEarnings as number) ?? 0) + earned,
            });
            return earned;
          });
          toast({
            title: "কনভার্ট + পেমেন্ট সম্পন্ন ✅",
            description:
              commission > 0
                ? `${client.name} → Paid; ${partner.name} পেলেন ${formatBDT(commission)}`
                : `${client.name} → Paid`,
          });
        }
      } else {
        await updateDoc(doc(db, "clients", client.id), {
          amount,
          status: "working",
          isFree: false,
        });
        await mirrorSync(client, "working", toast);
        toast({ title: "কনভার্ট হয়েছে ✅", description: `${client.name} → Working (${formatBDT(amount)}) — পেমেন্ট নিলে Paid করুন।` });
      }
      syncOrderStatusToSiteAccount(
        { ...client, amount },
        values.markPaidNow ? "paid" : "working"
      ).catch(() => undefined);
      setConverting(null);
    } catch {
      toast({ variant: "destructive", title: "কনভার্ট ব্যর্থ" });
    } finally {
      setBusyId(null);
    }
  };

  const onFollowUp = async (values: FollowUpValues) => {
    if (!following) return;
    setBusyId(following.id);
    try {
      await updateDoc(doc(db, "clients", following.id), {
        followUps: arrayUnion({ at: Date.now(), note: values.note.trim() }),
      });
      toast({ title: "ফলো-আপ যোগ হয়েছে ✅" });
      followUpForm.reset();
      setFollowing(null);
    } catch {
      toast({ variant: "destructive", title: "যোগ করা যায়নি" });
    } finally {
      setBusyId(null);
    }
  };

  const waHref = (phone: string, name?: string) =>
    `https://wa.me/88${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
      `আসসালামু আলাইকুম${name ? ` ${name}` : ""}! Rakibul Haque (CODEMYST) — আপনার ওয়েবসাইট সংক্রান্ত কথা বলছি।`
    )}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">ক্লায়েন্টস ও অর্ডার</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-emerald-300">Paid</span> হলে কমিশন অটো-ক্রেডিট ·
            DIRECT = কমিশন নেই (আপনার ১০০%)
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> ক্লায়েন্ট যোগ করুন
        </Button>
      </div>

      {!siteUser && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          ⚠️ প্রোফাইল সিঙ্ক বন্ধ — সাইট প্রজেক্টে (rakibul-haque) লগইন নেই।{" "}
          <Link href="/admin/site" className="font-semibold underline">
            জেনারেল → সাইট কনটেন্ট
          </Link>{" "}
          পেজে একবার লগইন করলেই অর্ডার status ক্লায়েন্টের প্রোফাইলে যেতে থাকবে।
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as ClientTab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all" className="gap-1.5">
            <Users className="h-4 w-4" /> সব
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingCart className="h-4 w-4" /> ওয়েবসাইট অর্ডার
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {clients.filter((c) => c.source === "pricing").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5">
            <Sparkles className="h-4 w-4" /> ফ্রি ও কোটেশন লিডস
            <Badge variant="warning" className="ml-1 text-[10px]">
              {clients.filter((c) => c.amount === 0 && c.status !== "paid").length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ফোন বা পার্টনার আইডি…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="shrink-0">{filtered.length} টি</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ক্লায়েন্ট</TableHead>
              <TableHead>প্যাকেজ</TableHead>
              <TableHead>রেফার্ড বাই</TableHead>
              <TableHead className="text-right">অ্যামাউন্ট</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead className="w-28 text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  কোনো ক্লায়েন্ট পাওয়া যায়নি।
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => {
              const meta = STATUS_META[c.status];
              const StatusIcon = meta.icon;
              const isLead = c.amount === 0 && c.status !== "paid";
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium">
                      {c.name}
                      {c.source === "pricing" && (
                        <Badge variant="secondary" className="text-[10px]">ওয়েবসাইট</Badge>
                      )}
                      {c.isFree && <Badge variant="warning" className="text-[10px]">ফ্রি</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </TableCell>
                  <TableCell className="text-sm">{c.package}</TableCell>
                  <TableCell>
                    <code
                      className={`rounded-md border px-1.5 py-0.5 font-mono text-xs ${
                        c.referredBy === "DIRECT"
                          ? "border-white/10 bg-white/[0.05] text-muted-foreground"
                          : "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      }`}
                    >
                      {c.referredBy}
                    </code>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatBDT(c.amount)}
                    {c.status !== "paid" && c.referredBy !== "DIRECT" && c.amount > 0 && (
                      <p className="text-[10px] font-normal text-emerald-400/80">
                        কমিশন ~{formatBDT(
                          Math.round(
                            (c.amount * (c.commissionRate ?? partnerByPid.get(c.referredBy)?.commissionRate ?? 15)) / 100
                          )
                        )}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
                          disabled={busyId === c.id}
                        >
                          {busyId === c.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <StatusIcon className="h-3 w-3" />
                          )}
                          {meta.label}
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>স্ট্যাটাস পরিবর্তন</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={c.status === "pending"} onClick={() => changeStatus(c, "pending")}>
                          <Clock /> Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={c.status === "working"} onClick={() => changeStatus(c, "working")}>
                          <Wrench /> Working
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={c.status === "paid"}
                          onClick={() => changeStatus(c, "paid")}
                          className="text-emerald-400 focus:text-emerald-300"
                        >
                          <CheckCircle2 /> Paid (কমিশন ক্রেডিট)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <a
                        href={waHref(c.phone, c.name)}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp-এ যোগাযোগ"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-400 transition-colors hover:bg-white/10"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      {isLead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="পেইডে কনভার্ট"
                          className="text-violet-300"
                          onClick={() => setConverting(c)}
                        >
                          <ArrowRightCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={isLead ? "ফলো-আপ নোট" : "এডিট"}
                        onClick={() => (isLead ? setFollowing(c) : setEditing(c))}
                      >
                        {isLead ? <History className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* ── Add client ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-violet-300" /> নতুন ক্লায়েন্ট
            </DialogTitle>
            <DialogDescription>
              পার্টনার ছাড়া নিজের অর্ডার হলে <span className="font-semibold text-foreground">DIRECT</span> রাখুন —
              পেইড হলে কোনো কমিশন কাটবে না।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input placeholder="ক্লায়েন্টের নাম" {...addForm.register("name")} />
                {addForm.formState.errors.name && (
                  <p className="text-xs text-red-400">{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>ফোন</Label>
                <Input placeholder="01712345678" {...addForm.register("phone")} />
                {addForm.formState.errors.phone && (
                  <p className="text-xs text-red-400">{addForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>প্যাকেজ</Label>
                <Controller
                  control={addForm.control}
                  name="package"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="প্যাকেজ" /></SelectTrigger>
                      <SelectContent>
                        {PACKAGES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>অ্যামাউন্ট (৳) — ফ্রি হলে ০</Label>
                <Input type="number" {...addForm.register("amount")} />
              </div>
              <div className="space-y-1.5">
                <Label>রেফার্ড বাই</Label>
                <Controller
                  control={addForm.control}
                  name="referredBy"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT">DIRECT — অ্যাডমিনের নিজের (কমিশন নেই)</SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.uid} value={p.partnerId}>
                            {p.partnerId} — {p.name} ({p.commissionRate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>কমিশন রেট ওভাররাইড (%)</Label>
                <Input placeholder="খালি = পার্টনারের রেট" inputMode="numeric" {...addForm.register("commissionRate")} />
                <p className="text-[11px] text-muted-foreground">যেমন: ৬ মাসের মধ্যে রিপিট ক্লায়েন্ট → ১০</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Input placeholder="যেমন: bKash-এ অ্যাডভান্স দিয়েছে" {...addForm.register("note")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>বাতিল</Button>
              <Button type="submit">যোগ করুন</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit client ── */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-violet-300" /> ক্লায়েন্ট এডিট
            </DialogTitle>
            <DialogDescription>
              {editing?.status === "paid" ? (
                <span className="text-amber-300">
                  পেইড ক্লায়েন্ট — অ্যামাউন্ট ও রেফারেন্স লক (কমিশন ইতিমধ্যে ক্রেডিট)
                </span>
              ) : (
                "তথ্য বদলে সংরক্ষণ করুন"
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input {...editForm.register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>ফোন</Label>
                <Input {...editForm.register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>প্যাকেজ</Label>
                <Controller
                  control={editForm.control}
                  name="package"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PACKAGES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>অ্যামাউন্ট (৳)</Label>
                <Input type="number" disabled={editing?.status === "paid"} {...editForm.register("amount")} />
              </div>
              <div className="space-y-1.5">
                <Label>রেফার্ড বাই</Label>
                <Controller
                  control={editForm.control}
                  name="referredBy"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={editing?.status === "paid"}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT">DIRECT — অ্যাডমিনের নিজের</SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.uid} value={p.partnerId}>
                            {p.partnerId} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>কমিশন রেট ওভাররাইড (%)</Label>
                <Input
                  placeholder="খালি = পার্টনারের রেট"
                  inputMode="numeric"
                  disabled={editing?.status === "paid"}
                  {...editForm.register("commissionRate")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>নোট</Label>
                <Input {...editForm.register("note")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>বাতিল</Button>
              <Button type="submit" disabled={busyId !== null}>
                {busyId ? "সংরক্ষণ…" : "সংরক্ষণ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Convert lead to paid ── */}
      <Dialog open={!!converting} onOpenChange={(o) => !o && setConverting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightCircle className="h-4 w-4 text-violet-300" /> পেইড প্রজেক্টে কনভার্ট
            </DialogTitle>
            <DialogDescription>
              {converting?.name} ({converting?.referredBy}) — ফ্রি/কোটেশন লিডকে পেইড প্রজেক্টে আনুন
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={convertForm.handleSubmit(onConvert)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>প্রজেক্ট ভ্যালু (৳)</Label>
              <Input type="number" {...convertForm.register("amount")} />
              {convertForm.formState.errors.amount && (
                <p className="text-xs text-red-400">{convertForm.formState.errors.amount.message}</p>
              )}
            </div>
            <Controller
              control={convertForm.control}
              name="markPaidNow"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 accent-violet-500"
                  />
                  পেমেন্ট এখনই নেওয়া হয়েছে (সরাসরি Paid — রেফারাল থাকলে কমিশন ক্রেডিট হবে)
                </label>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConverting(null)}>বাতিল</Button>
              <Button type="submit" disabled={busyId !== null}>
                {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                কনভার্ট করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Follow-up dialog ── */}
      <Dialog open={!!following} onOpenChange={(o) => !o && setFollowing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-violet-300" /> ফলো-আপ — {following?.name}
            </DialogTitle>
            <DialogDescription>
              ফ্রি/কোটেশন লিডের সাথে যোগাযোগের হিস্টোরি রাখুন — পরে কনভার্ট করা সহজ হবে
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-56 space-y-2 overflow-y-auto">
            {(following?.followUps ?? []).length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">এখনো কোনো নোট নেই।</p>
            ) : (
              (following?.followUps ?? []).map((f, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{formatDate(f.at)}</p>
                  <p className="mt-0.5 text-sm">{f.note}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={followUpForm.handleSubmit(onFollowUp)} className="space-y-3" noValidate>
            <div className="space-y-1.5">
              <Label>নতুন নোট</Label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                placeholder="যেমন: কলে বলেছে ঈদের পর ভাববে — ১৫ তারিখে আবার ফলো-আপ"
                {...followUpForm.register("note")}
              />
              {followUpForm.formState.errors.note && (
                <p className="text-xs text-red-400">{followUpForm.formState.errors.note.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFollowing(null)}>বন্ধ</Button>
              <Button type="submit" disabled={busyId !== null}>
                {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                নোট যোগ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
