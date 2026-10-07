"use client";

import * as React from "react";
import { LangContext, type Lang } from "@/context/site-lang";
import type { LText } from "@/lib/types";

export function useLang() {
  const ctx = React.useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

export type { Lang, LText };
