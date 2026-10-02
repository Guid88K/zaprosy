import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DeleteInvitationButton } from "@/components/DeleteInvitationButton";
import { InvitationCard } from "@/components/InvitationCard";
import { NoModeToggle } from "@/components/NoModeToggle";
import { SupportLink } from "@/components/SupportLink";
import { requireUser } from "@/lib/auth";
import { formatDateTime, pluralUk } from "@/lib/format";
import { getTemplate } from "@/lib/templates";
import { getBaseUrl } from "@/lib/url";

export const metadata: Metadata = { title: "Запрошення" };

type Props = { params: Promise<{ id: string }> };

export default async function InvitationDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, id), eq(invitations.userId, user.id)),
    with: { responses: { orderBy: (r, { desc }) => desc(r.createdAt) } },
  });
  if (!inv) notFound();

  const t = getTemplate(inv.templateId);
  const url = `${await getBaseUrl()}/i/${inv.slug}`;
  const shareText = encodeURIComponent(`${inv.recipientName}, у мене для тебе дещо є 💌 ${url}`);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div className="space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            ← Усі запрошення
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Запрошення для {inv.recipientName}</h1>
          <p className="text-sm text-muted">Створено {formatDateTime(inv.createdAt)}</p>
        </div>

        <section className="card space-y-4">
          <h2 className="font-semibold">Посилання для надсилання</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={url} className="field font-mono text-sm" />
            <CopyLinkButton url={url} />
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a className="btn-secondary" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${inv.recipientName}, у мене для тебе дещо є 💌`)}`} target="_blank" rel="noreferrer">
              Telegram
            </a>
            <a className="btn-secondary" href={`viber://forward?text=${shareText}`}>
              Viber
            </a>
            <a className="btn-secondary" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn-secondary" href={`/i/${inv.slug}`} target="_blank" rel="noreferrer">
              Відкрити сторінку ↗
            </a>
          </div>
          {process.env.NEXT_PUBLIC_SUPPORT_URL ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="text-muted">Запрошення безкоштовне. Сподобалось? Пригостіть автора кавою.</span>
              <SupportLink />
            </div>
          ) : null}
        </section>

        <NoModeToggle id={inv.id} noMode={inv.noMode} />

        <section className="card">
          <h2 className="font-semibold">
            Відповіді{" "}
            <span className="font-normal text-muted">
              · {inv.responses.length} {pluralUk(inv.responses.length, "відповідь", "відповіді", "відповідей")}
            </span>
          </h2>
          {inv.responses.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Поки відповіді немає. Щойно людина натисне кнопку, ти побачиш це тут і отримаєш сповіщення.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {inv.responses.map((r) => (
                <li key={r.id} className="flex gap-3 py-3">
                  <div className="text-2xl" aria-hidden>
                    {r.answer === "yes" ? "🎉" : "😔"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{r.answer === "yes" ? "Так!" : "На жаль, ні"}</div>
                    {r.comment ? <p className="mt-0.5 whitespace-pre-line text-sm">{r.comment}</p> : null}
                    <div className="mt-1 text-xs text-muted">{formatDateTime(r.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DeleteInvitationButton id={inv.id} />
      </div>

      <aside className="self-start lg:sticky lg:top-6">
        <p className="label">Прев&apos;ю</p>
        <div className="rounded-3xl p-5" style={{ background: t.page }}>
          <InvitationCard template={t} data={inv} compact />
        </div>
      </aside>
    </div>
  );
}
