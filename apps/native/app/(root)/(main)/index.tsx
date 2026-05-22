import { Header } from "@/components";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeRoute() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <Header />
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingBottom: 32,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4">
            <View className="gap-1">
              <Text className="text-3xl font-bold text-foreground">Home</Text>
              <Text className="text-sm text-muted">
                This is a starter app for Convex with Expo and React Native. Use
                the tabs below to explore the features of the app.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
