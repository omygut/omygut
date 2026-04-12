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
  note?: string;
  createdAt: Date;
  deletedAt?: Date;
}

// 症状记录
export interface SymptomRecord extends BaseRecord {
  symptoms: string[]; // 症状列表
  severity?: 1 | 2 | 3; // 整体严重程度：轻度、中度、重度
  overallFeeling: 1 | 2 | 3 | 4 | 5; // 整体感受 1很差 - 5很好
}

// 饮食记录
export interface MealRecord extends BaseRecord {
  foods: string[];
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
}

// 排便记录
export interface StoolRecord extends BaseRecord {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Bristol 分类
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
}

// 用药记录
export interface MedicationRecord extends BaseRecord {
  name: string;
  dosage: string;
}
