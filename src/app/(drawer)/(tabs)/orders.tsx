import { useApiMutation, useInfiniteApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  confirmed: "#3B82F6",
  processing: "#8B5CF6",
  shipped: "#10B981",
  delivered: "#059669",
  cancelled: "#EF4444",
};

const ORDER_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersScreen() {
  const { plate, gs } = useGlobalStyles();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{ id: string; status: string } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useInfiniteApiQuery<any>({
    url: "admin/orders",
    queryKey: queryKeys.admin.orders.list({ status: statusFilter }),
    params: { status: statusFilter ?? undefined },
  });

  const updateStatusMutation = useApiMutation<any, { status: string }>({
    method: "put",
    url: "",
    options: {
      onSuccess: () => { refetch(); setConfirmItem(null); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const handleUpdateStatus = useCallback((id: string, newStatus: string) => {
    updateStatusMutation.mutate({ status: newStatus }, {});
  }, [updateStatusMutation]);

  const orders = data?.pages.flatMap((p) => p.data) ?? [];

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;
  const getStatusLabel = (status: string) => ORDER_LABELS[status] ?? status;

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[gs.card, { padding: 16 }]}
      onPress={() => router.push({ pathname: "/(drawer)/(tabs)/order-detail" as any, params: { id: item._id } })}
    >
      <View style={[gs.rowBetween, { marginBottom: 8 }]}>
        <Text style={[gs.label, { flex: 1 }]}>{item.user?.phone ?? "Unknown"}</Text>
        <View style={[gs.badge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[gs.badgeText, { color: getStatusColor(item.status), fontSize: 11 }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View style={[gs.rowBetween]}>
        <Text style={[gs.textSmall]}>
          {item.items?.length ?? 0} items
        </Text>
        <Text style={[gs.textBold, { color: plate.primary }]}>
          ${item.total?.toLocaleString() ?? 0}
        </Text>
      </View>
      {item.createdAt ? (
        <Text style={[gs.caption, { marginTop: 4 }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.container, { paddingBottom: 0 }]}>
        <View style={[gs.rowBetween, { marginTop: 16, marginBottom: 12 }]}>
          <Text style={gs.h2}>Orders</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Ionicons name="refresh" size={22} color={plate.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={[{ key: null, label: "All" }, ...Object.entries(ORDER_LABELS).map(([key, label]) => ({ key, label }))]}
          keyExtractor={(item) => item.key ?? "all"}
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                gs.tag,
                { backgroundColor: statusFilter === item.key ? plate.primary : plate.gray },
              ]}
              onPress={() => setStatusFilter(item.key)}
            >
              <Text style={[gs.tagText, { color: statusFilter === item.key ? plate.background : plate.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item: any) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={[gs.container, orders.length === 0 && { flex: 1 }]}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders found" />}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} /> : null}
      />

      <ConfirmDialog
        visible={!!confirmItem}
        title="Update Order Status"
        message={`Change order status?`}
        confirmLabel="Update"
        onConfirm={() => confirmItem && handleUpdateStatus(confirmItem.id, confirmItem.status)}
        onCancel={() => setConfirmItem(null)}
      />
    </View>
  );
}
