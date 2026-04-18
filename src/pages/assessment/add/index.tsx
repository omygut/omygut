import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { assessmentService } from "../../../services/assessment";
import { stoolService } from "../../../services/stool";
import { labTestService } from "../../../services/labtest";
import {
  ASSESSMENT_TYPES,
  ASSESSMENT_LEVELS,
  HBI_QUESTIONS,
  CDAI_QUESTIONS,
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

    // 获取过去7天的腹泻次数
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const fromDate = formatDate(weekAgo);
    const toDate = formatDate(today);

    try {
      const stoolRecords = await stoolService.getByDateRange(fromDate, toDate);
      const stoolCount = stoolRecords.length;
      autoFilled.stoolCount = { from: fromDate, to: toDate, count: stoolCount };
      newAnswers.liquidStools = stoolCount;
    } catch {
      // 忽略错误
    }

    // CDAI 需要 Hct
    if (type === "cdai") {
      try {
        const labtestRecords = await labTestService.getRecent(10);
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
              break;
            }
          }
        }
      } catch {
        // 忽略错误
      }
    }

    setAutoFilledData(autoFilled);
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
        <View className="section-header">
          <Text className="section-title">
            {ASSESSMENT_TYPES.find((t) => t.value === assessmentType)?.label} 评估
          </Text>
          <Text className="change-type" onClick={() => setAssessmentType(null)}>
            更换
          </Text>
        </View>
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
              {"autoFill" in question &&
                question.autoFill &&
                key === "liquidStools" &&
                autoFilledData.stoolCount && (
                  <Text className="auto-fill-hint">
                    已从记录自动填充 ({autoFilledData.stoolCount.from} ~{" "}
                    {autoFilledData.stoolCount.to})
                  </Text>
                )}
              {"autoFill" in question &&
                question.autoFill &&
                key === "hematocrit" &&
                autoFilledData.hct && (
                  <Text className="auto-fill-hint">
                    已从化验记录自动填充 ({autoFilledData.hct.date})
                  </Text>
                )}
            </View>
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

          {/* 各项明细 */}
          <View className="result-details">
            {Object.entries(questions).map(([key, question]) => {
              const value = answers[key];
              let displayValue = "";
              if (Array.isArray(value)) {
                displayValue = value.length > 0 ? `${value.length} 项` : "无";
              } else if (typeof value === "number") {
                displayValue = String(value);
              } else {
                displayValue = "-";
              }
              return (
                <View key={key} className="detail-row">
                  <Text className="detail-label">{question.label}</Text>
                  <Text className="detail-value">{displayValue}</Text>
                </View>
              );
            })}
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
