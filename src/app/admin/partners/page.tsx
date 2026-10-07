"use client";

import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import {
  deleteApp,
  initializeApp,
  FirebaseError,
} from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut as secondarySignOut,
} from "firebase/auth";
import {
  collection,
  doc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import {
  Banknote,
  Loader2,
  Check,
  Crown,
  Hourglass,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { db, firebaseConfig } from "@/lib/firebase";
import { generatePartnerId } from "@/lib/users";
import { useAllClients, useAllUsers } from "@/hooks/use-firestore-data";
import type { AppUser } from "@/lib/types";
import { formatBDT, formatDate , firebaseErrText} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const phoneRegex = /^01[3-9]\d{8}$/;

const addSchema = z.object({
  name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের"),
  phone: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন (যেমন 01712345678)"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের"),
  commissionRate: z.number().refine((v): boolean => v === 15 || v === 20, "১৫ অথবা ২০ নির্বাচন করুন"),
  status: z.enum(["active", "pending", "banned"]),
});
type AddValues = z.infer<typeof addSchema>;

const idRegex = /^CM-\d{3,}$/;

const editSchema = z.object({
  partnerId: z.string().regex(idRegex, "ফরম্যাট: CM-001 (কমপক্ষে ৩ ডিজিট)"),
  name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের"),
  phone: z.string().regex(phoneRegex, "সঠিক ১১ ডিজিটের নম্বর দিন (যেমন 01712345678)"),
  commissionRate: z.number().refine((v): boolean => v === 15 || v === 20 || v === 10, "১৫ / ২০ (বা ১০ — রিপিট ক্লায়েন্ট) নির্বাচন করুন"),
  status: z.enum(["active", "pending", "banned"]),
});
type EditValues = z.infer<typeof editSchema>;

/**
 * Admin creates the partner's Auth account on a throwaway secondary app
 * so the admin's own session is never replaced.
 */
async function createPartnerAccount(values: AddValues): Promise<{ uid: string; partnerId: string }> {
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    const email = values.email?.trim() || `${values.phone}@rhb.partners`;
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, values.password);
    const partnerId = await generatePartnerId();
    const profile = {
      uid: cred.user.uid,
      name: values.name.trim(),
      phone: values.phone,
      email,
      role: "partner" as const,
      partnerId,
      commissionRate: values.commissionRate,
      status: values.status,
      balance: 0,
      totalEarnings: 0,
    };
    await setDoc(doc(db, "users", cred.user.uid), { ...profile, createdAt: serverTimestamp() });
    return { uid: cred.user.uid, partnerId };
  } finally {
    await secondarySignOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondary).catch(() => undefined);
  }
}

function statusBadgeVariant(status: AppUser["status"]) {
  return status === "active" ? "success" : status === "pending" ? "warning" : "destructive";
}

