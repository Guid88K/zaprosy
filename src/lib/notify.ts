import "server-only";
import nodemailer from "nodemailer";
import type { Invitation, Response, User } from "@/db/schema";
import { fmt, getDictionary, isLocale } from "@/lib/i18n";

type NotifyPayload = {
  author: User;
  invitation: Invitation;
  response: Response;
  manageUrl: string;
};

export function notificationChannels() {
  return {
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    email: Boolean(process.env.SMTP_HOST),
  };
}

function dictFor(author: User) {
  return getDictionary(isLocale(author.locale) ? author.locale : "uk");
}

function buildText({ author, invitation, response, manageUrl }: NotifyPayload): string {
  const n = dictFor(author).notify;
  const verdict = response.answer === "yes" ? n.yes : n.no;
  const lines = [fmt(n.answered, { name: invitation.recipientName, verdict }), fmt(n.question, { question: invitation.question })];
  if (response.choices) {
    try {
      const picks = JSON.parse(response.choices) as { screen: string; value: string }[];
      for (const p of picks) lines.push(`${p.screen || n.choiceFallback}: ${p.value}`);
    } catch {
      /* ігноруємо зламаний JSON */
    }
  }
  if (response.comment) lines.push(fmt(n.comment, { comment: response.comment }));
  lines.push("", fmt(n.details, { url: manageUrl }));
  return lines.join("\n");
}

async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    throw new Error(`Telegram API: ${res.status} ${await res.text()}`);
  }
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) return;
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "zaprosy@localhost",
    to,
    subject,
    text,
  });
}

/** Надсилає автору сповіщення про нову відповідь усіма налаштованими каналами. Помилки не кидає. */
export async function notifyAuthor(payload: NotifyPayload): Promise<void> {
  const { author, invitation, response } = payload;
  const text = buildText(payload);
  const n = dictFor(author).notify;
  const subject = fmt(response.answer === "yes" ? n.subjectYes : n.subjectAnswered, { name: invitation.recipientName });

  const jobs: Promise<void>[] = [];
  if (author.telegramChatId) jobs.push(sendTelegram(author.telegramChatId, text));
  if (author.notifyByEmail) jobs.push(sendEmail(author.email, subject, text));

  if (jobs.length === 0 || (!process.env.TELEGRAM_BOT_TOKEN && !process.env.SMTP_HOST)) {
    console.info(`[notify] Канали не налаштовані. Повідомлення для ${author.email}:\n${text}`);
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") console.error("[notify] Помилка надсилання:", r.reason);
  }
}
