"use client";

import { useActionState } from "react";
import type { User } from "@/db/schema";
import { updateSettings, type FormState } from "@/lib/actions/invitations";
import { fmt, getDictionary, locales } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { SubmitButton } from "./SubmitButton";

type Props = {
  user: User;
  channels: { telegram: boolean; email: boolean };
};

export function SettingsForm({ user, channels }: Props) {
  const { dict } = useI18n();
  const s = dict.settings;
  const [state, action] = useActionState<FormState, FormData>(updateSettings, {});

  return (
    <form action={action} className="card space-y-6">
      <div>
        <label htmlFor="name" className="label">{s.name}</label>
        <input id="name" name="name" className="field" defaultValue={user.name} required minLength={2} maxLength={60} />
        <p className="mt-1 text-xs text-muted">{s.nameHint}</p>
      </div>

      <div>
        <label htmlFor="email" className="label">{s.email}</label>
        <input id="email" className="field" value={user.email} disabled />
      </div>

      <div>
        <label htmlFor="locale" className="label">{s.language}</label>
        <select id="locale" name="locale" defaultValue={user.locale} className="field w-auto">
          {locales.map((l) => (
            <option key={l} value={l}>
              {getDictionary(l).languageName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="font-semibold">{s.notifications}</h2>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="notifyByEmail" defaultChecked={user.notifyByEmail} className="mt-1 size-4 accent-brand" />
          <span>
            <span className="block text-sm font-medium">{s.byEmail}</span>
            <span className="block text-xs text-muted">{channels.email ? fmt(s.emailReady, { email: user.email }) : s.emailNotConfigured}</span>
          </span>
        </label>

        <div>
          <label htmlFor="telegramChatId" className="label">{s.telegram}</label>
          <input id="telegramChatId" name="telegramChatId" className="field" inputMode="numeric" placeholder="123456789" defaultValue={user.telegramChatId ?? ""} />
          <p className="mt-1 text-xs text-muted">{channels.telegram ? s.telegramReady : s.telegramNotConfigured}</p>
        </div>
      </div>

      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-700 dark:text-green-400">{s.saved}</p> : null}

      <SubmitButton pendingText={dict.common.saving}>{dict.common.save}</SubmitButton>
    </form>
  );
}
