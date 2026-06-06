import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CategoryFormScreen() {
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
      onSuccess: () => { Alert.alert("Success", "Category created"); router.back(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `categories/${id}`,
    options: {
      onSuccess: () => { Alert.alert("Success", "Category updated"); router.back(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = "Name (English) is required";
    else if (nameEn.trim().length < 2) e.nameEn = "Name must be at least 2 characters";
    if (!nameAr.trim()) e.nameAr = "Name (Arabic) is required";
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
        <Text style={[gs.h3, { marginLeft: 12 }]}>{isEditing ? "Edit Category" : "New Category"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title="Category Information" />

        <FormField label="Name (English)" value={nameEn} onChangeText={setNameEn} placeholder="Category name" required error={errors.nameEn} />

        <FormField label="Name (Arabic)" value={nameAr} onChangeText={setNameAr} placeholder="اسم الفئة" required error={errors.nameAr} />

        <FormField
          label="Description (English)" value={descriptionEn} onChangeText={setDescriptionEn}
          placeholder="Category description (optional)"
          multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label="Description (Arabic)" value={descriptionAr} onChangeText={setDescriptionAr}
          placeholder="وصف الفئة"
          multiline numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <TouchableOpacity style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isLoading}>
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? "Saving..." : "Save Category"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
