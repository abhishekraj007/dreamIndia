import { createContext, useContext, useState } from "react";
import i18n, { locales, type Locale } from "@/lib/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { localeNames, isRTL } from "@convex-starter/i18n";
import { I18nManager } from "react-native";

const I18N_STORAGE_KEY = "app_locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (scope: string, options?: Record<string, string | number>) => string;
  isRTL: boolean;
  locales: typeof locales;
  localeNames: typeof localeNames;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18n.locale as Locale);

  const setLocale = async (newLocale: Locale) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);
    await AsyncStorage.setItem(I18N_STORAGE_KEY, newLocale);

    // Handle RTL
    const shouldBeRTL = isRTL(newLocale);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
    }
  };

  const t = (scope: string, options?: Record<string, string | number>) => {
    return i18n.t(scope, options);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRTL: isRTL(locale),
        locales,
        localeNames,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
