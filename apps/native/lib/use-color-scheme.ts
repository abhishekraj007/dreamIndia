import { colorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

const normalizeColorScheme = (scheme: string | null | undefined) =>
  scheme === "light" || scheme === "dark" ? scheme : "dark";

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [currentScheme, setCurrentScheme] = useState<"light" | "dark">(() => {
    return normalizeColorScheme(colorScheme.get() ?? systemColorScheme);
  });

  useEffect(() => {
    const newScheme = normalizeColorScheme(
      colorScheme.get() ?? systemColorScheme,
    );
    if (newScheme !== currentScheme) {
      setCurrentScheme(newScheme);
    }
  }, [systemColorScheme, currentScheme]);

  const setColorSchemeAndUpdate = (scheme: "light" | "dark") => {
    colorScheme.set(scheme);
    setCurrentScheme(scheme);

    setTimeout(() => {
      setCurrentScheme(scheme);
    }, 10);
  };

  const toggleColorScheme = () => {
    const newScheme = currentScheme === "dark" ? "light" : "dark";
    setColorSchemeAndUpdate(newScheme);
  };

  return {
    colorScheme: currentScheme,
    isDarkColorScheme: currentScheme === "dark",
    setColorScheme: setColorSchemeAndUpdate,
    toggleColorScheme,
  };
}
