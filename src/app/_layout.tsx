import { ApiProvider, getApiClient } from "@/api";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { initI18n } from "@/i18n";
import { APP_VERSION } from "@/config/constants";
import UpdateScreen from "@/components/UpdateScreen";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    if ((r[i] ?? 0) > (l[i] ?? 0)) return true;
    if ((r[i] ?? 0) < (l[i] ?? 0)) return false;
  }
  return false;
}

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
  const [ready, setReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    getApiClient().get("app-versions").then((res) => {
      const remote = res.data?.data?.admin;
      if (remote && isNewerVersion(remote.version, APP_VERSION)) {
        setUpdateInfo(remote);
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, [ready]);

  if (!ready || checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#FBBF24" />
      </View>
    );
  }

  if (updateInfo) {
    return <UpdateScreen currentVersion={APP_VERSION} newVersion={updateInfo.version} downloadUrl={updateInfo.url} />;
  }

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
