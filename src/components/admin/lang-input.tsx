"use client";

import * as React from "react";
import { useLang } from "@/hooks/use-lang";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LText } from "@/lib/types";

/** Admin এডিটরের দ্বিভাষিক ইনপুট — EN + বাংলা পাশাপাশি */
export function LangField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: LText;
  onChange: (v: LText) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const { lang } = useLang();
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="relative">
          <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-muted-foreground">
            EN
          </span>
          {multiline ? (
            <Textarea
              rows={rows}
              value={value?.en ?? ""}
              placeholder={placeholder}
              onChange={(e) => onChange({ en: e.target.value, bn: value?.bn ?? "" })}
            />
          ) : (
            <Input
              value={value?.en ?? ""}
              placeholder={placeholder}
              onChange={(e) => onChange({ en: e.target.value, bn: value?.bn ?? "" })}
            />
          )}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-violet-500/20 px-1 py-0.5 text-[9px] font-bold text-violet-300">
            বাং
          </span>
          {multiline ? (
            <Textarea
              rows={rows}
              value={value?.bn ?? ""}
              placeholder={placeholder}
              onChange={(e) => onChange({ en: value?.en ?? "", bn: e.target.value })}
            />
          ) : (
            <Input
              value={value?.bn ?? ""}
              placeholder={placeholder}
              onChange={(e) => onChange({ en: value?.en ?? "", bn: e.target.value })}
            />
          )}
        </div>
      </div>
      {lang === "bn" && (
        <p className="text-[10px] text-muted-foreground">
          সাইটে বাংলা ভার্সনটি দেখাবে (খালি হলে English fallback)
        </p>
      )}
    </div>
  );
}
