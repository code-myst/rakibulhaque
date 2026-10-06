"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AtSign,
  Code2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { normalizeLoginId } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FirebaseError,
} from "firebase/app";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "ইমেইল বা ফোন নম্বর দিন")
    .refine(
      (v) => /.+@.+\..+/.test(v) || /^01[3-9]\d{8}$/.test(v.replace(/\s+/g, "")),
      "সঠিক ইমেইল অথবা ১১ ডিজিটের ফোন নম্বর লিখুন"
    ),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

type LoginValues = z.infer<typeof loginSchema>;

function friendlyAuthError(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "ভুল ইমেইল/ফোন বা পাসওয়ার্ড।";
    case "auth/too-many-requests":
      return "অনেকবার চেষ্টা হয়েছে। একটু পরে আবার চেষ্টা করুন।";
    case "auth/popup-closed-by-user":
      return "Google পপআপ বন্ধ হয়ে গেছে। আবার চেষ্টা করুন।";
    case "auth/network-request-failed":
      return "নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।";
    default:
      return "লগইন করা যায়নি। আবার চেষ্টা করুন।";
  }
}

export default function LoginPage() {
  const { signIn, signInWithGoogle, effectiveRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const routeByRole = () => router.replace(effectiveRole === "admin" ? "/admin" : "/partner");

  const onSubmit = async (values: LoginValues) => {
    try {
      await signIn(normalizeLoginId(values.identifier), values.password);
      toast({ title: "স্বাগতম! 🎉", description: "সফলভাবে লগইন হয়েছে।" });
      routeByRole();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "লগইন ব্যর্থ",
        description: friendlyAuthError(err),
      });
    }
  };

  const onGoogle = async () => {
    try {
      await signInWithGoogle();
      toast({ title: "স্বাগতম! 🎉", description: "Google দিয়ে লগইন সফল হয়েছে।" });
      routeByRole();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Google লগইন ব্যর্থ",
        description: friendlyAuthError(err),
      });
    }
  };

  return (
    <main className="dot-grid relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl lg:grid-cols-2">
        {/* ── Brand panel ── */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass hidden flex-col justify-between rounded-l-2xl border-r-0 p-10 lg:flex"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
              <Code2 className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">RHB Partner</p>
              <p className="text-xs text-muted-foreground">Affiliation Portal</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              পার্টনার প্রোগ্রাম
            </div>
            <h1 className="text-gradient text-4xl font-extrabold leading-tight tracking-tight">
              রেফার করুন,
              <br />
              কমিশন আয় করুন
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              রাকিবুল হক ভূঁইয়ার ওয়েব ডেভেলপমেন্ট সার্ভিসে ক্লায়েন্ট রেফার করুন এবং
              প্রতিটি পেইড প্রজেক্টে <span className="font-semibold text-violet-300">১৫–২০%</span>{" "}
              কমিশন উপার্জন করুন।
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                রিয়েল-টাইম ক্লায়েন্ট ও ব্যালান্স ট্র্যাকিং
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                bKash / Nagad-এ দ্রুত উইথড্র
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                রেডি সেলস স্ক্রিপ্ট ও গাইডলাইন
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} rakibulhaque.com — All rights reserved
          </p>
        </motion.section>

        {/* ── Form panel ── */}
        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="rounded-r-2xl"
        >
          <Card className="h-full border-0 bg-transparent shadow-none backdrop-blur-none sm:rounded-2xl lg:bg-transparent">
            <CardHeader className="pt-10 lg:pt-24">
              <div className="mb-4 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
                  <Code2 className="h-5 w-5 text-violet-300" />
                </div>
                <p className="text-lg font-bold">RHB Partner</p>
              </div>
              <CardTitle className="text-2xl">লগইন করুন</CardTitle>
              <CardDescription>
                ইমেইল বা ফোন নম্বর দিয়ে আপনার অ্যাকাউন্টে প্রবেশ করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="identifier">ইমেইল বা ফোন</Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="identifier"
                      placeholder="you@mail.com অথবা 01712345678"
                      className="h-11 pl-9"
                      autoComplete="username"
                      {...register("identifier")}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-xs text-red-400">{errors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pl-9 pr-10"
                      autoComplete="current-password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  লগইন
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-white/10" />
                অথবা
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onGoogle}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
                  />
                </svg>
                Google দিয়ে চালিয়ে যান
              </Button>

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                নতুন পার্টনার? Google দিয়ে সাইন-আপ করুন — অ্যাডমিন অ্যাপ্রুভ করলেই
                আপনার ড্যাশবোর্ড চালু হবে।
              </p>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}