export default function AdminPartnersPage() {
  const { data: users, loading } = useAllUsers();
  const { data: allClients } = useAllClients();
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AppUser | null>(null);
  const [deleting, setDeleting] = React.useState<AppUser | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const partners = users
    .filter((u) => u.role === "partner")
    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.partnerId.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    );

  const addForm = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: "", phone: "", email: "", password: "", commissionRate: 15, status: "active" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  React.useEffect(() => {
    if (editing) {
      editForm.reset({
        partnerId: editing.partnerId,
        name: editing.name,
        phone: editing.phone,
        commissionRate: editing.commissionRate,
        status: editing.status,
      });
    }
  }, [editing, editForm]);

  const onAdd = async (values: AddValues) => {
    setBusy(true);
    try {
      const { partnerId } = await createPartnerAccount(values);
      toast({
        title: "পার্টনার যোগ হয়েছে ✅",
        description: `${values.name} — আইডি ${partnerId}`,
      });
      addForm.reset();
      setAddOpen(false);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      toast({
        variant: "destructive",
        title: "পার্টনার তৈরি ব্যর্থ",
        description:
          code === "auth/email-already-in-use"
            ? "এই ইমেইল/ফোন দিয়ে আগেই একটি অ্যাকাউন্ট আছে।"
            : "সমস্যা হয়েছে, আবার চেষ্টা করুন।",
      });
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (values: EditValues) => {
    if (!editing) return;
    setBusy(true);
    try {
      const oldId = editing.partnerId;
      const newId = values.partnerId.trim().toUpperCase();

      // ID বদলালে ইউনিকনেস চেক
      if (newId !== oldId) {
        const dup = await getDocs(query(collection(db, "users"), where("partnerId", "==", newId)));
        if (!dup.empty) {
          toast({
            variant: "destructive",
            title: "আইডি ইতিমধ্যে ব্যবহৃত",
            description: `${newId} আরেকজন পার্টনারের — ভিন্ন আইডি দিন।`,
          });
          setBusy(false);
          return;
        }
      }

      await updateDoc(doc(db, "users", editing.uid), {
        partnerId: newId,
        name: values.name.trim(),
        phone: values.phone,
        commissionRate: values.commissionRate,
        status: values.status,
      });

      // রেফারেন্স মাইগ্রেশন: পুরনো ID-এর সব clients + withdrawals নতুন ID-তে
      if (newId !== oldId) {
        const [clientSnaps, withdrawSnaps] = await Promise.all([
          getDocs(query(collection(db, "clients"), where("referredBy", "==", oldId))),
          getDocs(query(collection(db, "withdrawals"), where("partnerId", "==", oldId))),
        ]);
        const batch = writeBatch(db);
        clientSnaps.docs.forEach((d) => batch.update(d.ref, { referredBy: newId }));
        withdrawSnaps.docs.forEach((d) => batch.update(d.ref, { partnerId: newId }));
        await batch.commit();
      }

      toast({
        title: "আপডেট হয়েছে ✅",
        description:
          newId !== oldId
            ? `${values.name} — নতুন আইডি ${newId}; সব রেফারেন্স মাইগ্রেট হয়েছে।`
            : `${values.name}-এর তথ্য সংরক্ষিত হয়েছে।`,
      });
      setEditing(null);
    } catch (err) {
      console.error("partner update failed:", err);
      toast({ variant: "destructive", title: "আপডেট ব্যর্থ", description: firebaseErrText(err) });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "users", deleting.uid));
      toast({
        title: "পার্টনার মুছে ফেলা হয়েছে",
        description: "নোট: লগইন অ্যাকাউন্টটি Firebase Auth-এ থেকে যাবে — প্রয়োজনে Console থেকে ডিলিট করুন।",
      });
      setDeleting(null);
    } catch {
      toast({ variant: "destructive", title: "ডিলিট ব্যর্থ", description: "আবার চেষ্টা করুন।" });
    } finally {
      setBusy(false);
    }
  };

  const pendingPartners = users.filter((u) => u.role === "partner" && u.status === "pending");

  const onApprove = async (p: AppUser) => {
    setBusyId(p.uid);
    try {
      await updateDoc(doc(db, "users", p.uid), { status: "active" });
      toast({
        title: "পার্টনার অ্যাপ্রুভ ✅",
        description: `${p.name} (${p.partnerId}) — এখন ড্যাশবোর্ড ও রেফারেল লিংক ব্যবহার করতে পারবে।`,
      });
    } catch {
      toast({ variant: "destructive", title: "অ্যাপ্রুভ ব্যর্থ" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Pending approvals ── */}
      {pendingPartners.length > 0 && (
        <Card className="border-amber-500/30 p-0">
          <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 p-4">
            <Hourglass className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-200">অপেন্ডিং অ্যাপ্রুভাল</h2>
            <Badge variant="warning" className="ml-auto">{pendingPartners.length} জন</Badge>
          </div>
          <div className="divide-y divide-white/5">
            {pendingPartners.map((p) => (
              <div key={p.uid} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {p.name}
                    <code className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-mono text-xs text-violet-300">
                      {p.partnerId}
                    </code>
                  </p>
                  <p className="text-xs text-muted-foreground">{p.phone || p.email || "—"}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  {p.paymentNumber ? (
                    <span>
                      <Badge variant="secondary">{p.paymentMethod}</Badge>{" "}
                      <span className="font-mono">{p.paymentNumber}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300">পেমেন্ট নম্বর দেয়নি</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busyId === p.uid}
                    onClick={() => onApprove(p)}
                  >
                    {busyId === p.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    অ্যাপ্রুভ
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === p.uid}
                    onClick={() => setDeleting(p)}
                  >
                    <X className="h-4 w-4" /> রিজেক্ট
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">পার্টনারস</h1>
          <p className="text-sm text-muted-foreground">সব অ্যাফিলিয়েট পার্টনার পরিচালনা করুন</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> পার্টনার যোগ করুন
        </Button>
      </div>

      <Card className="p-0">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন…"
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">
            {partners.length} জন
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>পার্টনার</TableHead>
              <TableHead>আইডি</TableHead>
              <TableHead>রেট</TableHead>
              <TableHead className="text-right">ব্যালান্স</TableHead>
              <TableHead className="text-right">মোট আয়</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>যোগদান</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && partners.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  <UsersRound className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  কোনো পার্টনার নেই — উপরের বাটন থেকে যুক্ত করুন।
                </TableCell>
              </TableRow>
            )}
            {partners.map((p) => {
              const paidOrders = allClients.filter(
                (c) => c.referredBy === p.partnerId && c.status === "paid" && c.amount > 0
              ).length;
              const isGold = paidOrders >= 3;
              return (
                <TableRow key={p.uid}>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium">
                      {p.name}
                      {p.commissionRate === 20 && (
                        <Crown className="h-3.5 w-3.5 text-amber-400" aria-label="Gold Partner" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  </TableCell>
                  <TableCell>
                    <code className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-mono text-xs text-violet-300">
                      {p.partnerId}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.commissionRate}%</Badge>
                    {isGold && p.commissionRate < 20 && (
                      <p className="mt-0.5 text-[10px] text-amber-400">
                        {paidOrders} পেইড — Gold হিন্ট
                      </p>
                    )}
                  </TableCell>
                <TableCell className="text-right font-semibold text-emerald-300">
                  {formatBDT(p.balance)}
                </TableCell>
                <TableCell className="text-right">{formatBDT(p.totalEarnings)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt ?? 0)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="অ্যাকশন">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(p)}>
                        <Pencil /> এডিট
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-300"
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 /> ডিলিট
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* ── Add dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-violet-300" /> নতুন পার্টনার
            </DialogTitle>
            <DialogDescription>
              অ্যাকাউন্ট তৈরি হবে; ইমেইল না দিলে ফোন নম্বরই লগইন আইডি হবে।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input placeholder="পার্টনারের নাম" {...addForm.register("name")} />
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
                <Label>ইমেইল (ঐচ্ছিক)</Label>
                <Input type="email" placeholder="partner@mail.com" {...addForm.register("email")} />
                {addForm.formState.errors.email && (
                  <p className="text-xs text-red-400">{addForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>টেম্পোরারি পাসওয়ার্ড</Label>
                <Input type="text" placeholder="কমপক্ষে ৬ অক্ষর" {...addForm.register("password")} />
                {addForm.formState.errors.password && (
                  <p className="text-xs text-red-400">{addForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>কমিশন রেট</Label>
                <Controller
                  control={addForm.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="রেট" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">১৫% — স্ট্যান্ডার্ড</SelectItem>
                        <SelectItem value="20">২০% — প্রিমিয়াম</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>স্ট্যাটাস</Label>
                <Controller
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="স্ট্যাটাস" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "তৈরি হচ্ছে…" : "পার্টনার তৈরি করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-violet-300" /> পার্টনার এডিট
            </DialogTitle>
            <DialogDescription>
              {editing?.name} ({editing?.partnerId})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>পার্টনার আইডি</Label>
                <Input placeholder="CM-001" className="font-mono" {...editForm.register("partnerId")} />
                {editForm.formState.errors.partnerId ? (
                  <p className="text-xs text-red-400">{editForm.formState.errors.partnerId.message}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    বদলালে এই পার্টনারের সব ক্লায়েন্ট ও উইথড্র রেফারেন্স অটো-মাইগ্রেট হবে
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input {...editForm.register("name")} />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-red-400">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>ফোন</Label>
                <Input {...editForm.register("phone")} />
                {editForm.formState.errors.phone && (
                  <p className="text-xs text-red-400">{editForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>কমিশন রেট</Label>
                <Controller
                  control={editForm.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="রেট" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">১০% — রিপিট ক্লায়েন্ট</SelectItem>
                        <SelectItem value="15">১৫% — স্ট্যান্ডার্ড</SelectItem>
                        <SelectItem value="20">২০% — Gold Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>স্ট্যাটাস</Label>
                <Controller
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="স্ট্যাটাস" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                বাতিল
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "সংরক্ষণ…" : "সংরক্ষণ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>পার্টনার ডিলিট করবেন?</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{deleting?.name}</span>-এর প্রোফাইল
              মুছে যাবে। এই কাজ ফিরিয়ে আনা যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={busy}>
              <Trash2 className="h-4 w-4" /> ডিলিট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
