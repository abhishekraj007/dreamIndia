import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import en from "@convex-starter/i18n/messages/en";
import es from "@convex-starter/i18n/messages/es";
import fr from "@convex-starter/i18n/messages/fr";
import { locales, defaultLocale, type Locale } from "@convex-starter/i18n";

const i18n = new I18n({ en, es, fr });

// Set the locale from the device
const deviceLocale = Localization.getLocales()[0]?.languageCode || defaultLocale;
i18n.locale = locales.includes(deviceLocale as Locale) ? deviceLocale : defaultLocale;

i18n.enableFallback = true;
i18n.defaultLocale = defaultLocale;

export { locales, type Locale };
export default i18n;
