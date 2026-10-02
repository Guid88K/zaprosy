import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { notificationChannels } from "@/lib/notify";

export const metadata: Metadata = { title: "Налаштування" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Налаштування</h1>
      <p className="mb-6 text-sm text-muted">Ім&apos;я та канали, куди приходитимуть відповіді.</p>
      <SettingsForm user={user} channels={notificationChannels()} />
    </div>
  );
}
