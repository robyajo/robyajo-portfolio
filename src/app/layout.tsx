import { CommandMenu } from "@/components/shared/command-menu";
import { PhosphorProvider } from "@/components/shared/phosphor-provider";
import { QueryProvider } from "@/components/shared/query-provider";import { ThemeHotkey } from "@/components/shared/theme-hotkey";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n/provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/config";
import { ThemeProvider } from "next-themes";
import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Fira_Code,
  Geist_Pixel,
  Manrope,
} from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./global.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--font-bricolage",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const geistPixel = Geist_Pixel({
  subsets: ["latin"],
  display: "swap",
  axes: ["ELSH"],
  adjustFontFallback: false,
  fallback: ["ui-monospace", "monospace"],
  variable: "--font-geist-pixel",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  const locale = await getLocale();
  return {
    title: {
      default: `${siteConfig.name} – ${siteConfig.role}`,
      template: `%s – ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
      locale: locale === "id" ? "id_ID" : "en_US",
      alternateLocale: locale === "id" ? ["en_US"] : ["id_ID"],
    },
    metadataBase: new URL(siteConfig.baseUrl),
  icons: {
    icon: [
      {
        url: "/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon",
  },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${manrope.variable} ${firaCode.variable} ${geistPixel.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
      </head>
      <body className="relative flex flex-col min-h-screen">
        {process.env.NODE_ENV === "production" && (
          <Script
            src="/stats/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-host-url="/stats"
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <QueryProvider>
            <TooltipProvider>
              <PhosphorProvider>
                <LanguageProvider locale={locale} dict={dict}>
                  <ThemeHotkey />
                  <CommandMenu />
                  {children}
                  <Toaster />
                </LanguageProvider>
              </PhosphorProvider>
            </TooltipProvider>
            </QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
