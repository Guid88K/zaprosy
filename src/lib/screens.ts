import { z } from "zod";
import { formatEventDate } from "./format";

export const screenTypes = ["intro", "question", "choice", "datepick", "rating", "input", "details", "media", "final"] as const;
export type ScreenType = (typeof screenTypes)[number];

export const screenTypeMeta: Record<ScreenType, { name: string; emoji: string; hint: string }> = {
  intro: { name: "Привітання", emoji: "👋", hint: "Перший екран: заголовок, кілька слів і кнопка «Далі»" },
  question: { name: "Питання так/ні", emoji: "💌", hint: "Головне питання з кнопками. Поведінка «ні» задається нижче" },
  choice: { name: "Вибір плану", emoji: "🎯", hint: "Отримувач обирає з ваших варіантів або пропонує свій" },
  datepick: { name: "Вибір дати й часу", emoji: "📅", hint: "Отримувач сам обирає зручний день і час із тих, що ви дозволили" },
  rating: { name: "Шкала настрою", emoji: "🔥", hint: "Отримувач оцінює, наскільки хоче піти: від «ну таке» до «не можу дочекатися»" },
  input: { name: "Відкрите питання", emoji: "✍️", hint: "Отримувач пише відповідь текстом: контакт, побажання, що взяти" },
  details: { name: "Коли й де (задано вами)", emoji: "📍", hint: "Показує дату, час і місце з розділу «Основне», без вибору" },
  media: { name: "Фото або GIF", emoji: "🖼️", hint: "Картинка за посиланням із підписом" },
  final: { name: "Фінал", emoji: "🎉", hint: "Що побачить після відповіді. Є окремий текст для «ні»" },
};

const title = z.string().trim().max(160).default("");
const text = z.string().trim().max(800).default("");
const imageUrl = z
  .string()
  .trim()
  .max(600)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Посилання має починатися з http(s)://")
  .default("");
const button = z.string().trim().min(1, "Підпис кнопки порожній").max(40).default("Далі");
const id = z.string().min(1).max(40);

export const screenSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("intro"), title, text, imageUrl, button }),
  z.object({
    id,
    type: z.literal("question"),
    title,
    text,
    imageUrl,
    yesLabel: z.string().trim().min(1).max(40).default("Так! 💛"),
    noLabel: z.string().trim().min(1).max(40).default("На жаль, ні"),
  }),
  z.object({
    id,
    type: z.literal("choice"),
    title,
    text,
    imageUrl,
    options: z
      .array(
        z.object({
          emoji: z.string().trim().max(8).default(""),
          label: z.string().trim().min(1, "Варіант порожній").max(60),
        }),
      )
      .min(2, "Потрібно хоча б два варіанти")
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
    labels: z.array(z.string().trim().min(1).max(40)).length(5).default(["Ну таке", "Норм", "Цікаво", "Дуже хочу", "Не можу дочекатися"]),
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
    noTitle: z.string().trim().max(160).default("Шкода 💙"),
    noText: z.string().trim().max(800).default("Дякую за чесну відповідь. Можливо, іншим разом."),
  }),
]);

export const screensSchema = z.array(screenSchema).min(1, "Додайте хоча б один екран").max(12);

export type Screen = z.infer<typeof screenSchema>;
export type ScreenOf<T extends ScreenType> = Extract<Screen, { type: T }>;

