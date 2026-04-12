import { View, Text, Input, Textarea, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { medicationService } from "../../../services/medication";
import { MEDICATION_CATEGORIES } from "../../../constants/medication";
import { formatDate, formatTime } from "../../../utils/date";
import "./index.css";

export default function MedicationAdd() {
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedMedication, setSelectedMedication] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [dosage, setDosage] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMedicationClick = (medication: string) => {
    if (selectedMedication === medication) {
      setSelectedMedication("");
    } else {
      setSelectedMedication(medication);
    }
  };

  const handleManualAdd = () => {
    const medication = manualInput.trim();
    if (!medication) {
      Taro.showToast({ title: "请输入药物名称", icon: "none" });
      return;
    }
    setSelectedMedication(medication);
    setManualInput("");
  };

  const handleClearMedication = () => {
    setSelectedMedication("");
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!selectedMedication) {
      Taro.showToast({ title: "请选择或输入药物", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      await medicationService.add({
        date,
        time,
        name: selectedMedication,
        dosage: dosage.trim(),
        note: note.trim() || undefined,
      });

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

  const currentCategory = MEDICATION_CATEGORIES[selectedCategory];

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
          {currentCategory.items.map((medication) => (
            <View
              key={medication}
              className={`medication-item ${selectedMedication === medication ? "selected" : ""}`}
              onClick={() => handleMedicationClick(medication)}
            >
              {medication}
            </View>
          ))}
        </View>

        {/* 手动输入 */}
        <View className="manual-input-row">
          <Input
            className="manual-input"
            placeholder="输入其他药物"
            value={manualInput}
            onInput={(e) => setManualInput(e.detail.value)}
          />
          <View className="manual-add-btn" onClick={handleManualAdd}>
            添加
          </View>
        </View>
      </View>

      {/* 已选药物 */}
      <View className="section">
        <Text className="section-title">已选药物</Text>
        {!selectedMedication ? (
          <Text className="no-medication-hint">请从上方选择或输入药物</Text>
        ) : (
          <View className="selected-medication">
            <Text className="selected-medication-name">{selectedMedication}</Text>
            <Text className="clear-medication-btn" onClick={handleClearMedication}>
              清除
            </Text>
          </View>
        )}
      </View>

      {/* 剂量 */}
      <View className="section">
        <Text className="section-title">剂量（可选）</Text>
        <Input
          className="dosage-input"
          placeholder="如：1片、2粒、早晚各一次"
          value={dosage}
          onInput={(e) => setDosage(e.detail.value)}
        />
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
