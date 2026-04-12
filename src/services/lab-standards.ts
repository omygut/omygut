import type { LabTestIndicator } from "../types";

// 标准指标定义
export interface StandardIndicator {
  category: string;
  nameZh: string;
  abbr: string;
  unit: string;
  refValue?: string;
  refMin?: number;
  refMax?: number;
}

// 标准指标库（从 CSV 转换）
const STANDARD_INDICATORS: StandardIndicator[] = [
  // 血常规
  {
    category: "血常规",
    nameZh: "白细胞计数",
    abbr: "WBC",
    unit: "×10⁹/L",
    refMin: 4.0,
    refMax: 10.0,
  },
  {
    category: "血常规",
    nameZh: "红细胞计数",
    abbr: "RBC",
    unit: "×10¹²/L",
    refMin: 3.8,
    refMax: 5.9,
  },
  { category: "血常规", nameZh: "血红蛋白", abbr: "HGB", unit: "g/L", refMin: 115, refMax: 175 },
  { category: "血常规", nameZh: "红细胞压积", abbr: "HCT", unit: "%", refMin: 35, refMax: 50 },
  {
    category: "血常规",
    nameZh: "平均红细胞体积",
    abbr: "MCV",
    unit: "fL",
    refMin: 80,
    refMax: 100,
  },
  { category: "血常规", nameZh: "平均血红蛋白量", abbr: "MCH", unit: "pg", refMin: 27, refMax: 34 },
  {
    category: "血常规",
    nameZh: "平均血红蛋白浓度",
    abbr: "MCHC",
    unit: "g/L",
    refMin: 320,
    refMax: 360,
  },
  {
    category: "血常规",
    nameZh: "血小板计数",
    abbr: "PLT",
    unit: "×10⁹/L",
    refMin: 100,
    refMax: 300,
  },
  {
    category: "血常规",
    nameZh: "中性粒细胞百分比",
    abbr: "NEUT%",
    unit: "%",
    refMin: 40,
    refMax: 75,
  },
  {
    category: "血常规",
    nameZh: "淋巴细胞百分比",
    abbr: "LYMPH%",
    unit: "%",
    refMin: 20,
    refMax: 50,
  },
  { category: "血常规", nameZh: "单核细胞百分比", abbr: "MONO%", unit: "%", refMin: 3, refMax: 10 },
  {
    category: "血常规",
    nameZh: "嗜酸性粒细胞百分比",
    abbr: "EO%",
    unit: "%",
    refMin: 0.5,
    refMax: 5,
  },
  {
    category: "血常规",
    nameZh: "嗜碱性粒细胞百分比",
    abbr: "BASO%",
    unit: "%",
    refMin: 0,
    refMax: 1,
  },
  // 血沉
  { category: "血沉", nameZh: "红细胞沉降率", abbr: "ESR", unit: "mm/h", refMin: 0, refMax: 20 },
  // C反应蛋白
  { category: "C反应蛋白", nameZh: "C反应蛋白", abbr: "CRP", unit: "mg/L", refMin: 0, refMax: 10 },
  {
    category: "C反应蛋白",
    nameZh: "超敏C反应蛋白",
    abbr: "hs-CRP",
    unit: "mg/L",
    refMin: 0,
    refMax: 3,
  },
  // 肝功能
  {
    category: "肝功能",
    nameZh: "丙氨酸氨基转移酶",
    abbr: "ALT",
    unit: "U/L",
    refMin: 7,
    refMax: 40,
  },
  {
    category: "肝功能",
    nameZh: "天门冬氨酸氨基转移酶",
    abbr: "AST",
    unit: "U/L",
    refMin: 13,
    refMax: 35,
  },
  { category: "肝功能", nameZh: "碱性磷酸酶", abbr: "ALP", unit: "U/L", refMin: 40, refMax: 150 },
  {
    category: "肝功能",
    nameZh: "γ-谷氨酰转移酶",
    abbr: "GGT",
    unit: "U/L",
    refMin: 10,
    refMax: 60,
  },
  { category: "肝功能", nameZh: "总胆红素", abbr: "TBIL", unit: "μmol/L", refMin: 5, refMax: 21 },
  { category: "肝功能", nameZh: "直接胆红素", abbr: "DBIL", unit: "μmol/L", refMin: 0, refMax: 7 },
  { category: "肝功能", nameZh: "间接胆红素", abbr: "IBIL", unit: "μmol/L", refMin: 3, refMax: 14 },
  { category: "肝功能", nameZh: "总蛋白", abbr: "TP", unit: "g/L", refMin: 60, refMax: 80 },
  { category: "肝功能", nameZh: "白蛋白", abbr: "ALB", unit: "g/L", refMin: 35, refMax: 55 },
  { category: "肝功能", nameZh: "球蛋白", abbr: "GLB", unit: "g/L", refMin: 20, refMax: 35 },
  { category: "肝功能", nameZh: "白球比", abbr: "A/G", unit: "", refMin: 1.2, refMax: 2.5 },
  // 肾功能
  { category: "肾功能", nameZh: "血尿素氮", abbr: "BUN", unit: "mmol/L", refMin: 2.8, refMax: 7.1 },
  { category: "肾功能", nameZh: "肌酐", abbr: "CREA", unit: "μmol/L", refMin: 44, refMax: 97 },
  { category: "肾功能", nameZh: "尿酸", abbr: "UA", unit: "μmol/L", refMin: 155, refMax: 428 },
  {
    category: "肾功能",
    nameZh: "估算肾小球滤过率",
    abbr: "eGFR",
    unit: "mL/min/1.73m²",
    refMin: 90,
  },
];

