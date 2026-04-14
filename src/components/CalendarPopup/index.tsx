import { View, Text } from "@tarojs/components";
import { useState, useEffect } from "react";
import { formatDate } from "../../utils/date";
import "./index.css";

interface CalendarPopupProps {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

// 获取某月的天数
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 获取某月第一天是星期几
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// 生成日历网格数据
function generateCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = [];

  // 前面的空白
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 当月的天数
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

export default function CalendarPopup({ visible, value, onChange, onClose }: CalendarPopupProps) {
  const today = formatDate();
  const [viewYear, setViewYear] = useState(() => parseInt(value.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(value.slice(5, 7)) - 1);

  // 当 value 改变时，更新视图月份
  useEffect(() => {
    setViewYear(parseInt(value.slice(0, 4)));
    setViewMonth(parseInt(value.slice(5, 7)) - 1);
  }, [value]);

  if (!visible) return null;

  const days = generateCalendarDays(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const todayYear = parseInt(today.slice(0, 4));
    const todayMonth = parseInt(today.slice(5, 7)) - 1;

    // 不能超过今天所在月份
    if (viewYear > todayYear || (viewYear === todayYear && viewMonth >= todayMonth)) {
      return;
    }

    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number | null) => {
    if (day === null) return;

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 不能选择未来的日期
    if (dateStr > today) return;

    onChange(dateStr);
    onClose();
  };

  const isToday = (day: number | null): boolean => {
    if (day === null) return false;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === today;
  };

  const isSelected = (day: number | null): boolean => {
    if (day === null) return false;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === value;
  };

  const isFuture = (day: number | null): boolean => {
    if (day === null) return false;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr > today;
  };

  const todayYear = parseInt(today.slice(0, 4));
  const todayMonth = parseInt(today.slice(5, 7)) - 1;
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  return (
    <View className="calendar-popup-mask" onClick={onClose}>
      <View className="calendar-popup" onClick={(e) => e.stopPropagation()}>
        {/* 月份标题 */}
        <View className="calendar-header">
          <Text className="calendar-nav" onClick={handlePrevMonth}>
            ◀
          </Text>
          <Text className="calendar-title">
            {viewYear}年{viewMonth + 1}月
          </Text>
          <Text
            className={`calendar-nav ${isCurrentMonth ? "disabled" : ""}`}
            onClick={handleNextMonth}
          >
            ▶
          </Text>
        </View>

        {/* 星期标题 */}
        <View className="calendar-weekdays">
          {WEEKDAYS.map((day) => (
            <Text key={day} className="calendar-weekday">
              {day}
            </Text>
          ))}
        </View>

        {/* 日期网格 */}
        <View className="calendar-days">
          {days.map((day, index) => (
            <View
              key={index}
              className={`calendar-day ${day === null ? "empty" : ""} ${isToday(day) ? "today" : ""} ${isSelected(day) ? "selected" : ""} ${isFuture(day) ? "future" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              {day !== null && <Text className="day-text">{day}</Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
