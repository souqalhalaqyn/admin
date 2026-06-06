import { useAppTheme } from "@/context/ThemeContext";
import { ActivityIndicator, View } from "react-native";

export default function LoadingScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
