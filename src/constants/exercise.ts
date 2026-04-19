// 运动分类预设
export const EXERCISE_CATEGORIES = [
  {
    name: "有氧",
    items: [
      { name: "跑步", emoji: "🏃" },
      { name: "快走", emoji: "🚶" },
      { name: "游泳", emoji: "🏊" },
      { name: "骑行", emoji: "🚴" },
      { name: "跳绳", emoji: "🪢" },
      { name: "健身操", emoji: "🤸" },
      { name: "爬楼梯", emoji: "🪜" },
      { name: "椭圆机", emoji: "🏋️" },
      { name: "划船机", emoji: "🚣" },
    ],
  },
  {
    name: "力量",
    items: [
      { name: "举重", emoji: "🏋️" },
      { name: "俯卧撑", emoji: "💪" },
      { name: "深蹲", emoji: "🦵" },
      { name: "引体向上", emoji: "🙆" },
      { name: "哑铃", emoji: "🏋️" },
      { name: "杠铃", emoji: "🏋️" },
      { name: "器械训练", emoji: "🎰" },
    ],
  },
  {
    name: "柔韧",
    items: [
      { name: "瑜伽", emoji: "🧘" },
      { name: "普拉提", emoji: "🤸" },
      { name: "拉伸", emoji: "🙆" },
      { name: "太极", emoji: "☯️" },
    ],
  },
  {
    name: "球类",
    items: [
      { name: "篮球", emoji: "🏀" },
      { name: "足球", emoji: "⚽" },
      { name: "羽毛球", emoji: "🏸" },
      { name: "乒乓球", emoji: "🏓" },
      { name: "网球", emoji: "🎾" },
      { name: "高尔夫", emoji: "⛳" },
      { name: "排球", emoji: "🏐" },
    ],
  },
  {
    name: "其他",
    items: [
      { name: "散步", emoji: "🚶" },
      { name: "爬山", emoji: "🧗" },
      { name: "滑雪", emoji: "⛷️" },
      { name: "滑冰", emoji: "⛸️" },
      { name: "跳舞", emoji: "💃" },
      { name: "武术", emoji: "🥋" },
    ],
  },
] as const;

// 时长选项（分钟）
export const DURATION_OPTIONS = [
  { value: 15, label: "15分钟" },
  { value: 30, label: "30分钟" },
  { value: 45, label: "45分钟" },
  { value: 60, label: "1小时" },
  { value: 90, label: "1.5小时" },
  { value: 120, label: "2小时" },
] as const;

// 强度选项
export const INTENSITY_OPTIONS = [
  { value: 1, label: "轻松", desc: "可以正常聊天" },
  { value: 2, label: "适中", desc: "呼吸加快，微微出汗" },
  { value: 3, label: "剧烈", desc: "大量出汗，难以说话" },
] as const;
