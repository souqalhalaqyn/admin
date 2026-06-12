import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: `admin/users/${id}`,
    queryKey: queryKeys.users.detail(id!),
    enabled: !!id,
  });

  const updateBalanceMutation = useApiMutation<any, any>({
    method: "put",
    url: `admin/users/${id}/balance`,
    options: {
      onSuccess: () => { refetch(); setShowBalanceForm(false); setBalanceAmount(""); Alert.alert(t("common.success"), t("user.balanceUpdated")); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const user = (data as any)?.data;

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{t("user.detailTitle")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[gs.container, gs.scrollContent]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        <View style={[gs.card, { padding: 16 }]}>
          <SectionHeader title={t("user.accountInfo")} />
          <View style={{ gap: 8 }}>
            <Row label={t("user.phone")} value={user.phone} />
            <Row label={t("user.role")} value={user.role} color={user.role === "admin" ? plate.primary : plate.text} />
            <Row label={t("user.balance")} value={`$${user.balance?.toLocaleString() ?? 0}`} color={plate.blue} />
            <Row label={t("user.joined")} value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} />
          </View>
        </View>

        {!showBalanceForm ? (
          <TouchableOpacity
            style={[gs.buttonSecondary, { marginBottom: 16 }]}
            onPress={() => setShowBalanceForm(true)}
          >
            <Ionicons name="wallet-outline" size={18} color={plate.primary} style={{ marginRight: 8 }} />
            <Text style={gs.buttonTextSecondary}>{t("user.updateBalance")}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[gs.card, { padding: 16 }]}>
            <SectionHeader title={t("user.adjustBalance")} />
            <FormField
              label={t("user.amount")}
              value={balanceAmount}
              onChangeText={setBalanceAmount}
              placeholder={t("user.amountPlaceholder")}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[gs.buttonOutline, { flex: 1 }]}
                onPress={() => setShowBalanceForm(false)}
              >
                <Text style={gs.buttonTextSecondary}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[gs.button, { flex: 1 }]}
                onPress={() => {
                  const amount = Number(balanceAmount);
                  if (isNaN(amount) || amount === 0) {
                    Alert.alert(t("common.error"), t("user.validationAmount"));
                    return;
                  }
                  updateBalanceMutation.mutate({ amount });
                }}
              >
                <Text style={gs.buttonText}>{t("user.apply")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {user.locations?.length > 0 ? (
          <View style={[gs.card, { padding: 16 }]}>
            <SectionHeader title={t("user.savedLocations", { count: user.locations.length })} />
            {user.locations.map((loc: any, i: number) => (
              <View key={i} style={[gs.listItem, { paddingHorizontal: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={gs.label}>{loc.name}</Text>
                  <Text style={gs.caption}>
                    {[loc.state?.name, loc.region?.name, loc.way?.name, loc.address].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {user.orders?.length > 0 ? (
          <View style={[gs.card, { padding: 16 }]}>
            <SectionHeader title={t("user.recentOrders", { count: user.orders.length })} />
            {user.orders.map((order: any, i: number) => (
              <View key={i} style={[gs.listItem, { paddingHorizontal: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={gs.label}>{t("user.orderNumber", { id: order._id?.slice(-6) })}</Text>
                  <Text style={gs.caption}>${order.total?.toLocaleString()} - {order.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const { gs } = useGlobalStyles();
  return (
    <View style={[gs.rowBetween]}>
      <Text style={gs.textSmall}>{label}</Text>
      <Text style={[gs.label, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
