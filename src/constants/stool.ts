// Bristol 大便分类法
export const BRISTOL_TYPES = [
  { value: 1, label: "分散硬块", emoji: "🪨", desc: "严重便秘" },
  { value: 2, label: "块状香肠形", emoji: "🪵", desc: "轻度便秘" },
  { value: 3, label: "有裂纹香肠形", emoji: "🌽", desc: "正常" },
  { value: 4, label: "光滑香肠形", emoji: "🍌", desc: "理想" },
  { value: 5, label: "软块状", emoji: "🫘", desc: "缺乏纤维" },
  { value: 6, label: "糊状", emoji: "🍛", desc: "轻度腹泻" },
  { value: 7, label: "水样", emoji: "💧", desc: "严重腹泻" },
] as const;

// 量选项
export const STOOL_AMOUNTS = [
  { value: 1, label: "少量" },
  { value: 2, label: "适中" },
  { value: 3, label: "大量" },
] as const;

// 颜色选项
export const STOOL_COLORS = [
  { value: "normal", label: "正常" },
  { value: "dark", label: "深色" },
  { value: "light", label: "浅色" },
  { value: "red", label: "带红" },
  { value: "black", label: "黑色" },
] as const;
