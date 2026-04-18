import type { AssessmentType, AssessmentLevel } from "../types";

// 评估类型选项
export const ASSESSMENT_TYPES: { value: AssessmentType; label: string; description: string }[] = [
  { value: "hbi", label: "HBI", description: "Harvey-Bradshaw 指数，5项简化评估" },
  { value: "cdai", label: "CDAI", description: "克罗恩病活动指数，8项全面评估" },
];

// 病情分级
export const ASSESSMENT_LEVELS: Record<AssessmentLevel, { label: string; color: string }> = {
  remission: { label: "缓解期", color: "#52c41a" },
  mild: { label: "轻度活动", color: "#faad14" },
  moderate: { label: "中度活动", color: "#fa8c16" },
  severe: { label: "重度活动", color: "#f5222d" },
};

// HBI 问卷配置
export const HBI_QUESTIONS = {
  generalWellbeing: {
    label: "一般状况",
    description: "计分：选项对应分值直接计入总分",
    options: [
      { value: 0, label: "良好" },
      { value: 1, label: "略低于正常" },
      { value: 2, label: "较差" },
      { value: 3, label: "很差" },
      { value: 4, label: "极差" },
    ],
  },
  abdominalPain: {
    label: "腹痛",
    description: "计分：选项对应分值直接计入总分",
    options: [
      { value: 0, label: "无" },
      { value: 1, label: "轻度" },
      { value: 2, label: "中度" },
      { value: 3, label: "重度" },
    ],
  },
  liquidStools: {
    label: "每日腹泻次数",
    description: "计分：次数直接计入总分（取7天平均）",
    type: "number" as const,
    autoFill: true,
    placeholder: "过去一天的稀便次数",
  },
  abdominalMass: {
    label: "腹部包块",
    description: "计分：选项对应分值直接计入总分",
    options: [
      { value: 0, label: "无" },
      { value: 1, label: "可疑" },
      { value: 2, label: "确定" },
      { value: 3, label: "确定且有压痛" },
    ],
  },
  complications: {
    label: "并发症",
    description: "计分：每项并发症计1分",
    type: "multiSelect" as const,
    options: [
      { value: "arthralgia", label: "关节痛" },
      { value: "uveitis", label: "虹膜炎" },
      { value: "erythemaNodosum", label: "结节性红斑" },
      { value: "pyodermaGangrenosum", label: "坏疽性脓皮病" },
      { value: "apthousUlcers", label: "口腔溃疡" },
      { value: "analFissure", label: "肛裂" },
      { value: "fistula", label: "肛瘘" },
      { value: "abscess", label: "肛周脓肿" },
    ],
  },
};

// CDAI 问卷配置
export const CDAI_QUESTIONS = {
  liquidStools: {
    label: "过去7天腹泻总次数",
    description: "计分：次数×2",
    type: "number" as const,
    coefficient: 2,
    autoFill: true,
    placeholder: "稀便或水样便次数",
  },
  abdominalPain: {
    label: "过去7天腹痛程度总和",
    description: "计分：(每天评分0无1轻2中3重，7天相加)×5",
    type: "number" as const,
    coefficient: 5,
    placeholder: "0-21",
  },
  generalWellbeing: {
    label: "过去7天一般状况总和",
    description: "计分：(每天评分0良好1略差2较差3很差4极差，7天相加)×7",
    type: "number" as const,
    coefficient: 7,
    placeholder: "0-28",
  },
  complications: {
    label: "并发症数量",
    description: "计分：每项并发症×20",
    type: "multiSelect" as const,
    coefficient: 20,
    options: [
      { value: "arthritis", label: "关节炎/关节痛" },
      { value: "iritis", label: "虹膜炎/葡萄膜炎" },
      { value: "erythemaNodosum", label: "结节性红斑" },
      { value: "pyodermaGangrenosum", label: "坏疽性脓皮病" },
      { value: "apthousStomatitis", label: "口腔溃疡" },
      { value: "analFissure", label: "肛裂/肛瘘/肛周脓肿" },
      { value: "fever", label: "发热 >37.8°C" },
    ],
  },
  antidiarrheal: {
    label: "使用止泻药",
    description: "计分：是=1×30，否=0",
    autoFill: true,
    options: [
      { value: 0, label: "否" },
      { value: 1, label: "是" },
    ],
    coefficient: 30,
  },
  abdominalMass: {
    label: "腹部包块",
    description: "计分：选项对应分值×10",
    options: [
      { value: 0, label: "无" },
      { value: 2, label: "可疑" },
      { value: 5, label: "确定" },
    ],
    coefficient: 10,
  },
  hematocrit: {
    label: "血细胞比容 (Hct)",
    description: "计分：|标准值-实际值|×6 (男性标准47，女性标准42)",
    type: "number" as const,
    coefficient: 6,
    autoFill: true,
    placeholder: "百分比，如 42",
  },
  weightChange: {
    label: "体重变化",
    description: "计分：(1-实际体重/标准体重)×100",
    type: "number" as const,
    coefficient: 1,
    placeholder: "低于标准体重的百分比",
  },
};

// HBI 分级阈值
export const HBI_THRESHOLDS: { max: number; level: AssessmentLevel }[] = [
  { max: 4, level: "remission" },
  { max: 7, level: "mild" },
  { max: 16, level: "moderate" },
  { max: Infinity, level: "severe" },
];

// CDAI 分级阈值
export const CDAI_THRESHOLDS: { max: number; level: AssessmentLevel }[] = [
  { max: 149, level: "remission" },
  { max: 220, level: "mild" },
  { max: 450, level: "moderate" },
  { max: Infinity, level: "severe" },
];

// 计算 HBI 分数
export function calculateHBI(answers: Record<string, number | string[]>): number {
  let score = 0;
  score += (answers.generalWellbeing as number) || 0;
  score += (answers.abdominalPain as number) || 0;
  score += (answers.liquidStools as number) || 0;
  score += (answers.abdominalMass as number) || 0;
  score += Array.isArray(answers.complications) ? answers.complications.length : 0;
  return score;
}

// 计算 CDAI 分数
export function calculateCDAI(
  answers: Record<string, number | string[]>,
  gender: "male" | "female" = "male",
): number {
  const standardHct = gender === "male" ? 47 : 42;
  let score = 0;

  score += ((answers.liquidStools as number) || 0) * 2;
  score += ((answers.abdominalPain as number) || 0) * 5;
  score += ((answers.generalWellbeing as number) || 0) * 7;
  score += (Array.isArray(answers.complications) ? answers.complications.length : 0) * 20;
  score += ((answers.antidiarrheal as number) || 0) * 30;
  score += ((answers.abdominalMass as number) || 0) * 10;

  // Hct 差值：(标准值 - 实际值) × 6，女性为负数时取绝对值
  const hct = (answers.hematocrit as number) || standardHct;
  score += Math.abs(standardHct - hct) * 6;

  // 体重变化百分比
  score += (answers.weightChange as number) || 0;

  return Math.round(score);
}

// 根据分数获取分级
export function getAssessmentLevel(type: AssessmentType, score: number): AssessmentLevel {
  const thresholds = type === "hbi" ? HBI_THRESHOLDS : CDAI_THRESHOLDS;
  for (const { max, level } of thresholds) {
    if (score <= max) return level;
  }
  return "severe";
}
