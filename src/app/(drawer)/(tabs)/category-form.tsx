import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CategoryFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const isEditing = !!id;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading: loadingData } = useApiQuery<any>({
    url: `categories/${id}`,
    queryKey: queryKeys.categories.detail(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (data?.data) {
      setNameEn(data.data.nameEn ?? data.data.name ?? "");
      setNameAr(data.data.nameAr ?? "");
      setDescriptionEn(data.data.descriptionEn ?? data.data.description ?? "");
      setDescriptionAr(data.data.descriptionAr ?? "");
    }
  }, [data]);

  const createMutation = useApiMutation<any, any>({
    method: "post", url: "categories",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("categoryForm.created")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `categories/${id}`,
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("categoryForm.updated")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = t("categoryForm.validationNameEnRequired");
    else if (nameEn.trim().length < 2) e.nameEn = t("categoryForm.validationNameEnMinLength");
    if (!nameAr.trim()) e.nameAr = t("categoryForm.validationNameArRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { nameEn: nameEn.trim(), nameAr: nameAr.trim(), descriptionEn: descriptionEn.trim(), descriptionAr: descriptionAr.trim() };
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
        <Text style={[gs.h3, { marginLeft: 12 }]}>{isEditing ? t("categoryForm.editTitle") : t("categoryForm.newTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title={t("categoryForm.categoryInfo")} />

        <FormField label={t("categoryForm.nameEn")} value={nameEn} onChangeText={setNameEn} placeholder={t("categoryForm.nameEnPlaceholder")} required error={errors.nameEn} />

        <FormField label={t("categoryForm.nameAr")} value={nameAr} onChangeText={setNameAr} placeholder={t("categoryForm.nameArPlaceholder")} required error={errors.nameAr} />

        <FormField
          label={t("categoryForm.descEn")} value={descriptionEn} onChangeText={setDescriptionEn}
          placeholder={t("categoryForm.descEnPlaceholder")}
          multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("categoryForm.descAr")} value={descriptionAr} onChangeText={setDescriptionAr}
          placeholder={t("categoryForm.descArPlaceholder")}
          multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <TouchableOpacity style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isLoading}>
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? t("categoryForm.savingButton") : t("categoryForm.saveButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
