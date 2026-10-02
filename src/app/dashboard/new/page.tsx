import type { Metadata } from "next";
import { InvitationForm } from "@/components/InvitationForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Нове запрошення" };

export default async function NewInvitationPage() {
  const user = await requireUser();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Нове запрошення</h1>
      <p className="mb-8 text-sm text-muted">Збирайте екрани ліворуч, а праворуч одразу проходьте їх як отримувач.</p>
      <InvitationForm authorName={user.name} />
    </div>
  );
}
