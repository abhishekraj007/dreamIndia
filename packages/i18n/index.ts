export { default as en } from "./messages/en.json";
export { default as es } from "./messages/es.json";
export { default as fr } from "./messages/fr.json";

export const locales = ["en", "es", "fr"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Espanol",
  fr: "Francais",
};

export const defaultLocale: Locale = "en";

export const rtlLocales: string[] = ["ar", "he", "fa", "ur"];

export function isRTL(locale: string): boolean {
  return rtlLocales.includes(locale);
}
