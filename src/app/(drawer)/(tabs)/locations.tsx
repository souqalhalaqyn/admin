import { useApiQuery, useApiMutation, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LocationsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingState, setEditingState] = useState<any>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isDirectDelivery, setIsDirectDelivery] = useState(false);
  const [directDeliveryCharges, setDirectDeliveryCharges] = useState("");

  const { data, isLoading, refetch } = useApiQuery<any>({
    url: "locations/states",
    queryKey: queryKeys.locations.states(),
  });

  const states = data?.data ?? [];

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "locations/states",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), ""); setShowForm(false); refetch(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `locations/states/${editingState?._id}`,
    options: {
      onSuccess: () => { resetForm(); setShowForm(false); refetch(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const deleteMutation = useApiMutation<any, any>({
    method: "delete", url: `locations/states/${editingState?._id}`,
    options: {
      onSuccess: () => { refetch(); Alert.alert(t("common.success"), ""); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const resetForm = () => { setNameEn(""); setNameAr(""); setIsDirectDelivery(false); setDirectDeliveryCharges(""); setEditingState(null); };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (s: any) => {
    setEditingState(s);
    setNameEn(s.nameEn ?? "");
    setNameAr(s.nameAr ?? "");
    setIsDirectDelivery(s.isDirectDelivery ?? false);
    setDirectDeliveryCharges(String(s.directDeliveryCharges ?? ""));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!nameEn.trim() || !nameAr.trim()) { Alert.alert(t("common.error"), t("common.required")); return; }
    const payload = { nameEn: nameEn.trim(), nameAr: nameAr.trim(), isDirectDelivery, directDeliveryCharges: Number(directDeliveryCharges) || 0 };
    if (editingState) updateMutation.mutate(payload);
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
        <Text style={[gs.h3, { flex: 1 }]}>{t("locations.states")}</Text>
        <TouchableOpacity onPress={openCreate}>
          <Ionicons name="add-circle" size={28} color={plate.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={states}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[gs.listItem, { paddingLeft: 0 }]}
            onPress={() => router.push({ pathname: "/(drawer)/(tabs)/location-ways" as any, params: { stateId: item._id, stateName: item.nameEn ?? item.name } })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: plate.blue + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <Ionicons name="location" size={20} color={plate.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={gs.label}>{item.nameEn ?? item.name}</Text>
              {item.isDirectDelivery ? <Text style={gs.caption}>{t("locations.directDelivery")}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 8 }}>
              <Ionicons name="create-outline" size={20} color={plate.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, flex: states.length === 0 ? 1 : undefined }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState icon="location-outline" title={t("locations.emptyStates")} />}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={[gs.cardElevated, { backgroundColor: plate.background, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
            <Text style={[gs.h2, { marginBottom: 16 }]}>{editingState ? t("locations.editState") : t("locations.addState")}</Text>

            <View style={[gs.inputContainer, { marginBottom: 12 }]}>
              <TextInput style={gs.input} placeholder={t("locations.nameEn")} placeholderTextColor={plate.textSecond} value={nameEn} onChangeText={setNameEn} />
            </View>
            <View style={[gs.inputContainer, { marginBottom: 12 }]}>
              <TextInput style={gs.input} placeholder={t("locations.nameAr")} placeholderTextColor={plate.textSecond} value={nameAr} onChangeText={setNameAr} />
            </View>

            <TouchableOpacity style={[gs.containerRow, { marginBottom: 12 }]} onPress={() => setIsDirectDelivery(!isDirectDelivery)}>
              <Ionicons name={isDirectDelivery ? "checkbox" : "square-outline"} size={22} color={isDirectDelivery ? plate.green : plate.graySecond} />
              <Text style={[gs.text, { marginLeft: 8 }]}>{t("locations.directDelivery")}</Text>
            </TouchableOpacity>

            {isDirectDelivery ? (
              <View style={[gs.inputContainer, { marginBottom: 16 }]}>
                <TextInput style={gs.input} placeholder={t("locations.directDeliveryChargesPlaceholder")} placeholderTextColor={plate.textSecond} value={directDeliveryCharges} onChangeText={setDirectDeliveryCharges} keyboardType="decimal-pad" />
              </View>
            ) : null}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[gs.button, { flex: 1, backgroundColor: plate.gray }]} onPress={() => { setShowForm(false); resetForm(); }}>
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.button, { flex: 1 }]} onPress={handleSubmit}>
                <Text style={gs.buttonText}>{editingState ? t("common.save") : t("common.add")}</Text>
              </TouchableOpacity>
            </View>

            {editingState ? (
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
