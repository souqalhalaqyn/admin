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
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
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
      Alert.alert("Permission required", "Camera roll permission is needed to add images");
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
      Alert.alert("Upload Error", getErrorMessage(err));
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
      onSuccess: () => { Alert.alert("Success", "Product created"); router.back(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const updateMutation = useApiMutation<any, any>({
    method: "put", url: `products/${id}`,
    options: {
      onSuccess: () => { Alert.alert("Success", "Product updated"); router.back(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameEn.trim()) e.nameEn = "Name (English) is required";
    if (!nameAr.trim()) e.nameAr = "Name (Arabic) is required";
    if (!shortDescriptionEn.trim()) e.shortDescriptionEn = "Short description (English) is required";
    if (!shortDescriptionAr.trim()) e.shortDescriptionAr = "Short description (Arabic) is required";
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = "Valid price is required";
    if (!containerId) e.containerId = "Container is required";
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
        <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{isEditing ? "Edit Product" : "New Product"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, backgroundColor: plate.background }} keyboardShouldPersistTaps="handled">
        <SectionHeader title="Basic Information" subtitle="Name, description, and pricing" />

        <FormField
          label="Name (English)"
          value={nameEn}
          onChangeText={setNameEn}
          placeholder="e.g. Hair Dryer Pro"
          required
          error={errors.nameEn}
        />

        <FormField
          label="Name (Arabic)"
          value={nameAr}
          onChangeText={setNameAr}
          placeholder="اسم المنتج"
          required
          error={errors.nameAr}
        />

        <FormField
          label="Short Description (English)"
          value={shortDescriptionEn}
          onChangeText={setShortDescriptionEn}
          placeholder="Brief description (max 150 chars)"
          required
          maxLength={150}
          error={errors.shortDescriptionEn}
        />

        <FormField
          label="Short Description (Arabic)"
          value={shortDescriptionAr}
          onChangeText={setShortDescriptionAr}
          placeholder="وصف مختصر"
          required
          error={errors.shortDescriptionAr}
        />

        <FormField
          label="Long Description (English)"
          value={longDescriptionEn}
          onChangeText={setLongDescriptionEn}
          placeholder="Detailed description (optional)"
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label="Long Description (Arabic)"
          value={longDescriptionAr}
          onChangeText={setLongDescriptionAr}
          placeholder="وصف مفصل"
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              required
              error={errors.price}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Stock"
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <PickerSelect
          label="Container"
          options={containerOptions}
          selected={containerId}
          onSelect={setContainerId}
          required
          error={errors.containerId}
          placeholder="Select a container"
        />

        <View style={gs.dividerFull} />
        <SectionHeader title="Media" subtitle="Product images" />

        <ImageField
          images={images}
          label="Images"
          onAdd={handleAddImage}
          onRemove={(i) => setImages(images.filter((_, idx) => idx !== i))}
        />

        <View style={gs.dividerFull} />
        <SectionHeader title="Additional Info" subtitle="Tags, aliases, and notes" />

        <FormField
          label="Tags (English)"
          value={tagsEn}
          onChangeText={setTagsEn}
          placeholder="Comma-separated: tag1, tag2, tag3"
          autoCapitalize="none"
        />

        <FormField
          label="Tags (Arabic)"
          value={tagsAr}
          onChangeText={setTagsAr}
          placeholder="وسوم مفصولة بفواصل"
          autoCapitalize="none"
        />

        <FormField
          label="Aliases (English)"
          value={aliasesEn}
          onChangeText={setAliasesEn}
          placeholder="Comma-separated alternate names"
          autoCapitalize="none"
        />

        <FormField
          label="Aliases (Arabic)"
          value={aliasesAr}
          onChangeText={setAliasesAr}
          placeholder="أسماء بديلة"
          autoCapitalize="none"
        />

        <FormField
          label="Notes (English)"
          value={notesEn}
          onChangeText={setNotesEn}
          placeholder="One note per line"
          multiline
          numberOfLines={3}
          style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }}
        />

        <FormField
          label="Notes (Arabic)"
          value={notesAr}
          onChangeText={setNotesAr}
          placeholder="ملاحظات"
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
          <Text style={[gs.text, { marginLeft: 8 }]}>Active (visible in store)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[gs.button, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{isLoading ? "Saving..." : "Save Product"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
