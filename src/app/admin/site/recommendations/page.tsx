"use client";

import * as React from "react";
import { MessageSquareHeart, Star, Trash2 } from "lucide-react";
import { deleteRecommendation, setRecommendationStatus, subscribeRecommendations } from "@/lib/site-content";
import type { Recommendation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
        />
      ))}
    </span>
  );
}

function RecommendationsAdmin() {
  const [recs, setRecs] = React.useState<Recommendation[] | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = subscribeRecommendations(setRecs);
    return unsub;
  }, []);

  const onApprove = async (r: Recommendation) => {
    try {
      await setRecommendationStatus(r.id, "approved");
      toast({ title: "অ্যাপ্রুভ হয়েছে ✅", description: `${r.name}-এর রেকমেন্ডেশন পোর্টফোলিওতে দেখা যাবে।` });
    } catch {
      toast({ variant: "destructive", title: "অ্যাপ্রুভ ব্যর্থ" });
    }
  };

  const onRevoke = async (r: Recommendation) => {
    try {
      await setRecommendationStatus(r.id, "pending");
      toast({ title: "পেন্ডিং-এ ফেরানো হয়েছে" });
    } catch {
      toast({ variant: "destructive", title: "ব্যর্থ" });
    }
  };

  const onDelete = async (r: Recommendation) => {
    if (!confirm(`${r.name}-এর রেকমেন্ডেশন মুছে ফেলবেন?`)) return;
    try {
      await deleteRecommendation(r.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
    } catch {
      toast({ variant: "destructive", title: "ডিলিট ব্যর্থ" });
    }
  };

  const pending = (recs ?? []).filter((r) => r.status === "pending");
  const approved = (recs ?? []).filter((r) => r.status === "approved");

  const Item = ({ r }: { r: Recommendation }) => (
    <Card className="glass-hover p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{r.name}</p>
        {r.role && <span className="text-xs text-muted-foreground">— {r.role}</span>}
        <Stars n={r.rating} />
        <span className="ml-auto text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.text}</p>
      <div className="mt-3 flex gap-2">
        {r.status === "pending" ? (
          <Button size="sm" variant="success" onClick={() => onApprove(r)}>
            অ্যাপ্রুভ
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onRevoke(r)}>
            পেন্ডিং-এ ফেরান
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onDelete(r)}>
          <Trash2 className="h-4 w-4" /> মুছুন
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <MessageSquareHeart className="h-5 w-5 text-sky-300" /> রেকমেন্ডেশনস
        </h1>
        <p className="text-sm text-muted-foreground">
          ভিজিটররা গেস্ট হিসেবে রেকমেন্ডেশন দেয় — অ্যাপ্রুভ করলে পোর্টফোলিওতে দেখা যাবে
        </p>
      </div>

      {recs === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {recs !== null && (
        <>
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-200">
              পেন্ডিং <Badge variant="warning">{pending.length}</Badge>
            </h2>
            {pending.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">কোনো পেন্ডিং সাবমিশন নেই।</p>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <Item key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-200">
              অ্যাপ্রুভড <Badge variant="success">{approved.length}</Badge>
            </h2>
            {approved.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">এখনো কিছু অ্যাপ্রুভ করা হয়নি।</p>
            ) : (
              <div className="space-y-3">
                {approved.map((r) => (
                  <Item key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminRecommendationsPage() {
  return (
    <SiteGate>
      <RecommendationsAdmin />
    </SiteGate>
  );
}
