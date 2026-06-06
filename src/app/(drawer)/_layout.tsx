import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { Dimensions, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function DrawerLayout() {
  const { plate, gs } = useGlobalStyles();
  const { user } = useAuth();

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} style={{ backgroundColor: plate.background }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: plate.gray, marginBottom: 8 }}>
            <View style={[gs.containerRow, { gap: 12 }]}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: plate.primary,
                justifyContent: "center", alignItems: "center",
              }}>
                <Ionicons name="shield" size={24} color={plate.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gs.label, { fontSize: 16 }]}>{user?.phone ?? "Admin"}</Text>
                <Text style={gs.caption}>Admin Panel</Text>
              </View>
            </View>
          </View>
          <DrawerItemList {...props} />
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
          drawerLabel: "Dashboard",
          title: "Dashboard",
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
