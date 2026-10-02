import type { Metadata } from "next";
import { Caveat, Inter, Playfair_Display } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { getDict, getLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-playfair", display: "swap" });
const caveat = Caveat({ subsets: ["latin", "cyrillic"], variable: "--font-caveat", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict();
  return {
    title: { default: dict.meta.title, template: `%s · ${dict.common.brand}` },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, dict] = await Promise.all([getLocale(), getDict()]);
  return (
    <html lang={dict.htmlLang} className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
