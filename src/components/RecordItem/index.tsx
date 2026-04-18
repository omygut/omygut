import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { EXAM_TYPES } from "../../constants/exam";
import { SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../constants/symptom";
import AmountIcon from "../AmountIcon";
import { STOOL_AMOUNTS } from "../../constants/stool";
import { normalizeIndicators } from "../../services/labtest-standards";
import { getSymptomItems } from "../../utils/symptom";
import BristolIcon from "../BristolIcon";
import type {
  SymptomRecord,
  MealRecord,
  StoolRecord,
  MedicationRecord,
  LabTestRecord,
  LabTestIndicator,
  ExamRecord,
  AssessmentRecord,
  RecordType,
} from "../../types";
import { ASSESSMENT_LEVELS } from "../../constants/assessment";
import { RECORD_TYPE_OPTIONS } from "../../types";
import "./index.css";

export type AnyRecord =
  | (SymptomRecord & { _type: "symptom" })
  | (MealRecord & { _type: "meal" })
  | (StoolRecord & { _type: "stool" })
  | (MedicationRecord & { _type: "medication" })
  | (LabTestRecord & { _type: "labtest" })
  | (ExamRecord & { _type: "exam" })
  | (AssessmentRecord & { _type: "assessment" });

interface RecordItemProps {
  record: AnyRecord;
  showTypeIcon?: boolean;
}

const RECORD_TYPE_MAP = Object.fromEntries(
  RECORD_TYPE_OPTIONS.map((opt) => [opt.value, opt]),
) as Record<RecordType, (typeof RECORD_TYPE_OPTIONS)[number]>;

const UNKNOWN = "❓";

const getFeelingEmoji = (value: number): string => {
  return FEELING_OPTIONS.find((f) => f.value === value)?.emoji ?? UNKNOWN;
};

const getSeverityColor = (severity: 1 | 2 | 3): string => {
  return SEVERITY_OPTIONS.find((s) => s.value === severity)?.color ?? "#FFD230";
};

const getStoolAmountLabel = (amount: number): string => {
  return STOOL_AMOUNTS.find((a) => a.value === amount)?.label ?? UNKNOWN;
};

const getExamTypeInfo = (examType: string) => {
  return EXAM_TYPES.find((t) => t.value === examType) ?? { emoji: UNKNOWN, label: UNKNOWN };
};

const getLabTestCategories = (indicators: LabTestIndicator[]): string => {
  if (indicators.length === 0) return "";
  const normalized = normalizeIndicators(indicators);
  const categories = [...new Set(normalized.map((i) => i.category).filter(Boolean))];
  if (categories.length === 0) return "";
  if (categories.length <= 9) return categories.join("、");
  return `${categories.slice(0, 9).join("、")}等${categories.length}类`;
};

export default function RecordItem({ record, showTypeIcon = false }: RecordItemProps) {
  const typeInfo = RECORD_TYPE_MAP[record._type];

  const handleClick = () => {
    const path = `${typeInfo.addPath}?id=${record._id}`;
    Taro.navigateTo({ url: path });
  };

  const renderContent = () => {
    switch (record._type) {
      case "symptom": {
        const items = getSymptomItems(record);
        return (
          <>
            {record.overallFeeling && (
              <View className="record-feeling">{getFeelingEmoji(record.overallFeeling)}</View>
            )}
            {items.length > 0 && (
              <View className="record-symptoms-list">
                {items.map((item) => {
                  const color = getSeverityColor(item.severity);
                  return (
                    <Text
                      key={item.name}
                      className="record-symptom-tag"
                      style={{
                        borderColor: color,
                        backgroundColor: `${color}15`,
                        color: color,
                      }}
                    >
                      {item.name}
                    </Text>
                  );
                })}
              </View>
            )}
            {record.weight && <Text className="record-desc">{record.weight}kg</Text>}
          </>
        );
      }
      case "medication":
        return <Text className="record-desc">{record.names.join("、")}</Text>;
      case "meal":
        return (
          <>
            <View className="record-feeling">
              <AmountIcon level={record.amount as 1 | 2 | 3} size={24} />
            </View>
            <Text className="record-desc">{record.foods.join("、")}</Text>
          </>
        );
      case "stool":
        return (
          <>
            <View className="record-feeling">
              <BristolIcon type={record.type} size={18} />
            </View>
            <Text className="record-desc">
              {getStoolAmountLabel(record.amount)}
              {record.note && ` · ${record.note}`}
            </Text>
          </>
        );
      case "labtest": {
        const categoryText = getLabTestCategories(record.indicators);
        return (
          <Text className="record-desc">
            {categoryText || `${record.imageFileIds.length}张图片`}
          </Text>
        );
      }
      case "exam": {
        const examTypeInfo = getExamTypeInfo(record.examType);
        return (
          <Text className="record-desc">
            {record.examName || examTypeInfo.label}
            {record.imageFileIds.length > 0 && ` · ${record.imageFileIds.length}张图片`}
          </Text>
        );
      }
      case "assessment": {
        const levelInfo = ASSESSMENT_LEVELS[record.level];
        return (
          <>
            <Text className="record-desc">
              {record.type.toUpperCase()} {record.score}分
            </Text>
            <Text
              className="record-level"
              style={{ backgroundColor: levelInfo.color, color: "#fff" }}
            >
              {levelInfo.label}
            </Text>
          </>
        );
      }
    }
  };

  return (
    <View className="record-item" onClick={handleClick}>
      {showTypeIcon && <Text className="record-type-icon">{typeInfo.icon}</Text>}
      <Text className="record-time">{record.time || "--:--"}</Text>
      {renderContent()}
    </View>
  );
}
