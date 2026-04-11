import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { getRecentSymptomRecords } from "../../../services/symptom";
import { SYMPTOM_TYPES, SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../../constants/symptom";
import { formatDisplayDate } from "../../../utils/date";
import type { SymptomRecord } from "../../../types";
import "./index.css";

export default function SymptomIndex() {
  const [records, setRecords] = useState<SymptomRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getRecentSymptomRecords(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/symptom/add/index" });
  };

  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        const { deleteSymptomRecord } = await import("../../../services/symptom");
        await deleteSymptomRecord(id);
        Taro.showToast({ title: "已删除", icon: "success" });
        loadRecords();
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const getSymptomLabel = (type: string) => {
    return SYMPTOM_TYPES.find((s) => s.value === type)?.label || type;
  };

  const getSeverityInfo = (severity: 1 | 2 | 3) => {
    return SEVERITY_OPTIONS.find((s) => s.value === severity);
  };

  const getFeelingInfo = (feeling: number) => {
    return FEELING_OPTIONS.find((f) => f.value === feeling);
  };

  return (
    <View className="health-page">
      <View className="header">
        <Text className="title">身体状态记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加身体状态</Text>
        </View>
      ) : (
        <View className="record-list">
          {records.map((record) => {
            const feeling = getFeelingInfo(record.overallFeeling);
            return (
              <View
                key={record._id}
                className="record-item"
                onLongPress={() => handleDelete(record._id!)}
              >
                <View className="record-header">
                  <Text className="record-date">
                    {formatDisplayDate(record.date)}
                    {record.time && ` ${record.time}`}
                  </Text>
                  <View className="feeling-badge">
                    <Text className="feeling-emoji">{feeling?.emoji}</Text>
                    <Text className="feeling-label">{feeling?.label}</Text>
                  </View>
                </View>

                {record.symptoms.length > 0 && (
                  <View className="symptoms">
                    {record.symptoms.map((symptom, idx) => {
                      const severity = getSeverityInfo(symptom.severity);
                      return (
                        <View key={idx} className="symptom-tag">
                          <Text
                            className="severity-dot"
                            style={{ backgroundColor: severity?.color }}
                          />
                          <Text className="symptom-name">{getSymptomLabel(symptom.type)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {record.note && <Text className="record-note">{record.note}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
