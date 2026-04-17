import { View, Text, Input } from "@tarojs/components";
import { useState, useEffect } from "react";
import CalendarPopup from "../CalendarPopup";
import { formatDate } from "../../utils/date";
import type { ChartEvent } from "../../types";
import "./index.css";

interface EventFormPopupProps {
  visible: boolean;
  event?: ChartEvent;
  onConfirm: (date: string, description: string) => void;
  onClose: () => void;
}

export default function EventFormPopup({
  visible,
  event,
  onConfirm,
  onClose,
}: EventFormPopupProps) {
  const [date, setDate] = useState(() => event?.date || formatDate());
  const [description, setDescription] = useState(() => event?.description || "");
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(event?.date || formatDate());
      setDescription(event?.description || "");
    }
  }, [visible, event]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (!description.trim()) return;
    onConfirm(date, description.trim());
  };

  return (
    <View className="event-form-mask" onClick={onClose}>
      <View className="event-form-popup" onClick={(e) => e.stopPropagation()}>
        <View className="event-form-header">
          <Text className="event-form-title">{event ? "编辑事件" : "添加事件"}</Text>
        </View>

        <View className="event-form-field">
          <Text className="event-form-label">日期</Text>
          <View className="event-form-date" onClick={() => setCalendarVisible(true)}>
            <Text>{date}</Text>
          </View>
        </View>

        <View className="event-form-field">
          <Text className="event-form-label">描述</Text>
          <Input
            className="event-form-input"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            placeholder="例如：开始服用益生菌"
            maxlength={20}
          />
        </View>

        <View className="event-form-actions">
          <View className="event-form-btn cancel" onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View
            className={`event-form-btn confirm ${!description.trim() ? "disabled" : ""}`}
            onClick={handleConfirm}
          >
            <Text>确定</Text>
          </View>
        </View>
      </View>

      <CalendarPopup
        visible={calendarVisible}
        value={date}
        onChange={setDate}
        onClose={() => setCalendarVisible(false)}
      />
    </View>
  );
}
