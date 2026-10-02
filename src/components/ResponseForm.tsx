"use client";

import { useActionState, useState } from "react";
import { submitResponse, type RespondState } from "@/lib/actions/invitations";
import type { Template } from "@/lib/templates";
import { SubmitButton } from "./SubmitButton";

type Props = { slug: string; template: Template; authorName: string };

export function ResponseForm({ slug, template: t, authorName }: Props) {
  const [state, action] = useActionState<RespondState, FormData>(submitResponse, {});
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  if (state.ok) {
    return (
      <div className="animate-pop text-center font-sans">
        <div className="text-5xl" aria-hidden>
          {state.answer === "yes" ? "🎉" : "💙"}
        </div>
        <p className="mt-3 text-lg font-semibold">
          {state.answer === "yes"
            ? `Чудово! ${authorName} уже знає, що ти за.`
            : `Дякую за чесну відповідь. ${authorName} уже знає.`}
        </p>
        <p className="mt-1 text-sm" style={{ color: t.muted }}>
          {state.answer === "yes" ? "Домовляйтеся про деталі 😉" : "Можливо, іншим разом."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="font-sans">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="answer" value={answer ?? ""} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setAnswer("yes")}
          className={`rounded-xl py-3.5 text-base font-semibold shadow-sm transition hover:-translate-y-0.5 ${
            answer === "no" ? "opacity-50" : ""
          }`}
          style={{
            background: t.accent,
            color: t.accentText,
            outline: answer === "yes" ? `3px solid ${t.text}` : "none",
            outlineOffset: 2,
          }}
        >
          Так! 💛
        </button>
        <button
          type="button"
          onClick={() => setAnswer("no")}
          className={`rounded-xl border py-3.5 text-base font-semibold transition hover:-translate-y-0.5 ${
            answer === "yes" ? "opacity-50" : ""
          }`}
          style={{
            borderColor: t.border,
            color: t.muted,
            outline: answer === "no" ? `3px solid ${t.text}` : "none",
            outlineOffset: 2,
          }}
        >
          На жаль, ні
        </button>
      </div>

      {answer ? (
        <div className="animate-float-in mt-5 space-y-3">
          <label htmlFor="comment" className="block text-sm font-medium">
            {answer === "yes" ? "Хочеш щось додати?" : "Напиши пару слів, якщо хочеш"}
          </label>
          <textarea
            id="comment"
            name="comment"
            maxLength={500}
            placeholder={answer === "yes" ? "Чекатиму з нетерпінням!" : "Дякую, але…"}
            className="min-h-24 w-full resize-y rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 dark:bg-black/20"
            style={{ borderColor: t.border, color: t.text }}
          />
          {state.error ? (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          <SubmitButton
            pendingText="Надсилаю…"
            className="btn w-full shadow-md"
            style={{ background: t.text, color: t.dark ? "#0f172a" : "#ffffff" }}
          >
            Надіслати відповідь
          </SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
