"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb } from "@/db";
import { invitations, responses, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { notifyAuthor } from "@/lib/notify";
import { getBaseUrl } from "@/lib/url";
import {
  firstError,
  invitationSchema,
  responseSchema,
  settingsSchema,
} from "@/lib/validation";

const slugAlphabet = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export type FormState = { error?: string; ok?: boolean };

export async function createInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = invitationSchema.safeParse({
    templateId: formData.get("templateId"),
    recipientName: formData.get("recipientName"),
    question: formData.get("question"),
    message: formData.get("message") ?? "",
    eventDate: formData.get("eventDate") ?? "",
    eventTime: formData.get("eventTime") ?? "",
    place: formData.get("place") ?? "",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  let created: { id: string } | undefined;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      [created] = await db
        .insert(invitations)
        .values({ ...parsed.data, userId: user.id, slug: slugAlphabet() })
        .returning({ id: invitations.id });
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  if (!created) return { error: "Не вдалося створити запрошення, спробуйте ще раз" };

  revalidatePath("/dashboard");
  redirect(`/dashboard/${created.id}`);
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

export type RespondState = FormState & { answer?: "yes" | "no" };

export async function submitResponse(_prev: RespondState, formData: FormData): Promise<RespondState> {
  const parsed = responseSchema.safeParse({
    slug: formData.get("slug"),
    answer: formData.get("answer"),
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.slug, parsed.data.slug),
    with: { author: true },
  });
  if (!invitation) return { error: "Запрошення не знайдено" };

  const [response] = await db
    .insert(responses)
    .values({
      invitationId: invitation.id,
      answer: parsed.data.answer,
      comment: parsed.data.comment,
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
  return { ok: true, answer: parsed.data.answer };
}
