import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { plate, gs } = useGlobalStyles();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Error", "Please enter phone and password");
      return;
    }
    const fullPhone = `+963${phone}`;
    setLoading(true);
    try {
      await login(fullPhone, password);
      router.replace("/(drawer)" as any);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
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
          <View style={{
            width: 80, height: 80, borderRadius: 20,
            backgroundColor: plate.primary + "20",
            justifyContent: "center", alignItems: "center", marginBottom: 16,
          }}>
            <Ionicons name="shield-checkmark" size={40} color={plate.primary} />
          </View>
          <Text style={[gs.h1, { marginBottom: 8 }]}>Admin Login</Text>
          <Text style={[gs.text, { color: plate.textSecond, textAlign: "center" }]}>
            Sign in to manage your store
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={[gs.label, gs.mb12]}>Phone Number</Text>
          <View style={[gs.inputContainer, { paddingHorizontal: 16 }]}>
            <Text style={[gs.text, { color: plate.graySecond, marginRight: 8 }]}>+963</Text>
            <TextInput
              style={gs.input}
              placeholder="9XXXXXXXX"
              placeholderTextColor={plate.graySecond}
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={[gs.label, gs.mb12]}>Password</Text>
          <View style={[gs.inputContainer, { paddingHorizontal: 16 }]}>
            <TextInput
              style={gs.input}
              placeholder="Enter password"
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
          <Text style={gs.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
