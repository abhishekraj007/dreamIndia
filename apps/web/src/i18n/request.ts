import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from "./config";
import en from "@convex-starter/i18n/messages/en";
import es from "@convex-starter/i18n/messages/es";
import fr from "@convex-starter/i18n/messages/fr";

const messagesByLocale: Record<Locale, typeof en> = { en, es, fr };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // 1. Check cookie
  let locale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;

  // 2. Fall back to Accept-Language header
  if (!locale || !locales.includes(locale)) {
    const acceptLanguage = headerStore.get("accept-language") || "";
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
    if (preferred && locales.includes(preferred as Locale)) {
      locale = preferred as Locale;
    }
  }

  // 3. Fall back to default
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
