import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { InvitationPlayer } from "@/components/InvitationPlayer";
import { fmt, getDictionary } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/server";
import { parseScreens } from "@/lib/screens";
import { getTemplate } from "@/lib/templates";

type Props = { params: Promise<{ slug: string }> };

async function loadInvitation(slug: string) {
  const db = await getDb();
  return db.query.invitations.findFirst({ where: eq(invitations.slug, slug), with: { author: { columns: { name: true } } } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await loadInvitation(slug);
  if (!inv) return { title: (await getDict()).meta.notFound };
  const title = fmt(getDictionary(inv.locale).meta.invitationTitle, { name: inv.recipientName });
  return { title, description: inv.question, robots: { index: false }, openGraph: { title, description: inv.question } };
}

export default async function PublicInvitationPage({ params }: Props) {
  const { slug } = await params;
  const inv = await loadInvitation(slug);
  if (!inv) notFound();
  const dict = getDictionary(inv.locale);
  const t = getTemplate(inv.templateId);
  const screens = parseScreens(inv.screens, inv, inv.locale);

  return (
    <main lang={dict.htmlLang} className="flex min-h-dvh items-center justify-center px-4 py-10" style={{ background: t.page, backgroundAttachment: "fixed" }}>
      <div className="animate-float-in w-full max-w-xl">
        <InvitationPlayer
          template={t}
          screens={screens}
          context={{ slug: inv.slug, recipientName: inv.recipientName, authorName: inv.author.name, eventDate: inv.eventDate, eventTime: inv.eventTime, place: inv.place }}
          noMode={inv.noMode}
          locale={inv.locale}
          mode="live"
        />
        <p className="mt-6 text-center font-sans text-xs" style={{ color: t.dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)" }}>
          {fmt(dict.player.from, { author: inv.author.name })}{" "}
          <Link href="/" className="underline">{dict.common.brand}</Link>
        </p>
      </div>
    </main>
  );
}
