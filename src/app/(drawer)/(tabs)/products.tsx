import { getApiClient, useInfiniteApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { localizedName } from "@/utils/localizedName";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ProductsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useInfiniteApiQuery<any>({
    url: "products",
    queryKey: queryKeys.products.list({ q: submittedQuery || undefined }),
    params: { q: submittedQuery || undefined },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => getApiClient().delete(`products/${id}`).then(r => r.data),
    onSuccess: () => { refetch(); Alert.alert(t("common.deleted")); },
    onError: (err: any) => Alert.alert(t("common.error"), getErrorMessage(err)),
    onSettled: () => setDeleteId(null),
  });

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const totalProducts = data?.pages[0]?.meta?.total ?? 0;

  const renderProduct = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[gs.listItem, { paddingLeft: 0 }]}
      onPress={() => router.push({ pathname: "/(drawer)/(tabs)/product-form" as any, params: { id: item._id } })}
    >
      <View style={{ width: 28, alignItems: "center", marginRight: 8 }}>
        <Text style={[gs.caption, { color: plate.textSecond }]}>{index + 1}</Text>
      </View>
      <Image
        source={{ uri: buildImageUrl(item.images?.[0]) }}
        style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: plate.gray, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={gs.label} numberOfLines={1}>{localizedName(item, i18n.language)}</Text>
        <Text style={[gs.caption]}>
          ${item.price?.toLocaleString()} | {t("product.stockLabel", { stock: item.stock ?? 0 })}
        </Text>
      </View>
      <View style={[gs.containerRow, { gap: 4 }]}>
        {!item.isActive ? (
          <View style={[gs.badge, { backgroundColor: plate.red + "20" }]}>
            <Text style={[gs.badgeText, { color: plate.red, fontSize: 10 }]}>{t("product.inactiveBadge")}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={() => setDeleteId(item._id)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={plate.red} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <Text style={[gs.h3, { flex: 1 }]}>{t("product.listTitle")} ({totalProducts})</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginRight: 12 }}>
          <Ionicons name="refresh" size={22} color={plate.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(drawer)/(tabs)/product-form" as any })}
          style={[gs.buttonSmall, { backgroundColor: plate.primary, paddingHorizontal: 16 }]}
        >
          <Ionicons name="add" size={18} color={plate.background} />
          <Text style={[gs.buttonText, { fontSize: 14, marginLeft: 4 }]}>{t("product.addButton")}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: plate.background }}>
        <TextInput
          style={{ height: 52, paddingHorizontal: 16, borderRadius: 12, backgroundColor: plate.backgroundSecond, borderWidth: 1.5, borderColor: plate.gray, fontSize: 16, color: plate.text }}
          placeholder={t("common.search")}
          placeholderTextColor={plate.textSecond}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => setSubmittedQuery(searchQuery.trim())}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item: any) => item._id}
        renderItem={renderProduct}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, products.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        ListEmptyComponent={<EmptyState icon="cube-outline" title={t("product.emptyTitle")} subtitle={t("product.emptySubtitle")} />}
      />

      <ConfirmDialog
        visible={!!deleteId}
        title={t("product.deleteConfirmTitle")}
        message={t("product.deleteConfirmMessage")}
        confirmLabel={t("product.deleteConfirmButton")}
        confirmDanger
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}
