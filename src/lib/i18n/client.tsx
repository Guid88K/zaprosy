"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dict, type Locale } from "./index";

const I18nContext = createContext<{ locale: Locale; dict: Dict }>({ locale: "uk", dict: getDictionary("uk") });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict: getDictionary(locale) }}>{children}</I18nContext.Provider>;
}

/** Словник і мова інтерфейсу для клієнтських компонентів. */
export function useI18n() {
  return useContext(I18nContext);
}
