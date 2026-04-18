// 常见症状快捷输入
export const SYMPTOM_SHORTCUTS = [
  "腹痛",
  "腹胀",
  "呕吐",
  "腹泻",
  "便秘",
  "肠鸣",
  "乏力",
  "嗜睡",
  "头疼",
  "发热",
  "感冒",
  "皮疹",
  "皮肤瘙痒",
  "口腔溃疡",
  "肛裂",
  "肛周脓肿",
  "肛瘘",
  "关节痛",
  "虹膜炎",
  "结节性红斑",
] as const;

import { COLORS } from "./colors";

// 严重程度
export const SEVERITY_OPTIONS = [
  { value: 1, label: "轻度", color: COLORS.yellow },
  { value: 2, label: "中度", color: COLORS.orange },
  { value: 3, label: "重度", color: COLORS.red },
] as const;

// 整体感受
export const FEELING_OPTIONS = [
  { value: 1, label: "很差", emoji: "😫" },
  { value: 2, label: "较差", emoji: "😟" },
  { value: 3, label: "一般", emoji: "😐" },
  { value: 4, label: "良好", emoji: "😊" },
  { value: 5, label: "很好", emoji: "😄" },
] as const;
