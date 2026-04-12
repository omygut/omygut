import { View, Text, Input, Textarea, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { medicationService } from "../../../services/medication";
import { MEDICATION_CATEGORIES } from "../../../constants/medication";
import { formatDate, formatTime } from "../../../utils/date";
import "./index.css";

const CUSTOM_MEDICATIONS_KEY = "custom_medications";

// 所有预设药品的名称集合
const ALL_PRESET_MEDICATIONS = new Set(MEDICATION_CATEGORIES.flatMap((cat) => cat.items));

function getStoredCustomMedications(): string[] {
  const stored = Taro.getStorageSync(CUSTOM_MEDICATIONS_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveCustomMedication(medication: string) {
  const existing = getStoredCustomMedications();
  if (!existing.includes(medication)) {
    Taro.setStorageSync(CUSTOM_MEDICATIONS_KEY, [...existing, medication]);
  }
}

function removeCustomMedication(medication: string) {
  const existing = getStoredCustomMedications();
  Taro.setStorageSync(
    CUSTOM_MEDICATIONS_KEY,
    existing.filter((m) => m !== medication),
  );
}

export default function MedicationAdd() {
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(-1); // -1 = 常用
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customMedications, setCustomMedications] = useState<string[]>([]);
  const [topMedications, setTopMedications] = useState<string[]>([]);

  useDidShow(() => {
    setCustomMedications(getStoredCustomMedications());
    const meds = medicationService.getTopMedications(10);
    setTopMedications(meds.filter((m) => ALL_PRESET_MEDICATIONS.has(m)));
  });

  const handleMedicationClick = (medication: string) => {
    if (selectedMedications.includes(medication)) {
      setSelectedMedications(selectedMedications.filter((m) => m !== medication));
    } else {
      setSelectedMedications([...selectedMedications, medication]);
    }
  };

  const handleManualAdd = () => {
    const medication = manualInput.trim();
    if (!medication) {
      Taro.showToast({ title: "请输入药物名称", icon: "none" });
      return;
    }
    if (selectedMedications.includes(medication)) {
      Taro.showToast({ title: "已添加该药物", icon: "none" });
      return;
    }
    setSelectedMedications([...selectedMedications, medication]);
    setManualInput("");
    if (!ALL_PRESET_MEDICATIONS.has(medication)) {
      saveCustomMedication(medication);
      setCustomMedications(getStoredCustomMedications());
    }
  };

  const handleDeleteCustomMedication = async (medication: string) => {
    const res = await Taro.showModal({
      title: "删除药物",
      content: `确定要删除"${medication}"吗？`,
    });
    if (res.confirm) {
      removeCustomMedication(medication);
      setCustomMedications(getStoredCustomMedications());
      setSelectedMedications(selectedMedications.filter((m) => m !== medication));
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setSelectedMedications(selectedMedications.filter((m) => m !== medication));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (selectedMedications.length === 0) {
      Taro.showToast({ title: "请选择或输入药物", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      // 为每个选中的药物创建一条记录
      for (const medication of selectedMedications) {
        await medicationService.add({
          date,
          time,
          name: medication,
          note: note.trim() || undefined,
        });
      }

      Taro.showToast({ title: "记录成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  // 「常用」的药品列表：自定义药品 + 预设高频药品
  const myFavoriteMedications = [
    ...customMedications,
    ...topMedications.filter((m) => !customMedications.includes(m)),
  ];

  // 当前分类的药品列表
  const currentMedications =
    selectedCategory === -1 ? myFavoriteMedications : MEDICATION_CATEGORIES[selectedCategory].items;

  return (
    <View className="add-page">
      {/* 日期时间 */}
      <View className="section">
        <Text className="section-title">时间</Text>
        <View className="time-row">
          <Picker mode="date" value={date} onChange={(e) => setDate(e.detail.value)}>
            <View className="picker-value">{date}</View>
          </Picker>
          <Picker mode="time" value={time} onChange={(e) => setTime(e.detail.value)}>
            <View className="picker-value">{time}</View>
          </Picker>
        </View>
      </View>

      {/* 药物选择 */}
      <View className="section">
        <Text className="section-title">选择药物</Text>

        {/* 分类标签 */}
        <View className="category-tabs">
          <View
            className={`category-tab ${selectedCategory === -1 ? "active" : ""}`}
            onClick={() => setSelectedCategory(-1)}
          >
            常用
          </View>
          {MEDICATION_CATEGORIES.map((cat, index) => (
            <View
              key={cat.name}
              className={`category-tab ${selectedCategory === index ? "active" : ""}`}
              onClick={() => setSelectedCategory(index)}
            >
              {cat.name}
            </View>
          ))}
        </View>

        {/* 药物网格 */}
        <View className="medication-grid">
          {currentMedications.length === 0 ? (
            <Text className="no-medication-hint">暂无常用药物，请从其他分类选择或手动输入</Text>
          ) : (
            currentMedications.map((medication) => {
              const isCustom = selectedCategory === -1 && customMedications.includes(medication);
              return (
                <View
                  key={medication}
                  className={`medication-item ${selectedMedications.includes(medication) ? "selected" : ""} ${isCustom ? "custom" : ""}`}
                  onClick={() => handleMedicationClick(medication)}
                  onLongPress={
                    isCustom ? () => handleDeleteCustomMedication(medication) : undefined
                  }
                >
                  {medication}
                </View>
              );
            })
          )}
        </View>

        {/* 手动输入（仅在「常用」分类下显示） */}
        {selectedCategory === -1 && (
          <View className="manual-input-row">
            <Input
              className="manual-input"
              placeholder="输入其他药物"
              value={manualInput}
              onInput={(e) => setManualInput(e.detail.value)}
              onConfirm={handleManualAdd}
            />
            <View className="manual-add-btn" onClick={handleManualAdd}>
              添加
            </View>
          </View>
        )}
      </View>

      {/* 已选药物 */}
      <View className="section">
        <Text className="section-title">已选药物</Text>
        {selectedMedications.length === 0 ? (
          <Text className="no-medication-hint">请从上方选择或输入药物</Text>
        ) : (
          <View className="selected-medications">
            {selectedMedications.map((medication) => (
              <View
                key={medication}
                className="selected-medication-tag"
                onClick={() => handleRemoveMedication(medication)}
              >
                <Text className="selected-medication-name">{medication}</Text>
                <Text className="remove-medication-btn">×</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 备注 */}
      <View className="section">
        <Text className="section-title">备注</Text>
        <Textarea
          className="note-input"
          placeholder="添加备注（可选）"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={500}
        />
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View className={`submit-btn ${submitting ? "disabled" : ""}`} onClick={handleSubmit}>
          {submitting ? "保存中..." : "保存记录"}
        </View>
      </View>
    </View>
  );
}
