import { View, Text } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { examService } from "../../services/exam";
import { formatDisplayDate, getWeekday } from "../../utils/date";
import RecordItem, { AnyRecord } from "../../components/RecordItem";
import { RecordType, RECORD_TYPES, RECORD_TYPE_OPTIONS } from "../../types";
import "./index.css";

export default function History() {
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>(() => {
    const saved = Taro.getStorageSync("history_selected_types");
    return saved || [...RECORD_TYPES];
  });
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AnyRecord[]>([]);

  const loadData = useCallback(async (types: RecordType[]) => {
    setLoading(true);
    try {
      const promises: Promise<AnyRecord[]>[] = [];

      if (types.includes("symptom")) {
        promises.push(
          symptomService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "symptom" as const }))),
        );
      }
      if (types.includes("medication")) {
        promises.push(
          medicationService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "medication" as const }))),
        );
      }
      if (types.includes("meal")) {
        promises.push(
          mealService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "meal" as const }))),
        );
      }
      if (types.includes("stool")) {
        promises.push(
          stoolService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "stool" as const }))),
        );
      }
      if (types.includes("labtest")) {
        promises.push(
          labTestService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "labtest" as const }))),
        );
      }
      if (types.includes("exam")) {
        promises.push(
          examService
            .getRecent(200)
            .then((data) => data.map((r) => ({ ...r, _type: "exam" as const }))),
        );
      }

      const results = await Promise.all(promises);
      const allRecords = results.flat();

      // 按日期+时间倒序排列
      allRecords.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });

      setRecords(allRecords);
    } catch (error) {
      console.error("加载数据失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    // Only load on first visit, not when returning from detail page
    if (records.length === 0) {
      loadData(selectedTypes);
    }
  });

  usePullDownRefresh(async () => {
    await loadData(selectedTypes);
    Taro.stopPullDownRefresh();
  });

  const handleTypeToggle = (type: RecordType) => {
    let newTypes: RecordType[];
    if (selectedTypes.includes(type)) {
      // 至少保留一个类型
      if (selectedTypes.length === 1) return;
      newTypes = selectedTypes.filter((t) => t !== type);
    } else {
      newTypes = [...selectedTypes, type];
    }
    setSelectedTypes(newTypes);
    Taro.setStorageSync("history_selected_types", newTypes);
    loadData(newTypes);
  };

  // 按日期分组记录
  const groupedRecords: { date: string; records: AnyRecord[] }[] = [];
  let currentDate = "";
  records.forEach((record) => {
    if (record.date !== currentDate) {
      currentDate = record.date;
      groupedRecords.push({ date: record.date, records: [] });
    }
    groupedRecords[groupedRecords.length - 1].records.push(record);
  });

  return (
    <View className="history-page">
      {/* 类型筛选 */}
      <View className="type-filter">
        {RECORD_TYPE_OPTIONS.map((option) => (
          <View
            key={option.value}
            className={`type-option ${selectedTypes.includes(option.value) ? "active" : ""}`}
            onClick={() => handleTypeToggle(option.value)}
          >
            <Text className="type-icon">{option.icon}</Text>
            <Text className="type-label">{option.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
        </View>
      ) : (
        <View className="records-list">
          {groupedRecords.map((group) => (
            <View key={group.date} className="date-group">
              <View className="date-header">
                <Text className="date-text">
                  {formatDisplayDate(group.date)} {getWeekday(group.date)}
                </Text>
              </View>
              <View className="date-records">
                {group.records.map((record) => (
                  <RecordItem key={record._id} record={record} showTypeIcon />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
