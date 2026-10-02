import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl" aria-hidden>
        🫥
      </div>
      <h1 className="mt-4 text-2xl font-semibold">Такої сторінки немає</h1>
      <p className="mt-2 text-muted">Можливо, посилання скопійоване не повністю або запрошення вже видалили.</p>
      <Link href="/" className="btn-primary mt-6">
        На головну
      </Link>
    </main>
  );
}
