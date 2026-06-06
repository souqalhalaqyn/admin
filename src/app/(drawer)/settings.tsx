import { useApiMutation, useApiQuery, queryKeys } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import ImageField from "@/components/ImageField";
import LoadingScreen from "@/components/LoadingScreen";
import SectionHeader from "@/components/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { themeType, setThemeType } = useAppTheme();
  const { user, logout } = useAuth();

  const [sypRate, setSypRate] = useState("");
  const [sliderImages, setSliderImages] = useState<string[]>([]);

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
      onSuccess: () => { Alert.alert("Success", "Settings saved"); refetch(); },
      onError: (err) => Alert.alert("Error", getErrorMessage(err)),
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      sypExchangeRate: Number(sypRate) || 15000,
      sliderImages,
    });
  };

  if (isLoading) return <LoadingScreen />;

  const themeLabels: Record<string, string> = { system: "System", light: "Light", dark: "Dark" };

  return (
    <ScrollView style={gs.safeArea} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Text style={[gs.h2, { marginTop: 16, marginBottom: 24 }]}>Settings</Text>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title="Appearance" />
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
        <SectionHeader title="Exchange Rate" subtitle="SYR to USD" />
        <FormField
          label="SYP Exchange Rate"
          value={sypRate}
          onChangeText={setSypRate}
          placeholder="15000"
          keyboardType="number-pad"
        />
      </View>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title="Slider Images" />
        <ImageField
          images={sliderImages}
          label="Homepage slider images"
          onAdd={() => {
            Alert.prompt?.("Add Image URL", "Enter image URL", (url) => {
              if (url?.trim()) setSliderImages([...sliderImages, url.trim()]);
            });
          }}
          onRemove={(i) => setSliderImages(sliderImages.filter((_, idx) => idx !== i))}
        />
      </View>

      <TouchableOpacity style={[gs.button, { marginBottom: 24 }]} onPress={handleSave}>
        <Ionicons name="save-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
        <Text style={gs.buttonText}>Save Settings</Text>
      </TouchableOpacity>

      <View style={[gs.card, { padding: 16 }]}>
        <SectionHeader title="Account" />
        <Row label="Phone" value={user?.phone ?? ""} />
        <Row label="Role" value={user?.role ?? ""} />
        <TouchableOpacity
          style={[gs.buttonDanger, { marginTop: 16 }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={18} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>Logout</Text>
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
