import { getApiClient, queryKeys, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import PickerSelect from "@/components/PickerSelect";
import SectionHeader from "@/components/SectionHeader";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ContainerOption {
  _id: string;
  name: string;
}

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  container: string;
}

export default function OfferFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const isEditing = !!id;

  const [containerId, setContainerId] = useState("");
  const [productId, setProductId] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [unitSellPrice, setUnitSellPrice] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: containersData } = useApiQuery<{ data: ContainerOption[] }>({
    url: "containers",
    queryKey: queryKeys.containers.list(),
    params: { limit: 100 },
  });

  const { data: productsData } = useApiQuery<{ data: ProductOption[] }>({
    url: "products",
    queryKey: queryKeys.products.list(),
    params: { limit: 200 },
  });

  const { data: offerData, isLoading: loadingOffer } = useApiQuery<any>({
    url: `offers/admin/${id}`,
    queryKey: ["api", "offers", "admin", "detail", id!],
    enabled: isEditing,
  });

  useEffect(() => {
    if (offerData?.data) {
      const o = offerData.data;
      setContainerId(o.container?._id ?? "");
      setProductId(o.product?._id ?? "");
      setTotalQuantity(String(o.totalQuantity ?? ""));
      setOfferPrice(String(o.offerPrice ?? ""));
      setUnitSellPrice(String(o.unitSellPrice ?? ""));
      setCommissionPercent(String(o.commissionPercent ?? ""));
    }
  }, [offerData]);

  const containerOptions = useMemo(() => {
    return (containersData?.data ?? []).map((c) => ({
      label: c.name,
      value: c._id,
    }));
  }, [containersData]);

  const filteredProducts = useMemo(() => {
    return (productsData?.data ?? []).filter((p) => !containerId || p.container === containerId);
  }, [productsData, containerId]);

  const productOptions = useMemo(() => {
    return filteredProducts.map((p) => ({
      label: `${p.name} ($${p.price?.toFixed(2) ?? "0"})`,
      value: p._id,
    }));
  }, [filteredProducts]);

  const handleSave = async () => {
    if (!containerId || !productId || !totalQuantity || !offerPrice || !unitSellPrice || !commissionPercent) {
      Alert.alert("", t("offer.validationRequired"));
      return;
    }
    setSaving(true);
    try {
      const body = {
        container: containerId,
        product: productId,
        totalQuantity: Number(totalQuantity),
        offerPrice: Number(offerPrice),
        unitSellPrice: Number(unitSellPrice),
        commissionPercent: Number(commissionPercent),
      };
      const client = getApiClient();
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{isEditing ? t("offer.formEditTitle") : t("offer.formNewTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={[gs.container, gs.scrollContent]}>
        <SectionHeader title={t("offer.formTitle")} />

        <PickerSelect
          label={t("offer.container")}
          options={containerOptions}
          selected={containerId}
          onSelect={(val) => { setContainerId(val); setProductId(""); }}
          required
          placeholder={t("offer.containerPlaceholder")}
        />

        <PickerSelect
          label={t("offer.product")}
          options={productOptions}
          selected={productId}
          onSelect={setProductId}
          required
          placeholder={t("offer.productPlaceholder")}
        />

        <FormField
          label={t("offer.totalQuantity")}
          placeholder={t("offer.totalQuantityPlaceholder")}
          keyboardType="numeric"
          value={totalQuantity}
          onChangeText={setTotalQuantity}
          required
        />

        <FormField
          label={t("offer.offerPrice")}
          placeholder={t("offer.offerPricePlaceholder")}
          keyboardType="decimal-pad"
          value={offerPrice}
          onChangeText={setOfferPrice}
          required
        />

        <FormField
          label={t("offer.unitSellPrice")}
          placeholder={t("offer.unitSellPricePlaceholder")}
          keyboardType="decimal-pad"
          value={unitSellPrice}
          onChangeText={setUnitSellPrice}
          required
        />

        <FormField
          label={t("offer.commissionPercent")}
          placeholder={t("offer.commissionPercentPlaceholder")}
          keyboardType="numeric"
          value={commissionPercent}
          onChangeText={setCommissionPercent}
          required
        />

        <TouchableOpacity
          style={[gs.button, { marginTop: 16 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={gs.buttonText}>{saving ? t("common.loading") : t("offer.saveButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
