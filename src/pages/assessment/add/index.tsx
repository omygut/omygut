import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { assessmentService } from "../../../services/assessment";
import { stoolService } from "../../../services/stool";
import { labTestService } from "../../../services/labtest";
import { symptomService } from "../../../services/symptom";
import { getSymptomItems } from "../../../utils/symptom";
import {
  ASSESSMENT_TYPES,
  ASSESSMENT_LEVELS,
  HBI_QUESTIONS,
  CDAI_QUESTIONS,
  HBI_THRESHOLDS,
  CDAI_THRESHOLDS,
  calculateHBI,
  calculateCDAI,
  getAssessmentLevel,
} from "../../../constants/assessment";
import { formatDate, formatTime } from "../../../utils/date";
import { showError } from "../../../utils/error";
import CalendarPopup from "../../../components/CalendarPopup";
import TimePicker from "../../../components/TimePicker";
import type { AssessmentType, AssessmentLevel } from "../../../types";
import "./index.css";

export default function AssessmentAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string[]>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [result, setResult] = useState<{ score: number; level: AssessmentLevel } | null>(null);
  const [fieldHints, setFieldHints] = useState<Record<string, string>>({});
  const [autoFilledData, setAutoFilledData] = useState<{
    stoolCount?: { from: string; to: string; count: number };
    hct?: { recordId: string; value: number; date: string };
  }>({});

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await assessmentService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setAssessmentType(record.type);
        setAnswers(record.answers as Record<string, number | string[]>);
        setNote(record.note || "");
        setResult({ score: record.score, level: record.level });
      }
    } catch (error) {
      showError("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  // 自动填充数据
  const autoFillData = async (type: AssessmentType) => {
    const autoFilled: typeof autoFilledData = {};
    const newAnswers: Record<string, number | string[]> = { ...answers };
    const hints: Record<string, string> = {};

    // 统一使用过去7天
    const today = new Date();
    const toDate = formatDate(today);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const fromDate = formatDate(weekAgo);
    const dateRangeHint = `${fromDate} ~ ${toDate}`;

    // 获取排便记录
    try {
      const stoolRecords = await stoolService.getByDateRange(fromDate, toDate);
      if (stoolRecords.length > 0) {
        const stoolCount = stoolRecords.length;
        autoFilled.stoolCount = { from: fromDate, to: toDate, count: stoolCount };
        newAnswers.liquidStools = stoolCount;
        hints.liquidStools = `从排便记录获取 (${dateRangeHint}，共${stoolCount}次)`;
      } else {
        hints.liquidStools = "暂无近一周排便记录";
      }
    } catch {
      hints.liquidStools = "获取排便记录失败";
    }

    // 从症状记录获取一般状况、腹痛、并发症
    try {
      const symptomRecords = await symptomService.getByDateRange(fromDate, toDate);
      if (symptomRecords.length > 0) {
        // 找到第一条有 overallFeeling 的记录
        const recordWithFeeling = symptomRecords.find((r) => r.overallFeeling !== undefined);

        // 一般状况：从 overallFeeling (1-5) 映射到 generalWellbeing (0-3)
        // 5/4(良好/很好) → 0, 3(一般) → 1, 2(较差) → 2, 1(很差) → 3
        if (recordWithFeeling?.overallFeeling) {
          const feelingMap: Record<number, number> = { 5: 0, 4: 0, 3: 1, 2: 2, 1: 3 };
          newAnswers.generalWellbeing = feelingMap[recordWithFeeling.overallFeeling] ?? 0;
          hints.generalWellbeing = `从身体状态记录获取 (${recordWithFeeling.date})`;
        } else {
          hints.generalWellbeing = "近一周记录无整体感受数据";
        }

        // 收集所有症状
        const allSymptoms = new Set<string>();
        for (const record of symptomRecords) {
          const items = getSymptomItems(record);
          for (const item of items) {
            allSymptoms.add(item.name);
          }
        }

        // 腹痛映射 - 找到最近一条有腹痛的记录
        let painFound = false;
        for (const record of symptomRecords) {
          const items = getSymptomItems(record);
          const painItem = items.find((i) => i.name === "腹痛");
          if (painItem) {
            newAnswers.abdominalPain = painItem.severity;
            hints.abdominalPain = `从症状记录获取 (${record.date})`;
            painFound = true;
            break;
          }
        }
        if (!painFound) {
          newAnswers.abdominalPain = 0; // 无腹痛
          hints.abdominalPain = "近一周无腹痛记录，默认为无";
        }

        // 腹部包块 - 无法从现有数据获取，默认为无
        newAnswers.abdominalMass = 0;
        hints.abdominalMass = "默认为无，如有请手动修改";

        // 并发症映射
        const complicationMap: Record<string, string> = {
          关节痛: "arthralgia",
          虹膜炎: "uveitis",
          结节性红斑: "erythemaNodosum",
          坏疽性脓皮病: "pyodermaGangrenosum",
          口腔溃疡: "apthousUlcers",
          肛裂: "analFissure",
          肛瘘: "fistula",
          肛周脓肿: "abscess",
        };
        const complications: string[] = [];
        const foundSymptoms: string[] = [];
        for (const [symptomName, complicationKey] of Object.entries(complicationMap)) {
          if (allSymptoms.has(symptomName)) {
            complications.push(complicationKey);
            foundSymptoms.push(symptomName);
          }
        }
        if (complications.length > 0) {
          newAnswers.complications = complications;
          hints.complications = `从症状记录获取: ${foundSymptoms.join("、")}`;
        } else {
          hints.complications = "近一周无相关并发症记录";
        }
      } else {
        hints.generalWellbeing = "暂无近一周身体状态记录";
        hints.abdominalPain = "暂无近一周症状记录";
        hints.abdominalMass = "需手动填写";
        hints.complications = "暂无近一周症状记录";
      }
    } catch {
      hints.generalWellbeing = "获取症状记录失败";
      hints.abdominalPain = "获取症状记录失败";
      hints.abdominalMass = "需手动填写";
      hints.complications = "获取症状记录失败";
    }

    // CDAI 额外字段
    if (type === "cdai") {
      // Hct
      try {
        const labtestRecords = await labTestService.getByDateRange(fromDate, toDate);
        let found = false;
        for (const record of labtestRecords) {
          const hctIndicator = record.indicators.find(
            (i) =>
              i.name.toLowerCase().includes("hct") ||
              i.name.includes("红细胞比容") ||
              i.name.includes("血细胞比容"),
          );
          if (hctIndicator) {
            const hctValue = parseFloat(hctIndicator.value);
            if (!isNaN(hctValue)) {
              autoFilled.hct = { recordId: record._id!, value: hctValue, date: record.date };
              newAnswers.hematocrit = hctValue;
              hints.hematocrit = `从化验记录获取 (${record.date})`;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          hints.hematocrit = "暂无近一周 Hct 化验记录，请手动输入";
        }
      } catch {
        hints.hematocrit = "获取化验记录失败";
      }

      // 止泻药 - 无法从现有数据获取
      hints.antidiarrheal = "需手动填写";
      // 体重变化 - 无法从现有数据获取
      hints.weightChange = "需手动填写";
    }

    setAutoFilledData(autoFilled);
    setFieldHints(hints);
    setAnswers(newAnswers);
  };

  const handleSelectType = async (type: AssessmentType) => {
    setAssessmentType(type);
    setAnswers({});
    setResult(null);
    await autoFillData(type);
  };

  const handleAnswerChange = (key: string, value: number | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const handleCalculate = () => {
    if (!assessmentType) return;

    const score = assessmentType === "hbi" ? calculateHBI(answers) : calculateCDAI(answers);
    const level = getAssessmentLevel(assessmentType, score);
    setResult({ score, level });
  };

  const handleDelete = async () => {
    if (!editId) return;

    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        await assessmentService.delete(editId);
        Taro.showToast({ title: "已删除", icon: "success" });
        Taro.eventCenter.trigger("recordChange");
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } catch (error) {
        showError("删除失败", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting || !result || !assessmentType) return;

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        type: assessmentType,
        score: result.score,
        level: result.level,
        answers: answers as Record<string, number>,
        autoFilled:
          autoFilledData.stoolCount || autoFilledData.hct
            ? {
                stoolCount: autoFilledData.stoolCount
                  ? { from: autoFilledData.stoolCount.from, to: autoFilledData.stoolCount.to }
                  : undefined,
                hct: autoFilledData.hct?.recordId,
              }
            : undefined,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await assessmentService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await assessmentService.add(data);
        Taro.showToast({ title: "记录成功", icon: "success" });
      }

      Taro.eventCenter.trigger("recordChange");
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      showError("保存失败", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="add-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  // 类型选择页面
  if (!assessmentType) {
    return (
      <View className="add-page">
        <View className="section">
          <Text className="section-title">选择评估类型</Text>
          <View className="type-list">
            {ASSESSMENT_TYPES.map((type) => (
              <View
                key={type.value}
                className="type-item"
                onClick={() => handleSelectType(type.value)}
              >
                <Text className="type-label">{type.label}</Text>
                <Text className="type-desc">{type.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const questions = assessmentType === "hbi" ? HBI_QUESTIONS : CDAI_QUESTIONS;

  return (
    <View className="add-page">
      {/* 日期时间 */}
      <View className="section">
        <Text className="section-title">时间</Text>
        <View className="time-row">
          <View className="picker-value" onClick={() => setCalendarVisible(true)}>
            {date}
          </View>
          <TimePicker value={time} onChange={setTime} />
        </View>
        <CalendarPopup
          visible={calendarVisible}
          value={date}
          onChange={setDate}
          onClose={() => setCalendarVisible(false)}
        />
      </View>

      {/* 评估类型 */}
      <View className="section">
        <Text className="section-title">
          {ASSESSMENT_TYPES.find((t) => t.value === assessmentType)?.label} 评估
        </Text>
      </View>

      {/* 问卷 */}
      {Object.entries(questions).map(([key, question]) => (
        <View key={key} className="section">
          <Text className="section-title">{question.label}</Text>
          {"description" in question && question.description && (
            <Text className="section-desc">{question.description}</Text>
          )}

          {"options" in question && !("type" in question && question.type === "multiSelect") && (
            <View className="options-list">
              {question.options.map((opt) => (
                <View
                  key={opt.value}
                  className={`option-item ${answers[key] === opt.value ? "active" : ""}`}
                  onClick={() => handleAnswerChange(key, opt.value)}
                >
                  {opt.label}
                </View>
              ))}
            </View>
          )}

          {"type" in question && question.type === "number" && (
            <View className="number-input-row">
              <Input
                className="number-input"
                type="digit"
                placeholder={question.placeholder}
                value={answers[key] !== undefined ? String(answers[key]) : ""}
                onInput={(e) => handleAnswerChange(key, parseFloat(e.detail.value) || 0)}
              />
            </View>
          )}

          {/* 数据来源提示 */}
          {fieldHints[key] && (
            <Text
              className={`field-hint ${fieldHints[key].includes("获取") ? "has-data" : "no-data"}`}
            >
              {fieldHints[key]}
            </Text>
          )}

          {"type" in question && question.type === "multiSelect" && "options" in question && (
            <View className="multi-select-list">
              {question.options.map((opt) => {
                const selected =
                  Array.isArray(answers[key]) && (answers[key] as string[]).includes(opt.value);
                return (
                  <View
                    key={opt.value}
                    className={`multi-select-item ${selected ? "active" : ""}`}
                    onClick={() => {
                      const current = (answers[key] as string[]) || [];
                      const newValue = selected
                        ? current.filter((v) => v !== opt.value)
                        : [...current, opt.value];
                      handleAnswerChange(key, newValue);
                    }}
                  >
                    {opt.label}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}

      {/* 计算按钮 */}
      <View className="section">
        <View className="calculate-btn" onClick={handleCalculate}>
          计算评分
        </View>
      </View>

      {/* 结果显示 */}
      {result && (
        <View className="section result-section">
          <Text className="section-title">评估结果</Text>
          <View
            className="result-card"
            style={{ borderColor: ASSESSMENT_LEVELS[result.level].color }}
          >
            <View className="result-score">
              <Text className="score-value">{result.score}</Text>
              <Text className="score-unit">分</Text>
            </View>
            <View
              className="result-level"
              style={{ backgroundColor: ASSESSMENT_LEVELS[result.level].color }}
            >
              {ASSESSMENT_LEVELS[result.level].label}
            </View>
          </View>

          {/* 计算明细 */}
          <View className="result-details">
            <Text className="details-title">计算明细</Text>
            {Object.entries(questions).map(([key, question]) => {
              const value = answers[key];
              let rawValue: number;
              if (Array.isArray(value)) {
                rawValue = value.length;
              } else if (typeof value === "number") {
                rawValue = value;
              } else {
                rawValue = 0;
              }

              // CDAI 有系数，HBI 系数为 1
              const coefficient = "coefficient" in question ? (question.coefficient as number) : 1;
              const contribution = rawValue * coefficient;

              // Hct 特殊处理：显示差值
              const isHct = key === "hematocrit";
              const hctDiff = isHct ? Math.abs(47 - rawValue) : 0;

              return (
                <View key={key} className="detail-row">
                  <Text className="detail-label">{question.label}</Text>
                  <Text className="detail-value">
                    {isHct
                      ? `|47-${rawValue}|×${coefficient} = ${hctDiff * coefficient}`
                      : coefficient === 1
                        ? String(rawValue)
                        : `${rawValue}×${coefficient} = ${contribution}`}
                  </Text>
                </View>
              );
            })}
            <View className="detail-row total-row">
              <Text className="detail-label">总分</Text>
              <Text className="detail-value">{result.score}</Text>
            </View>
          </View>

          {/* 分级标准 */}
          <View className="result-details">
            <Text className="details-title">分级标准</Text>
            {(assessmentType === "hbi" ? HBI_THRESHOLDS : CDAI_THRESHOLDS).map(
              (threshold, index, arr) => {
                const prevMax = index === 0 ? -1 : arr[index - 1].max;
                const levelInfo = ASSESSMENT_LEVELS[threshold.level];
                const isCurrentLevel = threshold.level === result.level;
                const rangeText =
                  threshold.max === Infinity
                    ? `>${prevMax}`
                    : index === 0
                      ? `≤${threshold.max}`
                      : `${prevMax + 1}-${threshold.max}`;
                return (
                  <View
                    key={threshold.level}
                    className={`detail-row ${isCurrentLevel ? "highlight" : ""}`}
                  >
                    <Text className="detail-label">{rangeText} 分</Text>
                    <Text className="detail-value" style={{ color: levelInfo.color }}>
                      {levelInfo.label}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>
      )}

      {/* 备注 */}
      <View className="section">
        <Text className="section-title">备注</Text>
        <Textarea
          className="note-input"
          placeholder="添加备注（可选）"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={500}
          autoHeight
        />
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View
          className={`submit-btn ${submitting || !result ? "disabled" : ""}`}
          onClick={handleSubmit}
        >
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </View>
        {isEdit && (
          <View className="delete-btn" onClick={handleDelete}>
            删除记录
          </View>
        )}
      </View>
    </View>
  );
}
