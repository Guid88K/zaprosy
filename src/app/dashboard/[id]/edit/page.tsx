import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { InvitationForm } from "@/components/InvitationForm";
import { requireUser } from "@/lib/auth";
import { fmt } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/server";
import { parseScreens } from "@/lib/screens";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.edit };
}

type Props = { params: Promise<{ id: string }> };

export default async function EditInvitationPage({ params }: Props) {
  const { id } = await params;
  const [user, dict] = await Promise.all([requireUser(), getDict()]);
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({ where: and(eq(invitations.id, id), eq(invitations.userId, user.id)) });
  if (!inv) notFound();

  return (
    <div>
      <Link href={`/dashboard/${inv.id}`} className="text-sm text-muted hover:text-foreground">{dict.builder.editBack}</Link>
      <h1 className="mt-2 text-2xl font-semibold">{fmt(dict.builder.editTitle, { name: inv.recipientName })}</h1>
      <p className="mb-8 text-sm text-muted">{dict.builder.editSubtitle}</p>
      <InvitationForm
        authorName={user.name}
        initial={{
          id: inv.id,
          templateId: inv.templateId,
          recipientName: inv.recipientName,
          eventDate: inv.eventDate,
          eventTime: inv.eventTime,
          place: inv.place,
          noMode: inv.noMode,
          locale: inv.locale,
          screens: parseScreens(inv.screens, inv, inv.locale),
        }}
      />
    </div>
  );
}
