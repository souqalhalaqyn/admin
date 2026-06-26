import { getApiClient, queryKeys, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

interface AdItem {
  _id: string;
  container: { nameEn: string; nameAr: string };
  products: Array<{ nameEn: string; nameAr: string }>;
  user: { phone: string };
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  approved: "#10B981",
  rejected: "#EF4444",
};

export default function AdsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<string>("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, refetch } = useApiQuery<{ data: AdItem[]; meta?: any }>({
    url: "admin/ads",
    queryKey: ["api", "admin", "ads", "list", { status: filter !== "all" ? filter : undefined }],
    params: filter !== "all" ? { status: filter, limit: 50 } : { limit: 50 },
  });

  const ads = data?.data ?? [];

  const handleApprove = async (id: string) => {
    try {
      const client = getApiClient();
      await client.put(`admin/ads/${id}/approve`);
      refetch();
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    try {
      const client = getApiClient();
      await client.put(`admin/ads/${rejectId}/reject`, { rejectionReason: rejectReason.trim() });
      setRejectId(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    }
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;
  const getStatusLabel = (status: string) => t(`ads.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[gs.rowBetween, { marginTop: 16, marginBottom: 16 }]}>
          <Text style={gs.h2}>{t("ads.listTitle")}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Ionicons name="refresh" size={22} color={plate.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[gs.tag, { backgroundColor: filter === f ? plate.primary : plate.gray }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[gs.tagText, { color: filter === f ? plate.background : plate.text }]}>
              {t(`ads.filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={ads}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, ads.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="megaphone-outline" title={t("ads.emptyList")} />}
        renderItem={({ item }) => {
          const containerName = item.container?.nameEn || item.container?.nameAr || "—";
          const productCount = item.products?.length ?? 0;
          return (
            <View style={[gs.card, { padding: 16, marginBottom: 12 }]}>
              <View style={[gs.rowBetween, { marginBottom: 8 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[gs.label]} numberOfLines={1}>{containerName}</Text>
                  <Text style={gs.caption}>
                    {productCount} {t("ads.products")} · {item.user?.phone ?? "—"}
                  </Text>
                  <Text style={gs.caption}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[gs.badge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                  <Text style={[gs.badgeText, { color: getStatusColor(item.status), fontSize: 11 }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              {item.status === "pending" && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[gs.buttonSmall, { backgroundColor: plate.green, flex: 1, paddingVertical: 8 }]}
                    onPress={() => handleApprove(item._id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t("ads.approve")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[gs.buttonSmall, { backgroundColor: plate.red, flex: 1, paddingVertical: 8 }]}
                    onPress={() => setRejectId(item._id)}
                  >
                    <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t("ads.reject")}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === "rejected" && item.rejectionReason ? (
                <Text style={[gs.textSmall, { color: plate.red, marginTop: 8 }]}>
                  {t("ads.rejectionReason")}: {item.rejectionReason}
                </Text>
              ) : null}
            </View>
          );
        }}
      />

      <Modal visible={!!rejectId} transparent animationType="fade" onRequestClose={() => setRejectId(null)}>
        <View style={gs.overlay}>
          <View style={gs.modal}>
            <Text style={[gs.h3, { marginBottom: 8 }]}>{t("ads.rejectTitle")}</Text>
            <TextInput
              style={[gs.input, { marginBottom: 16, minHeight: 80, textAlignVertical: "top" }]}
              placeholder={t("ads.rejectPlaceholder")}
              placeholderTextColor={plate.graySecond}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[gs.buttonOutline, { flex: 1 }]}
                onPress={() => { setRejectId(null); setRejectReason(""); }}
              >
                <Text style={gs.buttonTextSecondary}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[gs.buttonDanger, { flex: 1 }]}
                onPress={handleReject}
              >
                <Text style={gs.buttonText}>{t("ads.reject")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
