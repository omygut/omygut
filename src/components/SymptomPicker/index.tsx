import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { SYMPTOM_SHORTCUTS } from "../../constants/symptom";
import "./index.css";

const CUSTOM_SYMPTOMS_KEY = "custom_symptoms";

function getStoredCustomSymptoms(): string[] {
  const stored = Taro.getStorageSync(CUSTOM_SYMPTOMS_KEY);
  return Array.isArray(stored) ? stored : [];
}

interface SymptomPickerProps {
  visible: boolean;
  onSelect: (symptom: string) => void;
  onClose: () => void;
}

export default function SymptomPicker({ visible, onSelect, onClose }: SymptomPickerProps) {
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setCustomSymptoms(getStoredCustomSymptoms());
    }
  }, [visible]);

  if (!visible) return null;

  const handleSelect = (symptom: string) => {
    onSelect(symptom);
    onClose();
  };

  const allSymptoms = [...SYMPTOM_SHORTCUTS, ...customSymptoms];

  return (
    <View className="symptom-picker-mask" onClick={onClose}>
      <View className="symptom-picker" onClick={(e) => e.stopPropagation()}>
        <View className="symptom-picker-header">
          <Text className="symptom-picker-title">选择症状</Text>
          <Text className="symptom-picker-close" onClick={onClose}>
            关闭
          </Text>
        </View>

        <ScrollView className="symptom-picker-list" scrollY>
          {allSymptoms.length === 0 ? (
            <View className="symptom-picker-empty">
              <Text>暂无症状记录</Text>
            </View>
          ) : (
            allSymptoms.map((symptom) => (
              <View key={symptom} className="symptom-item" onClick={() => handleSelect(symptom)}>
                <Text className="symptom-name">{symptom}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
