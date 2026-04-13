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

// 症状记录
export interface SymptomRecord extends BaseRecord {
  symptoms: string[]; // 症状列表
  severity?: 1 | 2 | 3; // 整体严重程度：轻度、中度、重度
  overallFeeling: 1 | 2 | 3 | 4 | 5; // 整体感受 1很差 - 5很好
  note?: string;
}

// 饮食记录
export interface MealRecord extends BaseRecord {
  foods: string[];
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
  note?: string;
}

// 排便记录
export interface StoolRecord extends BaseRecord {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Bristol 分类
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
  note?: string;
}

// 用药记录
export interface MedicationRecord extends BaseRecord {
  name: string;
  dosage: string;
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
  examDate: string; // 检查日期
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
}
