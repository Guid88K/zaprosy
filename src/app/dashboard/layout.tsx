import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { SupportLink } from "@/components/SupportLink";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="font-serif text-xl font-semibold">
            Запроси 💌
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="btn-ghost">
              Мої запрошення
            </Link>
            <Link href="/dashboard/settings" className="btn-ghost">
              Налаштування
            </Link>
            <Link href="/dashboard/new" className="btn-primary">
              + Нове
            </Link>
          </nav>
          <form action={logout} className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{user.name}</span>
            <button type="submit" className="btn-ghost">
              Вийти
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <span>Сервіс безкоштовний. Якщо він вам у пригоді, можна пригостити автора кавою.</span>
        <SupportLink variant="text" />
      </footer>
    </div>
  );
}
