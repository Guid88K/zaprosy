"use client";

import { useEffect, useRef, useState } from "react";
import { addResponseComment, submitResponse } from "@/lib/actions/invitations";
import { formatEventDate } from "@/lib/format";
import { fmt, getDictionary, type Locale } from "@/lib/i18n";
import { buildVars, renderVars, type Choice, type NoModeId, type Screen, type ScreenOf, type ScreenType } from "@/lib/screens";
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

type Props = {
  template: Template;
  screens: Screen[];
  context: PlayerContext;
  noMode: NoModeId;
  /** Мова запрошення: кнопки, дати й підказки для отримувача */
  locale: Locale;
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
  locale,
  mode,
  previewIndex,
  onPreviewIndexChange,
  compact = false,
}: Props) {
  const d = getDictionary(locale).player;
  const CUSTOM = d.custom;
  const [liveIndex, setLiveIndex] = useState(0);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [picksById, setPicksById] = useState<Record<string, Choice>>({});
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState<Record<string, string>>({});
  const [dateSel, setDateSel] = useState<Record<string, { date?: string; time?: string }>>({});
  const [freeText, setFreeText] = useState<Record<string, string>>({});
  const choices: Choice[] = screens.map((s) => picksById[s.id]).filter((c): c is Choice => Boolean(c));
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

  function record(s: Screen, value: string, kind: ScreenType, fallbackTitle: string) {
    setPicksById((m) => ({ ...m, [s.id]: { screen: s.title || fallbackTitle, value, kind } }));
  }

  function pick(s: ScreenOf<"choice">, label: string) {
    setPicked((p) => ({ ...p, [s.id]: label }));
    if (label !== CUSTOM) record(s, label, "choice", d.recordScreens.choice);
  }

  function pickCustom(s: ScreenOf<"choice">, text: string) {
    setCustomText((m) => ({ ...m, [s.id]: text }));
    if (text.trim()) record(s, text.trim(), "choice", d.recordScreens.choice);
  }

  function pickDate(s: ScreenOf<"datepick">, patch: { date?: string; time?: string }) {
    const next = { ...dateSel[s.id], ...patch };
    setDateSel((m) => ({ ...m, [s.id]: next }));
    if (next.date && next.time) {
      record(s, formatEventDate(next.date, next.time, locale) ?? `${next.date} ${next.time}`, "datepick", d.recordScreens.when);
    }
  }

  function pickRating(s: ScreenOf<"rating">, i: number) {
    setPicked((p) => ({ ...p, [s.id]: String(i) }));
    record(s, `${ratingEmojis[i]} ${s.labels[i]} (${i + 1}/5)`, "rating", d.recordScreens.mood);
  }

  function typeInput(s: ScreenOf<"input">, text: string) {
    setFreeText((m) => ({ ...m, [s.id]: text }));
    if (text.trim()) record(s, text.trim(), "input", d.recordScreens.answer);
    else setPicksById((m) => { const n = { ...m }; delete n[s.id]; return n; });
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
      .catch(() => setSubmission({ status: "error", error: d.sendError }));
  }, [screen, answer, choices, context.slug, preview, d.sendError]);

  async function sendComment() {
    if (submission.status !== "done" || !comment.trim()) return;
    setCommentState("sending");
    const r = await addResponseComment({ slug: context.slug, responseId: submission.responseId, comment });
    setCommentState(r.ok ? "done" : "error");
  }

  const vars = buildVars({ ...context, choices, locale });
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
    return <p className="text-center text-sm text-muted">{d.noScreens}</p>;
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
                {fmt(d.recipientComma, { name: context.recipientName })}
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
                  locale={locale}
                />
              </div>
            </>
          ) : null}

          {screen.type === "choice" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <div className="mt-6 grid grid-cols-2 gap-3 font-sans">
                {[...screen.options, ...(screen.allowCustom ? [{ emoji: "✏️", label: CUSTOM }] : [])].map((o) => {
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
              {picked[screen.id] === CUSTOM ? (
                <input
                  className="mt-3 w-full rounded-xl border bg-white/60 px-3.5 py-2.5 font-sans text-sm outline-none focus:ring-2 dark:bg-black/20"
                  style={{ borderColor: t.border, color: t.text }}
                  placeholder={d.customPlaceholder}
                  value={customText[screen.id] ?? ""}
                  onChange={(e) => pickCustom(screen, e.target.value)}
                  maxLength={120}
                  autoFocus
                />
              ) : null}
              <button
                type="button"
                onClick={goNext}
                disabled={!picksById[screen.id]}
                className={`${btnClass} mt-6 disabled:opacity-50`}
                style={btnStyle}
              >
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "datepick" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <div className="mt-6 space-y-5 font-sans text-left">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider opacity-70">{d.day}</p>
                  <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                    {dayOptions(screen, locale).map((day) => {
                      const sel = dateSel[screen.id]?.date === day.iso;
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() => pickDate(screen, { date: day.iso })}
                          className="rounded-xl border px-3 py-2 text-left text-sm transition hover:-translate-y-0.5"
                          style={{
                            borderColor: sel ? t.accent : t.border,
                            background: sel ? t.accent : "transparent",
                            color: sel ? t.accentText : t.text,
                          }}
                        >
                          <span className="block text-[10px] uppercase tracking-wider opacity-70">{day.weekday}</span>
                          <span className="font-semibold">{day.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider opacity-70">{d.time}</p>
                  {screen.timeMode === "slots" ? (
                    <div className="flex flex-wrap gap-2">
                      {screen.slots.map((slot) => {
                        const sel = dateSel[screen.id]?.time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => pickDate(screen, { time: slot })}
                            className="rounded-xl border px-3.5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                            style={{
                              borderColor: sel ? t.accent : t.border,
                              background: sel ? t.accent : "transparent",
                              color: sel ? t.accentText : t.text,
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="time"
                      className="w-full rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 dark:bg-black/20"
                      style={{ borderColor: t.border, color: t.text }}
                      value={dateSel[screen.id]?.time ?? ""}
                      onChange={(e) => pickDate(screen, { time: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={!picksById[screen.id]}
                className={`${btnClass} mt-6 disabled:opacity-50`}
                style={btnStyle}
              >
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "rating" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <div className="mt-6 grid grid-cols-5 gap-2 font-sans">
                {ratingEmojis.map((emoji, i) => {
                  const sel = picked[screen.id] === String(i);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => pickRating(screen, i)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition hover:-translate-y-0.5 ${sel ? "scale-110" : ""}`}
                      style={{
                        borderColor: sel ? t.accent : t.border,
                        background: sel ? t.accent : "transparent",
                        color: sel ? t.accentText : t.text,
                      }}
                    >
                      <span className={compact ? "text-2xl" : "text-3xl"} aria-hidden>
                        {emoji}
                      </span>
                      <span className="text-[10px] leading-tight">{screen.labels[i]}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={!picksById[screen.id]}
                className={`${btnClass} mt-6 disabled:opacity-50`}
                style={btnStyle}
              >
                {screen.button}
              </button>
            </>
          ) : null}

          {screen.type === "input" ? (
            <>
              {Image}
              {heading(screen.title, screen.text)}
              <textarea
                className="mt-5 min-h-24 w-full resize-y rounded-xl border bg-white/60 px-3.5 py-2.5 font-sans text-sm outline-none focus:ring-2 dark:bg-black/20"
                style={{ borderColor: t.border, color: t.text }}
                placeholder={screen.placeholder || d.writeHere}
                value={freeText[screen.id] ?? ""}
                onChange={(e) => typeInput(screen, e.target.value)}
                maxLength={300}
              />
              <button
                type="button"
                onClick={goNext}
                disabled={screen.required && !picksById[screen.id]}
                className={`${btnClass} mt-5 disabled:opacity-50`}
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
              <DetailsBlock t={t} context={context} compact={compact} locale={locale} />
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
                      {d.sending}
                    </p>
                  ) : null}
                  {submission.status === "error" ? (
                    <p className="text-center text-sm text-red-600">{submission.error}</p>
                  ) : null}
                  {submission.status === "done" && commentState !== "done" ? (
                    <div className="space-y-3">
                      <label htmlFor="comment" className="block text-sm font-medium">
                        {fmt(d.addSomething, { author: context.authorName })}
                      </label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        placeholder={answer === "no" ? d.commentNo : d.commentYes}
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
                        {commentState === "sending" ? d.sendingShort : d.send}
                      </button>
                      {commentState === "error" ? <p className="text-sm text-red-600">{d.commentError}</p> : null}
                    </div>
                  ) : null}
                  {commentState === "done" ? (
                    <p className="animate-pop text-center text-sm font-medium">{d.sent}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-6 font-sans text-xs" style={{ color: t.muted }}>
                  {d.previewNote}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const ratingEmojis = ["😐", "🙂", "😊", "😍", "🔥"];

/** Варіанти днів для екрана вибору дати: найближчі N днів або список автора. */
function dayOptions(s: ScreenOf<"datepick">, locale: Locale): { iso: string; weekday: string; label: string }[] {
  const intl = getDictionary(locale).intl;
  const isoList: string[] = [];
  if (s.dateMode === "list" && s.dates.length) {
    isoList.push(...s.dates);
  } else {
    const d = new Date();
    for (let i = 0; i < s.daysAhead; i++) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      isoList.push(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
    }
  }
  const wd = new Intl.DateTimeFormat(intl, { weekday: "short" });
  const dm = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
  return isoList.map((iso) => {
    const date = new Date(`${iso}T00:00:00`);
    return { iso, weekday: wd.format(date), label: dm.format(date) };
  });
}

function DetailsBlock({ t, context, compact, locale }: { t: Template; context: PlayerContext; compact: boolean; locale: Locale }) {
  const d = getDictionary(locale).player;
  const when = formatEventDate(context.eventDate, context.eventTime, locale);
  if (!when && !context.place) {
    return (
      <p className="mt-5 font-sans text-sm" style={{ color: t.muted }}>
        {d.noDetails}
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
            <dt className="text-xs uppercase tracking-wider opacity-70">{d.when}</dt>
            <dd className="font-medium first-letter:uppercase">{when}</dd>
          </div>
        </div>
      ) : null}
      {context.place ? (
        <div className="flex items-start gap-3">
          <span aria-hidden>📍</span>
          <div>
            <dt className="text-xs uppercase tracking-wider opacity-70">{d.where}</dt>
            <dd className="font-medium">{context.place}</dd>
          </div>
        </div>
      ) : null}
    </dl>
  );
}
