import { getApiClient, useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { uploadFiles } from "@/utils/uploadFile";
import FormField from "@/components/FormField";
import HSLColorPicker from "@/components/HSLColorPicker";
import ImageField from "@/components/ImageField";
import LoadingScreen from "@/components/LoadingScreen";
import PickerSelect from "@/components/PickerSelect";
import SectionHeader from "@/components/SectionHeader";
import UploadProgressModal from "@/components/UploadProgressModal";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const isEditing = !!id;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [containerId, setContainerId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tagsEn, setTagsEn] = useState("");
  const [tagsAr, setTagsAr] = useState("");
  const [aliasesEn, setAliasesEn] = useState("");
  const [aliasesAr, setAliasesAr] = useState("");
  const [colors, setColors] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [notesEn, setNotesEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const pendingFormDataRef = useRef<FormData | null>(null);

  const runUpload = useCallback(async (formData: FormData) => {
    setUploadProgress(0);
    setUploadError(null);
    setUploading(true);
    pendingFormDataRef.current = formData;
    try {
      const { filenames, abort } = await uploadFiles(formData, setUploadProgress);
      abortRef.current = abort;
      setImages((prev) => [...prev, ...filenames]);
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
      pendingFormDataRef.current = null;
    } catch (err: any) {
      setUploadError(err?.message ?? t("common.uploadError"));
    }
  }, [t]);

  const retryUpload = useCallback(() => {
    if (pendingFormDataRef.current) {
      runUpload(pendingFormDataRef.current);
    }
  }, [runUpload]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.();
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    abortRef.current = null;
    pendingFormDataRef.current = null;
  }, []);

  useEffect(() => {
    return () => abortRef.current?.();
  }, []);

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

    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop() || "image.jpg";
    const formData = new FormData();
    formData.append("images", {
      uri: localUri,
      name: filename,
      type: "image/jpeg",
    } as any);

    runUpload(formData);
  };

  const handleAddVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("common.permissionRequired"), t("productForm.permissionMessage"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop() || "video.mp4";
    const formData = new FormData();
    formData.append("images", {
      uri: localUri,
      name: filename,
      type: "video/mp4",
    } as any);

    runUpload(formData);
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
      setDescriptionEn(p.descriptionEn ?? p.description ?? "");
      setDescriptionAr(p.descriptionAr ?? "");
      setPrice(String(p.price ?? ""));
      setStock(String(p.stock ?? "0"));
      setContainerId(p.container?._id ?? p.container ?? "");
      setImages(p.images ?? []);
      setTagsEn((p.tagsEn ?? p.tags ?? []).join(", "));
      setTagsAr((p.tagsAr ?? []).join(", "));
      setAliasesEn((p.aliasesEn ?? p.aliases ?? []).join(", "));
      setAliasesAr((p.aliasesAr ?? []).join(", "));
      const rawNotesEn = p.notesEn ?? p.notes ?? [];
      const rawNotesAr = p.notesAr ?? [];
      const colorsEntry = rawNotesEn.find((n: string) => n.startsWith("colors:"));
      if (colorsEntry) {
        setColors(colorsEntry.replace("colors:", "").split(",").join(" "));
      }
      setNotesEn(rawNotesEn.filter((n: string) => !n.startsWith("colors:")).join("\n"));
      setNotesAr(rawNotesAr.filter((n: string) => !n.startsWith("colors:")).join("\n"));
      setIsActive(p.isActive ?? true);
    }
  }, [data]);

  const queryClient = useQueryClient();

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "products",
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        Alert.alert(t("common.success"), t("productForm.created"));
        router.back();
      },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `products/${id}`,
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id!) });
        Alert.alert(t("common.success"), t("productForm.updated"));
        router.back();
      },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameAr.trim()) e.nameAr = t("productForm.validationNameArRequired");
    if (!descriptionAr.trim()) e.descriptionAr = t("productForm.validationDescArRequired");
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = t("productForm.validationPriceRequired");
    if (!containerId) e.containerId = t("productForm.validationContainerRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (uploading) {
      Alert.alert("", t("productForm.uploadInProgress") || "Please wait, images are still uploading");
      return;
    }
    if (!validate()) return;
    const payload = {
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: descriptionEn.trim(),
      descriptionAr: descriptionAr.trim(),
      price: Number(price),
      stock: Number(stock) || 0,
      container: containerId,
      images,
      tagsEn: tagsEn.split(",").map((t) => t.trim()).filter(Boolean),
      tagsAr: tagsAr.split(",").map((t) => t.trim()).filter(Boolean),
      aliasesEn: aliasesEn.split(",").map((a) => a.trim()).filter(Boolean),
      aliasesAr: aliasesAr.split(",").map((a) => a.trim()).filter(Boolean),
      notesEn: (() => {
        const parsed = notesEn.split("\n").map((n) => n.trim()).filter(Boolean);
        const colorsTrimmed = colors.trim();
        if (colorsTrimmed) {
          const hexList = colorsTrimmed.split(/\s+/).filter((h) => /^#[0-9a-fA-F]{6}$/.test(h));
          if (hexList.length > 0) parsed.push("colors:" + hexList.join(","));
        }
        return parsed;
      })(),
      notesAr: (() => {
        const parsed = notesAr.split("\n").map((n) => n.trim()).filter(Boolean);
        const colorsTrimmed = colors.trim();
        if (colorsTrimmed) {
          const hexList = colorsTrimmed.split(/\s+/).filter((h) => /^#[0-9a-fA-F]{6}$/.test(h));
          if (hexList.length > 0) parsed.push("colors:" + hexList.join(","));
        }
        return parsed;
      })(),
      isActive,
    };
    if (isEditing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isLoading = loadingData || createMutation.isPending || updateMutation.isPending;
  if (isEditing && loadingData) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={gs.safeArea} behavior="padding">
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
          label={t("productForm.descEn")}
          value={descriptionEn}
          onChangeText={setDescriptionEn}
          placeholder={t("productForm.descEnPlaceholder")}
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("productForm.descAr")}
          value={descriptionAr}
          onChangeText={setDescriptionAr}
          placeholder={t("productForm.descArPlaceholder")}
          required
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
          error={errors.descriptionAr}
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
          onAddVideo={handleAddVideo}
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

        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <FormField
              label={t("productForm.colors")}
              value={colors}
              onChangeText={setColors}
              placeholder={t("productForm.colorsPlaceholder")}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowColorPicker(true)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: plate.primary, justifyContent: "center", alignItems: "center",
              marginTop: 28, marginLeft: 8,
            }}
          >
            <Ionicons name="color-palette-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {colors.trim() ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {colors.trim().split(/\s+/).map((hex, i) => {
              const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
              return (
                <View
                  key={i}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: valid ? hex : plate.gray,
                    borderWidth: 1, borderColor: plate.graySecond,
                  }}
                />
              );
            })}
          </View>
        ) : null}

        <HSLColorPicker
          visible={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          onColor={(hex) => {
            const existing = colors.trim().split(/\s+/).filter(Boolean);
            if (!existing.includes(hex)) {
              setColors((existing.length > 0 ? existing.join(" ") + " " : "") + hex);
            }
          }}
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

      <UploadProgressModal
        visible={uploading || !!uploadError}
        progress={uploadProgress}
        error={uploadError}
        onRetry={retryUpload}
        onCancel={cancelUpload}
        onDismiss={() => { setUploadError(null); setUploading(false); setUploadProgress(0); abortRef.current = null; pendingFormDataRef.current = null; }}
      />
    </KeyboardAvoidingView>
  );
}
