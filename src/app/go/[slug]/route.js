// app/go/[slug]/route.js — স্মার্ট রিডাইরেক্ট
// /hostinger  (next.config.js-এর rewrite হয়ে)  →  /go/hostinger  →  এই ফাইল  →  302 → এফিলিয়েট লিংক
// দরকার: Next.js 15.1+ (`after` এর জন্য) এবং env: AFFILIATE_API_URL = Apps Script-এর exec URL
import { NextResponse, after } from 'next/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // কখনো স্ট্যাটিক ক্যাশ হবে না (ক্লিক গুনতে হবে)

const API = process.env.AFFILIATE_API_URL;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless|lighthouse/i;

export async function GET(req, { params }) {
  const { slug: raw } = await params;            // Next 14/15 দুটোতেই চলে
  const slug = String(raw || '').toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();

  const home = new URL('/', req.url);
  if (!API) return NextResponse.redirect(home, 302);

  let info = null;
  try {
    // Vercel-এ ৬০ সেকেন্ড ক্যাশ: দ্রুত রিডাইরেক্ট; ড্যাশবোর্ডে বদলালে ~১ মিনিটে কার্যকর
    const r = await fetch(`${API}?action=go&slug=${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    info = await r.json();
  } catch (e) {
    return NextResponse.redirect(home, 302);      // Apps Script সাময়িক বন্ধ হলে হোমপেজে
  }
  if (!info || !info.ok) notFound();

  let dest;
  try { dest = new URL(info.url); if (!/^https?:$/.test(dest.protocol)) throw 0; } catch (e) { return NextResponse.redirect(home, 302); }

  // ক্লিক গোনা — রিডাইরেক্ট আটকায় না (বট বাদ)
  const ua = req.headers.get('user-agent') || '';
  if (info.id && !BOT.test(ua)) {
    after(async () => {
      try { await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'click', id: info.id }) }); } catch (e) {}
    });
  }

  const res = NextResponse.redirect(dest, 302);   // 302: লিংক বদলালে সাথে সাথে কাজ করে
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
