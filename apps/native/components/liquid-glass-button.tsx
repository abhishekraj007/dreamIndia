import type { ComponentProps, PropsWithChildren } from "react";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Button, useThemeColor } from "heroui-native";
import {
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useAppTheme } from "@/contexts/app-theme-context";
import { cn } from "@/lib/utils";

type HeroUIButtonProps = ComponentProps<typeof Button>;
type Variant = NonNullable<HeroUIButtonProps["variant"]>;

type LiquidGlassButtonProps = PropsWithChildren<{
  accessibilityLabel?: string;
  className?: string;
  size?: HeroUIButtonProps["size"];
  variant?: Variant;
  fullWidth?: boolean;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  onPress?: PressableProps["onPress"];
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
}>;

export function LiquidGlassButton({
  accessibilityLabel,
  children,
  className,
  size = "md",
  variant = "secondary",
  fullWidth = false,
  isDisabled = false,
  isIconOnly = false,
  onPress,
  style,
  tintColor,
}: LiquidGlassButtonProps) {
  const { isDark } = useAppTheme();

  // Resolve all variant background colors from the theme unconditionally.
  const colorAccent = useThemeColor("accent");
  const colorDefault = useThemeColor("default");
  const colorSurface = useThemeColor("surface");
  const colorDanger = useThemeColor("danger");
  const colorDangerSoft = useThemeColor("danger-soft");
  const colorBorder = useThemeColor("border");

  const canUseLiquidGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  if (!canUseLiquidGlass) {
    return (
      <Button
        accessibilityLabel={accessibilityLabel}
        className={cn(fullWidth && "w-full", className)}
        isDisabled={isDisabled}
        isIconOnly={isIconOnly}
        onPress={onPress}
        size={size}
        variant={variant}
      >
        {children}
      </Button>
    );
  }

  // Map each variant to a theme-reactive background color for the glass overlay.
  const bgColorByVariant: Record<Variant, string> = {
    primary: colorAccent,
    secondary: colorDefault,
    tertiary: colorSurface,
    outline: "transparent",
    ghost: "transparent",
    danger: colorDanger,
    "danger-soft": colorDangerSoft,
  };

  const hasBgClass = !!className && /\bbg-\S+/.test(className);
  const bgColor = hasBgClass ? undefined : bgColorByVariant[variant];
  const isOutline = variant === "outline";

  return (
    <GlassView
      colorScheme={isDark ? "dark" : "light"}
      glassEffectStyle="regular"
      isInteractive
      style={[
        styles.glass,
        isIconOnly ? styles.iconButton : styles.button,
        fullWidth && styles.fullWidth,
        isOutline && { borderWidth: 1.5, borderColor: colorBorder },
        style,
      ]}
      tintColor={tintColor}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        className={cn(
          "flex-row items-center justify-center gap-2",
          isIconOnly ? "h-9 w-9" : "min-h-10 px-4 py-2",
          isDisabled && "opacity-disabled",
          className,
        )}
        style={hasBgClass ? {} : { backgroundColor: bgColor }}
        disabled={isDisabled}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  glass: {
    borderRadius: 999,
    overflow: "hidden",
  },
  iconButton: {
    height: 36,
    width: 36,
  },
});
