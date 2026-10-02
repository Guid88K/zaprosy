import Link from "next/link";
import { InvitationCard } from "@/components/InvitationCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SupportLink } from "@/components/SupportLink";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n/server";
import { templateText, templates } from "@/lib/templates";

export default async function HomePage() {
  const [user, dict, locale] = await Promise.all([getCurrentUser(), getDict(), getLocale()]);
  const l = dict.landing;
  const demo = templates[0];
  const createHref = user ? "/dashboard/new" : "/register";

  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          {dict.common.brand} <span aria-hidden>💌</span>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Link href="/dashboard" className="btn-primary">{l.myDashboard}</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">{l.login}</Link>
              <Link href="/register" className="btn-primary">{l.create}</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">{l.badge}</p>
          <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-tight sm:text-6xl">{l.title}</h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted">{l.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={createHref} className="btn-primary px-6 py-3 text-base">{l.ctaFree}</Link>
            <a href="#how" className="btn-secondary px-6 py-3 text-base">{l.how}</a>
          </div>
        </div>

        <div className="animate-float-in rounded-3xl p-6 shadow-2xl sm:p-10" style={{ background: demo.page }}>
          <InvitationCard
            template={demo}
            locale={locale}
            data={{
              recipientName: l.demo.recipient,
              question: l.demo.question,
              message: l.demo.message,
              eventDate: "2026-10-10",
              eventTime: "19:00",
              place: l.demo.place,
            }}
            compact
          >
            <div className="grid grid-cols-2 gap-3 font-sans" aria-hidden>
              <div className="rounded-xl py-2.5 text-center text-sm font-semibold" style={{ background: demo.accent, color: demo.accentText }}>{l.demo.yes}</div>
              <div className="rounded-xl border py-2.5 text-center text-sm font-semibold" style={{ borderColor: demo.border, color: demo.muted }}>{l.demo.no}</div>
            </div>
          </InvitationCard>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {l.steps.map((s, i) => (
            <div key={s.title}>
              <div className="flex size-10 items-center justify-center rounded-full bg-brand font-serif text-lg font-semibold text-white">{i + 1}</div>
              <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-serif text-3xl font-semibold">{l.moodTitle}</h2>
        <p className="mt-2 text-center text-muted">{l.moodSubtitle}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {templates.map((t) => {
            const text = templateText(t.id, dict);
            return (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex aspect-[4/5] items-center justify-center text-4xl" style={{ background: t.page }}>{t.emoji}</div>
                <div className="p-3">
                  <div className="font-medium">{text.name}</div>
                  <div className="mt-0.5 text-xs text-muted">{text.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
          <span>{l.footer}</span>
          <div className="flex items-center gap-4">
            <SupportLink variant="text" />
            <Link href={createHref} className="font-medium text-brand hover:underline">{l.create}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
