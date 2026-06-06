import { useGlobalStyles } from "@/styles/global";
import { Text, View } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: Props) {
  const { gs, plate } = useGlobalStyles();

  return (
    <View style={{ marginBottom: 16, marginTop: 8 }}>
      <Text style={[gs.h3, { color: plate.text }]}>{title}</Text>
      {subtitle ? <Text style={[gs.textSmall, { marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}
