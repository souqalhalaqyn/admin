import { Text, View } from "react-native";
import { useGlobalStyles } from "@/styles/global";

export function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const { gs, plate } = useGlobalStyles();
  return (
    <View style={[gs.rowBetween]}>
      <Text style={gs.textSmall}>{label}</Text>
      <Text style={[gs.label, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
