"use client";

import * as React from "react";
import {
  FirebaseError,
} from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { Inbox, Loader2, LockKeyhole, LogOut, Send } from "lucide-react";
import { siteAuth, siteDb } from "@/lib/firebase-site";
import { subscribeMyMessages } from "@/lib/site-content";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useLang } from "@/hooks/use-lang";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InboxPage() {
  const { lang } = useLang();
  const { toast } = useToast();
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [logging, setLogging] = React.useState(false);
  const [msgs, setMsgs] = React.useState<ContactMessage[] | null>(null);
  const [replyFor, setReplyFor] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");

  React.useEffect(() => {
    const unsub = onAuthStateChanged(siteAuth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (!user) {
      setMsgs(null);
      return;
    }
    const unsub = subscribeMyMessages(user.uid, setMsgs);
    return unsub;
  }, [user]);

  const onLogin = async () => {
    setLogging(true);
    try {
      await signInWithEmailAndPassword(siteAuth, email, password);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      toast({
        variant: "destructive",
        title: lang === "bn" ? "লগইন ব্যর্থ" : "Login failed",
        description:
          code === "auth/invalid-credential" || code === "auth/user-not-found"
            ? lang === "bn"
              ? "ভুল ইমেইল বা পাসওয়ার্ড। কনটাক্ট ফর্মে দেওয়া পাসওয়ার্ড দিন।"
              : "Wrong email or password. Use the password you set on the contact form."
            : lang === "bn"
              ? "আবার চেষ্টা করুন।"
              : "Try again.",
      });
    } finally {
      setLogging(false);
    }
  };

  const onFollowUp = async (messageId: string) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(siteDb, "messages", messageId), {
        thread: arrayUnion({ from: "visitor", text: replyText.trim(), at: Date.now() }),
        status: "new",
      });
      setReplyText("");
      setReplyFor(null);
      toast({ title: lang === "bn" ? "পাঠানো হয়েছে ✅" : "Sent ✅" });
    } catch {
      toast({ variant: "destructive", title: lang === "bn" ? "পাঠানো যায়নি" : "Failed" });
    }
  };

  /* ── Login gate ── */
  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
              <LockKeyhole className="h-6 w-6 text-sky-300" />
            </div>
            <CardTitle>{lang === "bn" ? "আমার মেসেজ" : "My Messages"}</CardTitle>
            <CardDescription>
              {lang === "bn"
                ? "কনটাক্ট ফর্মে পাসওয়ার্ড দিয়ে মেসেজ পাঠিয়ে থাকলে সেই ইমেইল + পাসওয়ার্ড দিয়ে লগইন করুন — রিপ্লাই দেখতে পাবেন।"
                : "If you saved your messages with a password on the contact form, log in with that email + password to see replies."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{lang === "bn" ? "ইমেইল" : "Email"}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "bn" ? "পাসওয়ার্ড" : "Password"}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                onKeyDown={(e) => e.key === "Enter" && onLogin()}
              />
            </div>
            <Button className="w-full" onClick={onLogin} disabled={logging || !email || !password}>
              {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
              {lang === "bn" ? "ইনবক্স খুলুন" : "Open Inbox"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              {lang === "bn"
                ? "অ্যাকাউন্ট নেই? কনটাক্ট পেজে মেসেজ পাঠানোর সময় পাসওয়ার্ড দিন।"
                : "No account? Set a password when sending a message from the contact page."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Inbox ── */
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Inbox className="h-6 w-6 text-sky-300" />
            {lang === "bn" ? "আমার মেসেজ" : "My Messages"}
          </h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            fbSignOut(siteAuth).catch(() => toast({ variant: "destructive", title: "Failed" }))
          }
        >
          <LogOut className="h-4 w-4" /> {lang === "bn" ? "লগআউট" : "Log out"}
        </Button>
      </div>

      {msgs === null && (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}
      {msgs !== null && msgs.length === 0 && (
        <Card className="mt-8 p-10 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {lang === "bn" ? "এখনো কোনো মেসেজ নেই।" : "No messages yet."}
          </p>
        </Card>
      )}

      <div className="mt-8 space-y-4">
        {msgs?.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {lang === "bn" ? "কথোপকথন" : "Conversation"} · {formatDate(m.createdAt)}
              </p>
              {m.status === "replied" && (
                <Badge variant="success">{lang === "bn" ? "নতুন রিপ্লাই" : "Replied"}</Badge>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {m.thread.map((entry, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    entry.from === "admin"
                      ? "ml-auto bg-violet-600/25 text-violet-100"
                      : "bg-white/[0.06] text-foreground/90"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] opacity-60">
                    {entry.from === "admin"
                      ? lang === "bn"
                        ? "Rakibul Haque (রিপ্লাই)"
                        : "Rakibul Haque (reply)"
                      : lang === "bn"
                        ? "আপনি"
                        : "You"}{" "}
                    · {formatDate(entry.at)}
                  </p>
                  {entry.text}
                </div>
              ))}
            </div>

            {replyFor === m.id ? (
              <div className="mt-4 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={lang === "bn" ? "আরও লিখুন…" : "Write more…"}
                  onKeyDown={(e) => e.key === "Enter" && onFollowUp(m.id)}
                  autoFocus
                />
                <Button onClick={() => onFollowUp(m.id)} disabled={!replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setReplyFor(m.id);
                  setReplyText("");
                }}
              >
                {lang === "bn" ? "উত্তর দিন" : "Reply"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
