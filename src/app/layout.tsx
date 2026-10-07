import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Rakibul Haque — Web, Apps & AI · CODEMYST",
    template: "%s · RHB Portal",
  },
  description:
    "Portfolio, dynamic pricing & partner portal of Rakibul Haque Bhuiyan — websites, mobile/desktop apps, AI automation & agents.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  other: { "mobile-web-app-capable": "yes" },
  appleWebApp: { title: "RHB Portal", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
