import { View, Text, Textarea, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { symptomService } from "../../../services/symptom";
import { SYMPTOM_TYPES, SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../../constants/symptom";
import { formatDate, formatTime } from "../../../utils/date";
import type { Symptom } from "../../../types";
import "./index.css";

export default function SymptomAdd() {
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [overallFeeling, setOverallFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 添加症状
  const handleAddSymptom = (e) => {
    const index = e.detail.value;
    const selected = SYMPTOM_TYPES[index];
    // 检查是否已添加
    if (symptoms.some((s) => s.type === selected.value)) {
      Taro.showToast({ title: "已添加该症状", icon: "none" });
      return;
    }
    setSymptoms([...symptoms, { type: selected.value, severity: 1 }]);
  };

  // 修改症状严重程度
  const handleSeverityChange = (symptomIndex: number, e) => {
    const severityIndex = e.detail.value;
    const newSymptoms = [...symptoms];
    newSymptoms[symptomIndex].severity = SEVERITY_OPTIONS[severityIndex]
      .value as Symptom["severity"];
    setSymptoms(newSymptoms);
  };

  // 删除症状
  const handleRemoveSymptom = (index: number) => {
    const newSymptoms = [...symptoms];
    newSymptoms.splice(index, 1);
    setSymptoms(newSymptoms);
  };

  // 获取标签显示
  const getSymptomLabel = (type: string) => {
    return SYMPTOM_TYPES.find((s) => s.value === type)?.label || type;
  };

  const getSeverityInfo = (severity: 1 | 2 | 3) => {
    return SEVERITY_OPTIONS.find((s) => s.value === severity);
  };

  // 提交
  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await symptomService.add({
        date,
        time,
        symptoms,
        overallFeeling,
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

      {/* 整体感受 */}
      <View className="section">
        <Text className="section-title">整体感受</Text>
        <View className="feeling-options">
          {FEELING_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={`feeling-item ${overallFeeling === option.value ? "active" : ""}`}
              onClick={() => setOverallFeeling(option.value as typeof overallFeeling)}
            >
              <Text className="feeling-emoji">{option.emoji}</Text>
              <Text className="feeling-label">{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 症状 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">症状</Text>
          <Picker
            mode="selector"
            range={SYMPTOM_TYPES.map((s) => s.label)}
            onChange={handleAddSymptom}
          >
            <Text className="add-symptom-btn">+ 添加症状</Text>
          </Picker>
        </View>

        {symptoms.length === 0 ? (
          <View className="empty-symptoms">
            <Text className="empty-text">无症状，身体状态良好</Text>
          </View>
        ) : (
          <View className="symptom-list">
            {symptoms.map((symptom, index) => {
              const severity = getSeverityInfo(symptom.severity);
              return (
                <View key={index} className="symptom-item">
                  <View className="symptom-main">
                    <Text className="symptom-name">{getSymptomLabel(symptom.type)}</Text>
                    <View className="symptom-actions">
                      <Picker
                        mode="selector"
                        range={SEVERITY_OPTIONS.map((s) => s.label)}
                        onChange={(e) => handleSeverityChange(index, e)}
                      >
                        <View className="severity-btn" style={{ backgroundColor: severity?.color }}>
                          {severity?.label}
                        </View>
                      </Picker>
                      <Text className="remove-btn" onClick={() => handleRemoveSymptom(index)}>
                        删除
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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
