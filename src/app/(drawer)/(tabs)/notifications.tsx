import { getApiClient, useApiMutation, useApiQuery } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { useGlobalStyles } from "@/styles/global";
import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const QUICK_NOTES_KEY = `${APP_PREFIX}:quickNotifications`;

interface QuickNote {
  id: string;
  title: string;
  body: string;
  navType: "none" | "screen" | "container";
  navValue: string;
}

const NAV_SCREENS = ["orderUpdate", "orders", "bucket", "offers", "ads"] as const;

function buildData(navType: string, navValue: string): Record<string, string> | undefined {
  if (navType === "none") return undefined;
  if (navType === "screen") {
    if (navValue === "orderUpdate") return { screen: "orders" };
    return { screen: navValue };
  }
  if (navType === "container") return { screen: "container", containerId: navValue };
  return undefined;
}

export default function NotificationsScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [navType, setNavType] = useState<"none" | "screen" | "container">("none");
  const [navValue, setNavValue] = useState("");
  const [mode, setMode] = useState<"broadcast" | "specific">("broadcast");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);

  const [containerSearch, setContainerSearch] = useState("");
  const [containerResults, setContainerResults] = useState<any[]>([]);
  const [showContainerPicker, setShowContainerPicker] = useState(false);
  const [selectedContainerName, setSelectedContainerName] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(QUICK_NOTES_KEY).then((stored) => {
      if (stored) {
        try {
          setQuickNotes(JSON.parse(stored));
        } catch {}
      }
    });
  }, []);

  const persistQuickNotes = useCallback(async (notes: QuickNote[]) => {
    setQuickNotes(notes);
    await AsyncStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(notes));
  }, []);

  const { data: usersData } = useApiQuery<any>({
    url: "admin/users",
    queryKey: ["api", "admin", "users", "list"],
    params: { limit: 10000 },
  });

  const users: any[] = (usersData as any)?.data ?? [];

  const sendMutation = useApiMutation<any, any>({
    method: "post",
    url: "notifications/send",
    options: {
      onSuccess: (res: any) => {
        const p = res?.payload;
        const msg = res?.message ?? "";
        const summary = p
          ? t("notifications.sentSummary", { sent: p.sent, total: p.total })
          : msg;
        Alert.alert(t("common.success"), summary);
      },
      onError: (err) => Alert.alert(t("common.error"), getErrorMessage(err)),
    },
  });

  const resetForm = () => {
    setTitle("");
    setBody("");
    setNavType("none");
    setNavValue("");
    setSelectedIds([]);
    setContainerSearch("");
    setSelectedContainerName("");
  };

  const doSend = useCallback(
    (overrideTitle?: string, overrideBody?: string, overrideNavType?: string, overrideNavValue?: string) => {
      const finalTitle = overrideTitle ?? title;
      const finalBody = overrideBody ?? body;
      const finalNavType = overrideNavType ?? navType;
      const finalNavValue = overrideNavValue ?? navValue;

      if (!finalTitle.trim() || !finalBody.trim()) {
        Alert.alert("", t("notifications.validationRequired"));
        return;
      }

      const data = buildData(finalNavType, finalNavValue);

      const payload: Record<string, unknown> = {
        title: finalTitle.trim(),
        body: finalBody.trim(),
        ...(data ? { data } : {}),
      };

      if (mode === "specific" && selectedIds.length > 0) {
        payload.userIds = selectedIds;
      }

      sendMutation.mutate(payload, {
        onSuccess: () => resetForm(),
      });
    },
    [title, body, navType, navValue, mode, selectedIds, sendMutation, t],
  );

  const handleSend = () => doSend();

  const handleQuickSend = (note: QuickNote) => {
    doSend(note.title, note.body, note.navType, note.navValue);
  };

  const saveQuickNote = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("", t("notifications.validationRequired"));
      return;
    }
    const note: QuickNote = {
      id: Date.now().toString(),
      title: title.trim(),
      body: body.trim(),
      navType,
      navValue,
    };
    persistQuickNotes([note, ...quickNotes]);
    Alert.alert("", t("notifications.savedQuick"));
  };

  const deleteQuickNote = (id: string) => {
    persistQuickNotes(quickNotes.filter((n) => n.id !== id));
  };

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filteredUsers = users.filter((u: any) => u.role !== "admin");

  const doContainerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContainerResults([]);
      return;
    }
    try {
      const client = getApiClient();
      const res = await client.get("containers", { params: { q: query.trim(), limit: 8 } });
      setContainerResults(res.data?.data ?? []);
    } catch {
      setContainerResults([]);
    }
  }, []);

  const handleContainerSearchChange = (text: string) => {
    setContainerSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doContainerSearch(text), 300);
  };

  const selectContainer = (container: any) => {
    const name = container.nameEn ?? container.nameAr ?? container._id;
    setSelectedContainerName(name);
    setNavValue(container._id);
    setContainerSearch("");
    setContainerResults([]);
    setShowContainerPicker(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: plate.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[gs.h2, { marginBottom: 20 }]}>{t("notifications.composeTitle")}</Text>

        {quickNotes.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[gs.inputLabel, { marginBottom: 8 }]}>{t("notifications.quickNotes")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickNotes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() => handleQuickSend(note)}
                  onLongPress={() => {
                    Alert.alert(
                      t("common.delete"),
                      t("notifications.deleteQuickConfirm"),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        { text: t("common.delete"), style: "destructive", onPress: () => deleteQuickNote(note.id) },
                      ],
                    );
                  }}
                  style={{
                    backgroundColor: plate.primary + "15",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: plate.primary + "30",
                    padding: 14,
                    marginRight: 10,
                    minWidth: 160,
                    maxWidth: 220,
                  }}
                >
                  <Text style={[gs.label, { color: plate.primary }]} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <Text style={[gs.caption, { marginTop: 4 }]} numberOfLines={2}>
                    {note.body}
                  </Text>
                  {note.navType !== "none" && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                      <Ionicons name="navigate" size={12} color={plate.textSecond} style={{ marginRight: 4 }} />
                      <Text style={[gs.caption, { fontSize: 11, color: plate.textSecond }]} numberOfLines={1}>
                        {note.navType === "screen" ? note.navValue : note.navValue}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={gs.inputLabel}>{t("notifications.title")}</Text>
          <View style={gs.inputContainer}>
            <TextInput
              style={gs.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t("notifications.titlePlaceholder")}
              placeholderTextColor={plate.textSecond}
            />
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={gs.inputLabel}>{t("notifications.body")}</Text>
          <View
            style={[
              gs.inputContainer,
              { height: 120, alignItems: "flex-start", paddingVertical: 12 },
            ]}
          >
            <TextInput
              style={[gs.input, { height: "100%", textAlignVertical: "top" }]}
              value={body}
              onChangeText={setBody}
              placeholder={t("notifications.bodyPlaceholder")}
              placeholderTextColor={plate.textSecond}
              multiline
            />
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={gs.inputLabel}>{t("notifications.navLabel")}</Text>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["none", "screen", "container"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  gs.buttonOutline,
                  {
                    flex: 1,
                    minWidth: 80,
                    borderColor: navType === type ? plate.primary : plate.gray,
                    backgroundColor: navType === type ? plate.primary + "15" : "transparent",
                  },
                ]}
                onPress={() => { setNavType(type); setNavValue(""); setSelectedContainerName(""); }}
              >
                <Ionicons
                  name={
                    type === "none" ? "close-circle-outline" :
                    type === "screen" ? "phone-portrait-outline" : "cube-outline"
                  }
                  size={16}
                  color={navType === type ? plate.primary : plate.textSecond}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: navType === type ? plate.primary : plate.textSecond,
                  }}
                >
                  {t(`notifications.navType_${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {navType === "screen" && (
            <View style={{ marginTop: 8 }}>
              <Text style={[gs.inputLabel, { fontSize: 13 }]}>{t("notifications.navScreen")}</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {NAV_SCREENS.map((screen) => (
                  <TouchableOpacity
                    key={screen}
                    style={[
                      gs.buttonOutline,
                      {
                        paddingHorizontal: 16,
                        height: 40,
                        borderColor: navValue === screen ? plate.primary : plate.gray,
                        backgroundColor: navValue === screen ? plate.primary + "15" : "transparent",
                      },
                    ]}
                    onPress={() => setNavValue(screen)}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: navValue === screen ? plate.primary : plate.textSecond,
                      }}
                    >
                      {t(`notifications.screen_${screen}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {navType === "container" && (
            <View style={{ marginTop: 8 }}>
              <Text style={[gs.inputLabel, { fontSize: 13 }]}>{t("notifications.navContainerHint")}</Text>
              <TouchableOpacity
                style={[gs.inputContainer, { paddingRight: 8 }]}
                onPress={() => setShowContainerPicker(true)}
              >
                <TextInput
                  style={gs.input}
                  value={selectedContainerName || navValue}
                  placeholder={t("notifications.navContainerPlaceholder")}
                  placeholderTextColor={plate.textSecond}
                  editable={false}
                />
                <Ionicons name="search" size={20} color={plate.textSecond} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={[gs.inputLabel, { marginBottom: 10 }]}>{t("notifications.target")}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                gs.buttonOutline,
                { flex: 1, borderColor: mode === "broadcast" ? plate.primary : plate.gray },
              ]}
              onPress={() => setMode("broadcast")}
            >
              <Ionicons
                name={mode === "broadcast" ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={mode === "broadcast" ? plate.primary : plate.textSecond}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: mode === "broadcast" ? plate.primary : plate.textSecond,
                  fontWeight: "600",
                }}
              >
                {t("notifications.broadcast")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                gs.buttonOutline,
                { flex: 1, borderColor: mode === "specific" ? plate.primary : plate.gray },
              ]}
              onPress={() => setMode("specific")}
            >
              <Ionicons
                name={mode === "specific" ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={mode === "specific" ? plate.primary : plate.textSecond}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: mode === "specific" ? plate.primary : plate.textSecond,
                  fontWeight: "600",
                }}
              >
                {t("notifications.specific")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === "specific" && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[gs.inputLabel, { marginBottom: 8 }]}>
              {t("notifications.selectedCount", { count: selectedIds.length })}
            </Text>
            {filteredUsers.length === 0 ? (
              <Text style={gs.caption}>{t("notifications.noUsers")}</Text>
            ) : (
              filteredUsers.map((user: any) => {
                const selected = selectedIds.includes(user._id);
                return (
                  <TouchableOpacity
                    key={user._id}
                    style={[
                      gs.containerRow,
                      {
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        marginBottom: 6,
                        backgroundColor: selected ? plate.primary + "20" : plate.backgroundSecond,
                        borderWidth: 1,
                        borderColor: selected ? plate.primary : plate.gray,
                      },
                    ]}
                    onPress={() => toggleUser(user._id)}
                  >
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={20}
                      color={selected ? plate.primary : plate.textSecond}
                    />
                    <Text style={[gs.text, { flex: 1, marginLeft: 8 }]}>
                      {user.name ?? user.phone ?? user._id}
                    </Text>
                    {user.expoPushToken ? (
                      <Ionicons name="notifications" size={14} color={plate.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={[gs.buttonOutline, { flex: 1 }]}
            onPress={saveQuickNote}
          >
            <Ionicons name="bookmark-outline" size={18} color={plate.primary} style={{ marginRight: 6 }} />
            <Text style={gs.buttonTextSecondary}>{t("notifications.saveQuick")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[gs.button, { flex: 2, opacity: sendMutation.isPending ? 0.6 : 1 }]}
            onPress={handleSend}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={gs.buttonText}>
              {sendMutation.isPending ? t("notifications.sending") : t("notifications.send")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showContainerPicker} transparent animationType="fade" onRequestClose={() => setShowContainerPicker(false)}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowContainerPicker(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 120, backgroundColor: "rgba(0,0,0,0.3)" }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={{ marginHorizontal: 20, backgroundColor: plate.background, borderRadius: 12, maxHeight: 350 }}>
                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: plate.gray }}>
                  <View style={gs.inputContainer}>
                    <TextInput
                      style={[gs.input, { fontSize: 16, backgroundColor: plate.backgroundSecond, borderWidth: 1, borderColor: plate.gray, paddingHorizontal: 12, height: 48, color: plate.text }]}
                      value={containerSearch}
                      onChangeText={handleContainerSearchChange}
                      placeholder={t("notifications.navContainerPlaceholder")}
                      placeholderTextColor={plate.textSecond}
                      autoFocus
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                {containerResults.length > 0 ? (
                  <FlatList
                    data={containerResults}
                    keyExtractor={(item: any) => item._id}
                    renderItem={({ item }: { item: any }) => {
                      const name = item.nameEn ?? item.nameAr ?? item._id;
                      return (
                        <TouchableOpacity
                          style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: plate.gray }}
                          onPress={() => selectContainer(item)}
                        >
                          <Text style={gs.text}>{name}</Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                ) : (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={gs.caption}>{t("notifications.noContainerResults")}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
