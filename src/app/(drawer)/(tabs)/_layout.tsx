import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="products" />
      <Stack.Screen name="containers" />
      <Stack.Screen name="brands" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="users" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="charge-requests" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="product-form" />
      <Stack.Screen name="container-form" />
      <Stack.Screen name="brand-form" />
      <Stack.Screen name="category-form" />
      <Stack.Screen name="offer-form" />
      <Stack.Screen name="user-detail" />
    </Stack>
  );
}
