import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { notificationChannels } from "@/lib/notify";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.settings };
}

export default async function SettingsPage() {
  const [user, dict] = await Promise.all([requireUser(), getDict()]);
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">{dict.settings.title}</h1>
      <p className="mb-6 text-sm text-muted">{dict.settings.subtitle}</p>
      <SettingsForm user={user} channels={notificationChannels()} />
    </div>
  );
}
