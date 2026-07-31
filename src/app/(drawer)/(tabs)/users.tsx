import { getApiClient, useInfiniteApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { useAuth } from "@/context/AuthContext";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function UsersScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [changePasswordId, setChangePasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useInfiniteApiQuery<any>({
    url: "admin/users",
    queryKey: ["api", "admin", "users", "list"],
  });

  const users = data?.pages.flatMap((p) => p.data) ?? [];

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await getApiClient().put(`admin/users/${id}/${isBlocked ? "unblock" : "block"}`);
      refetch();
      Alert.alert("", t("common.success"));
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("", t("user.passwordMinLength"));
      return;
    }
    getApiClient().put(`admin/users/${changePasswordId}/change-password`, { newPassword })
      .then(() => {
        Alert.alert("", t("user.passwordChanged"));
        setChangePasswordId(null);
        setNewPassword("");
      })
      .catch((err) => Alert.alert(t("common.error"), getErrorMessage(err)));
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={[gs.listItem, { paddingLeft: 0 }]}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={() => router.push({ pathname: "/(drawer)/(tabs)/user-detail" as any, params: { id: item._id } })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: plate.blue + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
          <Ionicons name="person" size={20} color={plate.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gs.label}>{item.name ?? item.phone}</Text>
          <View style={[gs.containerRow, { gap: 8 }]}>
            <Text style={gs.caption}>{t("user.balanceLabel", { balance: "$" + (item.balance?.toLocaleString() ?? "0") })}</Text>
            {item.role === "super_admin" ? (
              <View style={[gs.badge, { backgroundColor: plate.red + "20" }]}>
                <Text style={[gs.badgeText, { color: plate.red, fontSize: 10 }]}>{t("user.superAdminBadge")}</Text>
              </View>
            ) : item.role === "admin" ? (
              <View style={[gs.badge, { backgroundColor: plate.primary + "20" }]}>
                <Text style={[gs.badgeText, { color: plate.primary, fontSize: 10 }]}>{t("user.adminBadge")}</Text>
              </View>
            ) : null}
            {item.isBlocked ? (
              <View style={[gs.badge, { backgroundColor: plate.red + "20" }]}>
                <Text style={[gs.badgeText, { color: plate.red, fontSize: 10 }]}>{t("user.blockedBadge")}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setChangePasswordId(item._id)} style={{ padding: 8 }}>
        <Ionicons name="key-outline" size={18} color={plate.primary} />
        </TouchableOpacity>
        {currentUser?.role === "super_admin" && item.role !== "super_admin" ? (
          <TouchableOpacity
            onPress={() => {
              const newRole = item.role === "admin" ? "customer" : "admin";
              Alert.alert(
                newRole === "admin" ? "Promote to Admin" : "Demote to Customer",
                `${item.phone}: ${newRole === "admin" ? "Make admin?" : "Remove admin?"}`,
                [
                  { text: t("common.cancel"), style: "cancel" },
                  { text: t("common.confirm"), onPress: async () => {
                    try {
                      await getApiClient().put(`admin/users/${item._id}/role`, { role: newRole });
                      refetch();
                      Alert.alert("", t("common.success"));
                    } catch (err) {
                      Alert.alert(t("common.error"), getErrorMessage(err));
                    }
                  }},
                ],
              );
            }}
            style={{ padding: 8 }}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={plate.primary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => handleBlock(item._id, item.isBlocked)} style={{ padding: 8 }}>
        <Ionicons name={item.isBlocked ? "lock-open" : "lock-closed"} size={18} color={item.isBlocked ? plate.green : plate.red} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <Text style={[gs.h3, { flex: 1 }]}>{t("user.listTitle")}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Ionicons name="refresh" size={22} color={plate.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item: any) => item._id}
        renderItem={renderUser}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingHorizontal: 20 }, users.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t("user.emptyTitle")} />}
      />

      <Modal visible={!!changePasswordId} transparent animationType="fade" onRequestClose={() => setChangePasswordId(null)}>
        <View style={gs.overlay}>
          <View style={gs.modal}>
            <Text style={[gs.h3, { marginBottom: 16 }]}>{t("user.changePasswordTitle")}</Text>
            <View style={[gs.inputContainer, { marginBottom: 16 }]}>
              <TextInput
                style={gs.input}
                placeholder={t("user.newPasswordPlaceholder")}
                placeholderTextColor={plate.textSecond}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[gs.buttonOutline, { flex: 1 }]} onPress={() => { setChangePasswordId(null); setNewPassword(""); }}>
                <Text style={gs.buttonTextSecondary}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.button, { flex: 1 }]} onPress={handleChangePassword}>
                <Text style={gs.buttonText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
