import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { downloadAndInstallApk } from "@/utils/installApk";

interface Props {
  currentVersion: string;
  newVersion: string;
  downloadUrl: string;
}

export default function UpdateScreen({ currentVersion, newVersion, downloadUrl }: Props) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    if (Platform.OS !== "android") {
      Linking.openURL(downloadUrl);
      return;
    }
    setDownloading(true);
    setProgress(0);
    setError(false);
    try {
      await downloadAndInstallApk(downloadUrl, setProgress);
    } catch (e) {
      setError(true);
      console.error("APK download/install failed:", e);
      Alert.alert(t("common.error"), t("update.downloadError"), [
        { text: t("common.ok"), style: "default" },
      ]);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, backgroundColor: "#fff" }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#FBBF2420", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
        <Ionicons name="cloud-download-outline" size={40} color="#FBBF24" />
      </View>

      <Text style={{ fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8, color: "#0F172A" }}>
        {t("update.title")}
      </Text>
      <Text style={{ fontSize: 15, textAlign: "center", marginBottom: 24, color: "#64748B", lineHeight: 22 }}>
        {t("update.description")}
      </Text>

      <View style={{ padding: 16, width: "100%", marginBottom: 24, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#0F172A" }}>{t("update.currentVersion")}</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B" }}>{currentVersion}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#0F172A" }}>{t("update.newVersion")}</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FBBF24" }}>{newVersion}</Text>
        </View>
      </View>

      <View style={{ padding: 16, width: "100%", marginBottom: 24, backgroundColor: "#EFF6FF", borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE" }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" style={{ marginTop: 2 }} />
          <Text style={{ fontSize: 13, color: "#64748B", flex: 1, lineHeight: 18 }}>
            {t("update.instructions")}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={{ backgroundColor: downloading ? "#94A3B8" : "#FBBF24", width: "100%", paddingVertical: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" }}
        onPress={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          {downloading ? t("update.downloading") : t("update.downloadButton")}
        </Text>
      </TouchableOpacity>

      {downloading ? (
        <View style={{ width: "100%", marginTop: 16 }}>
          <View style={{ width: "100%", height: 8, borderRadius: 4, backgroundColor: "#E2E8F0", overflow: "hidden" }}>
            <View style={{ width: `${Math.round(progress * 100)}%`, height: "100%", backgroundColor: "#FBBF24" }} />
          </View>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B", textAlign: "center" }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text style={{ marginTop: 12, fontSize: 13, color: "#EF4444", textAlign: "center" }}>
          {t("update.downloadError")}
        </Text>
      ) : null}
    </View>
  );
}
