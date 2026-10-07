"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { sendContactMessage } from "@/lib/site-content";
import { useSiteContent } from "@/context/site-content";
import { useLang } from "@/hooks/use-lang";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, "নাম লিখুন").max(60),
  email: z.string().email("সঠিক ইমেইল দিন"),
  text: z.string().min(5, "মেসেজ লিখুন").max(1500),
  password: z.string().max(40).optional(),
});
type ContactValues = z.infer<typeof formSchema>;

export default function ContactPage() {
  const { siteOrDefault: site } = useSiteContent();
  const { lang, t } = useLang();
  const { toast } = useToast();
  const [sent, setSent] = React.useState<{ accountCreated: boolean } | null>(null);

  const form = useForm<ContactValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", text: "", password: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    const res = await sendContactMessage({
      name: values.name,
      email: values.email,
      text: values.text,
      password: values.password?.trim() || undefined,
    });
    if (res.error) {
      toast({ variant: "destructive", title: "সমস্যা!", description: res.error });
      return;
    }
    setSent({ accountCreated: res.accountCreated });
    form.reset();
  };

  const waLink = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(
    lang === "bn" ? "আসসালামু আলাইকুম! একটা প্রজেক্ট নিয়ে কথা বলতে চাই।" : "Hello! I'd like to discuss a project."
  )}`;

  const infoItems = [
    { icon: Mail, label: lang === "bn" ? "ইমেইল" : "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: Phone, label: lang === "bn" ? "ফোন" : "Phone", value: site.contact.phone, href: `tel:${site.contact.phone}` },
    { icon: MessageCircle, label: "WhatsApp", value: site.contact.phone, href: waLink },
    { icon: MapPin, label: lang === "bn" ? "লোকেশন" : "Location", value: t(site.contact.location) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
          {lang === "bn" ? "যোগাযোগ করুন" : "Contact Me"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {lang === "bn"
            ? "প্রজেক্ট, প্রশ্ন বা কোটেশন — মেসেজ পাঠান, দ্রুত উত্তর পাবেন।"
            : "Projects, questions or quotes — send a message, get a fast reply."}
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Info */}
        <div className="space-y-3 lg:col-span-2">
          {infoItems.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <Card className="glass-hover flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
                  <Icon className="h-5 w-5 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="truncate text-sm font-medium">{item.value}</p>
                </div>
              </Card>
            );
            return item.href ? (
              <a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {inner}
              </a>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}

          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {lang === "bn" ? "সোশ্যাল" : "Social"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {site.contact.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-hover rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </Card>
        </div>

        {/* Form */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {lang === "bn" ? "মেসেজ পাঠান" : "Send a Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="mt-4 font-bold">
                  {lang === "bn" ? "মেসেজ পাঠানো হয়েছে! 🎉" : "Message sent! 🎉"}
                </h3>
                {sent.accountCreated ? (
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {lang === "bn"
                      ? "আপনার অ্যাকাউন্ট খুলেছে — পরে “আমার মেসেজ” পেজে ইমেইল + পাসওয়ার্ড দিয়ে লগইন করে রিপ্লাই দেখতে পারবেন।"
                      : "Your account is created — check replies later from the “My Messages” page using your email + password."}
                  </p>
                ) : (
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    {lang === "bn"
                      ? "গেস্ট হিসেবে পাঠানো হয়েছে। উত্তর পেতে চাইলে পরেরবার পাসওয়ার্ড বক্স ব্যবহার করুন।"
                      : "Sent as guest. Use the password box next time to track replies."}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline">
                    <a href="/inbox">
                      <Inbox className="h-4 w-4" /> {lang === "bn" ? "আমার মেসেজ" : "My Messages"}
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={() => setSent(null)}>
                    {lang === "bn" ? "আরেকটা পাঠান" : "Send another"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{lang === "bn" ? "নাম" : "Name"}</Label>
                    <Input placeholder={lang === "bn" ? "আপনার নাম" : "Your name"} {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>{lang === "bn" ? "ইমেইল" : "Email"}</Label>
                    <Input type="email" placeholder="you@mail.com" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "bn" ? "মেসেজ" : "Message"}</Label>
                  <textarea
                    rows={5}
                    className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                    placeholder={
                      lang === "bn"
                        ? "কী ধরনের সাইট/অ্যাপ/AI দরকার, বাজেট, সময়সীমা…"
                        : "What kind of site/app/AI do you need, budget, timeline…"
                    }
                    {...form.register("text")}
                  />
                  {form.formState.errors.text && (
                    <p className="text-xs text-red-400">{form.formState.errors.text.message}</p>
                  )}
                </div>

                {/* Secret account box */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/[0.07] p-4">
                  <Label className="flex items-center gap-1.5 text-violet-200">
                    <KeyRound className="h-3.5 w-3.5" />
                    {lang === "bn" ? "মেসেজ সেভ রাখার জন্য পাসওয়ার্ড (ঐচ্ছিক)" : "Password to save your messages (optional)"}
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    className="mt-2"
                    {...form.register("password")}
                  />
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {lang === "bn"
                      ? "দিলে এই ইমেইল দিয়ে অ্যাকাউন্ট খুলে যাবে — পরে"
                      : "Creates an account with this email — later open"}
                    <a href="/inbox" className="inline-flex items-center gap-1 font-semibold text-violet-300 hover:underline">
                      <Inbox className="h-3 w-3" /> {lang === "bn" ? "আমার মেসেজ" : "My Messages"}
                    </a>
                    {lang === "bn" ? "থেকে রিপ্লাই দেখতে পারবেন।" : "to see replies."}
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {lang === "bn" ? "মেসেজ পাঠান" : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
