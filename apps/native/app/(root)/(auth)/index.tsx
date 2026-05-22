import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Spinner } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useAppleAuth, useGoogleAuth } from "@/lib/betterAuth/oauth";
import { useTranslation } from "@/hooks/use-translation";
import { LanguageSheet } from "@/components/language/language-sheet";

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { t, language, supportedLanguages } = useTranslation();
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } =
    useGoogleAuth();
  const { signIn: signInWithApple, isLoading: isAppleLoading } = useAppleAuth();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(root)/(main)");
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google Sign-In error:", error);
      Alert.alert(t("alerts.error"), t("auth.failedGoogleSignIn"));
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      console.error("Apple Sign-In error:", error);
      Alert.alert(t("alerts.error"), t("auth.failedSignIn"));
    }
  };

  const isLoading = isGoogleLoading || isAppleLoading;
  const languageLabel =
    supportedLanguages.find((item) => item.code === language)?.label ??
    "English";

  return (
    <>
      <View style={{ flex: 1 }}>
        <Image
          source={require("@/assets/images/login-bg.jpeg")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.1)",
            "rgba(0,0,0,0.45)",
            "rgba(0,0,0,0.78)",
            "rgba(0,0,0,0.95)",
          ]}
          locations={[0, 0.48, 0.7, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height,
          }}
        />

        <Button
          variant="tertiary"
          size="sm"
          onPress={() => setIsLanguageSheetOpen(true)}
          style={{
            position: "absolute",
            top: insets.top,
            left: 16,
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 20,
          }}
        >
          <Text className="text-xs text-white">{languageLabel}</Text>
        </Button>

        <Button
          variant="tertiary"
          size="sm"
          isIconOnly
          onPress={handleClose}
          style={{
            position: "absolute",
            top: insets.top,
            right: 16,
            zIndex: 10,
            width: 40,
            height: 40,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 20,
          }}
        >
          <X size={20} color="white" />
        </Button>

        <View
          className="flex-1 justify-end gap-3 p-6"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-1 justify-end">
            <Text className="font-extrabold text-6xl text-white/90">
              Convex Starter
            </Text>
            <Text className="text-white/80">{t("auth.signInDescription")}</Text>
          </View>
          <View className="w-full gap-4">
            <Button
              size="md"
              className="overflow-hidden rounded-full bg-white/20"
              variant="ghost"
              onPress={handleGoogleSignIn}
              isDisabled={isLoading}
            >
              {isGoogleLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <Ionicons name="logo-google" size={20} color="white" />
              )}
              <Text className="text-white">{t("auth.google")}</Text>
            </Button>
            <Button
              size="md"
              className="overflow-hidden rounded-full bg-white/20"
              variant="ghost"
              onPress={handleAppleSignIn}
              isDisabled={isLoading}
            >
              {isAppleLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <Ionicons name="logo-apple" size={20} color="white" />
              )}
              <Text className="text-white">{t("auth.apple")}</Text>
            </Button>
          </View>
          <View className="justify-center gap-1 flex-row flex-wrap items-center ">
            <Text className="text-white/50 text-sm">
              {t("auth.termsAgreement")}
            </Text>
            <Text className="text-white/80 text-xs">
              {t("auth.termsOfService")}
            </Text>
            <Text className="text-muted text-sm">{t("auth.and")}</Text>
            <Text className="text-white/80 text-xs">
              {t("auth.privacyPolicy")}
            </Text>
          </View>
        </View>
      </View>

      <LanguageSheet
        isOpen={isLanguageSheetOpen}
        onOpenChange={setIsLanguageSheetOpen}
      />
    </>
  );
}
