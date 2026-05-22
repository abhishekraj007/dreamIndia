import { Bell, Home, UploadCloud, User } from "lucide-react-native";
import { View } from "react-native";

type TabName = "home" | "uploads" | "notifications" | "account";

interface TabBarIconProps {
  name: TabName;
  color: string;
  focused: boolean;
}

const icons: Record<TabName, typeof Home> = {
  home: Home,
  uploads: UploadCloud,
  notifications: Bell,
  account: User,
};

export const TabBarIcon = ({ name, color, focused }: TabBarIconProps) => {
  const IconComponent = icons[name];

  return (
    <View className="items-center justify-center">
      <IconComponent size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
};
