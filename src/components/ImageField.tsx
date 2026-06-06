import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  images: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  label?: string;
}

export default function ImageField({ images, onAdd, onRemove, label }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 8, color: "#0F172A" }}>{label}</Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {images.map((img, i) => (
          <View key={i} style={{ position: "relative" }}>
            <Image
              source={{ uri: buildImageUrl(img) }}
              style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: "#E2E8F0" }}
            />
            {onRemove ? (
              <TouchableOpacity
                onPress={() => onRemove(i)}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center",
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        {onAdd ? (
          <TouchableOpacity
            onPress={onAdd}
            style={{
              width: 80, height: 80, borderRadius: 8,
              borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed",
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Ionicons name="add" size={24} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
