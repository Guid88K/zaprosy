import { z } from "zod";
import { formatEventDate } from "./format";

export const screenTypes = ["intro", "question", "choice", "details", "media", "final"] as const;
export type ScreenType = (typeof screenTypes)[number];

export const screenTypeMeta: Record<ScreenType, { name: string; emoji: string; hint: string }> = {
  intro: { name: "Привітання", emoji: "👋", hint: "Перший екран: заголовок, кілька слів і кнопка «Далі»" },
  question: { name: "Питання так/ні", emoji: "💌", hint: "Головне питання з кнопками. Поведінка «ні» задається нижче" },
  choice: { name: "Вибір варіанта", emoji: "🎯", hint: "Отримувач обирає активність, місце чи час з ваших варіантів" },
  details: { name: "Коли й де", emoji: "📍", hint: "Показує дату, час і місце з полів запрошення" },
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
        text: "{name}, ти обрав(ла) «{choice}». {author} уже знає й чекає зустрічі!",
        imageUrl: "",
        noTitle: "Шкода 💙",
        noText: "Дякую за чесну відповідь. Можливо, іншим разом.",
      };
  }
}

/** Стартовий набір екранів для нового запрошення. */
export function defaultScreens(): Screen[] {
  return [newScreen("intro"), newScreen("question"), newScreen("choice"), newScreen("details"), newScreen("final")];
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
  choice: string;
  date: string;
  time: string;
  place: string;
};

export function buildVars(ctx: {
  recipientName: string;
  authorName: string;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
  choices: { screen: string; value: string }[];
}): ScreenVars {
  return {
    name: ctx.recipientName,
    author: ctx.authorName,
    choice: ctx.choices.map((c) => c.value).join(", "),
    date: formatEventDate(ctx.eventDate, null) ?? "",
    time: ctx.eventTime ?? "",
    place: ctx.place ?? "",
  };
}

/** Підставляє {name}, {author}, {choice}, {date}, {time}, {place}. */
export function renderVars(template: string, vars: ScreenVars): string {
  return template.replace(/\{(name|author|choice|date|time|place)\}/g, (_, key: keyof ScreenVars) => vars[key] ?? "");
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
