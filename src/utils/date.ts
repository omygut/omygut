// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化时间为 HH:mm，分钟向下取整到5分钟
export function formatTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// 格式化显示日期 (2025年4月10日)
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 获取星期几
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export function getWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  return WEEKDAYS[date.getDay()];
}

// 获取前一天日期
export function getPrevDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

// 获取后一天日期
export function getNextDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}
