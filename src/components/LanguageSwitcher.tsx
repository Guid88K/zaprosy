"use client";

import { setLocale } from "@/lib/actions/locale";
import { locales } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

/** Перемикач мови інтерфейсу: UK | EN. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, dict } = useI18n();
  return (
    <form action={setLocale} className={`inline-flex items-center rounded-xl border border-border p-0.5 text-xs font-semibold ${className}`} aria-label={dict.common.language}>
      {locales.map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          aria-pressed={l === locale}
          className={`rounded-lg px-2 py-1 transition ${l === locale ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
