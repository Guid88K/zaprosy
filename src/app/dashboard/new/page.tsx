import type { Metadata } from "next";
import { InvitationForm } from "@/components/InvitationForm";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.newInvitation };
}

export default async function NewInvitationPage() {
  const [user, dict] = await Promise.all([requireUser(), getDict()]);
  return (
    <div>
      <h1 className="text-2xl font-semibold">{dict.builder.newTitle}</h1>
      <p className="mb-8 text-sm text-muted">{dict.builder.newSubtitle}</p>
      <InvitationForm authorName={user.name} />
    </div>
  );
}
