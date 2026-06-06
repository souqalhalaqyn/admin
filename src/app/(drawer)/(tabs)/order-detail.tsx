import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: `admin/orders/${id}`,
    queryKey: queryKeys.admin.orders.detail(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useApiMutation<any, { status: string }>({
    method: "put",
    url: `admin/orders/${id}/status`,
    options: {
      onSuccess: () => { refetch(); setConfirmStatus(null); Alert.alert("Success", "Order status updated"); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const order = (data as any)?.data;
  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;

  if (isLoading) return <LoadingScreen />;
  if (!order) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>Order Detail</Text>
      </View>

      <ScrollView contentContainerStyle={[gs.container, gs.scrollContent]}>
        <View style={[gs.card, { padding: 16 }]}>
          <Text style={[gs.sectionHeader]}>Order Info</Text>
          <View style={{ gap: 8 }}>
            <Row label="Order ID" value={order._id} />
            <Row label="Status" value={ORDER_LABELS[order.status] ?? order.status} color={getStatusColor(order.status)} />
            <Row label="Total" value={`$${order.total?.toLocaleString() ?? 0}`} color={plate.primary} />
            <Row label="Customer" value={order.user?.phone ?? "N/A"} />
            <Row label="Location" value={order.location || "N/A"} />
            <Row label="Date" value={order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"} />
          </View>
        </View>

        <View style={[gs.card, { padding: 16 }]}>
          <Text style={[gs.sectionHeader]}>Items ({order.items?.length ?? 0})</Text>
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={[gs.listItem, { paddingHorizontal: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={gs.label}>{item.name}</Text>
                <Text style={gs.caption}>Qty: {item.quantity} x ${item.price}</Text>
              </View>
              <Text style={[gs.textBold, { color: plate.primary }]}>
                ${(item.quantity * item.price).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {STATUS_TRANSITIONS[order.status] ? (
          <View style={[gs.card, { padding: 16 }]}>
            <Text style={[gs.sectionHeader]}>Update Status</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {STATUS_TRANSITIONS[order.status].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    gs.buttonSmall,
                    { paddingHorizontal: 16, backgroundColor: getStatusColor(status) + "20" },
                  ]}
                  onPress={() => setConfirmStatus(status)}
                >
                  <Text style={{ color: getStatusColor(status), fontWeight: "600", fontSize: 14 }}>
                    {ORDER_LABELS[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {order.statusHistory?.length > 0 ? (
          <View style={[gs.card, { padding: 16 }]}>
            <Text style={[gs.sectionHeader]}>Status History</Text>
            {order.statusHistory.map((entry: any, i: number) => (
              <View key={i} style={[gs.listItem, { paddingHorizontal: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={gs.label}>{ORDER_LABELS[entry.status] ?? entry.status}</Text>
                  <Text style={gs.caption}>
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ""}
                    {entry.changedBy ? ` by ${entry.changedBy}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirmStatus}
        title="Update Status"
        message={`Change order to "${confirmStatus ? ORDER_LABELS[confirmStatus] : ""}"?`}
        confirmLabel="Update"
        onConfirm={() => confirmStatus && updateStatusMutation.mutate({ status: confirmStatus })}
        onCancel={() => setConfirmStatus(null)}
      />
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const { gs, plate } = useGlobalStyles();
  return (
    <View style={[gs.rowBetween]}>
      <Text style={gs.textSmall}>{label}</Text>
      <Text style={[gs.label, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
