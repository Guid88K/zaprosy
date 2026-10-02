import type { Metadata } from "next";
import { InvitationForm } from "@/components/InvitationForm";

export const metadata: Metadata = { title: "Нове запрошення" };

export default function NewInvitationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Нове запрошення</h1>
      <p className="mb-8 text-sm text-muted">Заповнюй поля ліворуч, а праворуч одразу бачитимеш результат.</p>
      <InvitationForm />
    </div>
  );
}
