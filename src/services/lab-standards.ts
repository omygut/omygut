import type { LabTestIndicator } from "../types";
import { STANDARD_INDICATORS } from "../data/lab-indicators";

// 标准指标定义
export interface StandardIndicator {
  category: string;
  nameZh: string;
  abbr: string;
  unit: string;
  refValue?: string;
  refMin?: number;
  refMax?: number;
  aliases?: string[];
}

/**
 * 查找标准指标
 */
export function findStandardIndicator(name: string): StandardIndicator | undefined {
  // 精确匹配：名称或缩写
  let found = STANDARD_INDICATORS.find((ind) => ind.nameZh === name || ind.abbr === name);
  if (found) return found;

  // 别名匹配
  found = STANDARD_INDICATORS.find((ind) => ind.aliases?.some((alias) => alias === name));
  if (found) return found;

  // 模糊匹配：包含关系
  found = STANDARD_INDICATORS.find((ind) => name.includes(ind.nameZh) || ind.nameZh.includes(name));
  if (found) return found;

  // 别名模糊匹配
  found = STANDARD_INDICATORS.find((ind) =>
    ind.aliases?.some((alias) => name.includes(alias) || alias.includes(name)),
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
