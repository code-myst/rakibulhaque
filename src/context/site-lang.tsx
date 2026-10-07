"use client";

import * as React from "react";
import type { LText } from "@/lib/types";

export type Lang = "en" | "bn";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** LText থেকে বর্তমান ভাষার স্ট্রিং (fallback: en) */
  t: (text: LText | undefined) => string;
}

const LangContext = React.createContext<LangContextValue | undefined>(undefined);

const KEY = "rhb.lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("bn");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "en" || stored === "bn") setLangState(stored);
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
  }, []);

  const t = React.useCallback(
    (text: LText | undefined) => {
      if (!text) return "";
      return (lang === "bn" ? text.bn || text.en : text.en || text.bn) ?? "";
    },
    [lang]
  );

  const value: LangContextValue = { lang, setLang, t };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export { LangContext };
