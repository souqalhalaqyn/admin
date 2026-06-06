import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text } from "react-native";

const tabLabel = (label: string) =>
  ({ focused, color }: { focused: boolean; color: string }) =>
    focused ? <Text style={{ color }}>{label}</Text> : null;

export default function TabsLayout() {
  const { plate } = useGlobalStyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: plate.backgroundSecond, borderTopColor: plate.gray },
        tabBarActiveTintColor: plate.primary,
        tabBarInactiveTintColor: plate.graySecond,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: tabLabel("Dashboard"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "speedometer" : "speedometer-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: tabLabel("Orders"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          tabBarLabel: tabLabel("Products"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="containers"
        options={{
          tabBarLabel: tabLabel("Containers"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "layers" : "layers-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="brands"
        options={{
          tabBarLabel: tabLabel("Brands"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "pricetags" : "pricetags-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          tabBarLabel: tabLabel("Categories"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "folder" : "folder-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          tabBarLabel: tabLabel("Users"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="order-detail"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="product-form"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="container-form"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="brand-form"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="category-form"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="user-detail"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}
