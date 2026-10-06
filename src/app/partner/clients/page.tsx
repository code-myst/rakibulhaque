"use client";

import * as React from "react";
import { EyeOff, Search, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePartnerClients } from "@/hooks/use-firestore-data";
import type { ClientStatus } from "@/lib/types";
import { formatBDT, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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

export default function PartnerClientsPage() {
  const { appUser } = useAuth();
  const { data: clients, loading } = usePartnerClients(appUser?.partnerId);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ClientStatus>("all");

  const filtered = clients
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const totalEarnedFromClients = clients
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Math.round((c.amount * (appUser?.commissionRate ?? 15)) / 100), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">আমার ক্লায়েন্ট</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <EyeOff className="h-3.5 w-3.5" />
            প্রাইভেসির জন্য ফোন নম্বর আংশিক দেখানো হয়েছে
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1.5 text-sm">
          পেইড কমিশন: {formatBDT(totalEarnedFromClients)}
        </Badge>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম দিয়ে খুঁজুন…"
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
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ক্লায়েন্ট</TableHead>
              <TableHead>ফোন</TableHead>
              <TableHead>প্যাকেজ</TableHead>
              <TableHead className="text-right">প্রজেক্ট ভ্যালু</TableHead>
              <TableHead className="text-right">আপনার কমিশন</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>তারিখ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
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
                  কোনো ক্লায়েন্ট নেই — রেফারেল লিংক শেয়ার করে শুরু করুন!
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.name}</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground" title="প্রাইভেসির জন্য মাস্কড">
                    {c.phone.replace(/\D/g, "").length >= 6
                      ? `${c.phone.slice(0, 3)}***${c.phone.slice(-3)}`
                      : "***"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{c.package}</TableCell>
                <TableCell className="text-right">{formatBDT(c.amount)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-300">
                  {formatBDT(Math.round((c.amount * (appUser?.commissionRate ?? 15)) / 100))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === "paid" ? "success" : c.status === "working" ? "default" : "warning"
                    }
                  >
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
