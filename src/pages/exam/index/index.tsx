import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { examService } from "../../../services/exam";
import { formatDisplayDate } from "../../../utils/date";
import { EXAM_TYPES } from "../../../constants/exam";
import type { ExamRecord } from "../../../types";
import "./index.css";

export default function ExamIndex() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await examService.getRecent(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/exam/add/index" });
  };

  const handleEdit = (id: string) => {
    Taro.navigateTo({ url: `/pages/exam/add/index?id=${id}` });
  };

  const getExamTypeInfo = (examType: string) => {
    return EXAM_TYPES.find((t) => t.value === examType) || EXAM_TYPES[EXAM_TYPES.length - 1];
  };

  return (
    <View className="health-page">
      <View className="header">
        <Text className="title">检查记录</Text>
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
            const examTypeInfo = getExamTypeInfo(record.examType);
            return (
              <View
                key={record._id}
                className="record-item"
                onClick={() => handleEdit(record._id!)}
              >
                <View className="record-main">
                  <View className="record-header">
                    <View className="exam-type-badge">
                      <Text className="exam-type-emoji">{examTypeInfo.emoji}</Text>
                      <Text className="exam-type-label">{examTypeInfo.label}</Text>
                    </View>
                    <Text className="record-date">
                      检查: {formatDisplayDate(record.examDate)}
                    </Text>
                  </View>

                  <View className="record-stats">
                    <View className="stat-badge">
                      <Text className="stat-icon">🖼️</Text>
                      <Text className="stat-text">{record.imageFileIds.length}张图片</Text>
                    </View>
                    {record.content && (
                      <View className="stat-badge">
                        <Text className="stat-icon">📋</Text>
                        <Text className="stat-text">有内容</Text>
                      </View>
                    )}
                  </View>

                  {record.content && (
                    <Text className="record-content" numberOfLines={2}>
                      {record.content}
                    </Text>
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
