import { z } from "zod";
import { formatEventDate } from "./format";
import { fmt, getDictionary, type Dict, type Locale } from "./i18n";

export const screenTypes = ["intro", "question", "choice", "datepick", "rating", "input", "details", "media", "final"] as const;
export type ScreenType = (typeof screenTypes)[number];

export const noModes = ["allow", "runaway", "shrink", "multiply"] as const;
export type NoModeId = (typeof noModes)[number];

/** Назви й підказки типів екранів вибраною мовою. */
export function screenTypeMeta(locale: Locale): Record<ScreenType, { name: string; emoji: string; hint: string }> {
  const t = getDictionary(locale).screens.types;
  const emoji: Record<ScreenType, string> = {
    intro: "👋",
    question: "💌",
    choice: "🎯",
    datepick: "📅",
    rating: "🔥",
    input: "✍️",
    details: "📍",
    media: "🖼️",
    final: "🎉",
  };
  return Object.fromEntries(screenTypes.map((k) => [k, { ...t[k], emoji: emoji[k] }])) as Record<
    ScreenType,
    { name: string; emoji: string; hint: string }
  >;
}

export function noModeMeta(locale: Locale): Record<NoModeId, { name: string; hint: string }> {
  return getDictionary(locale).screens.noModes;
}

/** Схема екранів з повідомленнями про помилки вибраною мовою. */
export function makeScreenSchema(dict: Dict) {
  const e = dict.screens.errors;
  const title = z.string().trim().max(160).default("");
  const text = z.string().trim().max(800).default("");
  const imageUrl = z
    .string()
    .trim()
    .max(600)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), e.imageUrl)
    .default("");
  const button = z.string().trim().min(1, e.button).max(40).default(dict.screens.defaults.next);
  const id = z.string().min(1).max(40);

  const screenSchema = z.discriminatedUnion("type", [
    z.object({ id, type: z.literal("intro"), title, text, imageUrl, button }),
    z.object({
      id,
      type: z.literal("question"),
      title,
      text,
      imageUrl,
      yesLabel: z.string().trim().min(1).max(40).default(dict.screens.defaults.yes),
      noLabel: z.string().trim().min(1).max(40).default(dict.screens.defaults.no),
    }),
    z.object({
      id,
      type: z.literal("choice"),
      title,
      text,
      imageUrl,
      options: z
        .array(z.object({ emoji: z.string().trim().max(8).default(""), label: z.string().trim().min(1, e.option).max(60) }))
        .min(2, e.options)
        .max(8),
      allowCustom: z.boolean().default(true),
      button,
    }),
    z.object({
      id,
      type: z.literal("datepick"),
      title,
      text,
      imageUrl,
      /** any: будь-який день із найближчих daysAhead; list: лише дати з dates */
      dateMode: z.enum(["any", "list"]).default("any"),
      daysAhead: z.number().int().min(3).max(60).default(14),
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(14).default([]),
      /** slots: лише запропонований час; free: отримувач вводить час сам */
      timeMode: z.enum(["slots", "free"]).default("slots"),
      slots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(12).default(["12:00", "15:00", "19:00"]),
      button,
    }),
    z.object({
      id,
      type: z.literal("rating"),
      title,
      text,
      imageUrl,
      labels: z.array(z.string().trim().min(1).max(40)).length(5).default([...dict.screens.defaults.ratingLabels]),
      button,
    }),
    z.object({
      id,
      type: z.literal("input"),
      title,
      text,
      imageUrl,
      placeholder: z.string().trim().max(120).default(""),
      required: z.boolean().default(false),
      button,
    }),
    z.object({ id, type: z.literal("details"), title, text, imageUrl, button }),
    z.object({ id, type: z.literal("media"), title, text, imageUrl, button }),
    z.object({
      id,
      type: z.literal("final"),
      title,
      text,
      imageUrl,
      noTitle: z.string().trim().max(160).default(dict.screens.defaults.finalNoTitle),
      noText: z.string().trim().max(800).default(dict.screens.defaults.finalNoText),
    }),
  ]);

  return { screenSchema, screensSchema: z.array(screenSchema).min(1, e.min).max(12) };
}

export type Screen = z.infer<ReturnType<typeof makeScreenSchema>["screenSchema"]>;
export type ScreenOf<T extends ScreenType> = Extract<Screen, { type: T }>;

