"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action] = useActionState<AuthState, FormData>(
    mode === "login" ? login : register,
    {},
  );

  return (
    <form action={action} className="card space-y-5">
      {mode === "register" ? (
        <div>
          <label htmlFor="name" className="label">
            Як тебе звати
          </label>
          <input id="name" name="name" className="field" autoComplete="name" required minLength={2} maxLength={60} />
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : 1}
        />
        {mode === "register" ? <p className="mt-1 text-xs text-muted">Не менше 8 символів.</p> : null}
      </div>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full">
        {mode === "login" ? "Увійти" : "Створити акаунт"}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Ще немає акаунта?{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              Зареєструватися
            </Link>
          </>
        ) : (
          <>
            Уже є акаунт?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Увійти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
