import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SupportLink } from "@/components/SupportLink";
import { logout } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, dict] = await Promise.all([requireUser(), getDict()]);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="font-serif text-xl font-semibold">{dict.common.brand} 💌</Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="btn-ghost">{dict.nav.myInvitations}</Link>
            <Link href="/dashboard/settings" className="btn-ghost">{dict.nav.settings}</Link>
            <Link href="/dashboard/new" className="btn-primary">{dict.nav.newShort}</Link>
          </nav>
          <div className="flex items-center gap-2 text-sm text-muted">
            <LanguageSwitcher />
            <form action={logout} className="flex items-center gap-2">
              <span className="hidden sm:inline">{user.name}</span>
              <button type="submit" className="btn-ghost">{dict.auth.logout}</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <span>{dict.nav.footerFree}</span>
        <SupportLink variant="text" />
      </footer>
    </div>
  );
}
