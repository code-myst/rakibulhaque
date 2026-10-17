// app/go/[slug]/route.js — স্মার্ট রিডাইরেক্ট (Next.js 14 + Vercel)
// /hostinger  (next.config.mjs-এর rewrite হয়ে)  →  /go/hostinger  →  এই ফাইল  →  302 → এফিলিয়েট লিংক
// দরকার: `npm i @vercel/functions`  এবং Vercel env: AFFILIATE_API_URL = Apps Script-এর exec URL
import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { waitUntil } from '@vercel/functions';   // রেসপন্স পাঠানোর পরেও ক্লিক গোনার কাজ শেষ করতে দেয়

const API = process.env.AFFILIATE_API_URL;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless|lighthouse/i;

// ৬০ সেকেন্ডের মেমরি ক্যাশ: একই সার্ভার ইনস্ট্যান্সে বারবার Apps Script ডাকতে হয় না (রিডাইরেক্ট দ্রুত)
const TTL = 60e3;
const cache = new Map();

async function lookup(slug) {
  const hit = cache.get(slug);
  if (hit && hit.exp > Date.now()) return hit.info;
  const r = await fetch(`${API}?action=go&slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
  const info = await r.json();
  if (cache.size > 200) cache.clear();
  cache.set(slug, { info, exp: Date.now() + TTL });
  return info;
}

export async function GET(req, { params }) {
  const slug = String(params?.slug || '').toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();

  const home = new URL('/', req.url);
  if (!API) return NextResponse.redirect(home, 302);

  let info = null;
  try { info = await lookup(slug); }
  catch { return NextResponse.redirect(home, 302); }   // Apps Script সাময়িক বন্ধ হলে হোমপেজে
  if (!info || !info.ok) notFound();

  let dest;
  try { dest = new URL(info.url); if (!/^https?:$/.test(dest.protocol)) throw 0; }
  catch { return NextResponse.redirect(home, 302); }

  // ক্লিক গোনা — রিডাইরেক্ট আটকায় না (বট বাদ)
  const ua = req.headers.get('user-agent') || '';
  if (info.id && !BOT.test(ua)) {
    waitUntil(
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'click', id: info.id }) }).catch(() => {})
    );
  }

  const res = NextResponse.redirect(dest, 302);   // 302: লিংক বদলালে সাথে সাথে কাজ করে
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
