import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, isLocale, type Locale } from "./index";

/** Мова інтерфейсу: cookie → Accept-Language → українська. */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
});

export async function getDict() {
  return getDictionary(await getLocale());
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
