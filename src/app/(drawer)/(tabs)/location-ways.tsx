import { queryKeys, useApiMutation, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LocationWaysScreen() {
  const { stateId, stateName } = useLocalSearchParams<{ stateId: string; stateName: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingWay, setEditingWay] = useState<any>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");

  const { data, isLoading, refetch } = useApiQuery<any>({
    url: `locations/states/${stateId}/ways`,
    queryKey: queryKeys.locations.ways(stateId!),
    enabled: !!stateId,
  });

  const ways = data?.data ?? [];

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "locations/ways",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), ""); setShowForm(false); refetch(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `locations/ways/${editingWay?._id}`,
    options: {
      onSuccess: () => { resetForm(); setShowForm(false); refetch(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const deleteMutation = useApiMutation<any, any>({
    method: "delete", url: `locations/ways/${editingWay?._id}`,
    options: {
      onSuccess: () => { refetch(); Alert.alert(t("common.success"), ""); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const resetForm = () => { setNameEn(""); setNameAr(""); setEditingWay(null); };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (w: any) => {
    setEditingWay(w);
    setNameEn(w.nameEn ?? w.name ?? "");
    setNameAr(w.nameAr ?? "");
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameAr.trim()) { Alert.alert(t("common.error"), t("common.required")); return; }
    const payload = { nameEn: nameEn.trim(), nameAr: nameAr.trim(), state: stateId };
    if (editingWay) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const handleDelete = () => {
    Alert.alert(t("common.confirm"), t("common.confirmDelete"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMutation.mutate(undefined) },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{t("locations.waysOf", { name: stateName })}</Text>
        <TouchableOpacity onPress={openCreate}>
          <Ionicons name="add-circle" size={28} color={plate.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={ways}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[gs.listItem, { paddingLeft: 0 }]}
            onPress={() => router.push({ pathname: "/(drawer)/(tabs)/location-branches" as any, params: { wayId: item._id, wayName: item.nameEn ?? item.name } })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: plate.green + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <Ionicons name="car" size={20} color={plate.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={gs.label}>{item.nameEn ?? item.name}</Text>
              <Text style={gs.caption}>{item.deliveryCompanyEn ?? item.deliveryCompany ?? ""}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 8 }}>
              <Ionicons name="create-outline" size={20} color={plate.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, flex: ways.length === 0 ? 1 : undefined }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="car-outline" title={t("locations.emptyWays")} />}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[gs.cardElevated, { backgroundColor: plate.background, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
            <Text style={[gs.h2, { marginBottom: 16 }]}>{editingWay ? t("locations.editWay") : t("locations.addWay")}</Text>

            <View style={[gs.inputContainer, { marginBottom: 12 }]}>
              <TextInput style={gs.input} placeholder={t("locations.nameEn")} placeholderTextColor={plate.textSecond} value={nameEn} onChangeText={setNameEn} />
            </View>
            <View style={[gs.inputContainer, { marginBottom: 12 }]}>
              <TextInput style={gs.input} placeholder={t("locations.nameAr")} placeholderTextColor={plate.textSecond} value={nameAr} onChangeText={setNameAr} />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[gs.button, { flex: 1, backgroundColor: plate.gray }]} onPress={() => { setShowForm(false); resetForm(); }}>
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.button, { flex: 1 }]} onPress={handleSubmit}>
                <Text style={gs.buttonText}>{editingWay ? t("common.save") : t("common.add")}</Text>
              </TouchableOpacity>
            </View>

            {editingWay ? (
              <TouchableOpacity style={[gs.buttonDanger, { marginTop: 12 }]} onPress={handleDelete}>
                <Text style={gs.buttonText}>{t("common.delete")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
