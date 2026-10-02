import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).meta.login };
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const dict = await getDict();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-center gap-3">
        <Link href="/" className="font-serif text-2xl font-semibold">{dict.common.brand} 💌</Link>
        <LanguageSwitcher />
      </div>
      <h1 className="mb-6 text-center text-2xl font-semibold">{dict.auth.welcomeBack}</h1>
      <AuthForm mode="login" />
    </main>
  );
}
