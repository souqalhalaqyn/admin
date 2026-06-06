import { useGlobalStyles } from "@/styles/global";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  confirmDanger, onConfirm, onCancel,
}: Props) {
  const { gs, plate } = useGlobalStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={gs.overlay}>
        <View style={gs.modal}>
          <Text style={[gs.h3, { marginBottom: 8 }]}>{title}</Text>
          <Text style={[gs.text, { marginBottom: 24, color: plate.textSecond }]}>{message}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={[gs.buttonOutline, { flex: 1 }]}
              onPress={onCancel}
            >
              <Text style={gs.buttonTextSecondary}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[confirmDanger ? gs.buttonDanger : gs.button, { flex: 1 }]}
              onPress={onConfirm}
            >
              <Text style={gs.buttonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
