import { View, Text, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { formatDate, getPrevDate, getNextDate, getWeekday } from "../../utils/date";
import { SEVERITY_OPTIONS, FEELING_OPTIONS } from "../../constants/symptom";
import { AMOUNT_OPTIONS } from "../../constants/meal";
import { BRISTOL_TYPES, STOOL_AMOUNTS } from "../../constants/stool";
import type { SymptomRecord, MealRecord, StoolRecord, MedicationRecord, LabTestRecord } from "../../types";
import "./index.css";

const getFeelingEmoji = (value: number): string => {
  return FEELING_OPTIONS.find((f) => f.value === value)?.emoji || "😐";
};

const formatSymptoms = (symptoms: string[]): string => {
  return symptoms.join("、");
};

const getSeverityInfo = (severity?: 1 | 2 | 3) => {
  if (!severity) return null;
  return SEVERITY_OPTIONS.find((s) => s.value === severity);
};

const getAmountEmoji = (amount: number): string => {
  return AMOUNT_OPTIONS.find((a) => a.value === amount)?.emoji || "🍚";
};

const getBristolEmoji = (type: number): string => {
  return BRISTOL_TYPES.find((b) => b.value === type)?.emoji || "";
};

const getStoolAmountLabel = (amount: number): string => {
  return STOOL_AMOUNTS.find((a) => a.value === amount)?.label || "";
};

export default function Records() {
  const [currentDate, setCurrentDate] = useState(formatDate());
  const [loading, setLoading] = useState(true);
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [stoolRecords, setStoolRecords] = useState<StoolRecord[]>([]);
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [labTestRecords, setLabTestRecords] = useState<LabTestRecord[]>([]);

  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [symptoms, meals, stools, medications, labTests] = await Promise.all([
        symptomService.getByDate(date),
        mealService.getByDate(date),
        stoolService.getByDate(date),
        medicationService.getByDate(date),
        labTestService.getByDate(date),
      ]);
      setSymptomRecords(symptoms);
      setMealRecords(meals);
      setStoolRecords(stools);
      setMedicationRecords(medications);
      setLabTestRecords(labTests);
    } catch (error) {
      console.error("加载数据失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadData(currentDate);
  });

  const handlePrevDate = () => {
    const newDate = getPrevDate(currentDate);
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const today = formatDate();
  const isToday = currentDate === today;

  const handleNextDate = () => {
    if (isToday) return;
    const newDate = getNextDate(currentDate);
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const handleDateChange = (e: { detail: { value: string } }) => {
    const newDate = e.detail.value;
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className="records-page">
      {/* 日期选择器 */}
      <View className="date-selector">
        <Text className="date-arrow" onClick={handlePrevDate}>
          ◀
        </Text>
        <Picker mode="date" value={currentDate} end={today} onChange={handleDateChange}>
          <Text className="date-text">
            {currentDate} {getWeekday(currentDate)}
          </Text>
        </Picker>
        <Text className={`date-arrow ${isToday ? "disabled" : ""}`} onClick={handleNextDate}>
          ▶
        </Text>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : (
        <View className="records-container">
          {/* 体感 */}
          <View className="record-card">
            <View className="card-header">
              <View
                className="card-title-row"
                onClick={() => handleNavigate("/pages/symptom/index/index")}
              >
                <Text className="card-icon">🌡️</Text>
                <Text className="card-title">体感</Text>
                <Text className="card-count">[{symptomRecords.length}条]</Text>
              </View>
              <Text
                className="card-add-btn"
                onClick={() => handleNavigate("/pages/symptom/add/index")}
              >
                ＋
              </Text>
            </View>
            <View className="card-content">
              {symptomRecords.length === 0 ? (
                <Text className="empty-hint">暂无记录</Text>
              ) : (
                symptomRecords.slice(0, 3).map((record) => {
                  const severity = getSeverityInfo(record.severity);
                  return (
                    <View
                      key={record._id}
                      className="record-item"
                      onClick={() => handleNavigate(`/pages/symptom/add/index?id=${record._id}`)}
                    >
                      <Text className="record-time">{record.time || "--:--"}</Text>
                      <Text className="record-feeling">
                        {getFeelingEmoji(record.overallFeeling)}
                      </Text>
                      {severity && (
                        <Text
                          className="record-severity"
                          style={{ backgroundColor: severity.color }}
                        >
                          {severity.label}
                        </Text>
                      )}
                      {record.symptoms.length > 0 && (
                        <Text className="record-desc">{formatSymptoms(record.symptoms)}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* 用药记录 */}
          <View className="record-card">
            <View className="card-header">
              <View
                className="card-title-row"
                onClick={() => handleNavigate("/pages/medication/index/index")}
              >
                <Text className="card-icon">💊</Text>
                <Text className="card-title">用药</Text>
                <Text className="card-count">[{medicationRecords.length}条]</Text>
              </View>
              <Text
                className="card-add-btn"
                onClick={() => handleNavigate("/pages/medication/add/index")}
              >
                ＋
              </Text>
            </View>
            <View className="card-content">
              {medicationRecords.length === 0 ? (
                <Text className="empty-hint">暂无记录</Text>
              ) : (
                medicationRecords.slice(0, 3).map((record) => (
                  <View
                    key={record._id}
                    className="record-item"
                    onClick={() => handleNavigate(`/pages/medication/add/index?id=${record._id}`)}
                  >
                    <Text className="record-time">{record.time}</Text>
                    <Text className="record-desc">
                      {record.name}
                      {record.dosage ? ` ${record.dosage}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* 饮食记录 */}
          <View className="record-card">
            <View className="card-header">
              <View
                className="card-title-row"
                onClick={() => handleNavigate("/pages/meal/index/index")}
              >
                <Text className="card-icon">🍱</Text>
                <Text className="card-title">饮食</Text>
                <Text className="card-count">[{mealRecords.length}条]</Text>
              </View>
              <Text
                className="card-add-btn"
                onClick={() => handleNavigate("/pages/meal/add/index")}
              >
                ＋
              </Text>
            </View>
            <View className="card-content">
              {mealRecords.length === 0 ? (
                <Text className="empty-hint">暂无记录</Text>
              ) : (
                mealRecords.slice(0, 3).map((record) => (
                  <View
                    key={record._id}
                    className="record-item"
                    onClick={() => handleNavigate(`/pages/meal/add/index?id=${record._id}`)}
                  >
                    <Text className="record-time">{record.time}</Text>
                    <Text className="record-feeling">{getAmountEmoji(record.amount)}</Text>
                    <Text className="record-desc">{record.foods.join("、")}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* 排便记录 */}
          <View className="record-card">
            <View className="card-header">
              <View
                className="card-title-row"
                onClick={() => handleNavigate("/pages/stool/index/index")}
              >
                <Text className="card-icon">💩</Text>
                <Text className="card-title">排便</Text>
                <Text className="card-count">[{stoolRecords.length}条]</Text>
              </View>
              <Text
                className="card-add-btn"
                onClick={() => handleNavigate("/pages/stool/add/index")}
              >
                ＋
              </Text>
            </View>
            <View className="card-content">
              {stoolRecords.length === 0 ? (
                <Text className="empty-hint">暂无记录</Text>
              ) : (
                stoolRecords.slice(0, 3).map((record) => (
                  <View
                    key={record._id}
                    className="record-item"
                    onClick={() => handleNavigate(`/pages/stool/add/index?id=${record._id}`)}
                  >
                    <Text className="record-time">{record.time}</Text>
                    <Text className="record-feeling">{getBristolEmoji(record.type)}</Text>
                    <Text className="record-desc">
                      {getStoolAmountLabel(record.amount)}
                      {record.note && ` · ${record.note}`}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* 化验记录 */}
          <View className="record-card">
            <View className="card-header">
              <View className="card-title-row">
                <Text className="card-icon">🧪</Text>
                <Text className="card-title">化验</Text>
                <Text className="card-count">[{labTestRecords.length}条]</Text>
              </View>
              <Text
                className="card-add-btn"
                onClick={() => handleNavigate("/pages/labtest/add/index")}
              >
                ＋
              </Text>
            </View>
            <View className="card-content">
              {labTestRecords.length === 0 ? (
                <Text className="empty-hint">暂无记录</Text>
              ) : (
                labTestRecords.slice(0, 3).map((record) => (
                  <View
                    key={record._id}
                    className="record-item"
                    onClick={() => handleNavigate(`/pages/labtest/add/index?id=${record._id}`)}
                  >
                    <Text className="record-time">{record.time}</Text>
                    <Text className="record-desc">
                      {record.type}
                      {record.imageFileIds.length > 0 && ` · ${record.imageFileIds.length}张图片`}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
