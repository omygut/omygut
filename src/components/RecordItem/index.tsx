import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { EXAM_TYPES } from "../../constants/exam";
import { SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../constants/symptom";
import { AMOUNT_OPTIONS } from "../../constants/meal";
import { STOOL_AMOUNTS } from "../../constants/stool";
import BristolIcon from "../BristolIcon";
import type {
  SymptomRecord,
  MealRecord,
  StoolRecord,
  MedicationRecord,
  LabTestRecord,
  ExamRecord,
} from "../../types";
import "./index.css";

type RecordType = "symptom" | "medication" | "meal" | "stool" | "labtest" | "exam";

export type AnyRecord =
  | (SymptomRecord & { _type: "symptom" })
  | (MealRecord & { _type: "meal" })
  | (StoolRecord & { _type: "stool" })
  | (MedicationRecord & { _type: "medication" })
  | (LabTestRecord & { _type: "labtest" })
  | (ExamRecord & { _type: "exam" });

interface RecordItemProps {
  record: AnyRecord;
  showTypeIcon?: boolean;
}

const TYPE_ICONS: Record<RecordType, string> = {
  symptom: "🌡️",
  medication: "💊",
  meal: "🍱",
  stool: "💩",
  labtest: "🧪",
  exam: "🩺",
};

const EDIT_PATHS: Record<RecordType, string> = {
  symptom: "/pages/symptom/add/index",
  medication: "/pages/medication/add/index",
  meal: "/pages/meal/add/index",
  stool: "/pages/stool/add/index",
  labtest: "/pages/labtest/add/index",
  exam: "/pages/exam/add/index",
};

const UNKNOWN = "❓";

const getFeelingEmoji = (value: number): string => {
  return FEELING_OPTIONS.find((f) => f.value === value)?.emoji ?? UNKNOWN;
};

const getSeverityInfo = (severity?: 1 | 2 | 3) => {
  if (!severity) return null;
  return SEVERITY_OPTIONS.find((s) => s.value === severity) ?? null;
};

const getAmountEmoji = (amount: number): string => {
  return AMOUNT_OPTIONS.find((a) => a.value === amount)?.emoji ?? UNKNOWN;
};

const getStoolAmountLabel = (amount: number): string => {
  return STOOL_AMOUNTS.find((a) => a.value === amount)?.label ?? UNKNOWN;
};

const getExamTypeInfo = (examType: string) => {
  return EXAM_TYPES.find((t) => t.value === examType) ?? { emoji: UNKNOWN, label: UNKNOWN };
};

export default function RecordItem({ record, showTypeIcon = false }: RecordItemProps) {
  const handleClick = () => {
    const path = `${EDIT_PATHS[record._type]}?id=${record._id}`;
    Taro.navigateTo({ url: path });
  };

  const renderContent = () => {
    switch (record._type) {
      case "symptom": {
        const severity = getSeverityInfo(record.severity);
        return (
          <>
            <Text className="record-feeling">{getFeelingEmoji(record.overallFeeling)}</Text>
            {severity && (
              <Text className="record-severity" style={{ backgroundColor: severity.color }}>
                {severity.label}
              </Text>
            )}
            {record.symptoms.length > 0 && (
              <Text className="record-desc">{record.symptoms.join("、")}</Text>
            )}
          </>
        );
      }
      case "medication":
        return <Text className="record-desc">{record.names.join("、")}</Text>;
      case "meal":
        return (
          <>
            <Text className="record-feeling">{getAmountEmoji(record.amount)}</Text>
            <Text className="record-desc">{record.foods.join("、")}</Text>
          </>
        );
      case "stool":
        return (
          <>
            <View className="record-feeling">
              <BristolIcon type={record.type} size={24} />
            </View>
            <Text className="record-desc">
              {getStoolAmountLabel(record.amount)}
              {record.note && ` · ${record.note}`}
            </Text>
          </>
        );
      case "labtest":
        return (
          <Text className="record-desc">
            {record.imageFileIds.length}张图片
            {record.indicators.length > 0 && ` · ${record.indicators.length}项指标`}
          </Text>
        );
      case "exam": {
        const examTypeInfo = getExamTypeInfo(record.examType);
        return (
          <>
            <Text className="record-feeling">{examTypeInfo.emoji}</Text>
            <Text className="record-desc">
              {examTypeInfo.label}
              {record.imageFileIds.length > 0 && ` · ${record.imageFileIds.length}张图片`}
            </Text>
          </>
        );
      }
    }
  };

  return (
    <View className="record-item" onClick={handleClick}>
      {showTypeIcon && <Text className="record-type-icon">{TYPE_ICONS[record._type]}</Text>}
      <Text className="record-time">{record.time || "--:--"}</Text>
      {renderContent()}
    </View>
  );
}
