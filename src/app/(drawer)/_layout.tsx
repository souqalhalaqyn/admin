import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { Redirect, router } from "expo-router";
import { Dimensions, Image, Text, View } from "react-native";

const { width } = Dimensions.get("window");

const NAV_ITEMS = [
  { label: "dashboard", icon: "grid", route: "/(drawer)/(tabs)" },
  { label: "orders", icon: "receipt", route: "/(drawer)/(tabs)/orders" },
  { label: "products", icon: "cube", route: "/(drawer)/(tabs)/products" },
  { label: "containers", icon: "layers", route: "/(drawer)/(tabs)/containers" },
  { label: "brands", icon: "pricetags", route: "/(drawer)/(tabs)/brands" },
  { label: "categories", icon: "folder", route: "/(drawer)/(tabs)/categories" },
  { label: "locations", icon: "location", route: "/(drawer)/(tabs)/locations" },
  { label: "users", icon: "people", route: "/(drawer)/(tabs)/users" },
  { label: "offers", icon: "pricetags", route: "/(drawer)/(tabs)/offers" },
  { label: "chargeRequests", icon: "card", route: "/(drawer)/(tabs)/charge-requests" },
  { label: "settings", icon: "settings", route: "/(drawer)/settings" },
] as const;

export default function DrawerLayout() {
  const { plate, gs } = useGlobalStyles();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)" as any} />;
  }

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} style={{ backgroundColor: plate.background }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: plate.gray, marginBottom: 8 }}>
            <View style={[gs.containerRow, { gap: 12 }]}>
              <Image
                source={require("@/assets/logo.png")}
                style={{ width: 44, height: 44, resizeMode: "contain" }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[gs.label, { fontSize: 16 }]}>{user?.phone ?? t("drawer.admin")}</Text>
                <Text style={gs.caption}>{t("drawer.adminPanel")}</Text>
              </View>
            </View>
          </View>
          {NAV_ITEMS.map((item) => (
            <DrawerItem
              key={item.route}
              label={t(`navigation.${item.label}`)}
              icon={({ color, size }) => (
                <Ionicons name={`${item.icon}-outline` as any} size={size} color={color} />
              )}
              onPress={() => {
                props.navigation.closeDrawer();
                router.push(item.route as any);
              }}
              focused={false}
            />
          ))}
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerStyle: { backgroundColor: plate.backgroundSecond },
        headerTintColor: plate.primary,
        drawerStyle: { backgroundColor: plate.background, width: width * 0.7 },
        drawerActiveBackgroundColor: plate.backgroundSecond,
        drawerActiveTintColor: plate.primary,
        drawerInactiveTintColor: plate.text,
        drawerLabelStyle: { marginLeft: 10, fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: t("navigation.dashboard"),
          headerTitle: t("navigation.dashboard"),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: t("navigation.settings"),
          headerTitle: t("navigation.settings"),
        }}
      />
    </Drawer>
  );
}
