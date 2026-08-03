import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import ColorPicker, { Panel5, PreviewText, Swatches } from "reanimated-color-picker";
import type { ColorFormatsObject } from "reanimated-color-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface HSLColorPickerProps {
  visible: boolean;
  onClose: () => void;
  onColor: (hex: string) => void;
}

const presetColors = [
  "#FF0000", "#FF4500", "#FF8C00", "#FFD700", "#ADFF2F", "#00FF00",
  "#00CED1", "#00BFFF", "#1E90FF", "#0000FF", "#8A2BE2", "#FF00FF",
  "#FF1493", "#DC143C", "#8B4513", "#808080", "#000000", "#FFFFFF",
];

export default function HSLColorPicker({ visible, onClose, onColor }: HSLColorPickerProps) {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [selectedColor, setSelectedColor] = useState("#FF0000");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={[
            gs.cardElevated,
            {
              backgroundColor: plate.background,
              padding: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}
        >
          <Text style={[gs.h2, { marginBottom: 16 }]}>{t("productForm.colors")}</Text>

          <ColorPicker
            style={{ width: "100%", gap: 16 }}
            value={selectedColor}
            onCompleteJS={(color: ColorFormatsObject) => setSelectedColor(color.hex)}
          >
            <Panel5 />
            <PreviewText style={{ color: plate.text }} />
            <Swatches swatchStyle={{ borderRadius: 12, borderWidth: 1, borderColor: plate.graySecond }} colors={presetColors} />
          </ColorPicker>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={[gs.button, { flex: 1, backgroundColor: plate.gray }]}
              onPress={onClose}
            >
              <Text style={[gs.buttonText, { color: plate.text }]}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.button, { flex: 1 }]}
              onPress={() => {
                onColor(selectedColor);
                onClose();
              }}
            >
              <Ionicons name="checkmark" size={18} color={plate.background} style={{ marginRight: 4 }} />
              <Text style={gs.buttonText}>{t("common.select")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
