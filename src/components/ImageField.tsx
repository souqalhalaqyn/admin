import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp", ".m4v"]);

function isVideo(url: string): boolean {
  const clean = url.split("?").shift()?.toLowerCase() ?? "";
  const ext = "." + clean.split(".").pop();
  return VIDEO_EXTS.has(ext);
}

interface Props {
  images: string[];
  onAdd?: () => void;
  onAddVideo?: () => void;
  onRemove?: (index: number) => void;
  label?: string;
}

export default function ImageField({ images, onAdd, onAddVideo, onRemove, label }: Props) {
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
            {isVideo(img) && (
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
              </View>
            )}
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
        <View style={{ gap: 4 }}>
          {onAdd ? (
            <TouchableOpacity
              onPress={onAdd}
              style={{
                width: 80, height: 38, borderRadius: 8,
                borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed",
                justifyContent: "center", alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
          {onAddVideo ? (
            <TouchableOpacity
              onPress={onAddVideo}
              style={{
                width: 80, height: 38, borderRadius: 8,
                borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed",
                justifyContent: "center", alignItems: "center",
              }}
            >
              <Ionicons name="videocam-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
