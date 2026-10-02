import { z } from "zod";
import { locales, type Dict } from "./i18n";
import { makeScreenSchema, noModes, type Screen } from "./screens";
import { templates } from "./templates";

const templateIds = templates.map((t) => t.id) as [string, ...string[]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

/** Схеми форм із повідомленнями вибраною мовою. */
export function makeValidation(dict: Dict) {
  const v = dict.validation;
  const { screensSchema } = makeScreenSchema(dict);

  const screensJson = z.string().transform((raw, ctx): Screen[] => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: dict.screens.errors.parse });
      return z.NEVER;
    }
    const result = screensSchema.safeParse(parsed);
    if (!result.success) {
      ctx.addIssue({ code: "custom", message: result.error.issues[0]?.message ?? dict.screens.errors.check });
      return z.NEVER;
    }
    return result.data;
  });

  return {
    registerSchema: z.object({
      name: z.string().trim().min(2, v.nameMin).max(60),
      email: z.string().trim().toLowerCase().email(v.email),
      password: z.string().min(8, v.passwordMin).max(128),
    }),
    loginSchema: z.object({
      email: z.string().trim().toLowerCase().email(v.email),
      password: z.string().min(1, v.passwordRequired),
    }),
    invitationSchema: z.object({
      templateId: z.enum(templateIds),
      recipientName: z.string().trim().min(1, v.recipient).max(60),
      eventDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, v.date)
        .or(z.literal(""))
        .transform((x) => (x === "" ? null : x))
        .nullable(),
      eventTime: z
        .string()
        .trim()
        .regex(/^\d{2}:\d{2}$/, v.time)
        .or(z.literal(""))
        .transform((x) => (x === "" ? null : x))
        .nullable(),
      place: optionalText(160),
      noMode: z.enum(noModes).default("allow"),
      locale: z.enum(locales).default("uk"),
      screens: screensJson,
    }),
    responseSchema: z.object({
      slug: z.string().trim().min(1),
      answer: z.enum(["yes", "no"]),
      choices: z
        .array(
          z.object({
            screen: z.string().trim().max(160),
            value: z.string().trim().max(300),
            kind: z.enum(["choice", "datepick", "rating", "input"]).optional(),
          }),
        )
        .max(12)
        .default([]),
    }),
    commentSchema: z.object({
      slug: z.string().trim().min(1),
      responseId: z.string().min(1),
      comment: z.string().trim().min(1, v.comment).max(500),
    }),
    settingsSchema: z.object({
      name: z.string().trim().min(2, v.nameMin).max(60),
      telegramChatId: z
        .string()
        .trim()
        .regex(/^-?\d*$/, v.chatId)
        .transform((x) => (x === "" ? null : x))
        .nullable(),
      notifyByEmail: z.boolean(),
      locale: z.enum(locales).default("uk"),
    }),
    firstError(error: z.ZodError): string {
      return error.issues[0]?.message ?? v.generic;
    },
  };
}
