import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { stoolService } from "../../../services/stool";
import { BRISTOL_TYPES, STOOL_AMOUNTS, NOTE_SHORTCUTS } from "../../../constants/stool";
import { formatDate, formatTime } from "../../../utils/date";
import { showError } from "../../../utils/error";
import BristolIcon from "../../../components/BristolIcon";
import CalendarPopup from "../../../components/CalendarPopup";
import TimePicker from "../../../components/TimePicker";
import type { StoolRecord } from "../../../types";
import "./index.css";

export default function StoolAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [bristolType, setBristolType] = useState<StoolRecord["type"]>(4);
  const [amount, setAmount] = useState<StoolRecord["amount"]>(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await stoolService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setBristolType(record.type);
        setAmount(record.amount);
        setNote(record.note || "");
      }
    } catch (error) {
      showError("加载失败", error);
    } finally {
      setLoading(false);
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
        await stoolService.delete(editId);
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

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        type: bristolType,
        amount,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await stoolService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await stoolService.add(data);
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
