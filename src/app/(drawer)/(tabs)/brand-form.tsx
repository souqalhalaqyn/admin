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

export default function BrandFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const isEditing = !!id;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [logo, setLogo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading: loadingData } = useApiQuery<any>({
    url: `brands/${id}`,
    queryKey: queryKeys.brands.detail(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (data?.data) {
      const b = data.data;
      setNameEn(b.nameEn ?? b.name ?? "");
      setNameAr(b.nameAr ?? "");
      setDescriptionEn(b.descriptionEn ?? b.description ?? "");
      setDescriptionAr(b.descriptionAr ?? "");
      setLogo(b.logo ?? "");
      setIsActive(b.isActive ?? true);
    }
  }, [data]);

  const createMutation = useApiMutation<any, any>({
    method: "post",
    url: "brands",
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("brandForm.created")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put",
    url: `brands/${id}`,
    options: {
      onSuccess: () => { Alert.alert(t("common.success"), t("brandForm.updated")); router.back(); },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = t("brandForm.validationNameEnRequired");
    else if (nameEn.trim().length < 2) e.nameEn = t("brandForm.validationNameEnMinLength");
    if (!nameAr.trim()) e.nameAr = t("brandForm.validationNameArRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: descriptionEn.trim(),
      descriptionAr: descriptionAr.trim(),
      logo: logo.trim(),
      isActive,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = loadingData || createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingData) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView style={gs.safeArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{isEditing ? t("brandForm.editTitle") : t("brandForm.newTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title={t("brandForm.brandInfo")} />

        <FormField
          label={t("brandForm.nameEn")}
          value={nameEn}
          onChangeText={setNameEn}
          placeholder={t("brandForm.nameEnPlaceholder")}
          required
          error={errors.nameEn}
        />

        <FormField
          label={t("brandForm.nameAr")}
          value={nameAr}
          onChangeText={setNameAr}
          placeholder={t("brandForm.nameArPlaceholder")}
          required
          error={errors.nameAr}
        />

        <FormField
          label={t("brandForm.descEn")}
          value={descriptionEn}
          onChangeText={setDescriptionEn}
          placeholder={t("brandForm.descEnPlaceholder")}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("brandForm.descAr")}
          value={descriptionAr}
          onChangeText={setDescriptionAr}
          placeholder={t("brandForm.descArPlaceholder")}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label={t("brandForm.logoUrl")}
          value={logo}
          onChangeText={setLogo}
          placeholder={t("brandForm.logoUrlPlaceholder")}
          autoCapitalize="none"
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
          <Text style={[gs.text, { marginLeft: 8 }]}>{t("brandForm.activeLabel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? t("brandForm.savingButton") : t("brandForm.saveButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
