"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n/server";
import { makeValidation } from "@/lib/validation";

export type AuthState = { error?: string };

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const dict = await getDict();
  const { registerSchema, firstError } = makeValidation(dict);
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  const exists = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email), columns: { id: true } });
  if (exists) return { error: dict.validation.userExists };

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      locale,
    })
    .returning({ id: users.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const dict = await getDict();
  const { loginSchema, firstError } = makeValidation(dict);
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!ok) return { error: dict.validation.badCredentials };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
