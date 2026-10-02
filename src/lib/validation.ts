import { z } from "zod";
import { templates } from "./templates";
import { noModes, screensSchema, type Screen } from "./screens";

const templateIds = templates.map((t) => t.id) as [string, ...string[]];

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ім'я має містити хоча б 2 символи").max(60),
  email: z.string().trim().toLowerCase().email("Введіть коректний email"),
  password: z.string().min(8, "Пароль має бути не коротший за 8 символів").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Введіть коректний email"),
  password: z.string().min(1, "Введіть пароль"),
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const screensJson = z.string().transform((raw, ctx): Screen[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    ctx.addIssue({ code: "custom", message: "Не вдалося прочитати екрани" });
    return z.NEVER;
  }
  const result = screensSchema.safeParse(parsed);
  if (!result.success) {
    ctx.addIssue({ code: "custom", message: result.error.issues[0]?.message ?? "Перевірте екрани" });
    return z.NEVER;
  }
  return result.data;
});

export const invitationSchema = z.object({
  templateId: z.enum(templateIds),
  recipientName: z.string().trim().min(1, "Вкажіть, кого запрошуєте").max(60),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  eventTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Невірний формат часу")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  place: optionalText(160),
  noMode: z.enum(noModes).default("allow"),
  screens: screensJson,
});

export const responseSchema = z.object({
  slug: z.string().trim().min(1),
  answer: z.enum(["yes", "no"]),
  choices: z
    .array(z.object({ screen: z.string().trim().max(160), value: z.string().trim().max(200) }))
    .max(12)
    .default([]),
});

export const commentSchema = z.object({
  slug: z.string().trim().min(1),
  responseId: z.string().min(1),
  comment: z.string().trim().min(1, "Напишіть щось").max(500),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Ім'я має містити хоча б 2 символи").max(60),
  telegramChatId: z
    .string()
    .trim()
    .regex(/^-?\d*$/, "Chat ID складається лише з цифр")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  notifyByEmail: z.boolean(),
});

export type InvitationInput = z.infer<typeof invitationSchema>;

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Перевірте введені дані";
}
