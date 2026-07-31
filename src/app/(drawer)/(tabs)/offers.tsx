import { getApiClient, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { localizedName } from "@/utils/localizedName";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

const STATUS_COLORS: Record<string, string> = {
  available: "#FBBF24",
  sold: "#3B82F6",
  completed: "#10B981",
};

interface OfferData {
  _id: string;
  totalQuantity: number;
  soldQuantity: number;
  offerPrice: number;
  unitSellPrice: number;
  commissionPercent: number;
  totalProfitDistributed: number;
  status: string;
  container?: { name?: string; nameEn?: string; nameAr?: string };
  product?: { name?: string; nameEn?: string; nameAr?: string; price?: number };
  buyer?: { phone?: string };
}

export default function OffersScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useApiQuery<{ data: OfferData[] }>({
    url: "offers/admin/all",
    queryKey: ["api", "offers", "admin", "list"],
  });

  const offers = data?.data ?? [];

  const handleDelete = useCallback(async (id: string) => {
    try {
      const client = getApiClient();
      await client.delete(`offers/admin/${id}`);
      setDeleteId(null);
      refetch();
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    }
  }, [t, refetch]);

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;
  const getStatusLabel = (status: string) => t(`offer.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[gs.rowBetween, { marginTop: 16, marginBottom: 16 }]}>
          <Text style={gs.h2}>{t("offer.listTitle")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={() => refetch()}>
              <Ionicons name="refresh" size={22} color={plate.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(drawer)/(tabs)/offer-form" as any)}>
              <Ionicons name="add-circle" size={26} color={plate.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, offers.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="pricetag-outline" title={t("offer.emptyList")} />}
        renderItem={({ item }) => {

          return (
            <TouchableOpacity
              style={[gs.card, { padding: 16, marginBottom: 12 }]}
              onPress={() => router.push({ pathname: "/(drawer)/(tabs)/offer-form" as any, params: { id: item._id } })}
            >
              <View style={[gs.rowBetween, { marginBottom: 8 }]}>
                <Text style={[gs.label, { flex: 1 }]} numberOfLines={1}>{localizedName(item.product, i18n.language) || "—"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[gs.badge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                    <Text style={[gs.badgeText, { color: getStatusColor(item.status), fontSize: 11 }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDeleteId(item._id)}>
                    <Ionicons name="trash-outline" size={18} color={plate.red} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ gap: 2 }}>
                <Text style={[gs.textSmall]}>
                  {t("offer.container")}: {localizedName(item.container, i18n.language) || "—"}
                </Text>
                <Text style={[gs.textSmall]}>
                  {t("offer.soldLabel", { sold: item.soldQuantity, total: item.totalQuantity })}
                </Text>
                <Text style={[gs.textSmall, { color: plate.primary }]}>
                  ${item.offerPrice?.toFixed(2)} · ${item.unitSellPrice?.toFixed(2)}/unit · {item.commissionPercent}%
                </Text>
                {item.status !== "available" && (
                  <Text style={[gs.textSmall]}>
                    {t("offer.buyerInfo")}: {item.buyer?.phone ?? t("offer.noBuyer")}
                  </Text>
                )}
                {item.totalProfitDistributed > 0 && (
                  <Text style={[gs.textSmall, { color: plate.green }]}>
                    {t("offer.profitDistributed", { amount: "$" + item.totalProfitDistributed.toFixed(2) })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <ConfirmDialog
        visible={!!deleteId}
        title={t("common.delete")}
        message={t("common.deleted")}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}