export function newScreenId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newScreen(type: ScreenType): Screen {
  const sid = newScreenId();
  switch (type) {
    case "intro":
      return { id: sid, type, title: "Привіт, {name}! 👋", text: "У мене для тебе дещо є…", imageUrl: "", button: "Відкрити" };
    case "question":
      return { id: sid, type, title: "Підеш зі мною на побачення?", text: "", imageUrl: "", yesLabel: "Так! 💛", noLabel: "На жаль, ні" };
    case "choice":
      return {
        id: sid,
        type,
        title: "Що обираємо?",
        text: "",
        imageUrl: "",
        options: [
          { emoji: "☕", label: "Кава" },
          { emoji: "🍝", label: "Вечеря" },
          { emoji: "🎬", label: "Кіно" },
          { emoji: "🚶", label: "Прогулянка" },
        ],
        allowCustom: true,
        button: "Далі",
      };
    case "datepick":
      return {
        id: sid,
        type,
        title: "Коли тобі зручно?",
        text: "Обери день і час, а решту я організую.",
        imageUrl: "",
        dateMode: "any",
        daysAhead: 14,
        dates: [],
        timeMode: "slots",
        slots: ["12:00", "15:00", "19:00"],
        button: "Підтвердити",
      };
    case "rating":
      return {
        id: sid,
        type,
        title: "Наскільки хочеш піти?",
        text: "",
        imageUrl: "",
        labels: ["Ну таке", "Норм", "Цікаво", "Дуже хочу", "Не можу дочекатися"],
        button: "Далі",
      };
    case "input":
      return {
        id: sid,
        type,
        title: "Щось додати?",
        text: "Побажання, алергії, улюблена музика — усе, що мені варто знати.",
        imageUrl: "",
        placeholder: "Напиши тут…",
        required: false,
        button: "Далі",
      };
    case "details":
      return { id: sid, type, title: "Коли й де", text: "", imageUrl: "", button: "Чудово" };
    case "media":
      return { id: sid, type, title: "", text: "", imageUrl: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif", button: "Далі" };
    case "final":
      return {
        id: sid,
        type,
        title: "Ура! 🎉",
        text: "{name}, домовились: {choice}, {when}. {author} уже знає й чекає зустрічі!",
        imageUrl: "",
        noTitle: "Шкода 💙",
        noText: "Дякую за чесну відповідь. Можливо, іншим разом.",
      };
  }
}

/** Стартовий набір екранів для нового запрошення. */
export function defaultScreens(): Screen[] {
  return [newScreen("intro"), newScreen("question"), newScreen("choice"), newScreen("datepick"), newScreen("rating"), newScreen("final")];
}

type LegacyFields = {
  question: string;
  message: string | null;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
};

/** Екрани для запрошень, створених до появи конструктора екранів. */
export function legacyScreens(inv: LegacyFields): Screen[] {
  const screens: Screen[] = [
    { id: "q", type: "question", title: inv.question, text: inv.message ?? "", imageUrl: "", yesLabel: "Так! 💛", noLabel: "На жаль, ні" },
  ];
  if (inv.eventDate || inv.eventTime || inv.place) {
    screens.push({ id: "d", type: "details", title: "Коли й де", text: "", imageUrl: "", button: "Чудово" });
  }
  screens.push({
    id: "f",
    type: "final",
    title: "Ура! 🎉",
    text: "{author} уже знає, що ти за. Домовляйтеся про деталі 😉",
    imageUrl: "",
    noTitle: "Шкода 💙",
    noText: "Дякую за чесну відповідь. Можливо, іншим разом.",
  });
  return screens;
}

/** Розбирає JSON екранів із бази; на помилку або null повертає legacy-екрани. */
export function parseScreens(json: string | null, inv: LegacyFields): Screen[] {
  if (!json) return legacyScreens(inv);
  try {
    const parsed = screensSchema.safeParse(JSON.parse(json));
    if (parsed.success) return ensureFinal(parsed.data);
  } catch {
    /* падаємо на legacy */
  }
  return legacyScreens(inv);
}

export function ensureFinal(screens: Screen[]): Screen[] {
  return screens.some((s) => s.type === "final") ? screens : [...screens, newScreen("final")];
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
    date: formatEventDate(ctx.eventDate, null) ?? "",
    time: ctx.eventTime ?? "",
    place: ctx.place ?? "",
  };
}

/** Підставляє {name}, {author}, {choice}, {date}, {time}, {place}. */
export function renderVars(template: string, vars: ScreenVars): string {
  return template.replace(/\{(name|author|choice|when|date|time|place)\}/g, (_, key: keyof ScreenVars) => vars[key] ?? "");
}

export const noModes = ["allow", "runaway", "shrink", "multiply"] as const;
export type NoModeId = (typeof noModes)[number];

export const noModeMeta: Record<NoModeId, { name: string; hint: string }> = {
  allow: { name: "Звичайна", hint: "Отримувач може чесно відповісти «ні»" },
  runaway: { name: "Тікає 🏃", hint: "Відстрибує від курсора й пальця, «Так» росте" },
  shrink: { name: "Зменшується 🔬", hint: "З кожною спробою меншає, доки не зникне" },
  multiply: { name: "Розмножує «Так» 🐇", hint: "Кожне натискання «ні» додає ще одну кнопку «Так»" },
};

/** Короткий підпис для списку запрошень. */
export function summarizeScreens(screens: Screen[]): string {
  const q = screens.find((s): s is ScreenOf<"question"> => s.type === "question");
  if (q?.title) return q.title;
  const first = screens.find((s) => s.title);
  return first?.title ?? "Запрошення";
}
