import { getApiClient, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ChargeRequestData {
  _id: string;
  user: { _id: string; phone: string } | null;
  amount: number;
  image: string;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  done: "#10B981",
  cancelled: "#EF4444",
};

export default function ChargeRequestsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{ id: string; action: "done" | "cancelled" } | null>(null);
  const [updating, setUpdating] = useState(false);

  const { data, isLoading, refetch } = useApiQuery<{ data: ChargeRequestData[] }>({
    url: "charge-requests/admin",
    queryKey: queryKeys.chargeRequests.list(),
  });

  const handleUpdate = useCallback(async (id: string, status: string) => {
    setUpdating(true);
    try {
      const client = getApiClient();
      await client.put(`charge-requests/admin/${id}/status`, { status });
      setConfirmItem(null);
      refetch();
      Alert.alert(t("common.success"), t("chargeRequest.updated"));
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }, [t, refetch]);

  const requests = data?.data ?? [];

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;
  const getStatusLabel = (status: string) => t(`chargeRequest.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);

  const renderItem = ({ item }: { item: ChargeRequestData }) => (
    <View style={[gs.card, { padding: 16, marginBottom: 12 }]}>
      <View style={[gs.rowBetween, { marginBottom: 8 }]}>
        <Text style={[gs.label, { flex: 1 }]}>{item.user?.phone ?? "—"}</Text>
        <View style={[gs.badge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[gs.badgeText, { color: getStatusColor(item.status), fontSize: 11 }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[gs.textBold, { color: plate.primary, marginBottom: 4 }]}>
        {t("chargeRequest.amount")}: {item.amount.toFixed(2)} SYP
      </Text>

      <Text style={[gs.caption, { marginBottom: 12 }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      <View style={[gs.containerRow, { gap: 8 }]}>
        {item.image ? (
          <TouchableOpacity
            style={[gs.buttonSmall, { backgroundColor: plate.gray }]}
            onPress={() => setSelectedImage(buildImageUrl(item.image))}
          >
            <Ionicons name="image-outline" size={16} color={plate.text} style={{ marginRight: 4 }} />
            <Text style={[gs.textSmall, { color: plate.text }]}>{t("chargeRequest.image")}</Text>
          </TouchableOpacity>
        ) : null}

        {item.status === "pending" && (
          <>
            <TouchableOpacity
              style={[gs.buttonSmall, { backgroundColor: plate.green }]}
              onPress={() => setConfirmItem({ id: item._id, action: "done" })}
            >
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={[gs.textSmall, { color: "#fff" }]}>{t("chargeRequest.approve")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.buttonSmall, { backgroundColor: plate.red }]}
              onPress={() => setConfirmItem({ id: item._id, action: "cancelled" })}
            >
              <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={[gs.textSmall, { color: "#fff" }]}>{t("chargeRequest.cancel")}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[gs.rowBetween, { marginTop: 16, marginBottom: 16 }]}>
          <Text style={gs.h2}>{t("chargeRequest.listTitle")}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Ionicons name="refresh" size={22} color={plate.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, requests.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="card-outline" title={t("chargeRequest.emptyList")} />}
      />

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 1 }}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "90%", height: "70%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!confirmItem}
        title={t("chargeRequest.listTitle")}
        message={t(`chargeRequest.${confirmItem?.action === "done" ? "approveConfirm" : "cancelConfirm"}`)}
        confirmLabel={t("common.confirm")}
        onConfirm={() => confirmItem && handleUpdate(confirmItem.id, confirmItem.action)}
        onCancel={() => setConfirmItem(null)}
      />

      {updating && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <ActivityIndicator size="large" color={plate.primary} />
        </View>
      )}
    </View>
  );
}
