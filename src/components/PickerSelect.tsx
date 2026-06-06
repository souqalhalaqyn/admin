import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  options: Option[];
  selected?: string;
  onSelect: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export default function PickerSelect({ label, options, selected, onSelect, error, required, placeholder }: Props) {
  const { plate, gs } = useGlobalStyles();
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === selected);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[gs.label, { marginBottom: 6 }]}>
        {label}
        {required ? <Text style={gs.required}> *</Text> : null}
      </Text>
      <TouchableOpacity
        style={[gs.inputContainer, { paddingHorizontal: 16 }, error ? gs.inputError : null]}
        onPress={() => setVisible(true)}
      >
        <Text style={[gs.text, { flex: 1, color: selectedOption ? plate.text : plate.graySecond }]}>
          {selectedOption?.label ?? placeholder ?? "Select..."}
        </Text>
        <Ionicons name="chevron-down" size={20} color={plate.graySecond} />
      </TouchableOpacity>
      {error ? <Text style={gs.errorText}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={gs.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={gs.modal}>
            <Text style={[gs.h3, { marginBottom: 16 }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[gs.listItem, { paddingVertical: 14 }]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[gs.text, { flex: 1 }]}>{item.label}</Text>
                  {item.value === selected ? (
                    <Ionicons name="checkmark" size={20} color={plate.primary} />
                  ) : null}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
