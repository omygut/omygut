import type { LabTestIndicator } from "../types";
import { STANDARD_INDICATORS } from "../data/labtest-indicators";

// 标本类型
export type SpecimenType = "血液" | "尿液" | "粪便" | "其他";

// 标准指标定义
export interface StandardIndicator {
  specimen: SpecimenType;
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
 * 清理指标名称中的前后非中英文字符
 */
function cleanIndicatorName(name: string): string {
  return name.replace(/^[^a-zA-Z\u4e00-\u9fa5]+|[^a-zA-Z\u4e00-\u9fa5]+$/g, "").trim();
}

/**
 * 查找标准指标
 * @param name 指标名称
 * @param specimen 标本类型，用于过滤
 */
export function findStandardIndicator(
  name: string,
  specimen?: SpecimenType,
): StandardIndicator | undefined {
  const cleanName = cleanIndicatorName(name);
  const candidates = specimen
    ? STANDARD_INDICATORS.filter((ind) => ind.specimen === specimen)
    : STANDARD_INDICATORS;

  // 精确匹配：名称或缩写
  let found = candidates.find((ind) => ind.nameZh === cleanName || ind.abbr === cleanName);
  if (found) return found;

  // 别名匹配
  found = candidates.find((ind) => ind.aliases?.some((alias) => alias === cleanName));
  if (found) return found;

  // 模糊匹配：包含关系
  found = candidates.find(
    (ind) => cleanName.includes(ind.nameZh) || ind.nameZh.includes(cleanName),
  );
  if (found) return found;

  // 别名模糊匹配
  found = candidates.find((ind) =>
    ind.aliases?.some((alias) => cleanName.includes(alias) || alias.includes(cleanName)),
  );
  if (found) return found;

  return undefined;
}

/**
 * 归一化指标
 */
export function normalizeIndicator(
  indicator: LabTestIndicator,
  specimen?: SpecimenType,
): LabTestIndicator & {
  standardName?: string;
  category?: string;
  refMin?: number;
  refMax?: number;
  refValue?: string;
} {
  const standard = findStandardIndicator(indicator.name, specimen);

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
export function normalizeIndicators(indicators: LabTestIndicator[], specimen?: SpecimenType) {
  return indicators.map((ind) => normalizeIndicator(ind, specimen));
}
