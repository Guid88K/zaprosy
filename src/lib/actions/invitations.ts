"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb } from "@/db";
import { invitations, responses, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { notifyAuthor } from "@/lib/notify";
import { ensureFinal, noModes, summarizeScreens, type Screen } from "@/lib/screens";
import { getBaseUrl } from "@/lib/url";
import {
  commentSchema,
  firstError,
  invitationSchema,
  responseSchema,
  settingsSchema,
} from "@/lib/validation";

const slugAlphabet = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export type FormState = { error?: string; ok?: boolean };

function parseInvitationForm(formData: FormData) {
  return invitationSchema.safeParse({
    templateId: formData.get("templateId"),
    recipientName: formData.get("recipientName"),
    eventDate: formData.get("eventDate") ?? "",
    eventTime: formData.get("eventTime") ?? "",
    place: formData.get("place") ?? "",
    noMode: formData.get("noMode") ?? "allow",
    screens: formData.get("screens") ?? "[]",
  });
}

function derivedFields(screens: Screen[]) {
  const finalScreens = ensureFinal(screens);
  const q = finalScreens.find((s) => s.type === "question");
  return {
    screens: JSON.stringify(finalScreens),
    question: summarizeScreens(finalScreens),
    message: q && q.type === "question" && q.text ? q.text : null,
  };
}

export async function createInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseInvitationForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { screens, ...fields } = parsed.data;

  const db = await getDb();
  let created: { id: string } | undefined;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      [created] = await db
        .insert(invitations)
        .values({ ...fields, ...derivedFields(screens), userId: user.id, slug: slugAlphabet() })
        .returning({ id: invitations.id });
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  if (!created) return { error: "Не вдалося створити запрошення, спробуйте ще раз" };

  revalidatePath("/dashboard");
  redirect(`/dashboard/${created.id}`);
}

export async function updateInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Запрошення не знайдено" };
  const parsed = parseInvitationForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { screens, ...fields } = parsed.data;

  const db = await getDb();
  const updated = await db
    .update(invitations)
    .set({ ...fields, ...derivedFields(screens) })
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .returning({ id: invitations.id, slug: invitations.slug });
  if (updated.length === 0) return { error: "Запрошення не знайдено" };

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
  await db
    .delete(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)));
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
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    telegramChatId: formData.get("telegramChatId") ?? "",
    notifyByEmail: formData.get("notifyByEmail") === "on",
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
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.slug, parsed.data.slug),
    with: { author: true },
  });
  if (!invitation) return { ok: false, error: "Запрошення не знайдено" };
  if (invitation.noMode !== "allow" && parsed.data.answer === "no") {
    return { ok: false, error: "У цьому запрошенні варіант «ні» не передбачений 😉" };
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
  await notifyAuthor({
    author: invitation.author,
    invitation,
    response,
    manageUrl: `${baseUrl}/dashboard/${invitation.id}`,
  });

  revalidatePath(`/dashboard/${invitation.id}`);
  revalidatePath("/dashboard");
  return { ok: true, responseId: response.id };
}

/** Додає коментар до щойно надісланої відповіді. */
export async function addResponseComment(input: unknown): Promise<FormState> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.slug, parsed.data.slug),
    columns: { id: true },
  });
  if (!invitation) return { error: "Запрошення не знайдено" };

  await db
    .update(responses)
    .set({ comment: parsed.data.comment })
    .where(and(eq(responses.id, parsed.data.responseId), eq(responses.invitationId, invitation.id)));

  revalidatePath(`/dashboard/${invitation.id}`);
  return { ok: true };
}
