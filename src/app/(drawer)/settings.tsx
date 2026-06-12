import { getApiClient, useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import ImageField from "@/components/ImageField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { changeLanguage, type LanguageCode } from "@/i18n";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { themeType, setThemeType } = useAppTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [sypRate, setSypRate] = useState("");
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, refetch, isLoading } = useApiQuery<any>({
    url: "admin/settings",
    queryKey: queryKeys.admin.settings(),
  });

  useEffect(() => {
    if (data?.data) {
      setSypRate(String(data.data.sypExchangeRate ?? "15000"));
      setSliderImages(data.data.sliderImages ?? []);
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
      sliderImages,
    });
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    await changeLanguage(lang);
  };

  if (isLoading) return <LoadingScreen />;

  const themeLabels: Record<string, string> = {
    system: t("settings.themeOptions.system"),
    light: t("settings.themeOptions.light"),
    dark: t("settings.themeOptions.dark"),
  };

  const currentLang: LanguageCode = i18n.language === "ar" ? "ar" : "en";

  return (
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
        <SectionHeader title={t("settings.sliderImages")} />
        <ImageField
          images={sliderImages}
          label={t("settings.sliderImagesLabel")}
          onAdd={async () => {
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

              const client = getApiClient();
              const uploadResp = await client.post("upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              const filenames: string[] = uploadResp.data?.data ?? [];
              const filename = filenames[0];
              if (filename) {
                setSliderImages([...sliderImages, filename]);
              }
            } catch (err) {
              Alert.alert(t("common.error"), getErrorMessage(err));
            } finally {
              setUploadingImage(false);
            }
          }}
          onRemove={(i) => setSliderImages(sliderImages.filter((_, idx) => idx !== i))}
        />
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
