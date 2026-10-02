import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { InvitationForm } from "@/components/InvitationForm";
import { requireUser } from "@/lib/auth";
import { parseScreens } from "@/lib/screens";

export const metadata: Metadata = { title: "Редагування запрошення" };

type Props = { params: Promise<{ id: string }> };

export default async function EditInvitationPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const db = await getDb();
  const inv = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, id), eq(invitations.userId, user.id)),
  });
  if (!inv) notFound();

  return (
    <div>
      <Link href={`/dashboard/${inv.id}`} className="text-sm text-muted hover:text-foreground">
        ← До запрошення
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Редагування запрошення для {inv.recipientName}</h1>
      <p className="mb-8 text-sm text-muted">Посилання лишиться тим самим, зміни з&apos;являться одразу після збереження.</p>
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
          screens: parseScreens(inv.screens, inv),
        }}
      />
    </div>
  );
}
