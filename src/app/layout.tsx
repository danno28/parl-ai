import type { Metadata } from "next";
import Link from "next/link";
import { bodoni, inter } from "./fonts";
import { ThemeScript } from "@/components/theme/theme-script";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { t } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "français",
  description: t("app.description"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${bodoni.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-5 font-sans text-sm font-medium sm:px-6">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight">
            français
          </Link>
          <span className="flex-1" />
          <Link href="/demo" className="hidden sm:inline">
            {t("nav.demo")}
          </Link>
          <span className="rounded-full border border-foreground px-2 text-xs">A2</span>
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
