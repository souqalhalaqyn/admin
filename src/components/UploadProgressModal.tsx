import { useGlobalStyles } from "@/styles/global";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  progress: number;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export default function UploadProgressModal({ visible, progress, error, onRetry, onCancel, onDismiss }: Props) {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={onCancel}>
        <Pressable style={[gs.card, { width: "80%", maxWidth: 320, padding: 24, alignItems: "center" }]} onPress={() => {}}>
          {error ? (
            <>
              <Text style={[gs.h3, { color: plate.red, marginBottom: 8 }]}>{t("common.error")}</Text>
              <Text style={[gs.text, { textAlign: "center", marginBottom: 20 }]}>{error}</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity style={[gs.button, { flex: 1, backgroundColor: plate.gray }]} onPress={onDismiss}>
                  <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.dismiss")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[gs.button, { flex: 1 }]} onPress={onRetry}>
                  <Text style={gs.buttonText}>{t("common.retry")}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[gs.h3, { marginBottom: 16 }]}>{t("common.uploading")}</Text>
              <View style={{ width: "100%", height: 8, backgroundColor: plate.gray, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <View style={{ width: `${progress}%`, height: "100%", backgroundColor: plate.primary, borderRadius: 4 }} />
              </View>
              <Text style={[gs.text, { color: plate.textSecond, marginBottom: 16 }]}>{progress}%</Text>
              <TouchableOpacity style={[gs.button, { backgroundColor: plate.gray }]} onPress={onCancel}>
                <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
