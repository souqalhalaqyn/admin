import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import PickerSelect from "@/components/PickerSelect";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ContainerFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const isEditing = !!id;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [shortDescriptionAr, setShortDescriptionAr] = useState("");
  const [longDescriptionEn, setLongDescriptionEn] = useState("");
  const [longDescriptionAr, setLongDescriptionAr] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading: loadingData } = useApiQuery<any>({
    url: `containers/${id}`,
    queryKey: queryKeys.containers.detail(id!),
    enabled: isEditing,
  });

  const { data: brandsData } = useApiQuery<any>({
    url: "brands", queryKey: queryKeys.brands.list({ limit: "200" }), params: { limit: 200 },
  });
  const { data: categoriesData } = useApiQuery<any>({
    url: "categories", queryKey: queryKeys.categories.list({ limit: "200" }), params: { limit: 200 },
  });

  const brandOptions = ((brandsData as any)?.data ?? []).map((b: any) => ({ label: b.nameEn ?? b.name, value: b._id }));
  const categoryOptions = ((categoriesData as any)?.data ?? []).map((c: any) => ({ label: c.nameEn ?? c.name, value: c._id }));

  useEffect(() => {
    if (data?.data) {
      const c = data.data;
      setNameEn(c.nameEn ?? c.name ?? "");
      setNameAr(c.nameAr ?? "");
      setShortDescriptionEn(c.shortDescriptionEn ?? c.shortDescription ?? "");
      setShortDescriptionAr(c.shortDescriptionAr ?? "");
      setLongDescriptionEn(c.longDescriptionEn ?? c.longDescription ?? "");
      setLongDescriptionAr(c.longDescriptionAr ?? "");
      setBrandId(c.brand?._id ?? c.brand ?? "");
      setCategoryIds((c.categories ?? []).map((cat: any) => cat._id ?? cat));
      setIsActive(c.isActive ?? true);
    }
  }, [data]);

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "containers",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("containerForm.created")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `containers/${id}`,
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("containerForm.updated")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const toggleCategory = (catId: string) => {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = t("containerForm.validationNameEnRequired");
    if (!nameAr.trim()) e.nameAr = t("containerForm.validationNameArRequired");
    if (!brandId) e.brandId = t("containerForm.validationBrandRequired");
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
      brand: brandId,
      categories: categoryIds,
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
        <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{isEditing ? t("containerForm.editTitle") : t("containerForm.newTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title={t("containerForm.containerInfo")} />

        <FormField label={t("containerForm.nameEn")} value={nameEn} onChangeText={setNameEn} placeholder={t("containerForm.nameEnPlaceholder")} required error={errors.nameEn} />
        <FormField label={t("containerForm.nameAr")} value={nameAr} onChangeText={setNameAr} placeholder={t("containerForm.nameArPlaceholder")} required error={errors.nameAr} />
        <FormField label={t("containerForm.shortDescEn")} value={shortDescriptionEn} onChangeText={setShortDescriptionEn} placeholder={t("containerForm.shortDescEnPlaceholder")} />
        <FormField label={t("containerForm.shortDescAr")} value={shortDescriptionAr} onChangeText={setShortDescriptionAr} placeholder={t("containerForm.shortDescArPlaceholder")} />
        <FormField
          label={t("containerForm.longDescEn")} value={longDescriptionEn} onChangeText={setLongDescriptionEn}
          placeholder={t("containerForm.longDescEnPlaceholder")} multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />
        <FormField
          label={t("containerForm.longDescAr")} value={longDescriptionAr} onChangeText={setLongDescriptionAr}
          placeholder={t("containerForm.longDescArPlaceholder")} multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <PickerSelect label={t("containerForm.brand")} options={brandOptions} selected={brandId} onSelect={setBrandId} required error={errors.brandId} placeholder={t("containerForm.brandPlaceholder")} />

        <View style={{ marginBottom: 16 }}>
          <Text style={[gs.label, { marginBottom: 6 }]}>{t("containerForm.categories")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categoryOptions.map((opt: { label: string; value: string }) => (
              <TouchableOpacity
                key={opt.value}
                style={[gs.tag, { backgroundColor: categoryIds.includes(opt.value) ? plate.primary : plate.gray }]}
                onPress={() => toggleCategory(opt.value)}
              >
                <Text style={[gs.tagText, { color: categoryIds.includes(opt.value) ? plate.background : plate.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[gs.containerRow, { marginBottom: 24 }]} onPress={() => setIsActive(!isActive)}>
          <Ionicons name={isActive ? "checkbox" : "square-outline"} size={22} color={isActive ? plate.green : plate.graySecond} />
          <Text style={[gs.text, { marginLeft: 8 }]}>{t("containerForm.activeLabel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isLoading}>
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? t("containerForm.savingButton") : t("containerForm.saveButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
