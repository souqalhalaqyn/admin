import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = "cube-outline", title, subtitle }: Props) {
  const { gs, plate } = useGlobalStyles();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, paddingVertical: 60 }}>
      <Ionicons name={icon} size={64} color={plate.graySecond} />
      <Text style={[gs.h3, { marginTop: 16, textAlign: "center" }]}>{title}</Text>
      {subtitle ? <Text style={[gs.textSmall, { textAlign: "center", marginTop: 8 }]}>{subtitle}</Text> : null}
    </View>
  );
}
