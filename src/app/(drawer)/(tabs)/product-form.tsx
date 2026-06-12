import { getApiClient, useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import ImageField from "@/components/ImageField";
import LoadingScreen from "@/components/LoadingScreen";
import PickerSelect from "@/components/PickerSelect";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const isEditing = !!id;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [shortDescriptionAr, setShortDescriptionAr] = useState("");
  const [longDescriptionEn, setLongDescriptionEn] = useState("");
  const [longDescriptionAr, setLongDescriptionAr] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [containerId, setContainerId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tagsEn, setTagsEn] = useState("");
  const [tagsAr, setTagsAr] = useState("");
  const [aliasesEn, setAliasesEn] = useState("");
  const [aliasesAr, setAliasesAr] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("common.permissionRequired"), t("productForm.permissionMessage"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    try {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop() || "image.jpg";
      const formData = new FormData();
      formData.append("images", {
        uri: localUri,
        name: filename,
        type: "image/jpeg",
      } as any);

      const client = getApiClient();
      const response = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const filenames: string[] = response.data?.data ?? [];
      setImages((prev) => [...prev, ...filenames]);
    } catch (err) {
      Alert.alert(t("common.uploadError"), getErrorMessage(err));
    }
  };

  const { data, isLoading: loadingData } = useApiQuery<any>({
    url: `products/${id}`,
    queryKey: queryKeys.products.detail(id!),
    enabled: isEditing,
  });

  const { data: containersData } = useApiQuery<any>({
    url: "containers",
    queryKey: queryKeys.containers.list({ limit: "200" }),
    params: { limit: 200 },
  });

  const containers = (containersData as any)?.data ?? [];
  const containerOptions = containers.map((c: any) => ({ label: c.nameEn ?? c.name, value: c._id }));

  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      setNameEn(p.nameEn ?? p.name ?? "");
      setNameAr(p.nameAr ?? "");
      setShortDescriptionEn(p.shortDescriptionEn ?? p.shortDescription ?? "");
      setShortDescriptionAr(p.shortDescriptionAr ?? "");
      setLongDescriptionEn(p.longDescriptionEn ?? p.longDescription ?? "");
      setLongDescriptionAr(p.longDescriptionAr ?? "");
      setPrice(String(p.price ?? ""));
      setStock(String(p.stock ?? "0"));
      setContainerId(p.container?._id ?? p.container ?? "");
      setImages(p.images ?? []);
      setTagsEn((p.tagsEn ?? p.tags ?? []).join(", "));
      setTagsAr((p.tagsAr ?? []).join(", "));
      setAliasesEn((p.aliasesEn ?? p.aliases ?? []).join(", "));
      setAliasesAr((p.aliasesAr ?? []).join(", "));
      setNotesEn((p.notesEn ?? p.notes ?? []).join("\n"));
      setNotesAr((p.notesAr ?? []).join("\n"));
      setIsActive(p.isActive ?? true);
    }
  }, [data]);

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "products",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("productForm.created")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `products/${id}`,
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("productForm.updated")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = t("productForm.validationNameEnRequired");
    if (!nameAr.trim()) e.nameAr = t("productForm.validationNameArRequired");
    if (!shortDescriptionEn.trim()) e.shortDescriptionEn = t("productForm.validationShortDescEnRequired");
    if (!shortDescriptionAr.trim()) e.shortDescriptionAr = t("productForm.validationShortDescArRequired");
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = t("productForm.validationPriceRequired");
    if (!containerId) e.containerId = t("productForm.validationContainerRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      shortDescriptionEn: shortDescriptionEn.trim(),
      shortDescriptionAr: shortDescriptionAr.trim(),
      longDescriptionEn: longDescriptionEn.trim(),
      longDescriptionAr: longDescriptionAr.trim(),
      price: Number(price),
      stock: Number(stock) || 0,
      container: containerId,
      images,
      tagsEn: tagsEn.split(",").map((t) => t.trim()).filter(Boolean),
      tagsAr: tagsAr.split(",").map((t) => t.trim()).filter(Boolean),
      aliasesEn: aliasesEn.split(",").map((a) => a.trim()).filter(Boolean),
      aliasesAr: aliasesAr.split(",").map((a) => a.trim()).filter(Boolean),
      notesEn: notesEn.split("\n").map((n) => n.trim()).filter(Boolean),
      notesAr: notesAr.split("\n").map((n) => n.trim()).filter(Boolean),
      isActive,
    };
    if (isEditing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isLoading = loadingData || createMutation.isPending || updateMutation.isPending;
  if (isEditing && loadingData) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={gs.safeArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{isEditing ? t("productForm.editTitle") : t("productForm.newTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title={t("productForm.basicInfo")} subtitle={t("productForm.basicInfoSub")} />

        <FormField
          label={t("productForm.nameEn")}
          value={nameEn}
          onChangeText={setNameEn}
          placeholder={t("productForm.nameEnPlaceholder")}
          required
          error={errors.nameEn}
        />

        <FormField
          label={t("productForm.nameAr")}
          value={nameAr}
          onChangeText={setNameAr}
          placeholder={t("productForm.nameArPlaceholder")}
          required
          error={errors.nameAr}
        />

        <FormField
          label={t("productForm.shortDescEn")}
          value={shortDescriptionEn}
          onChangeText={setShortDescriptionEn}
          placeholder={t("productForm.shortDescEnPlaceholder")}
          required
          maxLength={150}
          error={errors.shortDescriptionEn}
        />

        <FormField
          label={t("productForm.shortDescAr")}
          value={shortDescriptionAr}
          onChangeText={setShortDescriptionAr}
          placeholder={t("productForm.shortDescArPlaceholder")}
          required
          error={errors.shortDescriptionAr}
        />

        <FormField
          label={t("productForm.longDescEn")}
          value={longDescriptionEn}
          onChangeText={setLongDescriptionEn}
          placeholder={t("productForm.longDescEnPlaceholder")}
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("productForm.longDescAr")}
          value={longDescriptionAr}
          onChangeText={setLongDescriptionAr}
          placeholder={t("productForm.longDescArPlaceholder")}
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormField
              label={t("productForm.price")}
              value={price}
              onChangeText={setPrice}
              placeholder={t("productForm.pricePlaceholder")}
              keyboardType="decimal-pad"
              required
              error={errors.price}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label={t("productForm.stock")}
              value={stock}
              onChangeText={setStock}
              placeholder={t("productForm.stockPlaceholder")}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <PickerSelect
          label={t("productForm.container")}
          options={containerOptions}
          selected={containerId}
          onSelect={setContainerId}
          required
          error={errors.containerId}
          placeholder={t("productForm.containerPlaceholder")}
        />

        <View style={gs.dividerFull} />
        <SectionHeader title={t("productForm.media")} subtitle={t("productForm.mediaSub")} />

        <ImageField
          images={images}
          label={t("productForm.images")}
          onAdd={handleAddImage}
          onRemove={(i) => setImages(images.filter((_, idx) => idx !== i))}
        />

        <View style={gs.dividerFull} />
        <SectionHeader title={t("productForm.additionalInfo")} subtitle={t("productForm.additionalInfoSub")} />

        <FormField
          label={t("productForm.tagsEn")}
          value={tagsEn}
          onChangeText={setTagsEn}
          placeholder={t("productForm.tagsEnPlaceholder")}
          autoCapitalize="none"
        />

        <FormField
          label={t("productForm.tagsAr")}
          value={tagsAr}
          onChangeText={setTagsAr}
          placeholder={t("productForm.tagsArPlaceholder")}
          autoCapitalize="none"
        />

        <FormField
          label={t("productForm.aliasesEn")}
          value={aliasesEn}
          onChangeText={setAliasesEn}
          placeholder={t("productForm.aliasesEnPlaceholder")}
          autoCapitalize="none"
        />

        <FormField
          label={t("productForm.aliasesAr")}
          value={aliasesAr}
          onChangeText={setAliasesAr}
          placeholder={t("productForm.aliasesArPlaceholder")}
          autoCapitalize="none"
        />

        <FormField
          label={t("productForm.notesEn")}
          value={notesEn}
          onChangeText={setNotesEn}
          placeholder={t("productForm.notesEnPlaceholder")}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("productForm.notesAr")}
          value={notesAr}
          onChangeText={setNotesAr}
          placeholder={t("productForm.notesArPlaceholder")}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <TouchableOpacity
          style={[gs.containerRow, { marginBottom: 24 }]}
          onPress={() => setIsActive(!isActive)}
        >
          <Ionicons
            name={isActive ? "checkbox" : "square-outline"}
            size={22}
            color={isActive ? plate.green : plate.graySecond}
          />
          <Text style={[gs.text, { marginLeft: 8 }]}>{t("productForm.activeLabel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? t("productForm.savingButton") : t("productForm.saveButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
