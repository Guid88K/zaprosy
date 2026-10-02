"use client";

import { useEffect, useRef, useState } from "react";
import { addResponseComment, submitResponse } from "@/lib/actions/invitations";
import { formatEventDate } from "@/lib/format";
import { buildVars, renderVars, type NoModeId, type Screen, type ScreenOf } from "@/lib/screens";
import { fontClassByKey, type Template } from "@/lib/templates";
import { Hearts } from "./Hearts";
import { YesNoButtons } from "./YesNoButtons";

export type PlayerContext = {
  slug: string;
  recipientName: string;
  authorName: string;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
};

type Choice = { screen: string; value: string };

type Props = {
  template: Template;
  screens: Screen[];
  context: PlayerContext;
  noMode: NoModeId;
  /** live: справжнє запрошення з надсиланням відповіді; preview: конструктор, без запитів */
  mode: "live" | "preview";
  previewIndex?: number;
  onPreviewIndexChange?: (index: number) => void;
  compact?: boolean;
};

type Submission =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; responseId: string }
  | { status: "error"; error: string };

export function InvitationPlayer({
  template: t,
  screens,
  context,
  noMode,
  mode,
  previewIndex,
  onPreviewIndexChange,
  compact = false,
}: Props) {
  const [liveIndex, setLiveIndex] = useState(0);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [celebrate, setCelebrate] = useState(false);
  const [submission, setSubmission] = useState<Submission>({ status: "idle" });
  const [comment, setComment] = useState("");
  const [commentState, setCommentState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const submittedFor = useRef<string | null>(null);

  const preview = mode === "preview";
  const controlled = preview && previewIndex !== undefined;
  const index = Math.min(controlled ? previewIndex : liveIndex, Math.max(screens.length - 1, 0));
  const screen = screens[index];
  const finalIndex = screens.findIndex((s) => s.type === "final");

  function goTo(i: number) {
    const next = Math.min(Math.max(i, 0), screens.length - 1);
    if (controlled) onPreviewIndexChange?.(next);
    else setLiveIndex(next);
  }

  function goNext() {
    goTo(index + 1);
  }

  function handleYes() {
    setAnswer("yes");
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 3200);
    goNext();
  }

  function handleNo() {
    setAnswer("no");
    goTo(finalIndex >= 0 ? finalIndex : screens.length - 1);
  }

  function pick(s: ScreenOf<"choice">, label: string) {
    setPicked((p) => ({ ...p, [s.id]: label }));
    setChoices((list) => [...list.filter((c) => c.screen !== (s.title || "Вибір")), { screen: s.title || "Вибір", value: label }]);
  }

  // Дійшли до фіналу в live-режимі: надсилаємо відповідь один раз.
  useEffect(() => {
    if (preview || !screen || screen.type !== "final") return;
    const key = `${answer ?? "yes"}|${JSON.stringify(choices)}`;
    if (submittedFor.current) return;
    submittedFor.current = key;
    setSubmission({ status: "sending" });
    submitResponse({ slug: context.slug, answer: answer ?? "yes", choices })
      .then((r) => setSubmission(r.ok ? { status: "done", responseId: r.responseId } : { status: "error", error: r.error }))
      .catch(() => setSubmission({ status: "error", error: "Не вдалося надіслати відповідь. Спробуй оновити сторінку." }));
  }, [screen, answer, choices, context.slug, preview]);

  async function sendComment() {
    if (submission.status !== "done" || !comment.trim()) return;
    setCommentState("sending");
    const r = await addResponseComment({ slug: context.slug, responseId: submission.responseId, comment });
    setCommentState(r.ok ? "done" : "error");
  }

  const vars = buildVars({ ...context, choices });
  const txt = (s: string) => renderVars(s, vars);
  const font = fontClassByKey[t.font];
  const scriptFont = t.font === "script";

  const titleClass = compact
    ? scriptFont ? "text-3xl" : "text-2xl"
    : scriptFont ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl";
  const textClass = compact ? (scriptFont ? "text-xl" : "text-sm") : scriptFont ? "text-2xl" : "text-base sm:text-lg";
  const btnClass = `btn w-full font-sans ${compact ? "py-2.5 text-sm" : "py-3.5 text-base"} shadow-md`;
  const btnStyle = { background: t.accent, color: t.accentText } as const;

  if (!screen) {
    return <p className="text-center text-sm text-muted">Додайте хоча б один екран.</p>;
  }

  const Image = screen.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={screen.imageUrl}
      alt=""
      className={`mx-auto mb-5 w-full rounded-2xl object-cover ${compact ? "max-h-40" : "max-h-72"}`}
      loading="lazy"
    />
  ) : null;

  const heading = (title: string, text: string) => (
    <>
      {title ? <h1 className={`text-balance font-semibold leading-tight ${titleClass}`}>{txt(title)}</h1> : null}
      {text ? (
        <p className={`mx-auto mt-4 max-w-prose whitespace-pre-line text-pretty ${textClass}`} style={{ color: t.muted }}>
          {txt(text)}
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className={`relative w-full rounded-3xl border shadow-xl backdrop-blur-md ${compact ? "p-6" : "p-8 sm:p-10"} ${font}`}
      style={{ background: t.card, color: t.text, borderColor: t.border }}
    >
      {celebrate ? <Hearts /> : null}

      {screens.length > 1 ? (
        <div className="mb-5 flex justify-center gap-1.5" aria-hidden>
          {screens.map((s, i) => (
            <span
              key={s.id}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 22 : 8, background: i <= index ? t.accent : t.border }}
            />
          ))}
        </div>
      ) : null}

      <div key={screen.id} className="animate-float-in text-center">
        <div className={`${compact ? "text-3xl" : "text-5xl"} leading-none`} aria-hidden>
          {t.emoji}
        </div>
        <div className="mt-4">
          {screen.type === "intro" || screen.type === "media" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <button type="button" onClick={goNext} className={`${btnClass} mt-7`} style={btnStyle}>
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "question" ? (
            <>
              <p className={`${scriptFont ? "text-2xl" : "text-sm uppercase tracking-[0.2em]"}`} style={{ color: t.muted }}>
                {context.recipientName},
              </p>
              {Image ? <div className="mt-4">{Image}</div> : null}
              <div className="mt-2">
                {heading(screen.title, screen.text)}
              </div>
              <div className="mt-7">
                <YesNoButtons
                  template={t}
                  yesLabel={screen.yesLabel}
                  noLabel={screen.noLabel}
                  noMode={noMode}
                  onYes={handleYes}
                  onNo={handleNo}
                  compact={compact}
                />
              </div>
            </>
          ) : null}

          {screen.type === "choice" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <div className="mt-6 grid grid-cols-2 gap-3 font-sans">
                {screen.options.map((o) => {
                  const selected = picked[screen.id] === o.label;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => pick(screen, o.label)}
                      className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${compact ? "text-sm" : ""}`}
                      style={{
                        borderColor: selected ? t.accent : t.border,
                        background: selected ? t.accent : "transparent",
                        color: selected ? t.accentText : t.text,
                        boxShadow: selected ? `0 0 0 3px ${t.border}` : undefined,
                      }}
                    >
                      <span className="mr-2 text-xl" aria-hidden>
                        {o.emoji}
                      </span>
                      <span className="font-semibold">{o.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={!picked[screen.id]}
                className={`${btnClass} mt-6 disabled:opacity-50`}
                style={btnStyle}
              >
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "details" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <DetailsBlock t={t} context={context} compact={compact} />
              <button type="button" onClick={goNext} className={`${btnClass} mt-7`} style={btnStyle}>
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "final" ? (
            <>
              {answer === "no" ? (
                heading(screen.noTitle, screen.noText)
              ) : (
                <>
                  {Image}
                  {heading(screen.title, screen.text)}
                </>
              )}

              {!preview ? (
                <div className="mt-7 font-sans text-left">
                  {submission.status === "sending" ? (
                    <p className="text-center text-sm" style={{ color: t.muted }}>
                      Надсилаю відповідь…
                    </p>
                  ) : null}
                  {submission.status === "error" ? (
                    <p className="text-center text-sm text-red-600">{submission.error}</p>
                  ) : null}
                  {submission.status === "done" && commentState !== "done" ? (
                    <div className="space-y-3">
                      <label htmlFor="comment" className="block text-sm font-medium">
                        Хочеш щось додати для {context.authorName}?
                      </label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        placeholder={answer === "no" ? "Дякую, але…" : "Чекатиму з нетерпінням!"}
                        className="min-h-24 w-full resize-y rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 dark:bg-black/20"
                        style={{ borderColor: t.border, color: t.text }}
                      />
                      <button
                        type="button"
                        onClick={sendComment}
                        disabled={commentState === "sending" || !comment.trim()}
                        className="btn w-full shadow-md disabled:opacity-50"
                        style={{ background: t.text, color: t.dark ? "#0f172a" : "#ffffff" }}
                      >
                        {commentState === "sending" ? "Надсилаю…" : "Надіслати"}
                      </button>
                      {commentState === "error" ? <p className="text-sm text-red-600">Не вдалося надіслати коментар.</p> : null}
                    </div>
                  ) : null}
                  {commentState === "done" ? (
                    <p className="animate-pop text-center text-sm font-medium">Передано! 💌</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-6 font-sans text-xs" style={{ color: t.muted }}>
                  Тут отримувач зможе дописати коментар. Відповідь уже буде у вашому кабінеті.
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailsBlock({ t, context, compact }: { t: Template; context: PlayerContext; compact: boolean }) {
  const when = formatEventDate(context.eventDate, context.eventTime);
  if (!when && !context.place) {
    return (
      <p className="mt-5 font-sans text-sm" style={{ color: t.muted }}>
        Дату й місце домовимо разом 😉
      </p>
    );
  }
  return (
    <dl
      className={`mt-6 grid gap-3 rounded-2xl border p-4 text-left font-sans ${compact ? "text-sm" : "text-base"}`}
      style={{ borderColor: t.border }}
    >
      {when ? (
        <div className="flex items-start gap-3">
          <span aria-hidden>📅</span>
          <div>
            <dt className="text-xs uppercase tracking-wider opacity-70">Коли</dt>
            <dd className="font-medium first-letter:uppercase">{when}</dd>
          </div>
        </div>
      ) : null}
      {context.place ? (
        <div className="flex items-start gap-3">
          <span aria-hidden>📍</span>
          <div>
            <dt className="text-xs uppercase tracking-wider opacity-70">Де</dt>
            <dd className="font-medium">{context.place}</dd>
          </div>
        </div>
      ) : null}
    </dl>
  );
}
