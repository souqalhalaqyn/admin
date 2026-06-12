import { getApiClient, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const { plate, gs } = useGlobalStyles();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: "categories",
    queryKey: queryKeys.categories.list({ limit: "200" }),
    params: { limit: 200 },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => getApiClient().delete(`categories/${id}`).then(r => r.data),
    onSuccess: () => { refetch(); Alert.alert(t("common.deleted")); },
    onError: (err: any) => Alert.alert(t("common.error"), getErrorMessage(err)),
    onSettled: () => setDeleteId(null),
  });

  const categories = (data as any)?.data ?? [];

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[gs.listItem, { paddingLeft: 0 }]}
      onPress={() => router.push({ pathname: "/(drawer)/(tabs)/category-form" as any, params: { id: item._id } })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: plate.blue + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
        <Ionicons name="folder" size={20} color={plate.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={gs.label}>{item.name}</Text>
        <Text style={gs.caption}>{t("category.containerCount", { count: item.containers?.length ?? 0 })}</Text>
      </View>
      <TouchableOpacity onPress={() => setDeleteId(item._id)} style={{ padding: 8 }}>
        <Ionicons name="trash-outline" size={18} color={plate.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <Text style={[gs.h3, { flex: 1 }]}>{t("category.listTitle")}</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginRight: 12 }}>
          <Ionicons name="refresh" size={22} color={plate.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(drawer)/(tabs)/category-form" as any })}
          style={[gs.buttonSmall, { backgroundColor: plate.primary, paddingHorizontal: 16 }]}
        >
          <Ionicons name="add" size={18} color={plate.background} />
          <Text style={[gs.buttonText, { fontSize: 14, marginLeft: 4 }]}>{t("category.addButton")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item: any) => item._id}
        renderItem={renderCategory}
        contentContainerStyle={[gs.container]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="folder-outline" title={t("category.emptyTitle")} />}
      />

      <ConfirmDialog
        visible={!!deleteId}
        title={t("category.deleteConfirmTitle")}
        message={t("category.deleteConfirmMessage")}
        confirmLabel={t("category.deleteConfirmButton")}
        confirmDanger
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}