// 别名映射（AI 识别名 -> 标准名）
const ALIASES: Record<string, string> = {
  // 白细胞
  白细胞: "白细胞计数",
  WBC: "白细胞计数",
  // 红细胞
  红细胞: "红细胞计数",
  RBC: "红细胞计数",
  // 血红蛋白
  Hb: "血红蛋白",
  HB: "血红蛋白",
  血红蛋白浓度: "血红蛋白",
  // 红细胞压积
  HCT: "红细胞压积",
  压积: "红细胞压积",
  // 血小板
  血小板: "血小板计数",
  PLT: "血小板计数",
  // 肝功能
  谷丙转氨酶: "丙氨酸氨基转移酶",
  谷草转氨酶: "天门冬氨酸氨基转移酶",
  转氨酶: "丙氨酸氨基转移酶",
  // 肾功能
  尿素氮: "血尿素氮",
  肌酸酐: "肌酐",
  Cr: "肌酐",
};

/**
 * 查找标准指标
 */
export function findStandardIndicator(name: string): StandardIndicator | undefined {
  // 先通过别名查找
  const standardName = ALIASES[name] || name;

  // 精确匹配
  let found = STANDARD_INDICATORS.find(
    (ind) => ind.nameZh === standardName || ind.abbr === standardName,
  );
  if (found) return found;

  // 模糊匹配：包含关系
  found = STANDARD_INDICATORS.find(
    (ind) => standardName.includes(ind.nameZh) || ind.nameZh.includes(standardName),
  );
  if (found) return found;

  return undefined;
}

/**
 * 归一化指标
 */
export function normalizeIndicator(indicator: LabTestIndicator): LabTestIndicator & {
  standardName?: string;
  category?: string;
  refMin?: number;
  refMax?: number;
  refValue?: string;
} {
  const standard = findStandardIndicator(indicator.name);

  if (!standard) {
    return indicator;
  }

  return {
    ...indicator,
    standardName: standard.nameZh,
    category: standard.category,
    refMin: standard.refMin,
    refMax: standard.refMax,
    refValue: standard.refValue,
  };
}

/**
 * 批量归一化指标
 */
export function normalizeIndicators(indicators: LabTestIndicator[]) {
  return indicators.map(normalizeIndicator);
}
