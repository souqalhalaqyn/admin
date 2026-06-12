import { useAuth } from "@/context/AuthContext";
import { changeLanguage, type LanguageCode } from "@/i18n";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { plate, gs } = useGlobalStyles();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentLang: LanguageCode = i18n.language === "ar" ? "ar" : "en";

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert(t("common.error"), t("auth.validationRequired"));
      return;
    }
    const fullPhone = `+963${phone}`;
    setLoading(true);
    try {
      await login(fullPhone, password);
      router.replace("/(drawer)" as any);
    } catch (err: any) {
      Alert.alert(t("auth.loginFailed"), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[gs.safeArea]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[gs.container, { justifyContent: "center", paddingHorizontal: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 48, marginTop: 60 }}>
          <Image
            source={require("@/assets/logo.png")}
            style={{ width: 80, height: 80, resizeMode: "contain", marginBottom: 16 }}
          />
          <Text style={[gs.h1, { marginBottom: 8 }]}>{t("auth.loginTitle")}</Text>
          <Text style={[gs.text, { color: plate.textSecond, textAlign: "center" }]}>
            {t("auth.signInSubtitle")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {(["en", "ar"] as LanguageCode[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                gs.tag,
                { backgroundColor: currentLang === lang ? plate.primary : plate.gray, alignItems: "center", paddingHorizontal: 20 },
              ]}
              onPress={() => changeLanguage(lang)}
            >
              <Text style={[gs.tagText, { color: currentLang === lang ? plate.background : plate.text }]}>
                {lang === "en" ? t("language.english") : t("language.arabic")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={[gs.label, gs.mb12]}>{t("auth.phonePlaceholder")}</Text>
          <View style={[gs.inputContainer, { paddingHorizontal: 16 }]}>
            <Text style={[gs.text, { color: plate.graySecond, marginRight: 8 }]}>+963</Text>
            <TextInput
              style={gs.input}
              placeholder={t("auth.phonePlaceholderHint")}
              placeholderTextColor={plate.graySecond}
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={[gs.label, gs.mb12]}>{t("auth.passwordPlaceholder")}</Text>
          <View style={[gs.inputContainer, { paddingHorizontal: 16 }]}>
            <TextInput
              style={gs.input}
              placeholder={t("auth.passwordPlaceholderHint")}
              placeholderTextColor={plate.graySecond}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={plate.graySecond} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[gs.button, { opacity: loading ? 0.6 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Ionicons name="log-in-outline" size={20} color={plate.background} style={{ marginRight: 8 }} />
          <Text style={gs.buttonText}>{loading ? t("auth.signingIn") : t("auth.loginButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
