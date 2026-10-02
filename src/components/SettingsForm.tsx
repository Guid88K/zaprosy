"use client";

import { useActionState } from "react";
import type { User } from "@/db/schema";
import { updateSettings, type FormState } from "@/lib/actions/invitations";
import { SubmitButton } from "./SubmitButton";

type Props = {
  user: User;
  channels: { telegram: boolean; email: boolean };
};

export function SettingsForm({ user, channels }: Props) {
  const [state, action] = useActionState<FormState, FormData>(updateSettings, {});

  return (
    <form action={action} className="card space-y-6">
      <div>
        <label htmlFor="name" className="label">
          Ім&apos;я
        </label>
        <input id="name" name="name" className="field" defaultValue={user.name} required minLength={2} maxLength={60} />
        <p className="mt-1 text-xs text-muted">Його побачить отримувач після відповіді.</p>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" className="field" value={user.email} disabled />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="font-semibold">Сповіщення про відповіді</h2>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="notifyByEmail"
            defaultChecked={user.notifyByEmail}
            className="mt-1 size-4 accent-brand"
          />
          <span>
            <span className="block text-sm font-medium">На email</span>
            <span className="block text-xs text-muted">
              {channels.email
                ? `Лист прийде на ${user.email}.`
                : "SMTP на сервері ще не налаштований: лист не піде, поки адміністратор не задасть SMTP_HOST."}
            </span>
          </span>
        </label>

        <div>
          <label htmlFor="telegramChatId" className="label">
            Telegram chat ID
          </label>
          <input
            id="telegramChatId"
            name="telegramChatId"
            className="field"
            inputMode="numeric"
            placeholder="123456789"
            defaultValue={user.telegramChatId ?? ""}
          />
          <p className="mt-1 text-xs text-muted">
            {channels.telegram
              ? "Напиши боту сервісу /start, а свій chat ID дізнайся через @userinfobot."
              : "Telegram-бот на сервері ще не налаштований (TELEGRAM_BOT_TOKEN). Поле можна заповнити заздалегідь."}
          </p>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-green-700 dark:text-green-400">Збережено ✓</p> : null}

      <SubmitButton pendingText="Зберігаю…">Зберегти</SubmitButton>
    </form>
  );
}
