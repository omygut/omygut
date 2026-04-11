// 用户信息
export interface User {
  _id: string; // openid
  nickname?: string;
  avatar?: string;
  createdAt: Date;
}

// 症状
export interface Symptom {
  type: string;
  severity: 1 | 2 | 3; // 轻度、中度、重度
}

// 症状记录
export interface SymptomRecord {
  _id?: string;
  userId: string;
  date: string; // 2026-04-10
  time?: string; // 08:30
  symptoms: Symptom[];
  overallFeeling: 1 | 2 | 3 | 4 | 5; // 整体感受 1很差 - 5很好
  note?: string;
  createdAt: Date;
}

// 饮食记录
export interface MealRecord {
  _id?: string;
  userId: string;
  date: string;
  time: string;
  foods: string[];
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
  note?: string;
  createdAt: Date;
}

// 排便记录
export interface BowelRecord {
  _id?: string;
  userId: string;
  date: string;
  time: string;
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Bristol 分类
  color?: "normal" | "dark" | "light" | "red" | "black";
  hasBlood?: boolean;
  hasMucus?: boolean;
  urgency?: 1 | 2 | 3;
  note?: string;
  createdAt: Date;
}

// 用药记录
export interface MedicationRecord {
  _id?: string;
  userId: string;
  date: string;
  time: string;
  name: string;
  dosage: string;
  note?: string;
  createdAt: Date;
}

// 医疗检查记录
export interface MedicalRecord {
  _id?: string;
  userId: string;
  date: string;
  type: "blood" | "stool" | "colonoscopy" | "gastroscopy" | "ct" | "ultrasound" | "other";
  hospital?: string;
  result?: string;
  images?: string[];
  note?: string;
  createdAt: Date;
}
