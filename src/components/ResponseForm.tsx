"use client";

import { useActionState, useRef, useState } from "react";
import type { NoMode } from "@/db/schema";
import { submitResponse, type RespondState } from "@/lib/actions/invitations";
import type { Template } from "@/lib/templates";
import { SubmitButton } from "./SubmitButton";

type Props = { slug: string; template: Template; authorName: string; noMode?: NoMode };

/** Що каже кнопка «ні» після кожної спроби її впіймати. */
const dodgePhrases = [
  "На жаль, ні",
  "Точно ні?",
  "Подумай ще",
  "Ну ні ж",
  "Не вийде 😏",
  "Спробуй ще раз",
  "Я швидша",
  "Тисни «Так»",
  "Здавайся 💛",
];

export function ResponseForm({ slug, template: t, authorName, noMode = "allow" }: Props) {
  const [state, action] = useActionState<RespondState, FormData>(submitResponse, {});
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [dodge, setDodge] = useState({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  const runaway = noMode === "runaway";

  function runAway() {
    const width = areaRef.current?.offsetWidth ?? 300;
    const range = Math.min(width * 0.45, 220);
    setDodge({
      x: (Math.random() * 2 - 1) * range,
      y: (Math.random() * 2 - 1) * 90,
    });
    setAttempts((n) => n + 1);
  }

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

  const yesScale = runaway ? Math.min(1 + attempts * 0.06, 1.45) : 1;
  const noScale = runaway ? Math.max(1 - attempts * 0.07, 0.55) : 1;
  const noLabel = runaway ? dodgePhrases[Math.min(attempts, dodgePhrases.length - 1)] : "На жаль, ні";

  return (
    <form action={action} className="font-sans">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="answer" value={answer ?? ""} />

      <div ref={areaRef} className="relative grid grid-cols-2 gap-3">
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
            transform: `scale(${yesScale})`,
            transformOrigin: "left center",
            zIndex: runaway ? 1 : 2,
          }}
        >
          Так! 💛
        </button>
        <button
          type="button"
          aria-disabled={runaway}
          onMouseEnter={runaway ? runAway : undefined}
          onTouchStart={runaway ? runAway : undefined}
          onFocus={runaway ? runAway : undefined}
          onClick={runaway ? runAway : () => setAnswer("no")}
          className={`rounded-xl border py-3.5 text-base font-semibold transition duration-200 hover:-translate-y-0.5 ${
            answer === "yes" ? "opacity-50" : ""
          }`}
          style={{
            borderColor: t.border,
            color: t.muted,
            outline: answer === "no" ? `3px solid ${t.text}` : "none",
            outlineOffset: 2,
            transform: `translate(${dodge.x}px, ${dodge.y}px) scale(${noScale})`,
            transitionProperty: "transform, opacity",
            background: runaway ? t.card : undefined,
            zIndex: runaway ? 3 : 1,
          }}
        >
          {noLabel}
        </button>
      </div>

      {runaway && attempts >= 3 && !answer ? (
        <p className="animate-float-in mt-4 text-center text-sm" style={{ color: t.muted }}>
          Здається, варіанту «ні» тут не передбачено 😄
        </p>
      ) : null}

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
