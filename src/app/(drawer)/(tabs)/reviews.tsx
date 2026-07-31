import { getApiClient, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ReviewsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useApiQuery<any>({
    url: "admin/products-with-reviews",
    queryKey: ["api", "admin", "products-with-reviews", { q: search }],
    params: { q: search || undefined, limit: 100 },
  });

  const products = productsData?.data ?? [];

  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useApiQuery<any>({
    url: "admin/reviews",
    queryKey: ["api", "admin", "reviews", { productId: selectedProductId }],
    params: { productId: selectedProductId ?? undefined, limit: 200 },
    enabled: !!selectedProductId,
  });

  const reviews = reviewsData?.data ?? [];

  const handleDelete = async (reviewId: string) => {
    Alert.alert(t("common.confirmDelete"), "", [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => {
        try {
          await getApiClient().delete(`admin/reviews/${reviewId}`);
          queryClient.invalidateQueries({ queryKey: ["api", "admin", "reviews"] });
          queryClient.invalidateQueries({ queryKey: ["api", "admin", "products-with-reviews"] });
        } catch (err) {
          Alert.alert(t("common.error"), getErrorMessage(err));
        }
      }},
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  if (selectedProductId) {
    const product = products.find((p: any) => p._id === selectedProductId);

    return (
      <View style={{ flex: 1, backgroundColor: plate.background }}>
        <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
          <TouchableOpacity onPress={() => setSelectedProductId(null)} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={plate.text} />
          </TouchableOpacity>
          <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]} numberOfLines={1}>
            {product?.nameAr || product?.nameEn || ""}
          </Text>
        </View>

        {reviewsLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={plate.primary} />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={reviews}
            keyExtractor={(item: any) => item._id}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetchReviews} />}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={plate.graySecond} />
                <Text style={[gs.text, { color: plate.textSecond, marginTop: 12 }]}>{t("common.noResults")}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[gs.card, { padding: 12, marginBottom: 12 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontWeight: "600", color: plate.text, fontSize: 14 }}>
                          {item.user?.name ?? "—"}
                        </Text>
                      <Text style={{ color: plate.textSecond, fontSize: 11 }}>{formatDate(item.createdAt)}</Text>
                    </View>
                    {item.rating ? (
                      <View style={{ flexDirection: "row", gap: 2, marginBottom: 4 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name={s <= item.rating ? "star" : "star-outline"} size={14} color="#f59e0b" />
                        ))}
                      </View>
                    ) : null}
                    {item.comment ? (
                      <Text style={[gs.text, { color: plate.text, marginTop: 4 }]}>{item.comment}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={20} color={plate.red} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: plate.background }}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <Text style={[gs.h3, { flex: 1 }]}>{t("navigation.reviews")}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={[gs.inputContainer, { flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }]}>
          <Ionicons name="search" size={18} color={plate.textSecond} />
          <TextInput
            style={[gs.input, { flex: 1, marginLeft: 8 }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t("common.search")}
            placeholderTextColor={plate.textSecond}
          />
        </View>
      </View>

      {productsLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={plate.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          data={products}
          keyExtractor={(item: any) => item._id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetchProducts} />}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="star-outline" size={48} color={plate.graySecond} />
              <Text style={[gs.text, { color: plate.textSecond, marginTop: 12 }]}>{"No reviews yet"}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[gs.card, { padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }]}
              onPress={() => setSelectedProductId(item._id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[gs.text, { fontWeight: "600" }]}>{item.nameAr || item.nameEn || "—"}</Text>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={[gs.textSmall, { color: plate.textSecond }]}>{(item.averageRating ?? 0).toFixed(1)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="chatbubble" size={14} color={plate.primary} />
                    <Text style={[gs.textSmall, { color: plate.textSecond }]}>{item.reviewCount ?? 0}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={plate.graySecond} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
