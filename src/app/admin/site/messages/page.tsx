"use client";

import * as React from "react";
import { arrayUnion, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import {
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  Send,
  UserSearch,
} from "lucide-react";
import { siteDb } from "@/lib/firebase-site";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useSiteAuth } from "@/hooks/use-site-auth";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Filter = "new" | "all" | "replied";

function MessagesAdmin() {
  const { siteRole } = useSiteAuth();
  const [msgs, setMsgs] = React.useState<ContactMessage[] | null>(null);
  const [active, setActive] = React.useState<ContactMessage | null>(null);
  const [reply, setReply] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const { toast } = useToast();

  // অ্যাডমিন সব মেসেজ দেখে — সরাসরি collection subscribe
  React.useEffect(() => {
    const unsub = onSnapshot(
      query(collection(siteDb, "messages"), orderBy("createdAt", "desc")),
      (snap) => {
        setMsgs(
          snap.docs.map((d) => {
            const data = d.data() as Partial<ContactMessage>;
            return {
              ...(data as ContactMessage),
              id: d.id,
              createdAt: (data.createdAt as unknown as { toMillis?: () => number })?.toMillis?.() ?? 0,
            };
          })
        );
      },
      () => setMsgs([])
    );
    return unsub;
  }, []);

  const markRead = async (m: ContactMessage) => {
    if (m.status === "new") {
      await updateDoc(doc(siteDb, "messages", m.id), { status: "read" }).catch(() => undefined);
    }
  };

  const openThread = (m: ContactMessage) => {
    setActive(m);
    markRead(m);
  };

  const onReply = async () => {
    if (!active || !reply.trim()) return;
    try {
      await updateDoc(doc(siteDb, "messages", active.id), {
        thread: arrayUnion({ from: "admin", text: reply.trim(), at: Date.now() }),
        status: "replied",
      });
      setReply("");
      toast({ title: "রিপ্লাই পাঠানো হয়েছে ✅", description: `${active.email}-কে উত্তর দেওয়া হয়েছে।` });
    } catch {
      toast({ variant: "destructive", title: "রিপ্লাই ব্যর্থ" });
    }
  };

  const filtered = (msgs ?? []).filter((m) =>
    filter === "all" ? true : filter === "new" ? m.status === "new" : m.status === "replied"
  );

  const statusBadge = (s: ContactMessage["status"]) =>
    s === "new" ? (
      <Badge variant="warning">নতুন</Badge>
    ) : s === "replied" ? (
      <Badge variant="success">রিপ্লাইড</Badge>
    ) : (
      <Badge variant="secondary">পড়া হয়েছে</Badge>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Inbox className="h-5 w-5 text-sky-300" /> মেসেজেস
        </h1>
        <p className="text-sm text-muted-foreground">
          কনটাক্ট পেজ থেকে আসা মেসেজ — রিপ্লাই দিলে ভিজিটর নিজের ইনবক্সে দেখবে
        </p>
      </div>

      {siteRole !== "admin" && (
        <Card className="border-amber-500/30 p-4 text-sm text-amber-200">
          নোট: আপনি এই প্রজেক্টে admin নন — সব মেসেজ পড়তে Firebase Console-এ নিজের
          users/{'{uid}'} ডকে <code className="font-mono">role: &quot;admin&quot;</code> দিন।
        </Card>
      )}

      <div className="flex gap-2">
        {(["new", "all", "replied"] as Filter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "new" ? `নতুন (${(msgs ?? []).filter((m) => m.status === "new").length})` : f === "all" ? "সব" : "রিপ্লাইড"}
          </Button>
        ))}
      </div>

      {msgs === null && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}
      {msgs !== null && filtered.length === 0 && (
        <Card className="p-10 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm text-muted-foreground">কোনো মেসেজ নেই।</p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((m) => (
          <Card
            key={m.id}
            className={`glass-hover cursor-pointer p-4 ${m.status === "new" ? "border-amber-500/30" : ""}`}
            onClick={() => openThread(m)}
          >
            <div className="flex items-center gap-3">
              {m.status === "new" ? (
                <Mail className="h-5 w-5 shrink-0 text-amber-400" />
              ) : (
                <MailOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {m.name}
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  {m.visitorUid && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <UserSearch className="h-2.5 w-2.5" /> অ্যাকাউন্ট
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.thread[m.thread.length - 1]?.text}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {statusBadge(m.status)}
                <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(m.createdAt)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Thread dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{active.name}</DialogTitle>
                <p className="text-xs text-muted-foreground">{active.email}</p>
              </DialogHeader>
              <div className="space-y-2">
                {active.thread.map((entry, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      entry.from === "admin"
                        ? "ml-auto bg-violet-600/25 text-violet-100"
                        : "bg-white/[0.06] text-foreground/90"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] opacity-60">
                      {entry.from === "admin" ? "আপনি" : active.name} · {formatDate(entry.at)}
                    </p>
                    {entry.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 pt-3">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="রিপ্লাই লিখুন…"
                  onKeyDown={(e) => e.key === "Enter" && onReply()}
                />
                <Button onClick={onReply} disabled={!reply.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {active.visitorUid && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCheck className="h-3 w-3" />
                  এই ভিজিটরের অ্যাকাউন্ট আছে — রিপ্লাই সে /inbox থেকে দেখতে পাবে।
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <SiteGate>
      <MessagesAdmin />
    </SiteGate>
  );
}
