import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { medicationService } from "../../../services/medication";
import { MEDICATION_CATEGORIES } from "../../../constants/medication";
import { formatDate, formatTime } from "../../../utils/date";
import { showError } from "../../../utils/error";
import { validateMedication } from "../../../utils/validation";
import CalendarPopup from "../../../components/CalendarPopup";
import TimePicker from "../../../components/TimePicker";
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
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(-1); // -1 = 常用
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customMedications, setCustomMedications] = useState<string[]>([]);
  const [topMedications, setTopMedications] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await medicationService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setSelectedMedications(record.names);
        setNote(record.note || "");
      }
    } catch (error) {
      showError("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

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

    const error = validateMedication(medication);
    if (error) {
      Taro.showToast({ title: error, icon: "none" });
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

  const handleDelete = async () => {
    if (!editId) return;

    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        await medicationService.delete(editId);
        Taro.showToast({ title: "已删除", icon: "success" });
        Taro.eventCenter.trigger("recordChange");
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } catch (error) {
        showError("删除失败", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (selectedMedications.length === 0) {
      Taro.showToast({ title: "请选择至少一种药物", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        names: selectedMedications,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await medicationService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await medicationService.add(data);
        Taro.showToast({ title: "记录成功", icon: "success" });
      }

      Taro.eventCenter.trigger("recordChange");
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      showError("保存失败", error);
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
          <View className="picker-value" onClick={() => setCalendarVisible(true)}>
            {date}
          </View>
          <TimePicker value={time} onChange={setTime} />
        </View>
        <CalendarPopup
          visible={calendarVisible}
          value={date}
          onChange={setDate}
          onClose={() => setCalendarVisible(false)}
        />
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
            我的常用
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
          autoHeight
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
