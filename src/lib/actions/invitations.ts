"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb } from "@/db";
import { invitations, responses, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getDict, getLocale } from "@/lib/i18n/server";
import { notifyAuthor } from "@/lib/notify";
import { ensureFinal, noModes, summarizeScreens, type Screen } from "@/lib/screens";
import { getBaseUrl } from "@/lib/url";
import { makeValidation } from "@/lib/validation";
import type { Locale } from "@/lib/i18n";

const slugAlphabet = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export type FormState = { error?: string; ok?: boolean };

async function parseInvitationForm(formData: FormData) {
  const dict = await getDict();
  const { invitationSchema, firstError } = makeValidation(dict);
  const parsed = invitationSchema.safeParse({
    templateId: formData.get("templateId"),
    recipientName: formData.get("recipientName"),
    eventDate: formData.get("eventDate") ?? "",
    eventTime: formData.get("eventTime") ?? "",
    place: formData.get("place") ?? "",
    noMode: formData.get("noMode") ?? "allow",
    locale: formData.get("locale") ?? (await getLocale()),
    screens: formData.get("screens") ?? "[]",
  });
  return { parsed, firstError, dict };
}

function derivedFields(screens: Screen[], locale: Locale) {
  const finalScreens = ensureFinal(screens, locale);
  const q = finalScreens.find((s) => s.type === "question");
  return {
    screens: JSON.stringify(finalScreens),
    question: summarizeScreens(finalScreens, locale),
    message: q && q.type === "question" && q.text ? q.text : null,
  };
}

export async function createInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const { parsed, firstError, dict } = await parseInvitationForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { screens, ...fields } = parsed.data;

  const db = await getDb();
  let created: { id: string } | undefined;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      [created] = await db
        .insert(invitations)
        .values({ ...fields, ...derivedFields(screens, fields.locale), userId: user.id, slug: slugAlphabet() })
        .returning({ id: invitations.id });
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  if (!created) return { error: dict.validation.createFailed };

  revalidatePath("/dashboard");
  redirect(`/dashboard/${created.id}`);
}

export async function updateInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { parsed, firstError, dict } = await parseInvitationForm(formData);
  if (!id) return { error: dict.validation.notFound };
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { screens, ...fields } = parsed.data;

  const db = await getDb();
  const updated = await db
    .update(invitations)
    .set({ ...fields, ...derivedFields(screens, fields.locale) })
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .returning({ id: invitations.id, slug: invitations.slug });
  if (updated.length === 0) return { error: dict.validation.notFound };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
  revalidatePath(`/i/${updated[0].slug}`);
  redirect(`/dashboard/${id}`);
}

export async function deleteInvitation(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = await getDb();
  await db.delete(invitations).where(and(eq(invitations.id, id), eq(invitations.userId, user.id)));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function setNoMode(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("noMode") ?? "allow");
  const noMode = (noModes as readonly string[]).includes(raw) ? (raw as (typeof noModes)[number]) : "allow";
  if (!id) return;
  const db = await getDb();
  const updated = await db
    .update(invitations)
    .set({ noMode })
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .returning({ slug: invitations.slug });
  revalidatePath(`/dashboard/${id}`);
  if (updated[0]) revalidatePath(`/i/${updated[0].slug}`);
}

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const dict = await getDict();
  const { settingsSchema, firstError } = makeValidation(dict);
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    telegramChatId: formData.get("telegramChatId") ?? "",
    notifyByEmail: formData.get("notifyByEmail") === "on",
    locale: formData.get("locale") ?? user.locale,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export type RespondResult = { ok: true; responseId: string } | { ok: false; error: string };

/** Викликається плеєром запрошення, коли отримувач дійшов до фіналу. */
export async function submitResponse(input: unknown): Promise<RespondResult> {
  const uiDict = await getDict();
  const { responseSchema, firstError } = makeValidation(uiDict);
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.slug, parsed.data.slug),
    with: { author: true },
  });
  if (!invitation) return { ok: false, error: uiDict.validation.notFound };
  // Повідомлення отримувачу — мовою запрошення.
  const dict = getDictionary(isLocale(invitation.locale) ? invitation.locale : "uk");
  if (invitation.noMode !== "allow" && parsed.data.answer === "no") {
    return { ok: false, error: dict.validation.noNotAllowed };
  }

  const [response] = await db
    .insert(responses)
    .values({
      invitationId: invitation.id,
      answer: parsed.data.answer,
      choices: parsed.data.choices.length ? JSON.stringify(parsed.data.choices) : null,
    })
    .returning();

  const baseUrl = await getBaseUrl();
  await notifyAuthor({ author: invitation.author, invitation, response, manageUrl: `${baseUrl}/dashboard/${invitation.id}` });

  revalidatePath(`/dashboard/${invitation.id}`);
  revalidatePath("/dashboard");
  return { ok: true, responseId: response.id };
}

/** Додає коментар до щойно надісланої відповіді. */
export async function addResponseComment(input: unknown): Promise<FormState> {
  const dict = await getDict();
  const { commentSchema, firstError } = makeValidation(dict);
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({ where: eq(invitations.slug, parsed.data.slug), columns: { id: true } });
  if (!invitation) return { error: dict.validation.notFound };

  await db
    .update(responses)
    .set({ comment: parsed.data.comment })
    .where(and(eq(responses.id, parsed.data.responseId), eq(responses.invitationId, invitation.id)));

  revalidatePath(`/dashboard/${invitation.id}`);
  return { ok: true };
}
