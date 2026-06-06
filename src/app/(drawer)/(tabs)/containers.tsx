import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

export default function ContainersScreen() {
  const { plate, gs } = useGlobalStyles();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: "containers",
    queryKey: queryKeys.containers.list({ limit: "100" }),
    params: { limit: 100 },
  });

  const deleteMutation = useApiMutation<any, any>({
    method: "delete", url: "",
    options: {
      onSuccess: () => { refetch(); Alert.alert("Deleted"); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
      onSettled: () => setDeleteId(null),
    },
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
          {item.brand?.name ?? "No brand"} | {item.products?.length ?? 0} products
        </Text>
      </View>
      <View style={[gs.containerRow, { gap: 4 }]}>
        {!item.isActive ? (
          <View style={[gs.badge, { backgroundColor: plate.red + "20" }]}>
            <Text style={[gs.badgeText, { color: plate.red, fontSize: 10 }]}>INACTIVE</Text>
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
        <Text style={[gs.h3, { flex: 1 }]}>Containers</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginRight: 12 }}>
          <Ionicons name="refresh" size={22} color={plate.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(drawer)/(tabs)/container-form" as any })}
          style={[gs.buttonSmall, { backgroundColor: plate.primary, paddingHorizontal: 16 }]}
        >
          <Ionicons name="add" size={18} color={plate.background} />
          <Text style={[gs.buttonText, { fontSize: 14, marginLeft: 4 }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={containers}
        keyExtractor={(item: any) => item._id}
        renderItem={renderContainer}
        contentContainerStyle={[gs.container]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="layers-outline" title="No containers" />}
      />
    </View>
  );
}
