import { ApiProvider } from "@/api";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

function InnerLayout() {
  const { theme } = useAppTheme();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ApiProvider>
      <AuthProvider>
        <AppThemeProvider>
          <InnerLayout />
        </AppThemeProvider>
      </AuthProvider>
    </ApiProvider>
  );
}
