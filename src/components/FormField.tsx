import { useGlobalStyles } from "@/styles/global";
import { Text, TextInput, View, type TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, style, ...props }: Props) {
  const { gs, plate } = useGlobalStyles();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[gs.label, { marginBottom: 6 }]}>
        {label}
        {required ? <Text style={gs.required}> *</Text> : null}
      </Text>
      <View style={[gs.inputContainer, { paddingHorizontal: 16 }, error ? gs.inputError : null]}>
        <TextInput
          style={[gs.input, style]}
          placeholderTextColor={plate.graySecond}
          {...props}
        />
      </View>
      {error ? <Text style={gs.errorText}>{error}</Text> : null}
    </View>
  );
}
