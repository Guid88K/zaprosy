"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { dict } = useI18n();
  const a = dict.auth;
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});

  return (
    <form action={action} className="card space-y-5">
      {mode === "register" ? (
        <div>
          <label htmlFor="name" className="label">{a.name}</label>
          <input id="name" name="name" className="field" autoComplete="name" required minLength={2} maxLength={60} />
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="label">{a.email}</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password" className="label">{a.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : 1}
        />
        {mode === "register" ? <p className="mt-1 text-xs text-muted">{a.passwordHint}</p> : null}
      </div>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full">{mode === "login" ? a.login : a.register}</SubmitButton>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? a.noAccount : a.haveAccount}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-brand hover:underline">
          {mode === "login" ? a.registerLink : a.loginLink}
        </Link>
      </p>
    </form>
  );
}
