import { View, Text, Textarea, Picker, Input } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { symptomService } from "../../../services/symptom";
import { SYMPTOM_SHORTCUTS, SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../../constants/symptom";
import { formatDate, formatTime } from "../../../utils/date";
import { validateSymptom } from "../../../utils/validation";
import type { SymptomRecord } from "../../../types";
import "./index.css";

const CUSTOM_SYMPTOMS_KEY = "custom_symptoms";

function getStoredCustomSymptoms(): string[] {
  const stored = Taro.getStorageSync(CUSTOM_SYMPTOMS_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveCustomSymptom(symptom: string) {
  const existing = getStoredCustomSymptoms();
  if (!existing.includes(symptom)) {
    Taro.setStorageSync(CUSTOM_SYMPTOMS_KEY, [...existing, symptom]);
  }
}

function removeCustomSymptom(symptom: string) {
  const existing = getStoredCustomSymptoms();
  Taro.setStorageSync(
    CUSTOM_SYMPTOMS_KEY,
    existing.filter((s) => s !== symptom),
  );
}

export default function SymptomAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [savedCustomSymptoms, setSavedCustomSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<SymptomRecord["severity"]>(undefined);
  const [overallFeeling, setOverallFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await symptomService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setSymptoms(record.symptoms);
        setSeverity(record.severity);
        setOverallFeeling(record.overallFeeling);
        setNote(record.note || "");
      }
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    setSavedCustomSymptoms(getStoredCustomSymptoms());
  });

  const handleToggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter((s) => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const handleAddCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (!trimmed) return;

    const error = validateSymptom(trimmed);
    if (error) {
      Taro.showToast({ title: error, icon: "none" });
      return;
    }

    if (symptoms.includes(trimmed)) {
      Taro.showToast({ title: "已添加该症状", icon: "none" });
      return;
    }
    setSymptoms([...symptoms, trimmed]);
    setCustomSymptom("");
    // 保存到本地存储（如果不是预设的）
    if (!SYMPTOM_SHORTCUTS.includes(trimmed as (typeof SYMPTOM_SHORTCUTS)[number])) {
      saveCustomSymptom(trimmed);
      setSavedCustomSymptoms(getStoredCustomSymptoms());
    }
  };

  const handleDeleteCustomSymptom = async (symptom: string) => {
    const res = await Taro.showModal({
      title: "删除症状",
      content: `确定要删除"${symptom}"吗？`,
    });
    if (res.confirm) {
      removeCustomSymptom(symptom);
      setSavedCustomSymptoms(getStoredCustomSymptoms());
      setSymptoms(symptoms.filter((s) => s !== symptom));
    }
  };

  const handleDelete = async () => {
    if (!editId) return;

    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        await symptomService.delete(editId);
        Taro.showToast({ title: "已删除", icon: "success" });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        symptoms,
        severity: symptoms.length > 0 ? severity : undefined,
        overallFeeling,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await symptomService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await symptomService.add(data);
        Taro.showToast({ title: "记录成功", icon: "success" });
      }

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

  if (loading) {
    return (
      <View className="add-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

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
        <Text className="section-title">症状（可选）</Text>
        <View className="symptom-shortcuts">
          {SYMPTOM_SHORTCUTS.map((symptom) => (
            <View
              key={symptom}
              className={`symptom-tag ${symptoms.includes(symptom) ? "active" : ""}`}
              onClick={() => handleToggleSymptom(symptom)}
            >
              {symptom}
            </View>
          ))}
          {savedCustomSymptoms.map((symptom) => (
            <View
              key={symptom}
              className={`symptom-tag custom ${symptoms.includes(symptom) ? "active" : ""}`}
              onClick={() => handleToggleSymptom(symptom)}
              onLongPress={() => handleDeleteCustomSymptom(symptom)}
            >
              {symptom}
            </View>
          ))}
        </View>
        <View className="custom-symptom-row">
          <Input
            className="custom-symptom-input"
            placeholder="输入其他症状"
            value={customSymptom}
            onInput={(e) => setCustomSymptom(e.detail.value)}
            onConfirm={handleAddCustomSymptom}
          />
          <View className="custom-symptom-add" onClick={handleAddCustomSymptom}>
            添加
          </View>
        </View>
      </View>

      {/* 严重程度 */}
      {symptoms.length > 0 && (
        <View className="section">
          <Text className="section-title">严重程度</Text>
          <View className="severity-options">
            {SEVERITY_OPTIONS.map((option) => (
              <View
                key={option.value}
                className={`severity-item ${severity === option.value ? "active" : ""}`}
                style={{
                  borderColor: severity === option.value ? option.color : "#f0f0f0",
                  backgroundColor: severity === option.value ? `${option.color}15` : "transparent",
                }}
                onClick={() => setSeverity(option.value as SymptomRecord["severity"])}
              >
                <View className="severity-dot" style={{ backgroundColor: option.color }} />
                <Text className="severity-label">{option.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </View>
        {isEdit && (
          <View className="delete-btn" onClick={handleDelete}>
            删除记录
          </View>
        )}
      </View>
    </View>
  );
}
