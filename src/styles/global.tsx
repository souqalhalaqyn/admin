import { useAppTheme } from "@/context/ThemeContext";
import { StyleSheet } from "react-native";
import type { AppTheme } from "./theme";

export type Plate = AppTheme["colors"];

export const useGlobalStyles = () => {
  const { theme, isDark } = useAppTheme();
  const plate: Plate = theme.colors;

  const gs = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: plate.background },
    container: { flex: 1, paddingHorizontal: 20, backgroundColor: plate.background },
    containerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    centered: { justifyContent: "center", alignItems: "center" },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    column: { flexDirection: "column" },
    flex1: { flex: 1 },

    h1: { fontSize: 28, fontWeight: "800", color: plate.text, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: "700", color: plate.text, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: "600", color: plate.text, letterSpacing: -0.2 },
    title: { fontSize: 16, fontWeight: "600", color: plate.text },
    text: { fontSize: 16, fontWeight: "400", color: plate.text, letterSpacing: -0.5 },
    textSmall: { fontSize: 14, fontWeight: "400", color: plate.textSecond },
    textBold: { fontSize: 16, fontWeight: "700", color: plate.text },
    caption: { fontSize: 12, fontWeight: "400", color: plate.textSecond },
    label: { fontSize: 14, fontWeight: "500", color: plate.text },

    button: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      height: 48, paddingHorizontal: 20, borderRadius: 12,
      backgroundColor: plate.primary,
      shadowColor: plate.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    buttonSecondary: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      height: 48, paddingHorizontal: 20, borderRadius: 12,
      backgroundColor: plate.backgroundSecond, borderWidth: 1.5, borderColor: plate.primary,
    },
    buttonOutline: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      height: 48, paddingHorizontal: 20, borderRadius: 12,
      backgroundColor: "transparent", borderWidth: 1.5, borderColor: plate.gray,
    },
    buttonDanger: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      height: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: plate.red,
    },
    buttonSmall: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      height: 36, paddingHorizontal: 14, borderRadius: 8,
    },
    buttonText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5, textAlign: "center", color: plate.background },
    buttonTextSecondary: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5, textAlign: "center", color: plate.primary },
    buttonIcon: { marginRight: 8 },

    input: { flex: 1, fontSize: 16, height: "100%", color: plate.text },
    inputContainer: {
      flexDirection: "row", alignItems: "center", height: 48,
      paddingHorizontal: 12, borderRadius: 12,
      backgroundColor: plate.backgroundSecond, borderWidth: 1, borderColor: plate.gray,
    },
    inputLabel: { fontSize: 14, fontWeight: "500", color: plate.text, marginBottom: 6 },
    inputError: { borderColor: plate.red },
    errorText: { color: plate.red, fontSize: 12, marginTop: 4 },
    required: { color: plate.red },

    card: {
      borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: "hidden",
      backgroundColor: plate.backgroundSecond, borderColor: plate.gray,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 8, elevation: 3,
    },
    cardElevated: {
      borderRadius: 16, backgroundColor: plate.backgroundSecond,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 12, elevation: 6,
    },
    cardFlat: { borderRadius: 12, backgroundColor: plate.backgroundSecond, borderWidth: 1, borderColor: plate.gray },

    listItem: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: 12, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: plate.gray,
    },
    listItemLast: { borderBottomWidth: 0 },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: plate.primary },
    badgeText: { fontSize: 12, fontWeight: "600", color: plate.background },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: plate.gray },
    tagText: { fontSize: 13, fontWeight: "500", color: plate.text },

    divider: { height: 1, backgroundColor: plate.gray, marginVertical: 12 },
    dividerVertical: { width: 1, backgroundColor: plate.gray, marginHorizontal: 12 },

    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: plate.gray },
    avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: plate.gray },

    p4: { padding: 4 },
    p8: { padding: 8 },
    p12: { padding: 12 },
    p16: { padding: 16 },
    p20: { padding: 20 },
    px16: { paddingHorizontal: 16 },
    py12: { paddingVertical: 12 },
    m8: { margin: 8 },
    mb12: { marginBottom: 12 },
    mb16: { marginBottom: 16 },
    mb20: { marginBottom: 20 },
    mt12: { marginTop: 12 },
    mt16: { marginTop: 16 },
    mt20: { marginTop: 20 },
    gap8: { gap: 8 },
    gap12: { gap: 12 },
    gap16: { gap: 16 },

    overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modal: {
      width: "85%", borderRadius: 20, padding: 24,
      backgroundColor: plate.backgroundSecond,
      shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
    },

    skeleton: { backgroundColor: plate.gray, borderRadius: 8 },

    successText: { color: plate.green },
    infoText: { color: plate.blue },
    warningText: { color: plate.primary },

    iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: plate.gray },
    iconContainerPrimary: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: plate.primary + "20" },

    scrollContent: { paddingBottom: 40 },

    sectionHeader: {
      fontSize: 14, fontWeight: "600", color: plate.textSecond,
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
    },
    dividerFull: { height: 1, backgroundColor: plate.gray, marginHorizontal: -20, marginVertical: 16 },
  });

  return { plate, gs, isDark, theme };
};
