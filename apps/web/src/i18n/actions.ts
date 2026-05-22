"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./config";

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: "/",
    sameSite: "lax",
  });
}
