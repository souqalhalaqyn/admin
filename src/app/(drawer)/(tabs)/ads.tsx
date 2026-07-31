import { getApiClient, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Linking, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdItem {
  _id: string;
  container: { nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string };
  products: Array<{
    nameEn: string; nameAr: string; price: number; stock: number;
    images: string[]; descriptionEn: string; descriptionAr: string;
  }>;
  user: { phone: string };
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface EditForm {
  containerNameAr: string; containerNameEn: string;
  containerDescAr: string; containerDescEn: string;
  products: Array<{
    nameAr: string; nameEn: string; price: string; stock: string;
    descriptionAr: string; descriptionEn: string;
  }>;
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
  const [previewAd, setPreviewAd] = useState<AdItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

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

  const openEditForm = () => {
    if (!previewAd) return;
    setEditForm({
      containerNameAr: previewAd.container?.nameAr ?? "",
      containerNameEn: previewAd.container?.nameEn ?? "",
      containerDescAr: previewAd.container?.descriptionAr ?? "",
      containerDescEn: previewAd.container?.descriptionEn ?? "",
      products: previewAd.products?.map((p) => ({
        nameAr: p.nameAr ?? "",
        nameEn: p.nameEn ?? "",
        price: String(p.price ?? ""),
        stock: String(p.stock ?? "0"),
        descriptionAr: p.descriptionAr ?? "",
        descriptionEn: p.descriptionEn ?? "",
      })) ?? [],
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !previewAd) return;
    if (!editForm.containerNameAr.trim()) {
      Alert.alert("", t("ads.validationContainerArRequired"));
      return;
    }
    setSaving(true);
    try {
      const client = getApiClient();
      await client.put(`admin/ads/${previewAd._id}`, {
        container: {
          nameAr: editForm.containerNameAr.trim(),
          nameEn: editForm.containerNameEn.trim() || editForm.containerNameAr.trim(),
          descriptionAr: editForm.containerDescAr.trim(),
          descriptionEn: editForm.containerDescEn.trim(),
        },
        products: editForm.products.map((p) => ({
          nameAr: p.nameAr.trim(),
          nameEn: p.nameEn.trim() || p.nameAr.trim(),
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          descriptionAr: p.descriptionAr.trim(),
          descriptionEn: p.descriptionEn.trim(),
        })),
      });
      setEditForm(null);
      setPreviewAd(null);
      refetch();
      Alert.alert("", t("common.success"));
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateEditProduct = (i: number, field: string, value: any) => {
    if (!editForm) return;
    setEditForm((prev) => {
      if (!prev) return prev;
      const products = [...prev.products];
      products[i] = { ...products[i], [field]: value };
      return { ...prev, products };
    });
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] ?? plate.graySecond;
  const getStatusLabel = (status: string) => t(`ads.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);

  const langLabel = (en: string, ar: string) => i18n.language === "ar" ? (ar || en) : (en || ar);

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
          const containerName = langLabel(item.container?.nameEn, item.container?.nameAr) || "—";
          const productCount = item.products?.length ?? 0;
          return (
            <View style={[gs.card, { padding: 16, marginBottom: 12 }]}>
              <TouchableOpacity onPress={() => setPreviewAd(item)}>
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
              </TouchableOpacity>
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

      <Modal visible={!!previewAd && !editForm} animationType="slide" onRequestClose={() => setPreviewAd(null)}>
        <View style={{ flex: 1, backgroundColor: plate.background }}>
          <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, alignItems: "center" }]}>
            <TouchableOpacity onPress={() => setPreviewAd(null)} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={plate.text} />
            </TouchableOpacity>
            <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]} numberOfLines={1}>
              {previewAd ? langLabel(previewAd.container?.nameEn, previewAd.container?.nameAr) : ""}
            </Text>
            {previewAd && (
              <TouchableOpacity onPress={openEditForm} style={{ padding: 4 }}>
                <Ionicons name="create-outline" size={24} color={plate.primary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {previewAd && previewAd.products?.map((product, idx) => {
              const images = product.images ?? [];
              return (
                <View key={idx}>
                  {images.length > 0 ? (
                    <Image
                      source={{ uri: buildImageUrl(images[0]) }}
                      style={{ width: "100%", height: SCREEN_WIDTH - 40, borderRadius: 12, marginTop: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: "100%", height: SCREEN_WIDTH - 40, borderRadius: 12, marginTop: 12, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name="image-outline" size={48} color={plate.textSecond} />
                    </View>
                  )}

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 }}>
                    <Text style={[gs.h2, { flex: 1 }]}>{langLabel(product.nameEn, product.nameAr)}</Text>
                    <Text style={[gs.h1, { color: plate.primary }]}>
                      {Number(product.price ?? 0).toLocaleString()} SYP
                    </Text>
                  </View>

                  {langLabel(product.descriptionEn, product.descriptionAr) ? (
                    <Text style={[gs.text, { marginTop: 12 }]}>{langLabel(product.descriptionEn, product.descriptionAr)}</Text>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity
              style={[gs.button, { marginTop: 24, backgroundColor: "#25D366" }]}
              onPress={() => previewAd?.user?.phone && Linking.openURL(`https://wa.me/${previewAd.user.phone.replace(/^0|\+|\s/g, "")}`).catch(() => {})}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={gs.buttonText}>{t("ads.contactWhatsApp")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: plate.red, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
              onPress={() => Alert.alert(t("common.confirm"), t("ads.deleteConfirm"), [
                { text: t("common.cancel"), style: "cancel" },
                { text: t("common.delete"), style: "destructive", onPress: async () => {
                  try {
                    const client = getApiClient();
                    await client.delete(`admin/ads/${previewAd!._id}`);
                    setPreviewAd(null);
                    refetch();
                  } catch (err) {
                    Alert.alert(t("common.error"), getErrorMessage(err));
                  }
                }},
              ])}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{t("common.delete")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!editForm} animationType="slide" onRequestClose={() => setEditForm(null)}>
        <View style={{ flex: 1, backgroundColor: plate.background }}>
          <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, alignItems: "center" }]}>
            <TouchableOpacity onPress={() => setEditForm(null)} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={plate.text} />
            </TouchableOpacity>
            <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{t("ads.editTitle")}</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {editForm && (
              <>
                <Text style={[gs.inputLabel, { marginTop: 16, marginBottom: 8 }]}>{t("containerForm.nameAr")}</Text>
                <View style={gs.inputContainer}>
                  <TextInput style={gs.input} value={editForm.containerNameAr} onChangeText={(v) => setEditForm({ ...editForm, containerNameAr: v })} placeholder={t("containerForm.nameArPlaceholder")} placeholderTextColor={plate.textSecond} />
                </View>

                <Text style={[gs.inputLabel, { marginTop: 12, marginBottom: 8 }]}>{t("containerForm.nameEn")}</Text>
                <View style={gs.inputContainer}>
                  <TextInput style={gs.input} value={editForm.containerNameEn} onChangeText={(v) => setEditForm({ ...editForm, containerNameEn: v })} placeholder={t("containerForm.nameEnPlaceholder")} placeholderTextColor={plate.textSecond} />
                </View>

                <Text style={[gs.inputLabel, { marginTop: 12, marginBottom: 8 }]}>{t("containerForm.descAr")}</Text>
                <View style={[gs.inputContainer, { height: 80, alignItems: "flex-start", paddingVertical: 12 }]}>
                  <TextInput style={[gs.input, { height: "100%", textAlignVertical: "top" }]} value={editForm.containerDescAr} onChangeText={(v) => setEditForm({ ...editForm, containerDescAr: v })} placeholder={t("containerForm.descArPlaceholder")} placeholderTextColor={plate.textSecond} multiline />
                </View>

                <Text style={[gs.inputLabel, { marginTop: 12, marginBottom: 8 }]}>{t("containerForm.descEn")}</Text>
                <View style={[gs.inputContainer, { height: 80, alignItems: "flex-start", paddingVertical: 12 }]}>
                  <TextInput style={[gs.input, { height: "100%", textAlignVertical: "top" }]} value={editForm.containerDescEn} onChangeText={(v) => setEditForm({ ...editForm, containerDescEn: v })} placeholder={t("containerForm.descEnPlaceholder")} placeholderTextColor={plate.textSecond} multiline />
                </View>

                {editForm.products.map((p, i) => (
                  <View key={i} style={[gs.card, { padding: 12, marginTop: 16 }]}>
                    <Text style={[gs.label, { marginBottom: 8 }]}>{t("ads.productLabel")} {i + 1}</Text>

                    <Text style={gs.inputLabel}>{t("productForm.nameAr")}</Text>
                    <View style={[gs.inputContainer, { marginBottom: 8 }]}>
                      <TextInput style={gs.input} value={p.nameAr} onChangeText={(v) => updateEditProduct(i, "nameAr", v)} placeholder={t("productForm.nameArPlaceholder")} placeholderTextColor={plate.textSecond} />
                    </View>

                    <Text style={gs.inputLabel}>{t("productForm.nameEn")}</Text>
                    <View style={[gs.inputContainer, { marginBottom: 8 }]}>
                      <TextInput style={gs.input} value={p.nameEn} onChangeText={(v) => updateEditProduct(i, "nameEn", v)} placeholder={t("productForm.nameEnPlaceholder")} placeholderTextColor={plate.textSecond} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={gs.inputLabel}>{t("productForm.price")}</Text>
                        <View style={gs.inputContainer}>
                          <TextInput style={gs.input} value={p.price} onChangeText={(v) => updateEditProduct(i, "price", v)} keyboardType="decimal-pad" placeholderTextColor={plate.textSecond} />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={gs.inputLabel}>{t("productForm.stock")}</Text>
                        <View style={gs.inputContainer}>
                          <TextInput style={gs.input} value={p.stock} onChangeText={(v) => updateEditProduct(i, "stock", v)} keyboardType="number-pad" placeholderTextColor={plate.textSecond} />
                        </View>
                      </View>
                    </View>

                    <Text style={[gs.inputLabel, { marginTop: 8 }]}>{t("productForm.descAr")}</Text>
                    <View style={[gs.inputContainer, { height: 60, alignItems: "flex-start", paddingVertical: 12, marginBottom: 8 }]}>
                      <TextInput style={[gs.input, { height: "100%", textAlignVertical: "top" }]} value={p.descriptionAr} onChangeText={(v) => updateEditProduct(i, "descriptionAr", v)} placeholderTextColor={plate.textSecond} multiline />
                    </View>

                    <Text style={gs.inputLabel}>{t("productForm.descEn")}</Text>
                    <View style={[gs.inputContainer, { height: 60, alignItems: "flex-start", paddingVertical: 12 }]}>
                      <TextInput style={[gs.input, { height: "100%", textAlignVertical: "top" }]} value={p.descriptionEn} onChangeText={(v) => updateEditProduct(i, "descriptionEn", v)} placeholderTextColor={plate.textSecond} multiline />
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[gs.button, { marginTop: 24, opacity: saving ? 0.6 : 1 }]}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
                  <Text style={gs.buttonText}>{saving ? t("common.loading") : t("common.save")}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
