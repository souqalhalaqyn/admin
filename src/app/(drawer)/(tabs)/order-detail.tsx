import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingScreen from "@/components/LoadingScreen";
import { Row } from "@/components/Row";
import { useGlobalStyles } from "@/styles/global";
import { localizedName } from "@/utils/localizedName";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  confirmed: "#3B82F6",
  processing: "#8B5CF6",
  shipped: "#10B981",
  delivered: "#059669",
  cancelled: "#EF4444",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

const statusLabelKey = (status: string) => `order.status${status.charAt(0).toUpperCase()}${status.slice(1)}`;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [stockWarnings, setStockWarnings] = useState<any[] | null>(null);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: `admin/orders/${id}`,
    queryKey: queryKeys.admin.orders.detail(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useApiMutation<any, any>({
    method: "put",
    url: `admin/orders/${id}/status`,
    options: {
      onSuccess: (resp: any) => {
        const warnings = resp?.meta?.stockWarnings;
        if (warnings && warnings.length > 0) {
          setStockWarnings(warnings);
          return;
        }
        refetch(); setConfirmStatus(null); Alert.alert(t("common.success"), t("order.statusUpdated"));
      },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const forceUpdate = () => {
    setStockWarnings(null);
    updateStatusMutation.mutate({ status: confirmStatus, force: true });
  };

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
        <Text style={[gs.h3, { marginLeft: 12 }]}>{t("order.detailTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={[gs.container, gs.scrollContent]}>
        <View style={[gs.card, { padding: 16 }]}>
          <Text style={[gs.sectionHeader]}>{t("order.orderInfo")}</Text>
          <View style={{ gap: 8 }}>
            <Row label={t("order.orderId")} value={order._id} />
            <Row label={t("order.status")} value={t(statusLabelKey(order.status))} color={getStatusColor(order.status)} />
            <Row label={t("order.total")} value={`$${order.total?.toLocaleString() ?? 0}`} color={plate.primary} />
            <Row label={t("order.customer")} value={order.user?.phone ?? t("order.na")} />
            <Row label={t("order.location")} value={order.address || order.location || t("order.na")} />
            <Row label={t("order.date")} value={order.createdAt ? new Date(order.createdAt).toLocaleString() : t("order.na")} />
          </View>
        </View>

        <View style={[gs.card, { padding: 16 }]}>
          <Text style={[gs.sectionHeader]}>{t("order.items", { count: order.items?.length ?? 0 })}</Text>
          {order.items?.map((item: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={[gs.listItem, { paddingHorizontal: 0 }]}
              onPress={() => {
                const productId = item.product?._id ?? item.product;
                if (productId) router.push({ pathname: "/(drawer)/(tabs)/product-form" as any, params: { id: productId } });
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={gs.label}>{item.name}</Text>
                <Text style={gs.caption}>{t("order.qty", { qty: item.quantity, price: "$" + item.price })}</Text>
              </View>
              <Text style={[gs.textBold, { color: plate.primary }]}>
                ${(item.quantity * item.price).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {STATUS_TRANSITIONS[order.status] ? (
          <View style={[gs.card, { padding: 16 }]}>
            <Text style={[gs.sectionHeader]}>{t("order.updateStatus")}</Text>
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
                    {t(statusLabelKey(status))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {order.statusHistory?.length > 0 ? (
          <View style={[gs.card, { padding: 16 }]}>
            <Text style={[gs.sectionHeader]}>{t("order.statusHistory")}</Text>
            {order.statusHistory.map((entry: any, i: number) => (
              <View key={i} style={[gs.listItem, { paddingHorizontal: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={gs.label}>{t(statusLabelKey(entry.status))}</Text>
                  <Text style={gs.caption}>
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ""}
                    {entry.changedBy ? t("order.changedBy", { changedBy: entry.changedBy }) : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirmStatus}
        title={t("order.confirmUpdateTitle")}
        message={t("order.confirmChangeMessage", { status: confirmStatus ? t(statusLabelKey(confirmStatus)) : "" })}
        confirmLabel={t("order.confirmUpdateButton")}
        onConfirm={() => confirmStatus && updateStatusMutation.mutate({ status: confirmStatus })}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        visible={!!stockWarnings}
        title={t("order.stockWarningTitle")}
        message={stockWarnings?.map((w: any) =>
          `• ${localizedName(w, i18n.language)} — ${t("order.stockWarningDetail", { qty: w.quantity, stock: w.stock })}`
        ).join("\n") ?? ""}
        confirmLabel={t("order.continueAnyway")}
        onConfirm={forceUpdate}
        onCancel={() => setStockWarnings(null)}
      />
    </View>
  );
}


