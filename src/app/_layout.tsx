import { ApiProvider, getApiClient } from "@/api";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { initI18n } from "@/i18n";
import { APP_VERSION } from "@/config/constants";
import UpdateScreen from "@/components/UpdateScreen";
import { ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    const token = tokenData.data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (e) {
    console.warn("Push token registration failed:", e);
  }
}

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
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const notificationListenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        getApiClient().post("auth/register-admin-push-token", { expoPushToken: token }).catch((err) => {
          console.warn("Failed to register admin push token:", err);
        });
      }
    });

    notificationListenerRef.current = Notifications.addNotificationReceivedListener(() => {});

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!data?.screen) return;

      switch (data.screen) {
        case "orders":
          if (data.orderId) {
            router.push({ pathname: "/(drawer)/(tabs)/order-detail", params: { id: data.orderId } } as any);
          } else {
            router.push("/(drawer)/(tabs)/orders" as any);
          }
          break;
        case "offers":
          router.push("/(drawer)/(tabs)/offers" as any);
          break;
        case "ads":
          router.push("/(drawer)/(tabs)/ads" as any);
          break;
        case "chargeRequests":
          router.push("/(drawer)/(tabs)/charge-requests" as any);
          break;
        default:
          router.push("/(drawer)" as any);
      }
    });

    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [isLoading, isAuthenticated, router]);

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
    initI18n().then(() => setReady(true)).catch(() => setReady(true));
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
