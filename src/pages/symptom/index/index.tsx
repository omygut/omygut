import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { symptomService } from "../../../services/symptom";
import { SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../../constants/symptom";
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
      const data = await symptomService.getRecent(50);
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

  const handleEdit = (id: string) => {
    Taro.navigateTo({ url: `/pages/symptom/add/index?id=${id}` });
  };

  const getSeverityInfo = (severity?: 1 | 2 | 3) => {
    if (!severity) return null;
    return SEVERITY_OPTIONS.find((s) => s.value === severity);
  };

  const getFeelingInfo = (feeling: number) => {
    return FEELING_OPTIONS.find((f) => f.value === feeling);
  };

  return (
    <View className="health-page">
      <View className="header">
        <Text className="title">体感记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加记录</Text>
        </View>
      ) : (
        <View className="record-list">
          {records.map((record) => {
            const feeling = getFeelingInfo(record.overallFeeling);
            return (
              <View
                key={record._id}
                className="record-item"
                onClick={() => handleEdit(record._id!)}
              >
                <View className="record-main">
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
                      {record.severity && (
                        <View
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityInfo(record.severity)?.color }}
                        >
                          {getSeverityInfo(record.severity)?.label}
                        </View>
                      )}
                      {record.symptoms.map((symptom, idx) => (
                        <View key={idx} className="symptom-tag">
                          <Text className="symptom-name">{symptom}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {record.note && <Text className="record-note">{record.note}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
