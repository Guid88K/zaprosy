import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Вхід" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-center font-serif text-2xl font-semibold">
        Запроси 💌
      </Link>
      <h1 className="mb-6 text-center text-2xl font-semibold">З поверненням</h1>
      <AuthForm mode="login" />
    </main>
  );
}
