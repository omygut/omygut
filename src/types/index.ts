// 记录类型
export const RECORD_TYPES = [
  "symptom",
  "medication",
  "meal",
  "stool",
  "exercise",
  "labtest",
  "exam",
  "assessment",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export interface RecordTypeOption {
  value: RecordType;
  label: string;
  icon: string;
  addPath: string;
}

export const RECORD_TYPE_OPTIONS: RecordTypeOption[] = [
  { value: "symptom", label: "身体状态", icon: "🌱", addPath: "/pages/symptom/add/index" },
  { value: "meal", label: "饮食", icon: "🍱", addPath: "/pages/meal/add/index" },
  { value: "stool", label: "排便", icon: "💩", addPath: "/pages/stool/add/index" },
  { value: "exercise", label: "运动", icon: "🧘", addPath: "/pages/exercise/add/index" },
  { value: "medication", label: "用药", icon: "💊", addPath: "/pages/medication/add/index" },
  { value: "labtest", label: "化验", icon: "🧪", addPath: "/pages/labtest/add/index" },
  { value: "exam", label: "检查", icon: "🩺", addPath: "/pages/exam/add/index" },
  { value: "assessment", label: "评估", icon: "📋", addPath: "/pages/assessment/add/index" },
];

// 用户信息
export interface User {
  _id: string; // openid
  nickname?: string;
  avatar?: string;
  createdAt: Date;
}

// 基础记录 - 所有记录共有的属性
export interface BaseRecord {
  _id?: string;
  userId: string;
  date: string; // 2026-04-10
  time: string; // 08:30
  createdAt: Date;
  deletedAt?: Date;
}

// 症状项（带独立严重程度）
export interface SymptomItem {
  name: string;
  severity: 1 | 2 | 3; // 1轻度 2中度 3重度
}

// 状态记录（原症状记录）
export interface SymptomRecord extends BaseRecord {
  // 旧字段（只读，兼容旧数据）
  symptoms?: string[];
  severity?: 1 | 2 | 3;

  // 新字段
  symptomItems?: SymptomItem[];

  overallFeeling?: 1 | 2 | 3 | 4 | 5; // 整体感受 1很差 - 5很好
  weight?: number; // 体重（kg），支持一位小数
  note?: string;
}

// 饮食记录
export interface MealRecord extends BaseRecord {
  foods: string[];
  amount: 0 | 1 | 2 | 3 | 4; // 0-少量 1-较少 2-适中 3-较多 4-大量
  note?: string;
}

// 排便记录
export interface StoolRecord extends BaseRecord {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Bristol 分类
  amount: 1 | 2 | 3 | 4 | 5; // 1-极少 2-少量 3-适中 4-较多 5-大量
  note?: string;
}

// 用药记录
export interface MedicationRecord extends BaseRecord {
  names: string[];
  note?: string;
}

// 运动记录
export interface ExerciseRecord extends BaseRecord {
  type: string; // 运动类型（如"跑步"）
  duration: 15 | 30 | 45 | 60 | 90 | 120; // 时长（分钟）
  intensity: 1 | 2 | 3; // 强度：1轻松/2适中/3剧烈
  note?: string;
}

// 化验指标
export interface LabTestIndicator {
  name: string; // 指标名称
  value: string; // 数值
  unit?: string; // 单位
}

// 化验记录
export interface LabTestRecord extends BaseRecord {
  specimen: "血液" | "尿液" | "粪便" | "其他"; // 标本类型
  imageFileIds: string[]; // 原图云存储 ID 列表
  indicators: LabTestIndicator[];
  note?: string;
}

// 检查记录
export interface ExamRecord extends BaseRecord {
  examType: string; // 检查类型：B超、CT、MRI、肠镜、胃镜等
  examName?: string; // 具体检查名称，如"胸部CT"、"肠道超声"
  imageFileIds: string[]; // 报告图片云存储 ID 列表
  content?: string; // AI识别的报告完整内容
  note?: string;
}

// 导出数据
export interface ExportData {
  exportedAt: string;
  stool_records: StoolRecord[];
  symptom_records: SymptomRecord[];
  meal_records: MealRecord[];
  medication_records: MedicationRecord[];
  exercise_records: ExerciseRecord[];
  labtest_records: LabTestRecord[];
  exam_records: ExamRecord[];
  assessment_records: AssessmentRecord[];
}

// 病情评估记录
export type AssessmentType = "hbi" | "cdai";
export type AssessmentLevel = "remission" | "mild" | "moderate" | "severe";

export interface AssessmentRecord extends BaseRecord {
  type: AssessmentType;
  score: number;
  level: AssessmentLevel;
  answers: Record<string, number>; // 各项答案
  autoFilled?: {
    stoolCount?: { from: string; to: string }; // 腹泻次数的日期范围
    hct?: string; // labtest record id
  };
  note?: string;
}

// 图表事件标注
export interface ChartEvent {
  id: string; // unique identifier (timestamp-based)
  date: string; // "2026-03-15"
  description: string; // "开始服用益生菌"
}
