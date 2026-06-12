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

export default function ContainersScreen() {
  const { t } = useTranslation();
  const { plate, gs } = useGlobalStyles();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: "containers",
    queryKey: queryKeys.containers.list({ limit: "100" }),
    params: { limit: 100 },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => getApiClient().delete(`containers/${id}`).then(r => r.data),
    onSuccess: () => { refetch(); Alert.alert(t("common.deleted")); },
    onError: (err: any) => Alert.alert(t("common.error"), getErrorMessage(err)),
    onSettled: () => setDeleteId(null),
  });

  const containers = (data as any)?.data ?? [];

  const renderContainer = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[gs.listItem, { paddingLeft: 0 }]}
      onPress={() => router.push({ pathname: "/(drawer)/(tabs)/container-form" as any, params: { id: item._id } })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: plate.green + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
        <Ionicons name="layers" size={20} color={plate.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={gs.label}>{item.name}</Text>
        <Text style={gs.caption}>
          {item.brand?.name ?? t("container.noBrand")} | {t("container.productsCount", { count: item.products?.length ?? 0 })}
        </Text>
      </View>
      <View style={[gs.containerRow, { gap: 4 }]}>
        {!item.isActive ? (
          <View style={[gs.badge, { backgroundColor: plate.red + "20" }]}>
            <Text style={[gs.badgeText, { color: plate.red, fontSize: 10 }]}>{t("container.inactiveBadge")}</Text>
          </View>
        ) : null}
        <TouchableOpacity onPress={() => setDeleteId(item._id)} style={{ padding: 8 }}>
          <Ionicons name="trash-outline" size={18} color={plate.red} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <Text style={[gs.h3, { flex: 1 }]}>{t("container.listTitle")}</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginRight: 12 }}>
          <Ionicons name="refresh" size={22} color={plate.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(drawer)/(tabs)/container-form" as any })}
          style={[gs.buttonSmall, { backgroundColor: plate.primary, paddingHorizontal: 16 }]}
        >
          <Ionicons name="add" size={18} color={plate.background} />
          <Text style={[gs.buttonText, { fontSize: 14, marginLeft: 4 }]}>{t("container.addButton")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={containers}
        keyExtractor={(item: any) => item._id}
        renderItem={renderContainer}
        contentContainerStyle={[gs.container]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="layers-outline" title={t("container.emptyTitle")} />}
      />

      <ConfirmDialog
        visible={!!deleteId}
        title={t("container.deleteConfirmTitle")}
        message={t("container.deleteConfirmMessage")}
        confirmLabel={t("container.deleteConfirmButton")}
        confirmDanger
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}
