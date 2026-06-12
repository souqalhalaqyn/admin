import { useApiQuery, useInfiniteApiQuery, queryKeys } from "@/api";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

export default function UsersScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useInfiniteApiQuery<any>({
    url: "admin/users",
    queryKey: queryKeys.admin.all,
  });

  const users = data?.pages.flatMap((p) => p.data) ?? [];

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[gs.listItem, { paddingLeft: 0 }]}
      onPress={() => router.push({ pathname: "/(drawer)/(tabs)/user-detail" as any, params: { id: item._id } })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: plate.blue + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
        <Ionicons name="person" size={20} color={plate.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={gs.label}>{item.phone}</Text>
        <View style={[gs.containerRow, { gap: 8 }]}>
          <Text style={gs.caption}>{t("user.balanceLabel", { balance: "$" + (item.balance?.toLocaleString() ?? "0") })}</Text>
          {item.role === "admin" ? (
            <View style={[gs.badge, { backgroundColor: plate.primary + "20" }]}>
              <Text style={[gs.badgeText, { color: plate.primary, fontSize: 10 }]}>{t("user.adminBadge")}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={plate.graySecond} />
    </TouchableOpacity>
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
        contentContainerStyle={[gs.container, users.length === 0 && { flex: 1 }]}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t("user.emptyTitle")} />}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} /> : null}
      />
    </View>
  );
}
