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
      <Stack.Screen name="locations" />
      <Stack.Screen name="location-ways" />
      <Stack.Screen name="location-branches" />
      <Stack.Screen name="users" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="ads" />
      <Stack.Screen name="charge-requests" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="product-form" />
      <Stack.Screen name="container-form" />
      <Stack.Screen name="brand-form" />
      <Stack.Screen name="category-form" />
      <Stack.Screen name="offer-form" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="user-detail" />
    </Stack>
  );
}
