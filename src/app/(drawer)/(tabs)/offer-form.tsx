import { getApiClient, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { uploadFiles, UPLOAD_CANCELLED } from "@/utils/uploadFile";
import FormField from "@/components/FormField";
import ImageField from "@/components/ImageField";
import LoadingScreen from "@/components/LoadingScreen";
import PickerSelect from "@/components/PickerSelect";
import SectionHeader from "@/components/SectionHeader";
import UploadProgressModal from "@/components/UploadProgressModal";
import { useGlobalStyles } from "@/styles/global";
import { localizedName } from "@/utils/localizedName";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ProductForm {
  nameEn: string; nameAr: string; price: string; stock: string;
  descriptionEn: string; descriptionAr: string;
  images: string[]; tagsEn: string; tagsAr: string;
  aliasesEn: string; aliasesAr: string; notesEn: string; notesAr: string;
}

const emptyProduct = (): ProductForm => ({
  nameEn: "", nameAr: "", price: "", stock: "0",
  descriptionEn: "", descriptionAr: "",
  images: [], tagsEn: "", tagsAr: "", aliasesEn: "", aliasesAr: "", notesEn: "", notesAr: "",
});

export default function OfferFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const isEditing = !!id;
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const pendingFormDataRef = useRef<FormData | null>(null);

  const runUpload = useCallback(async (formData: FormData) => {
    setUploadProgress(0);
    setUploadError(null);
    setUploading(true);
    pendingFormDataRef.current = formData;
    const { promise, abort } = uploadFiles(formData, setUploadProgress);
    abortRef.current = abort;
    try {
      const filenames = await promise;
      return filenames;
    } catch (err: any) {
      if (err?.message !== UPLOAD_CANCELLED) {
        setUploadError(err?.message ?? t("common.uploadError"));
      }
      return null;
    }
  }, [t]);

  const retryUpload = useCallback(() => {
    if (pendingFormDataRef.current) {
      const formData = pendingFormDataRef.current;
      runUpload(formData).then((filenames) => {
        if (filenames) {
          setUploading(false);
          setUploadProgress(0);
          abortRef.current = null;
          pendingFormDataRef.current = null;
        }
      });
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

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [products, setProducts] = useState<ProductForm[]>([emptyProduct()]);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(0);

  const [totalQuantity, setTotalQuantity] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [unitSellPrice, setUnitSellPrice] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [saving, setSaving] = useState(false);

  const firstProduct = products[0];

  // Auto-fill offer details from the first product's fields
  useEffect(() => {
    if (!firstProduct) return;
    if (firstProduct.stock && !isEditing) setTotalQuantity(firstProduct.stock);
    if (firstProduct.price && !isEditing) setUnitSellPrice(firstProduct.price);
  }, [firstProduct, isEditing]);

  const { data: brandsData } = useApiQuery<any>({
    url: "brands", queryKey: ["api", "brands", "list", "all"], params: { limit: 200 },
  });
  const { data: categoriesData } = useApiQuery<any>({
    url: "categories", queryKey: ["api", "categories", "list", "all"], params: { limit: 200 },
  });

  const brandOptions = ((brandsData as any)?.data ?? []).map((b: any) => ({
    label: localizedName(b, i18n.language), value: b._id,
  }));
  const categoryOptions = ((categoriesData as any)?.data ?? []).map((c: any) => ({
    label: localizedName(c, i18n.language), value: c._id,
  }));

  const { data: offerData, isLoading: loadingOffer } = useApiQuery<any>({
    url: `offers/admin/${id}`,
    queryKey: ["api", "offers", "admin", "detail", id!],
    enabled: isEditing,
  });

  useEffect(() => {
    if (offerData?.data) {
      const o = offerData.data;
      const c = o.container || {};
      setNameEn(c.nameEn ?? "");
      setNameAr(c.nameAr ?? "");
      setBrandId(c.brand?._id ?? c.brand ?? "");
      setCategoryIds((c.categories ?? []).map((cat: any) => cat._id ?? cat));
      setIsActive(c.isActive ?? true);
      setTotalQuantity(String(o.totalQuantity ?? ""));
      setOfferPrice(String(o.offerPrice ?? ""));
      setUnitSellPrice(String(o.unitSellPrice ?? ""));
      setCommissionPercent(String(o.commissionPercent ?? ""));
    }
  }, [offerData]);

  const handleAddImage = useCallback(async (productIndex: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("common.permissionRequired")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop() || "image.jpg";
    const formData = new FormData();
    formData.append("images", { uri: localUri, name: filename, type: "image/jpeg" } as any);
    const filenames = await runUpload(formData);
    if (filenames) {
      setProducts((prev) => {
        const next = [...prev];
        next[productIndex] = { ...next[productIndex], images: [...next[productIndex].images, ...filenames] };
        return next;
      });
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
      pendingFormDataRef.current = null;
    }
  }, [t, runUpload]);

  const updateProduct = (index: number, field: keyof ProductForm, value: any) => {
    setProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, emptyProduct()]);
    setExpandedProduct(products.length);
  };

  const removeProduct = (index: number) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((_, i) => i !== index));
    setExpandedProduct((prev) => (prev === index ? null : prev));
  };

  const toggleCategory = (catId: string) => {
    setCategoryIds((prev) => (prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]));
  };

  const handleSave = async () => {
    if (uploading) {
      Alert.alert("", "Please wait, images are still uploading");
      return;
    }
    if (!brandId || !nameEn.trim() || !nameAr.trim()) {
      Alert.alert("", t("offer.validationContainerRequired")); return;
    }
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.nameEn.trim() || !p.price || isNaN(Number(p.price)) || Number(p.price) <= 0) {
        Alert.alert("", t("offer.validationProductRequired", { index: i + 1 })); return;
      }
    }
    if (!totalQuantity || Number(totalQuantity) < 1 || !offerPrice || Number(offerPrice) <= 0 || !unitSellPrice || Number(unitSellPrice) <= 0 || !commissionPercent || Number(commissionPercent) < 0) {
      Alert.alert("", t("offer.validationRequired")); return;
    }

    setSaving(true);
    try {
      const client = getApiClient();
      let containerId: string;

      if (isEditing && offerData?.data?.container?._id) {
        containerId = offerData.data.container._id;
        await client.put(`containers/${containerId}`, {
          nameEn: nameEn.trim(), nameAr: nameAr.trim(),
          brand: brandId, categories: categoryIds, isActive,
        });
      } else {
        const containerRes = await client.post("containers", {
          nameEn: nameEn.trim(), nameAr: nameAr.trim(),
          brand: brandId, categories: categoryIds, isActive,
        });
        containerId = containerRes.data?.data?._id;
        if (!containerId) throw new Error("Failed to create container");
      }

      let productIds: string[] = [];
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (isEditing && i === 0 && offerData?.data?.product?._id) {
          await client.put(`products/${offerData.data.product._id}`, {
            nameEn: p.nameEn.trim(), nameAr: p.nameAr.trim(),
            descriptionEn: p.descriptionEn.trim(), descriptionAr: p.descriptionAr.trim(),
            price: Number(p.price), stock: Number(p.stock) || 0,
            currency: "syp", isActive: false,
            container: containerId, images: p.images,
            tagsEn: p.tagsEn.split(",").map((x: string) => x.trim()).filter(Boolean),
            tagsAr: p.tagsAr.split(",").map((x: string) => x.trim()).filter(Boolean),
            aliasesEn: p.aliasesEn.split(",").map((x: string) => x.trim()).filter(Boolean),
            aliasesAr: p.aliasesAr.split(",").map((x: string) => x.trim()).filter(Boolean),
            notesEn: p.notesEn.split("\n").map((x: string) => x.trim()).filter(Boolean),
            notesAr: p.notesAr.split("\n").map((x: string) => x.trim()).filter(Boolean),
          });
          productIds.push(offerData.data.product._id);
        } else {
          const prodRes = await client.post("products", {
            nameEn: p.nameEn.trim(), nameAr: p.nameAr.trim(),
            descriptionEn: p.descriptionEn.trim(), descriptionAr: p.descriptionAr.trim(),
            price: Number(p.price), stock: Number(p.stock) || 0,
            currency: "syp", isActive: false,
            container: containerId, images: p.images,
            tagsEn: p.tagsEn.split(",").map((x: string) => x.trim()).filter(Boolean),
            tagsAr: p.tagsAr.split(",").map((x: string) => x.trim()).filter(Boolean),
            aliasesEn: p.aliasesEn.split(",").map((x: string) => x.trim()).filter(Boolean),
            aliasesAr: p.aliasesAr.split(",").map((x: string) => x.trim()).filter(Boolean),
            notesEn: p.notesEn.split("\n").map((x: string) => x.trim()).filter(Boolean),
            notesAr: p.notesAr.split("\n").map((x: string) => x.trim()).filter(Boolean),
          });
          const pid = prodRes.data?.data?._id;
          if (pid) productIds.push(pid);
        }
      }

      const body = {
        container: containerId,
        product: productIds[0],
        totalQuantity: Number(totalQuantity),
        offerPrice: Number(offerPrice),
        unitSellPrice: Number(unitSellPrice),
        commissionPercent: Number(commissionPercent),
      };

      if (isEditing) {
        await client.put(`offers/admin/${id}`, body);
        Alert.alert("", t("offer.updated"));
      } else {
        await client.post("offers/admin", body);
        Alert.alert("", t("offer.created"));
      }
      router.back();
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingOffer) return <LoadingScreen />;

  const renderStepIndicator = () => (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 20 }}>
      {[t("offer.containerStepTitle"), t("offer.productStepTitle"), t("offer.offerStepTitle")].map((label, i) => (
        <TouchableOpacity
          key={i}
          style={[gs.tag, { backgroundColor: step === i ? plate.primary : plate.gray, flex: 1, alignItems: "center" }]}
          onPress={() => step > i && setStep(i)}
        >
          <Text style={[gs.tagText, { color: step === i ? plate.background : plate.text, fontWeight: "600", fontSize: 12 }]}>
            {i + 1}. {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStepNav = (canNext: boolean, nextLabel?: string) => (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 32 }}>
      {step > 0 && (
        <TouchableOpacity style={[gs.button, { flex: 1, backgroundColor: plate.gray }]} onPress={() => setStep(step - 1)}>
          <Text style={[gs.buttonText, { color: plate.text }]}>{t("offer.prevStep")}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[gs.button, { flex: 1, opacity: canNext ? 1 : 0.5 }]}
        onPress={() => canNext && setStep(step + 1)}
        disabled={!canNext}
      >
        <Text style={gs.buttonText}>{nextLabel || t("offer.nextStep")}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{isEditing ? t("offer.formEditTitle") : t("offer.formNewTitle")}</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {step === 0 && (
          <>
            <SectionHeader title={t("offer.containerStepTitle")} />
            <FormField label={t("containerForm.nameEn")} value={nameEn} onChangeText={setNameEn} placeholder={t("containerForm.nameEnPlaceholder")} required />
            <FormField label={t("containerForm.nameAr")} value={nameAr} onChangeText={setNameAr} placeholder={t("containerForm.nameArPlaceholder")} required />
            <PickerSelect label={t("containerForm.brand")} options={brandOptions} selected={brandId} onSelect={setBrandId} required placeholder={t("containerForm.brandPlaceholder")} />
            <View style={{ marginBottom: 16 }}>
              <Text style={[gs.label, { marginBottom: 6 }]}>{t("containerForm.categories")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categoryOptions.map((opt: { label: string; value: string }) => (
                  <TouchableOpacity key={opt.value} style={[gs.tag, { backgroundColor: categoryIds.includes(opt.value) ? plate.primary : plate.gray }]} onPress={() => toggleCategory(opt.value)}>
                    <Text style={[gs.tagText, { color: categoryIds.includes(opt.value) ? plate.background : plate.text }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[gs.containerRow, { marginBottom: 24 }]} onPress={() => setIsActive(!isActive)}>
              <Ionicons name={isActive ? "checkbox" : "square-outline"} size={22} color={isActive ? plate.green : plate.graySecond} />
              <Text style={[gs.text, { marginLeft: 8 }]}>{t("containerForm.activeLabel")}</Text>
            </TouchableOpacity>
            {renderStepNav(!!brandId && !!nameEn.trim() && !!nameAr.trim())}
          </>
        )}

        {step === 1 && (
          <>
            <View style={[gs.containerRow, { justifyContent: "space-between", marginBottom: 12 }]}>
              <SectionHeader title={t("offer.productStepTitle")} />
              <TouchableOpacity style={[gs.buttonSmall, { paddingHorizontal: 12 }]} onPress={addProduct}>
                <Ionicons name="add" size={18} color={plate.background} />
                <Text style={[gs.buttonText, { marginLeft: 4 }]}>{t("offer.addProduct")}</Text>
              </TouchableOpacity>
            </View>
            {products.map((p, i) => (
              <View key={i} style={[gs.card, { padding: 12, marginBottom: 12 }]}>
                <TouchableOpacity style={[gs.containerRow, { justifyContent: "space-between" }]} onPress={() => setExpandedProduct(expandedProduct === i ? null : i)}>
                  <Text style={[gs.label, { flex: 1 }]} numberOfLines={1}>
                    {p.nameEn || `${t("offer.productLabel")} ${i + 1}`}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Ionicons name={expandedProduct === i ? "chevron-up" : "chevron-down"} size={18} color={plate.textSecond} />
                    {products.length > 1 && (
                      <TouchableOpacity onPress={() => removeProduct(i)}>
                        <Ionicons name="trash-outline" size={18} color={plate.red} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
                {expandedProduct === i && (
                  <View style={{ marginTop: 12 }}>
                    <FormField label={t("productForm.nameEn")} value={p.nameEn} onChangeText={(v) => updateProduct(i, "nameEn", v)} placeholder={t("productForm.nameEnPlaceholder")} required />
                    <FormField label={t("productForm.nameAr")} value={p.nameAr} onChangeText={(v) => updateProduct(i, "nameAr", v)} placeholder={t("productForm.nameArPlaceholder")} required />
                    <FormField label={t("productForm.descEn")} value={p.descriptionEn} onChangeText={(v) => updateProduct(i, "descriptionEn", v)} placeholder={t("productForm.descEnPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
                    <FormField label={t("productForm.descAr")} value={p.descriptionAr} onChangeText={(v) => updateProduct(i, "descriptionAr", v)} placeholder={t("productForm.descArPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <FormField label={t("productForm.price")} value={p.price} onChangeText={(v) => updateProduct(i, "price", v)} placeholder={t("productForm.pricePlaceholder")} keyboardType="decimal-pad" required />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormField label={t("productForm.stock")} value={p.stock} onChangeText={(v) => updateProduct(i, "stock", v)} placeholder={t("productForm.stockPlaceholder")} keyboardType="number-pad" />
                      </View>
                    </View>
                    <ImageField images={p.images} label={t("productForm.images")} onAdd={() => handleAddImage(i)} onRemove={(idx) => setProducts((prev) => { const next = [...prev]; next[i] = { ...next[i], images: next[i].images.filter((_, fi) => fi !== idx) }; return next; })} />
                    <FormField label={t("productForm.tagsEn")} value={p.tagsEn} onChangeText={(v) => updateProduct(i, "tagsEn", v)} placeholder={t("productForm.tagsEnPlaceholder")} />
                    <FormField label={t("productForm.tagsAr")} value={p.tagsAr} onChangeText={(v) => updateProduct(i, "tagsAr", v)} placeholder={t("productForm.tagsArPlaceholder")} />
                    <FormField label={t("productForm.aliasesEn")} value={p.aliasesEn} onChangeText={(v) => updateProduct(i, "aliasesEn", v)} placeholder={t("productForm.aliasesEnPlaceholder")} />
                    <FormField label={t("productForm.aliasesAr")} value={p.aliasesAr} onChangeText={(v) => updateProduct(i, "aliasesAr", v)} placeholder={t("productForm.aliasesArPlaceholder")} />
                    <FormField label={t("productForm.notesEn")} value={p.notesEn} onChangeText={(v) => updateProduct(i, "notesEn", v)} placeholder={t("productForm.notesEnPlaceholder")} multiline numberOfLines={2} style={{ minHeight: 50, textAlignVertical: "top", paddingTop: 12 }} />
                    <FormField label={t("productForm.notesAr")} value={p.notesAr} onChangeText={(v) => updateProduct(i, "notesAr", v)} placeholder={t("productForm.notesArPlaceholder")} multiline numberOfLines={2} style={{ minHeight: 50, textAlignVertical: "top", paddingTop: 12 }} />
                  </View>
                )}
              </View>
            ))}
            {renderStepNav(products.some((p) => p.nameEn.trim() && p.price && Number(p.price) > 0))}
          </>
        )}

        {step === 2 && (
          <>
            <SectionHeader title={t("offer.offerStepTitle")} />
            <FormField label={t("offer.totalQuantity")} placeholder={t("offer.totalQuantityPlaceholder")} keyboardType="numeric" value={totalQuantity} onChangeText={setTotalQuantity} required />
            <FormField label={t("offer.offerPrice")} placeholder={t("offer.offerPricePlaceholder")} keyboardType="decimal-pad" value={offerPrice} onChangeText={setOfferPrice} required />
            <FormField label={t("offer.unitSellPrice")} placeholder={t("offer.unitSellPricePlaceholder")} keyboardType="decimal-pad" value={unitSellPrice} onChangeText={setUnitSellPrice} required />
            <FormField label={t("offer.commissionPercent")} placeholder={t("offer.commissionPercentPlaceholder")} keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} required />

            {step > 0 && (
              <TouchableOpacity style={[gs.button, { marginTop: 8, backgroundColor: plate.gray }]} onPress={() => setStep(step - 1)}>
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("offer.prevStep")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[gs.button, { marginTop: 8 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={gs.buttonText}>{saving ? t("common.loading") : t("offer.saveButton")}</Text>
            </TouchableOpacity>
          </>
        )}
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
