import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";
import { Platform } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

export default function TabsLayout() {
  const { t } = useTranslation();
  const accentColor = useThemeColor("accent");
  const accentForeground = useThemeColor("accent-foreground");
  const mutedColor = useThemeColor("muted");
  const backgroundColor = useThemeColor("background");
  const tabBackgroundColor = useThemeColor("surface");
  const borderColor = useThemeColor("border");
  const selectedIconColor =
    Platform.OS === "android" ? accentForeground : accentColor;

  // Android: NativeTabs global iconColor.default is not propagated to per-screen
  // standardAppearance. Pass per-trigger appearance to get theme-reactive inactive colors.
  // const androidTabNativeProps =
  //   Platform.OS === "android"
  //     ? {
  //         android: {
  //           standardAppearance: {
  //             tabBarBackgroundColor: tabBackgroundColor,
  //             tabBarItemActiveIndicatorColor: accentColor,
  //             tabBarItemActiveIndicatorEnabled: true,
  //             normal: {
  //               tabBarItemIconColor: mutedColor,
  //               tabBarItemTitleFontColor: mutedColor,
  //             },
  //             selected: {
  //               tabBarItemIconColor: selectedIconColor,
  //               tabBarItemTitleFontColor: accentColor,
  //             },
  //           },
  //         },
  //       }
  //     : undefined;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={accentColor}
      iconColor={{ default: mutedColor, selected: selectedIconColor }}
      labelStyle={{
        default: { color: mutedColor, fontSize: 11, fontWeight: "500" },
        selected: { color: accentColor, fontSize: 11, fontWeight: "600" },
      }}
      backgroundColor={tabBackgroundColor}
      blurEffect="systemChromeMaterial"
      shadowColor={borderColor}
      indicatorColor={accentColor}
      rippleColor={selectedIconColor}
      // disableIndicator={true}
      // {...androidTabNativeProps}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="features">
        <NativeTabs.Trigger.Label>
          {t("tabs.features")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "star", selected: "star.fill" }}
          md="auto_awesome"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Label>
          {t("tabs.notifications")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          md="notifications"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>{t("tabs.account")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
