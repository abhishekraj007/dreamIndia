import { useI18n } from "@/contexts/i18n-context";
import type { Locale } from "@/lib/i18n";

const accountTranslations: Record<string, string> = {
  "common.ok": "OK",
  "chat.clear": "Clear",
  "tabs.home": "Home",
  "tabs.uploads": "Uploads",
  "tabs.features": "Features",
  "tabs.notifications": "Notifications",
  "tabs.account": "Account",
  "language.english": "English",
  "appearance.theme": "Theme",
  "appearance.light": "Light",
  "appearance.dark": "Dark",
  "appearance.color": "Color Theme",
  "nav.settings": "Settings",
  "nav.notifications": "Notifications",
  "settings.notificationsDescription":
    "Choose whether this device receives push notifications.",
  "notifications.enable": "Enable notifications",
  "notifications.enabledRegistered":
    "Notifications are enabled for this device.",
  "notifications.disabledInApp":
    "Notifications are allowed by the system but disabled in the app.",
  "notifications.disabledPrompt":
    "Notifications are disabled. Enable them in system settings to receive updates.",
  "notifications.permissionDeniedDescription":
    "Please enable notifications in your device settings to receive push notifications.",
  "notifications.requestFailed": "Failed to request permissions",
  "account.profile.noName": "No name set",
  "account.guest.login": "Log In",
  "account.profile.currentCredits": "Current credits",
  "account.profile.buyCredits": "Buy Credits",
  "account.profile.premium": "Premium",
  "account.profile.getPremium": "Get Premium",
  "account.actions.title": "Account",
  "account.actions.signOut": "Sign Out",
  "account.actions.signingOut": "Signing Out...",
  "account.actions.clearCache": "Clear Cache",
  "account.actions.clearingCache": "Clearing Cache...",
  "account.actions.dangerTitle": "Danger Zone",
  "account.actions.dangerDescription":
    "Once you delete your account, there is no going back.",
  "account.actions.delete": "Delete Account",
  "account.actions.deleting": "Deleting...",
  "account.sheet.title": "Choose app language",
  "account.sheet.subtitle": "Select the language used in the app.",
  "account.section.quickActions": "Quick Actions",
  "account.section.support": "Support",
  "account.section.supportDescription":
    "Help, troubleshooting, and contact options.",
  "account.section.legal": "Legal",
  "account.section.feedback": "Feedback",
  "account.item.appearance": "Appearance",
  "account.item.notifications": "Notifications",
  "account.item.language": "Language",
  "account.item.account": "Account",
  "account.item.helpCenter": "FAQ & Help Center",
  "account.item.contactSupport": "Contact Support",
  "account.item.terms": "Terms of Service",
  "account.item.privacy": "Privacy Policy",
  "account.item.rateUs": "Rate Us",
  "account.item.shareApp": "Share App",
  "account.helpCenterMissing": "Help Center URL is not configured yet.",
  "account.supportMissing": "Support URL is not configured yet.",
  "account.termsMissing": "Terms URL is not configured yet.",
  "account.privacyMissing": "Privacy URL is not configured yet.",
  "alerts.error": "Error",
  "alerts.success": "Success",
  "alerts.linkUnavailable": "Link unavailable",
  "alerts.unableOpenLink": "Unable to open link",
  "alerts.tryAgainMoment": "Please try again in a moment.",
  "alerts.ratingUnavailable": "Rating unavailable",
  "alerts.iosStoreMissing": "iOS App Store ID is not configured yet.",
  "alerts.unableOpenRating": "Unable to open rating",
  "alerts.shareUnavailable": "Share unavailable",
  "alerts.shareUrlMissing": "App share URL is not configured yet.",
  "alerts.unableShare": "Unable to share",
  "alerts.signOutTitle": "Sign Out",
  "alerts.signOutBody": "Are you sure you want to sign out?",
  "alerts.clearCacheTitle": "Clear Cache",
  "alerts.clearCacheBody":
    "Clear downloaded images and temporary app data from this device?",
  "alerts.clearCacheSuccess": "App cache cleared successfully.",
  "alerts.clearCacheFailed": "Failed to clear app cache. Please try again.",
  "alerts.deleteTitle": "Delete Account",
  "alerts.deleteBody":
    "Are you sure you want to permanently delete your account? This action cannot be undone.",
  "alerts.cancel": "Cancel",
  "alerts.delete": "Delete",
};

export const useTranslation = () => {
  const { locale, localeNames, locales, setLocale, t: translate } = useI18n();

  const t = (key: string, values?: Record<string, string | number>) => {
    const template = accountTranslations[key] ?? translate(key, values);

    if (!values) {
      return template;
    }

    return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
      const value = values[rawKey.trim()];
      return value === undefined ? "" : String(value);
    });
  };

  return {
    t,
    language: locale,
    setLanguage: (nextLocale: Locale) => setLocale(nextLocale),
    supportedLanguages: locales.map((code) => ({
      code,
      label: localeNames[code],
    })),
  };
};
