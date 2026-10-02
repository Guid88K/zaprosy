"use client";

import { useActionState, useState } from "react";
import { createInvitation, type FormState } from "@/lib/actions/invitations";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  questionPresets,
  templates,
} from "@/lib/templates";
import { InvitationCard } from "./InvitationCard";
import { SubmitButton } from "./SubmitButton";

type Draft = {
  recipientName: string;
  question: string;
  message: string;
  eventDate: string;
  eventTime: string;
  place: string;
};

const initialDraft: Draft = {
  recipientName: "",
  question: questionPresets[0],
  message: "",
  eventDate: "",
  eventTime: "",
  place: "",
};

export function InvitationForm() {
  const [state, action] = useActionState<FormState, FormData>(createInvitation, {});
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [runawayNo, setRunawayNo] = useState(false);
  const template = getTemplate(templateId);

  const update =
    (key: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={action} className="space-y-7">
        <fieldset>
          <legend className="label">Дизайн</legend>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
            {templates.map((t) => {
              const selected = t.id === templateId;
              return (
                <label
                  key={t.id}
                  className={`group cursor-pointer rounded-2xl border-2 p-1 transition ${
                    selected ? "border-brand" : "border-transparent hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="templateId"
                    value={t.id}
                    checked={selected}
                    onChange={() => setTemplateId(t.id)}
                    className="sr-only"
                  />
                  <div
                    className="flex aspect-[4/3] items-center justify-center rounded-xl text-2xl shadow-inner"
                    style={{ background: t.page }}
                    aria-hidden
                  >
                    {t.emoji}
                  </div>
                  <div className="mt-1.5 truncate px-1 text-center text-xs font-medium">{t.name}</div>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-muted">{template.description}</p>
        </fieldset>

        <div>
          <label htmlFor="recipientName" className="label">
            Кого запрошуєш
          </label>
          <input
            id="recipientName"
            name="recipientName"
            className="field"
            placeholder="Наприклад, Оленко"
            value={draft.recipientName}
            onChange={update("recipientName")}
            maxLength={60}
            required
          />
          <p className="mt-1 text-xs text-muted">Пиши у кличному відмінку: саме так ім&apos;я з&apos;явиться на картці.</p>
        </div>

        <div>
          <label htmlFor="question" className="label">
            Питання
          </label>
          <input
            id="question"
            name="question"
            className="field"
            value={draft.question}
            onChange={update("question")}
            maxLength={160}
            required
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {questionPresets.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, question: q }))}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  draft.question === q
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border text-muted hover:border-brand/50 hover:text-foreground"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="label">
            Кілька слів від себе <span className="font-normal text-muted">(необов&apos;язково)</span>
          </label>
          <textarea
            id="message"
            name="message"
            className="field min-h-28 resize-y"
            placeholder="Давно хотів(ла) тебе кудись запросити…"
            value={draft.message}
            onChange={update("message")}
            maxLength={600}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eventDate" className="label">
              Дата
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              className="field"
              value={draft.eventDate}
              onChange={update("eventDate")}
            />
          </div>
          <div>
            <label htmlFor="eventTime" className="label">
              Час
            </label>
            <input
              id="eventTime"
              name="eventTime"
              type="time"
              className="field"
              value={draft.eventTime}
              onChange={update("eventTime")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="place" className="label">
            Місце
          </label>
          <input
            id="place"
            name="place"
            className="field"
            placeholder="Кав'ярня на Подолі, Київ"
            value={draft.place}
            onChange={update("place")}
            maxLength={160}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:border-brand/50">
          <input
            type="checkbox"
            name="noMode"
            value="runaway"
            checked={runawayNo}
            onChange={(e) => setRunawayNo(e.target.checked)}
            className="mt-1 size-4 accent-brand"
          />
          <span>
            <span className="block text-sm font-medium">Кнопка «ні» тікає 😏</span>
            <span className="block text-xs text-muted">
              Відповісти «ні» буде неможливо: кнопка відстрибує від курсора й пальця, а «Так» щоразу росте.
            </span>
          </span>
        </label>

        {state.error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        ) : null}

        <SubmitButton pendingText="Створюю…" className="btn-primary w-full sm:w-auto">
          Створити й отримати посилання
        </SubmitButton>
      </form>

      <aside className="self-start lg:sticky lg:top-6">
        <p className="label">Так побачить отримувач</p>
        <div className="rounded-3xl p-5 sm:p-8" style={{ background: template.page }}>
          <InvitationCard template={template} data={draft} compact>
            <div className="grid grid-cols-2 gap-3 font-sans" aria-hidden>
              <div
                className="rounded-xl py-2.5 text-center text-sm font-semibold"
                style={{ background: template.accent, color: template.accentText }}
              >
                Так! 💛
              </div>
              <div
                className={`rounded-xl border py-2.5 text-center text-sm font-semibold ${runawayNo ? "translate-x-3 -rotate-3 opacity-80" : ""}`}
                style={{ borderColor: template.border, color: template.muted }}
              >
                {runawayNo ? "Ні? Не вийде 😏" : "На жаль, ні"}
              </div>
            </div>
          </InvitationCard>
        </div>
      </aside>
    </div>
  );
}
