import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { I18nProvider } from "@/contexts/i18n-context";
import ConvexProvider from "@/providers/ConvexProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { featureFlags } from "react-native-screens";

const screenExperiments =
  featureFlags.experiment as typeof featureFlags.experiment & {
    ios26AllowInteractionsDuringTransition?: boolean;
  };

screenExperiments.ios26AllowInteractionsDuringTransition = true;

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const heroUIConfig = {
  // colorScheme: "dark",
  // theme: currentTheme,
  textProps: {
    allowFontScaling: false,
  },
};

/* ------------------------------ themed route ------------------------------ */
function ThemedLayout() {
  const { isThemeLoaded } = useAppTheme();

  if (!isThemeLoaded) {
    return null; // Let SplashScreenProvider handle the splash screen
  }

  return (
    <HeroUINativeProvider config={heroUIConfig}>
      <Slot />
    </HeroUINativeProvider>
  );
}
/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <KeyboardProvider>
        <ConvexProvider>
          <SplashScreenProvider>
            <I18nProvider>
              <AppThemeProvider>
                <PurchasesProvider>
                  <ThemedLayout />
                </PurchasesProvider>
              </AppThemeProvider>
            </I18nProvider>
          </SplashScreenProvider>
        </ConvexProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
