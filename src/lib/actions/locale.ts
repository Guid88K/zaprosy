"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { setLocaleCookie } from "@/lib/i18n/server";

/** Перемикає мову інтерфейсу: cookie для всіх, плюс профіль для залогінених. */
export async function setLocale(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  await setLocaleCookie(locale);
  const user = await getCurrentUser();
  if (user && user.locale !== locale) {
    const db = await getDb();
    await db.update(users).set({ locale }).where(eq(users.id, user.id));
  }
  revalidatePath("/", "layout");
}
