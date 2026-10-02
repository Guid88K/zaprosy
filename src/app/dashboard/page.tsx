import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { fmt, plural } from "@/lib/i18n";
import { getDict, getLocale } from "@/lib/i18n/server";
import { getTemplate } from "@/lib/templates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.dashboard };
}

export default async function DashboardPage() {
  const [user, dict, locale] = await Promise.all([requireUser(), getDict(), getLocale()]);
  const l = dict.list;
  const db = await getDb();
  const list = await db.query.invitations.findMany({
    where: eq(invitations.userId, user.id),
    orderBy: desc(invitations.createdAt),
    with: { responses: { orderBy: (r, { desc }) => desc(r.createdAt) } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{l.title}</h1>
          <p className="text-sm text-muted">{list.length} {plural(locale, list.length, l.count)}</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">{l.createNew}</Link>
      </div>

      {list.length === 0 ? (
        <div className="card text-center">
          <div className="text-5xl" aria-hidden>💌</div>
          <h2 className="mt-3 text-xl font-semibold">{l.emptyTitle}</h2>
          <p className="mt-1 text-muted">{l.emptyText}</p>
          <Link href="/dashboard/new" className="btn-primary mt-5">{l.emptyCta}</Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((inv) => {
            const t = getTemplate(inv.templateId);
            const latest = inv.responses[0];
            return (
              <li key={inv.id}>
                <Link href={`/dashboard/${inv.id}`} className="card flex gap-4 transition hover:border-brand/50 hover:shadow-md">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: t.page }} aria-hidden>{t.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate font-semibold">{fmt(l.forName, { name: inv.recipientName })}</h2>
                      {latest ? (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${latest.answer === "yes" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"}`}>
                          {latest.answer === "yes" ? l.yes : l.no}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">{l.waiting}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">{inv.question}</p>
                    <p className="mt-2 text-xs text-muted">
                      {formatDateTime(inv.createdAt, locale)} · {inv.responses.length} {plural(locale, inv.responses.length, l.responses)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
