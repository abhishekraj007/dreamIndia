import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useConvexAuth, useQuery } from "convex/react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SplashScreen } from "@/components/splash-screen";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { useEffect, useState } from "react";

export const unstable_settings = {
  initialRouteName: "(main)",
};

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isDark } = useAppTheme();
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");
  const [hasFinishedInitialBootstrap, setHasFinishedInitialBootstrap] =
    useState(false);

  // Fetch user data when authenticated
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  // Register for push notifications when user is authenticated
  usePushNotifications(userData?.userMetadata._id);

  const isUserBootstrapPending = isAuthenticated && userData === undefined;

  useEffect(() => {
    if (hasFinishedInitialBootstrap) {
      return;
    }

    if (!isLoading && !isUserBootstrapPending) {
      setHasFinishedInitialBootstrap(true);
    }
  }, [hasFinishedInitialBootstrap, isLoading, isUserBootstrapPending]);

  const showSplash = !hasFinishedInitialBootstrap;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerTransparent: true,
          headerBlurEffect: isDark ? "dark" : "light",
          headerTintColor: themeColorForeground,
          headerStyle: {
            backgroundColor: Platform.select({
              ios: undefined,
              android: themeColorBackground,
            }),
          },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
          },
          // headerRight: _renderThemeToggle,
          headerBackButtonDisplayMode: "generic",
          gestureEnabled: true,
          gestureDirection: "horizontal",
          fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
          contentStyle: {
            backgroundColor: themeColorBackground,
          },
        }}
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
        <Stack.Screen
          name="(main)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      {showSplash ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 9999, backgroundColor: themeColorBackground },
          ]}
        >
          <SplashScreen />
        </View>
      ) : null}
    </>
  );
}
