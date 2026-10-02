import { z } from "zod";
import { templates } from "./templates";

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

export const invitationSchema = z.object({
  templateId: z.enum(templateIds),
  recipientName: z.string().trim().min(1, "Вкажіть, кого запрошуєте").max(60),
  question: z.string().trim().min(3, "Сформулюйте питання").max(160),
  message: optionalText(600),
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
});

export const responseSchema = z.object({
  slug: z.string().trim().min(1),
  answer: z.enum(["yes", "no"]),
  comment: optionalText(500),
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
