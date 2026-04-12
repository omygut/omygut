// 常见症状快捷输入
export const SYMPTOM_SHORTCUTS = [
  "腹痛",
  "腹胀",
  "呕吐",
  "腹泻",
  "便秘",
  "肠鸣",
  "乏力",
  "发热",
  "口腔溃疡",
  "肛周脓肿",
  "肛瘘",
] as const;

// 严重程度
export const SEVERITY_OPTIONS = [
  { value: 1, label: "轻度", color: "#52c41a" },
  { value: 2, label: "中度", color: "#faad14" },
  { value: 3, label: "重度", color: "#f5222d" },
] as const;

// 整体感受
export const FEELING_OPTIONS = [
  { value: 1, label: "很差", emoji: "😫" },
  { value: 2, label: "较差", emoji: "😟" },
  { value: 3, label: "一般", emoji: "😐" },
  { value: 4, label: "良好", emoji: "😊" },
  { value: 5, label: "很好", emoji: "😄" },
] as const;
