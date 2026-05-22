import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isRTL } from "@convex-starter/i18n";
import "../index.css";
import Providers from "@/components/providers";
import { LayoutContent } from "@/components/layout-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

export const metadata: Metadata = {
  title: {
    default: "cockroachdreamindia",
    template: "%s | cockroachdreamindia",
  },
  description:
    "A civic transformation atlas for documenting India's bad infrastructure and visualizing realistic Dream India outcomes.",
  keywords: [
    "Dream India",
    "civic tech India",
    "infrastructure reporting",
    "AI image transformation",
    "Convex",
    "Better Auth",
  ],
  authors: [{ name: "cockroachdreamindia" }],
  creator: "cockroachdreamindia",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "cockroachdreamindia",
    title: "cockroachdreamindia",
    description:
      "Report bad roads, rivers, drainage, transit edges, and popular places, then compare current conditions with AI-planned transformations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "cockroachdreamindia",
    description:
      "A civic transformation atlas for exact-location before/after infrastructure reporting.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={isRTL(locale) ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <LayoutContent>{children}</LayoutContent>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
