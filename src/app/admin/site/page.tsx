"use client";

import * as React from "react";
import { Globe, Loader2, Plus, RotateCcw, Save, Trash2, UserCircle } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "@/lib/site-content";
import { DEFAULT_SITE_CONTENT } from "@/lib/default-site-content";
import type { SiteContent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SiteGate } from "@/components/site/site-gate";
import { LangField } from "@/components/admin/lang-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { firebaseErrText } from "@/lib/utils";

function SiteContentEditor() {
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSiteContent().then((c) => setContent(c ?? structuredClone(DEFAULT_SITE_CONTENT)));
  }, []);

  if (!content) return <Skeleton className="h-96 w-full rounded-xl" />;

  const patch = (p: Partial<SiteContent>) => {
    setContent((prev) => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      setDirty(false);
      toast({ title: "সংরক্ষিত ✅", description: "পোর্টফোলিও সাইট সাথে সাথে আপডেট হয়েছে।" });
    } catch (err) {
      console.error("site content save failed:", err);
      toast({
        variant: "destructive",
        title: "সংরক্ষণ ব্যর্থ",
        description: firebaseErrText(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setContent(structuredClone(DEFAULT_SITE_CONTENT));
    setDirty(true);
    toast({ title: "ডিফল্ট কনটেন্ট লোড হয়েছে", description: "সংরক্ষণ করলে সাইটে যাবে।" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Globe className="h-5 w-5 text-sky-300" /> সাইট কনটেন্ট
          </h1>
          <p className="text-sm text-muted-foreground">
            পোর্টফোলিওর Hero, About, Skills, Contact — সব এখান থেকে
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> ডিফল্ট
          </Button>
          <Button onClick={onSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "সংরক্ষণ করুন" : "সংরক্ষিত"}
          </Button>
        </div>
      </div>

      {/* Profile / Hero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">হিরো ও প্রোফাইল</CardTitle>
          <CardDescription>হোম পেজের উপরের অংশ — নাম, ছবি, roles, tagline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>নাম</Label>
              <Input
                value={content.profile.name}
                onChange={(e) => patch({ profile: { ...content.profile, name: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5 text-sky-300" /> প্রোফাইল ছবি (লিংক)
              </Label>
              <Input
                placeholder="https://…/photo.jpg"
                value={content.profile.photoUrl ?? ""}
                onChange={(e) => patch({ profile: { ...content.profile, photoUrl: e.target.value } })}
              />
            </div>
          </div>
          <LangField
            label="ব্যাজ (Hero-র ছোট লেখা)"
            value={content.profile.badge}
            onChange={(badge) => patch({ profile: { ...content.profile, badge } })}
          />
          <LangField
            label="Tagline"
            value={content.profile.tagline}
            onChange={(tagline) => patch({ profile: { ...content.profile, tagline } })}
            multiline
          />

          {/* Roles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Roles (animated rotation)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patch({
                    profile: {
                      ...content.profile,
                      roles: [...content.profile.roles, { en: "", bn: "" }],
                    },
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> যোগ
              </Button>
            </div>
            {content.profile.roles.map((role, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={role.en}
                  placeholder="EN"
                  onChange={(e) => {
                    const roles = [...content.profile.roles];
                    roles[i] = { ...roles[i], en: e.target.value };
                    patch({ profile: { ...content.profile, roles } });
                  }}
                />
                <Input
                  value={role.bn}
                  placeholder="বাংলা"
                  onChange={(e) => {
                    const roles = [...content.profile.roles];
                    roles[i] = { ...roles[i], bn: e.target.value };
                    patch({ profile: { ...content.profile, roles } });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-red-400"
                  onClick={() =>
                    patch({
                      profile: {
                        ...content.profile,
                        roles: content.profile.roles.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CTA বাটন</CardTitle>
          <CardDescription>Hero-র প্রাইমারি ও সেকেন্ডারি বাটন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LangField
              label="প্রাইমারি লেবেল"
              value={content.cta.primaryLabel}
              onChange={(primaryLabel) => patch({ cta: { ...content.cta, primaryLabel } })}
            />
            <div className="space-y-1.5">
              <Label>প্রাইমারি লিংক</Label>
              <Input
                value={content.cta.primaryHref}
                onChange={(e) => patch({ cta: { ...content.cta, primaryHref: e.target.value } })}
              />
            </div>
            <LangField
              label="সেকেন্ডারি লেবেল"
              value={content.cta.secondaryLabel}
              onChange={(secondaryLabel) => patch({ cta: { ...content.cta, secondaryLabel } })}
            />
            <div className="space-y-1.5">
              <Label>সেকেন্ডারি লিংক</Label>
              <Input
                value={content.cta.secondaryHref}
                onChange={(e) => patch({ cta: { ...content.cta, secondaryHref: e.target.value } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About পেজ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LangField
            label="শিরোনাম"
            value={content.about.title}
            onChange={(title) => patch({ about: { ...content.about, title } })}
          />
          {content.about.paragraphs.map((p, i) => (
            <LangField
              key={i}
              label={`প্যারাগ্রাফ ${i + 1}`}
              value={p}
              multiline
              onChange={(np) => {
                const paragraphs = [...content.about.paragraphs];
                paragraphs[i] = np;
                patch({ about: { ...content.about, paragraphs } });
              }}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                about: { ...content.about, paragraphs: [...content.about.paragraphs, { en: "", bn: "" }] },
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> প্যারাগ্রাফ যোগ
          </Button>

          {/* Stats */}
          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <div className="flex items-center justify-between">
              <Label>পরিসংখ্যান (Stats)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch({
                    about: {
                      ...content.about,
                      stats: [...content.about.stats, { value: "", label: { en: "", bn: "" } }],
                    },
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> যোগ
              </Button>
            </div>
            {content.about.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_1fr_40px] items-center gap-2">
                <Input
                  value={s.value}
                  placeholder="50+"
                  onChange={(e) => {
                    const stats = [...content.about.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    patch({ about: { ...content.about, stats } });
                  }}
                />
                <Input
                  value={s.label.en}
                  placeholder="EN label"
                  onChange={(e) => {
                    const stats = [...content.about.stats];
                    stats[i] = { ...stats[i], label: { ...stats[i].label, en: e.target.value } };
                    patch({ about: { ...content.about, stats } });
                  }}
                />
                <Input
                  value={s.label.bn}
                  placeholder="বাংলা label"
                  onChange={(e) => {
                    const stats = [...content.about.stats];
                    stats[i] = { ...stats[i], label: { ...stats[i].label, bn: e.target.value } };
                    patch({ about: { ...content.about, stats } });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400"
                  onClick={() =>
                    patch({
                      about: { ...content.about, stats: content.about.stats.filter((_, j) => j !== i) },
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">কনটাক্ট ও সোশ্যাল</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>ইমেইল</Label>
              <Input
                value={content.contact.email}
                onChange={(e) => patch({ contact: { ...content.contact, email: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ফোন</Label>
              <Input
                value={content.contact.phone}
                onChange={(e) => patch({ contact: { ...content.contact, phone: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp (880…)</Label>
              <Input
                value={content.contact.whatsapp}
                onChange={(e) => patch({ contact: { ...content.contact, whatsapp: e.target.value } })}
              />
            </div>
          </div>
          <LangField
            label="লোকেশন"
            value={content.contact.location}
            onChange={(location) => patch({ contact: { ...content.contact, location } })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>সোশ্যাল লিংক</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch({
                    contact: {
                      ...content.contact,
                      socials: [...content.contact.socials, { label: "", url: "" }],
                    },
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> যোগ
              </Button>
            </div>
            {content.contact.socials.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={s.label}
                  placeholder="LinkedIn"
                  className="max-w-36"
                  onChange={(e) => {
                    const socials = [...content.contact.socials];
                    socials[i] = { ...socials[i], label: e.target.value };
                    patch({ contact: { ...content.contact, socials } });
                  }}
                />
                <Input
                  value={s.url}
                  placeholder="https://…"
                  onChange={(e) => {
                    const socials = [...content.contact.socials];
                    socials[i] = { ...socials[i], url: e.target.value };
                    patch({ contact: { ...content.contact, socials } });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400"
                  onClick={() =>
                    patch({
                      contact: {
                        ...content.contact,
                        socials: content.contact.socials.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSiteContentPage() {
  return (
    <SiteGate>
      <SiteContentEditor />
    </SiteGate>
  );
}