export function newScreenId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newScreen(type: ScreenType, locale: Locale): Screen {
  const d = getDictionary(locale).screens.defaults;
  const sid = newScreenId();
  switch (type) {
    case "intro":
      return { id: sid, type, title: d.introTitle, text: d.introText, imageUrl: "", button: d.introButton };
    case "question":
      return { id: sid, type, title: d.question, text: "", imageUrl: "", yesLabel: d.yes, noLabel: d.no };
    case "choice":
      return { id: sid, type, title: d.choiceTitle, text: "", imageUrl: "", options: d.options.map((o) => ({ ...o })), allowCustom: true, button: d.next };
    case "datepick":
      return {
        id: sid,
        type,
        title: d.datepickTitle,
        text: d.datepickText,
        imageUrl: "",
        dateMode: "any",
        daysAhead: 14,
        dates: [],
        timeMode: "slots",
        slots: ["12:00", "15:00", "19:00"],
        button: d.datepickButton,
      };
    case "rating":
      return { id: sid, type, title: d.ratingTitle, text: "", imageUrl: "", labels: [...d.ratingLabels], button: d.next };
    case "input":
      return { id: sid, type, title: d.inputTitle, text: d.inputText, imageUrl: "", placeholder: d.inputPlaceholder, required: false, button: d.next };
    case "details":
      return { id: sid, type, title: d.detailsTitle, text: "", imageUrl: "", button: d.detailsButton };
    case "media":
      return { id: sid, type, title: "", text: "", imageUrl: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif", button: d.next };
    case "final":
      return { id: sid, type, title: d.finalTitle, text: d.finalText, imageUrl: "", noTitle: d.finalNoTitle, noText: d.finalNoText };
  }
}

/** Стартовий набір екранів для нового запрошення. */
export function defaultScreens(locale: Locale): Screen[] {
  return ["intro", "question", "choice", "datepick", "rating", "final"].map((t) => newScreen(t as ScreenType, locale));
}

/** Чи екрани ще стандартні (порівняння без id), щоб можна було безпечно замінити їх при зміні мови. */
export function isDefaultSet(screens: Screen[], locale: Locale): boolean {
  const strip = (list: Screen[]) =>
    JSON.stringify(
      list.map((s) => {
        const copy: Record<string, unknown> = { ...s };
        delete copy.id;
        return copy;
      }),
    );
  return strip(screens) === strip(defaultScreens(locale));
}

type LegacyFields = {
  question: string;
  message: string | null;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
};

/** Екрани для запрошень, створених до появи конструктора екранів. */
export function legacyScreens(inv: LegacyFields, locale: Locale): Screen[] {
  const d = getDictionary(locale).screens.defaults;
  const screens: Screen[] = [
    { id: "q", type: "question", title: inv.question, text: inv.message ?? "", imageUrl: "", yesLabel: d.yes, noLabel: d.no },
  ];
  if (inv.eventDate || inv.eventTime || inv.place) {
    screens.push({ id: "d", type: "details", title: d.detailsTitle, text: "", imageUrl: "", button: d.detailsButton });
  }
  screens.push({ id: "f", type: "final", title: d.finalTitle, text: d.legacyFinalText, imageUrl: "", noTitle: d.finalNoTitle, noText: d.finalNoText });
  return screens;
}

/** Розбирає JSON екранів із бази; на помилку або null повертає legacy-екрани. */
export function parseScreens(json: string | null, inv: LegacyFields, locale: Locale): Screen[] {
  if (!json) return legacyScreens(inv, locale);
  try {
    const parsed = makeScreenSchema(getDictionary(locale)).screensSchema.safeParse(JSON.parse(json));
    if (parsed.success) return ensureFinal(parsed.data, locale);
  } catch {
    /* падаємо на legacy */
  }
  return legacyScreens(inv, locale);
}

export function ensureFinal(screens: Screen[], locale: Locale): Screen[] {
  return screens.some((s) => s.type === "final") ? screens : [...screens, newScreen("final", locale)];
}

export type ScreenVars = {
  name: string;
  author: string;
  /** усе, що отримувач обрав на екранах «Вибір плану» */
  choice: string;
  /** день і час з екрана «Вибір дати й часу» */
  when: string;
  date: string;
  time: string;
  place: string;
};

export type Choice = { screen: string; value: string; kind?: ScreenType };

export function buildVars(ctx: {
  locale: Locale;
  recipientName: string;
  authorName: string;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
  choices: Choice[];
}): ScreenVars {
  const picks = ctx.choices.filter((c) => c.kind === "choice" || c.kind === undefined).map((c) => c.value);
  const when = ctx.choices.find((c) => c.kind === "datepick")?.value ?? "";
  return {
    name: ctx.recipientName,
    author: ctx.authorName,
    choice: picks.join(", "),
    when,
    date: formatEventDate(ctx.eventDate, null, ctx.locale) ?? "",
    time: ctx.eventTime ?? "",
    place: ctx.place ?? "",
  };
}

/** Підставляє {name}, {author}, {choice}, {when}, {date}, {time}, {place}. */
export function renderVars(template: string, vars: ScreenVars): string {
  return fmt(template, vars);
}

/** Короткий підпис для списку запрошень. */
export function summarizeScreens(screens: Screen[], locale: Locale): string {
  const q = screens.find((s): s is ScreenOf<"question"> => s.type === "question");
  if (q?.title) return q.title;
  const first = screens.find((s) => s.title);
  return first?.title ?? getDictionary(locale).screens.defaults.summaryFallback;
}
