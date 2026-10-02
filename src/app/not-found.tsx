import Link from "next/link";
import { getDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const dict = await getDict();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl" aria-hidden>🫥</div>
      <h1 className="mt-4 text-2xl font-semibold">{dict.notFound.title}</h1>
      <p className="mt-2 text-muted">{dict.notFound.text}</p>
      <Link href="/" className="btn-primary mt-6">{dict.notFound.home}</Link>
    </main>
  );
}
