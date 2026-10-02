import { en, uk, type Dict } from "./dictionaries";

export const locales = ["uk", "en"] as const;
export type Locale = (typeof locales)[number];
export const DEFAULT_LOCALE: Locale = "uk";
export const LOCALE_COOKIE = "zaprosy_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dict {
  return locale === "en" ? en : uk;
}

/** Підставляє {key} у рядок словника. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
}

/** Множина: uk має три форми, en дві (друга й третя однакові). */
export function plural(locale: Locale, n: number, forms: readonly [string, string, string] | readonly string[]): string {
  if (locale === "en") return n === 1 ? forms[0] : forms[1];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export type { Dict };
