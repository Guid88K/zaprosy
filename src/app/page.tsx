import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { InvitationCard } from "@/components/InvitationCard";
import { templates } from "@/lib/templates";
import { SupportLink } from "@/components/SupportLink";

const steps = [
  { n: "1", title: "Збери екрани", text: "Привітання, питання, вибір активності, фото чи GIF, фінал. Шість стилів оформлення й живе прев'ю." },
  { n: "2", title: "Надішли посилання", text: "Одне коротке посилання в Telegram, Viber чи Instagram. Без реєстрації для отримувача." },
  { n: "3", title: "Отримай відповідь", text: "Так чи ні, обраний варіант і коментар. А кнопка «ні» може тікати, меншати або розмножувати «Так»." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const demo = templates[0];

  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          Запроси <span aria-hidden>💌</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Мій кабінет
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Увійти
              </Link>
              <Link href="/register" className="btn-primary">
                Створити запрошення
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
            Українська альтернатива сервісам запрошень
          </p>
          <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            Запроси на побачення одним посиланням
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted">
            Збери тепле інтерактивне запрошення за дві хвилини, надішли його в месенджер і дізнайся відповідь одразу, щойно людина натисне «Так».
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard/new" : "/register"} className="btn-primary px-6 py-3 text-base">
              Створити безкоштовно
            </Link>
            <a href="#how" className="btn-secondary px-6 py-3 text-base">
              Як це працює
            </a>
          </div>
        </div>

        <div className="animate-float-in rounded-3xl p-6 shadow-2xl sm:p-10" style={{ background: demo.page }}>
          <InvitationCard
            template={demo}
            data={{
              recipientName: "Оленко",
              question: "Підеш зі мною на побачення?",
              message: "Обіцяю смачну каву, теплий плед і жодних незручних пауз.",
              eventDate: "2026-10-10",
              eventTime: "19:00",
              place: "Кав'ярня на Подолі",
            }}
            compact
          >
            <div className="grid grid-cols-2 gap-3 font-sans" aria-hidden>
              <div className="rounded-xl py-2.5 text-center text-sm font-semibold" style={{ background: demo.accent, color: demo.accentText }}>
                Так! 💛
              </div>
              <div className="rounded-xl border py-2.5 text-center text-sm font-semibold" style={{ borderColor: demo.border, color: demo.muted }}>
                На жаль, ні
              </div>
            </div>
          </InvitationCard>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="flex size-10 items-center justify-center rounded-full bg-brand font-serif text-lg font-semibold text-white">
                {s.n}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-serif text-3xl font-semibold">Обери свій настрій</h2>
        <p className="mt-2 text-center text-muted">Кожен шаблон адаптований до телефону й виглядає добре в темній темі.</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {templates.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex aspect-[4/5] items-center justify-center text-4xl" style={{ background: t.page }}>
                {t.emoji}
              </div>
              <div className="p-3">
                <div className="font-medium">{t.name}</div>
                <div className="mt-0.5 text-xs text-muted">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
          <span>Запроси · зроблено в Україні 💙💛</span>
          <div className="flex items-center gap-4">
            <SupportLink variant="text" />
            <Link href={user ? "/dashboard/new" : "/register"} className="font-medium text-brand hover:underline">
              Створити запрошення
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
