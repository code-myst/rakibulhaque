// app/go/[slug]/route.js — স্মার্ট রিডাইরেক্ট (Next.js 14 + Vercel)
// /hostinger  (next.config.mjs-এর rewrite হয়ে)  →  /go/hostinger  →  এই ফাইল  →  302 → এফিলিয়েট লিংক
// কোনো এক্সট্রা প্যাকেজ লাগে না। শুধু Vercel env: AFFILIATE_API_URL = Apps Script-এর exec URL
import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';

const API = process.env.AFFILIATE_API_URL;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless|lighthouse/i;

// রেসপন্স পাঠানোর পরেও ক্লিক গোনার কাজ শেষ করতে দেওয়া (Vercel-এর নিজস্ব রানটাইম থেকে — প্যাকেজ ছাড়াই)।
// না পেলে (যেমন লোকাল ডেভ) true ফেরত দেয় না, তখন নিচে সংক্ষিপ্ত অপেক্ষা করা হয়।
function runInBackground(p) {
  try {
    const ctx = globalThis[Symbol.for('@vercel/request-context')];
    const wu = ctx && ctx.get && ctx.get() && ctx.get().waitUntil;
    if (typeof wu === 'function') { wu(p); return true; }
  } catch {}
  return false;
}

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
    const click = fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'click', id: info.id }) }).catch(() => {});
    if (!runInBackground(click)) await Promise.race([click, new Promise((r) => setTimeout(r, 1500))]);   // ব্যাকগ্রাউন্ড না পেলে সর্বোচ্চ ১.৫ সেকেন্ড অপেক্ষা
  }

  const res = NextResponse.redirect(dest, 302);   // 302: লিংক বদলালে সাথে সাথে কাজ করে
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
