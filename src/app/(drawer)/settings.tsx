import { getApiClient, useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { changeLanguage, type LanguageCode } from "@/i18n";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { uploadFiles } from "@/utils/uploadFile";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface SliderEntry {
  image: string;
  productId?: string;
  productName?: string;
}

export default function SettingsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { themeType, setThemeType } = useAppTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [sypRate, setSypRate] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [sliderEntries, setSliderEntries] = useState<SliderEntry[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: "admin/settings",
    queryKey: queryKeys.admin.settings(),
  });

  useEffect(() => {
    if (data?.data) {
      setSypRate(String(data.data.sypExchangeRate ?? "15000"));
      setAdPrice(String(data.data.adPrice ?? "0"));
      const entries: SliderEntry[] = (data.data.sliderImages ?? []).map((s: any) =>
        typeof s === "string" ? { image: s } : s,
      );
      setSliderEntries(entries);
    }
  }, [data]);

  const updateSettingsMutation = useApiMutation<any, any>({
    method: "put",
    url: "admin/settings",
    options: {
      onSuccess: () => { Alert.alert("Success", t("settings.saved")); refetch(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      sypExchangeRate: Number(sypRate) || 15000,
      adPrice: Number(adPrice) || 0,
      sliderImages: sliderEntries,
    });
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    await changeLanguage(lang);
  };

  const doProductSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProductResults([]);
      return;
    }
    try {
      const client = getApiClient();
      const res = await client.get("products", { params: { q: query.trim(), limit: 8 } });
      setProductResults(res.data?.data ?? []);
    } catch {
      setProductResults([]);
    }
  }, []);

  const openProductPicker = (index: number) => {
    setPickerIndex(index);
    setProductSearch("");
    setProductResults([]);
  };

  const selectProduct = (product: any) => {
    if (pickerIndex === null) return;
    const name = product.nameEn ?? product.nameAr ?? "";
    const idx = pickerIndex;
    setSliderEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], productId: product._id, productName: name };
      return next;
    });
    closeProductPicker();
  };

  const clearProduct = (index: number) => {
    setSliderEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], productId: undefined, productName: undefined };
      return next;
    });
  };

  const closeProductPicker = () => {
    setPickerIndex(null);
    setProductSearch("");
    setProductResults([]);
  };

  if (isLoading) return <LoadingScreen />;

  const themeLabels: Record<string, string> = {
    system: t("settings.themeOptions.system"),
    light: t("settings.themeOptions.light"),
    dark: t("settings.themeOptions.dark"),
  };

  const currentLang: LanguageCode = i18n.language === "ar" ? "ar" : "en";

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={gs.safeArea} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Text style={[gs.h2, { marginTop: 16, marginBottom: 24 }]}>{t("settings.title")}</Text>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title={t("settings.appearance")} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["system", "light", "dark"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                gs.tag,
                { backgroundColor: themeType === type ? plate.primary : plate.gray, flex: 1, alignItems: "center" },
              ]}
              onPress={() => setThemeType(type)}
            >
              <Ionicons
                name={type === "light" ? "sunny" : type === "dark" ? "moon" : "phone-portrait"}
                size={16}
                color={themeType === type ? plate.background : plate.text}
              />
              <Text style={[gs.tagText, { color: themeType === type ? plate.background : plate.text, marginLeft: 4 }]}>
                {themeLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title={t("settings.language")} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["en", "ar"] as LanguageCode[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                gs.tag,
                { backgroundColor: currentLang === lang ? plate.primary : plate.gray, flex: 1, alignItems: "center" },
              ]}
              onPress={() => handleLanguageChange(lang)}
            >
              <Text style={[gs.tagText, { color: currentLang === lang ? plate.background : plate.text }]}>
                {lang === "en" ? t("language.english") : t("language.arabic")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title={t("settings.exchangeRate")} subtitle={t("settings.exchangeRateSubtitle")} />
        <FormField
          label={t("settings.sypRate")}
          value={sypRate}
          onChangeText={setSypRate}
          placeholder="15000"
          keyboardType="number-pad"
        />
      </View>

      <View style={[gs.card, { padding: 16 }]}>
        <FormField
          label={t("settings.adPriceLabel")}
          value={adPrice}
          onChangeText={setAdPrice}
          placeholder="0"
          keyboardType="number-pad"
        />
      </View>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title={t("settings.sliderImages")} subtitle={t("settings.productIdOptional")} />
        {sliderEntries.map((entry, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
            <Image source={{ uri: buildImageUrl(entry.image) }} style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: plate.gray }} />
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: plate.gray, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, minHeight: 38 }}
                onPress={() => openProductPicker(i)}
              >
                <Text style={[gs.text, { flex: 1, fontSize: 14, color: entry.productName ? plate.text : plate.textSecond }]} numberOfLines={1}>
                  {entry.productName || t("settings.productIdPlaceholder")}
                </Text>
                <Ionicons name="search" size={18} color={plate.textSecond} />
              </TouchableOpacity>
              {entry.productId ? (
                <TouchableOpacity
                  style={{ position: "absolute", right: 4, top: 4 }}
                  onPress={() => clearProduct(i)}
                >
                  <Ionicons name="close-circle" size={18} color={plate.red} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => setSliderEntries(sliderEntries.filter((_, idx) => idx !== i))}>
              <Ionicons name="trash-outline" size={20} color={plate.red} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[gs.buttonOutline, { marginTop: 8 }]}
          onPress={async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
            if (result.canceled || !result.assets[0]) return;

            setUploadingImage(true);
            try {
              const formData = new FormData();
              formData.append("images", {
                uri: result.assets[0].uri,
                type: "image/jpeg",
                name: "slider.jpg",
              } as any);

              const filenames = await uploadFiles(formData);
              if (filenames[0]) {
                setSliderEntries([...sliderEntries, { image: filenames[0] }]);
              }
            } catch (err) {
              Alert.alert(t("common.error"), getErrorMessage(err));
            } finally {
              setUploadingImage(false);
            }
          }}
        >
          <Ionicons name="add" size={18} color={plate.primary} />
          <Text style={[gs.buttonTextSecondary, { marginLeft: 4 }]}>{t("settings.addSliderImage")}</Text>
        </TouchableOpacity>
        {uploadingImage ? (
          <ActivityIndicator size="small" color={plate.primary} style={{ marginTop: 8 }} />
        ) : null}
      </View>

      <TouchableOpacity style={[gs.button, { marginBottom: 24 }]} onPress={handleSave}>
        <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
        <Text style={gs.buttonText}>{t("settings.saveSettings")}</Text>
      </TouchableOpacity>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title={t("settings.account")} />
        <Row label={t("settings.phone")} value={user?.phone ?? ""} />
        <Row label={t("settings.role")} value={user?.role ?? ""} />
        <TouchableOpacity
          style={[gs.buttonDanger, { marginTop: 16 }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={18} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{t("settings.logout")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

      <Modal visible={pickerIndex !== null} transparent animationType="fade" onRequestClose={closeProductPicker}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={closeProductPicker}
        >
          <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 120, backgroundColor: "rgba(0,0,0,0.3)" }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={{ marginHorizontal: 20, backgroundColor: plate.background, borderRadius: 12, maxHeight: 350 }}>
                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: plate.gray }}>
                  <View style={gs.inputContainer}>
                    <TextInput
                      style={{ fontSize: 16, backgroundColor: plate.backgroundSecond, borderWidth: 1, borderColor: plate.gray, paddingHorizontal: 12, height: 48, color: plate.text, borderRadius: 8, flex: 1 }}
                      value={productSearch}
                      onChangeText={setProductSearch}
                      onSubmitEditing={() => doProductSearch(productSearch)}
                      returnKeyType="search"
                      placeholder={t("settings.productIdPlaceholder")}
                      placeholderTextColor={plate.textSecond}
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                {productResults.length > 0 ? (
                  <FlatList
                    data={productResults}
                    keyExtractor={(item: any) => item._id}
                    renderItem={({ item }: { item: any }) => {
                      const name = item.nameEn ?? item.nameAr ?? item._id;
                      return (
                        <TouchableOpacity
                          style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: plate.gray }}
                          onPress={() => selectProduct(item)}
                        >
                          <Text style={gs.text}>{name}</Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                ) : (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={gs.caption}>{t("common.loading")}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { gs } = useGlobalStyles();
  return (
    <View style={[gs.rowBetween, { marginBottom: 8 }]}>
      <Text style={gs.textSmall}>{label}</Text>
      <Text style={gs.label}>{value}</Text>
    </View>
  );
}
