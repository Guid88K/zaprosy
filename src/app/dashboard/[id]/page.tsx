import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DeleteInvitationButton } from "@/components/DeleteInvitationButton";
import { InvitationPlayer } from "@/components/InvitationPlayer";
import { NoModeToggle } from "@/components/NoModeToggle";
import { SupportLink } from "@/components/SupportLink";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { fmt, plural } from "@/lib/i18n";
import { getDict, getLocale } from "@/lib/i18n/server";
import { parseScreens } from "@/lib/screens";
import { getTemplate } from "@/lib/templates";
import { getBaseUrl } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.invitation };
}

type Props = { params: Promise<{ id: string }> };

function parseChoices(json: string | null): { screen: string; value: string }[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function InvitationDetailPage({ params }: Props) {
  const { id } = await params;
  const [user, dict, locale] = await Promise.all([requireUser(), getDict(), getLocale()]);
  const d = dict.detail;
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, id), eq(invitations.userId, user.id)),
    with: { responses: { orderBy: (r, { desc }) => desc(r.createdAt) } },
  });
  if (!inv) notFound();

  const t = getTemplate(inv.templateId);
  const screens = parseScreens(inv.screens, inv, inv.locale);
  const url = `${await getBaseUrl()}/i/${inv.slug}`;
  const shareLine = fmt(d.shareText, { name: inv.recipientName });
  const shareText = encodeURIComponent(`${shareLine} ${url}`);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div className="space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">{d.back}</Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{fmt(d.title, { name: inv.recipientName })}</h1>
            <Link href={`/dashboard/${inv.id}/edit`} className="btn-secondary">{d.edit}</Link>
          </div>
          <p className="text-sm text-muted">
            {fmt(d.created, { date: formatDateTime(inv.createdAt, locale) })} · {screens.length} {plural(locale, screens.length, d.screens)}
          </p>
        </div>

        <section className="card space-y-4">
          <h2 className="font-semibold">{d.linkTitle}</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={url} className="field font-mono text-sm" />
            <CopyLinkButton url={url} />
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a className="btn-secondary" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareLine)}`} target="_blank" rel="noreferrer">Telegram</a>
            <a className="btn-secondary" href={`viber://forward?text=${shareText}`}>Viber</a>
            <a className="btn-secondary" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="btn-secondary" href={`/i/${inv.slug}`} target="_blank" rel="noreferrer">{d.open}</a>
          </div>
          {process.env.NEXT_PUBLIC_SUPPORT_URL ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="text-muted">{dict.support.detailLine}</span>
              <SupportLink />
            </div>
          ) : null}
        </section>

        <NoModeToggle id={inv.id} noMode={inv.noMode} />

        <section className="card">
          <h2 className="font-semibold">
            {d.responsesTitle}{" "}
            <span className="font-normal text-muted">· {inv.responses.length} {plural(locale, inv.responses.length, dict.list.responses)}</span>
          </h2>
          {inv.responses.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{d.noResponses}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {inv.responses.map((r) => (
                <li key={r.id} className="flex gap-3 py-3">
                  <div className="text-2xl" aria-hidden>{r.answer === "yes" ? "🎉" : "😔"}</div>
                  <div className="min-w-0">
                    <div className="font-semibold">{r.answer === "yes" ? d.answerYes : d.answerNo}</div>
                    {parseChoices(r.choices).map((c) => (
                      <p key={c.screen + c.value} className="mt-0.5 text-sm">
                        <span className="text-muted">{c.screen}:</span> {c.value}
                      </p>
                    ))}
                    {r.comment ? <p className="mt-1 whitespace-pre-line text-sm">«{r.comment}»</p> : null}
                    <div className="mt-1 text-xs text-muted">{formatDateTime(r.createdAt, locale)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DeleteInvitationButton id={inv.id} />
      </div>

      <aside className="self-start lg:sticky lg:top-6">
        <p className="label">{d.preview}</p>
        <div className="rounded-3xl p-5" style={{ background: t.page }}>
          <InvitationPlayer
            template={t}
            screens={screens}
            context={{ slug: inv.slug, recipientName: inv.recipientName, authorName: user.name, eventDate: inv.eventDate, eventTime: inv.eventTime, place: inv.place }}
            noMode={inv.noMode}
            locale={inv.locale}
            mode="preview"
            compact
          />
        </div>
      </aside>
    </div>
  );
}
