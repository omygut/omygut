import { View, Text, Textarea, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { stoolService } from "../../../services/stool";
import { BRISTOL_TYPES, STOOL_AMOUNTS, NOTE_SHORTCUTS } from "../../../constants/stool";
import { formatDate, formatTime } from "../../../utils/date";
import BristolIcon from "../../../components/BristolIcon";
import type { StoolRecord } from "../../../types";
import "./index.css";

export default function StoolAdd() {
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [bristolType, setBristolType] = useState<StoolRecord["type"]>(4);
  const [amount, setAmount] = useState<StoolRecord["amount"]>(2);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await stoolService.add({
        date,
        time,
        type: bristolType,
        amount,
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

      {/* Bristol 类型 */}
      <View className="section">
        <Text className="section-title">Bristol 类型</Text>
        <View className="bristol-options">
          {BRISTOL_TYPES.map((option) => (
            <View
              key={option.value}
              className={`bristol-item ${bristolType === option.value ? "active" : ""}`}
              onClick={() => setBristolType(option.value as StoolRecord["type"])}
            >
              <BristolIcon type={option.value} size={48} />
            </View>
          ))}
        </View>
        <View className="bristol-selected">
          <Text className="bristol-selected-label">{BRISTOL_TYPES[bristolType - 1].label}</Text>
          <Text className="bristol-selected-desc">{BRISTOL_TYPES[bristolType - 1].desc}</Text>
        </View>
      </View>

      {/* 量 */}
      <View className="section">
        <Text className="section-title">量</Text>
        <View className="amount-options">
          {STOOL_AMOUNTS.map((option) => (
            <View
              key={option.value}
              className={`amount-item ${amount === option.value ? "active" : ""}`}
              onClick={() => setAmount(option.value as StoolRecord["amount"])}
            >
              <Text className="amount-label">{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 备注 */}
      <View className="section">
        <Text className="section-title">备注</Text>
        <View className="note-shortcuts">
          {NOTE_SHORTCUTS.map((shortcut) => (
            <View
              key={shortcut}
              className="note-shortcut"
              onClick={() => {
                const newNote = note ? `${note}、${shortcut}` : shortcut;
                setNote(newNote);
              }}
            >
              {shortcut}
            </View>
          ))}
        </View>
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
