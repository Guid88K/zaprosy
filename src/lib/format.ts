import { fmt, getDictionary, type Locale } from "./i18n";

export function formatEventDate(date: string | null, time: string | null, locale: Locale = "uk"): string | null {
  if (!date && !time) return null;
  const d = getDictionary(locale);
  const parts: string[] = [];
  if (date) {
    const parsed = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      parts.push(new Intl.DateTimeFormat(d.intl, { weekday: "long", day: "numeric", month: "long" }).format(parsed));
    }
  }
  if (time) parts.push(fmt(d.time.at, { time }));
  return parts.join(", ");
}

export function formatDateTime(date: Date, locale: Locale = "uk"): string {
  return new Intl.DateTimeFormat(getDictionary(locale).intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
