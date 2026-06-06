import { useApiQuery } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface DashboardStat {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
}

export default function DashboardScreen() {
  const { plate, gs } = useGlobalStyles();
  const { user, logout } = useAuth();

  const { data: ordersData, refetch: refetchOrders } = useApiQuery<any>({
    url: "admin/orders",
    queryKey: ["api", "admin", "orders", "list", { limit: "1" }],
    params: { limit: 1, page: 1 },
  });

  const { data: usersData } = useApiQuery<any>({
    url: "admin/users",
    queryKey: ["api", "admin", "users", "list", { limit: "1" }],
    params: { limit: 1, page: 1 },
  });

  const orderCount = (ordersData as any)?.meta?.total ?? 0;
  const userCount = (usersData as any)?.meta?.total ?? 0;

  const stats: DashboardStat[] = [
    { label: "Total Orders", value: String(orderCount), icon: "receipt", color: plate.blue, route: "orders" },
    { label: "Total Users", value: String(userCount), icon: "people", color: plate.green, route: "users" },
  ];

  const quickActions = [
    { label: "Orders", icon: "receipt-outline" as const, route: "orders" },
    { label: "Products", icon: "cube-outline" as const, route: "products" },
    { label: "Containers", icon: "layers-outline" as const, route: "containers" },
    { label: "Brands", icon: "pricetags-outline" as const, route: "brands" },
    { label: "Categories", icon: "folder-outline" as const, route: "categories" },
    { label: "Users", icon: "people-outline" as const, route: "users" },
  ];

  return (
    <ScrollView
      style={gs.safeArea}
      contentContainerStyle={[gs.container, gs.scrollContent]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetchOrders} />}
    >
      <View style={[gs.rowBetween, { marginTop: 16, marginBottom: 24 }]}>
        <View>
          <Text style={gs.h2}>Dashboard</Text>
          <Text style={[gs.textSmall, { marginTop: 4 }]}>Welcome, {user?.phone}</Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: plate.red + "20", justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="log-out-outline" size={20} color={plate.red} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.label}
            style={[gs.cardElevated, { flex: 1, padding: 16 }]}
            onPress={() => stat.route && router.push(`/(drawer)/(tabs)/${stat.route}` as any)}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: stat.color + "20", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={[gs.h2, { color: stat.color }]}>{stat.value}</Text>
            <Text style={gs.textSmall}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[gs.sectionHeader, { marginBottom: 12 }]}>Quick Actions</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[gs.cardFlat, { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, minWidth: "45%" }]}
            onPress={() => router.push(`/(drawer)/(tabs)/${action.route}` as any)}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: plate.primary + "20", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name={action.icon} size={18} color={plate.primary} />
            </View>
            <Text style={gs.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
