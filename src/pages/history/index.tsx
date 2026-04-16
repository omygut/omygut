import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback, useRef } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { examService } from "../../services/exam";
import { formatDisplayDate, getWeekday, formatDate } from "../../utils/date";
import RecordItem, { AnyRecord } from "../../components/RecordItem";
import CalendarPopup from "../../components/CalendarPopup";
import { RecordType, RECORD_TYPE_OPTIONS } from "../../types";
import "./index.css";

type ViewMode = "records" | "stats";
type DateRangePreset = "7" | "30" | "90" | "custom";

const PAGE_SIZE = 50;

const services = {
  symptom: symptomService,
  medication: medicationService,
  meal: mealService,
  stool: stoolService,
  labtest: labTestService,
  exam: examService,
} as const;

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return formatDate(date);
}

export default function History() {
  const [selectedType, setSelectedType] = useState<RecordType>(() => {
    return Taro.getStorageSync("history_selected_type") || "meal";
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [records, setRecords] = useState<AnyRecord[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Stats view state
  const [viewMode, setViewMode] = useState<ViewMode>("records");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("7");
  const [customStartDate, setCustomStartDate] = useState(() => getDateDaysAgo(7));
  const [customEndDate, setCustomEndDate] = useState(() => formatDate());
  const [startCalendarVisible, setStartCalendarVisible] = useState(false);
  const [endCalendarVisible, setEndCalendarVisible] = useState(false);

  const cursorRef = useRef({ date: "9999-12-31", time: "23:59" });

  const loadMore = useCallback(async (type: RecordType, isInitial = false) => {
    const service = services[type];
    const cursor = cursorRef.current;

    const data = await service.getRecentBefore(cursor.date, cursor.time, PAGE_SIZE);

    if (data.length < PAGE_SIZE) {
      setHasMore(false);
    }

    if (data.length > 0) {
      const last = data[data.length - 1];
      cursorRef.current = { date: last.date, time: last.time };
    }

    return data.map((r) => ({ ...r, _type: type })) as AnyRecord[];
  }, []);

  const loadInitial = useCallback(
    async (type: RecordType) => {
      setLoading(true);
      setHasMore(true);
      cursorRef.current = { date: "9999-12-31", time: "23:59" };

      try {
        const newRecords = await loadMore(type, true);
        setRecords(newRecords);
      } catch (error) {
        console.error("加载数据失败:", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
      } finally {
        setLoading(false);
      }
    },
    [loadMore],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const newRecords = await loadMore(selectedType);
      if (newRecords.length > 0) {
        setRecords((prev) => [...prev, ...newRecords]);
      }
    } catch (error) {
      console.error("加载更多失败:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadMore, selectedType, loadingMore, hasMore]);

  useDidShow(() => {
    if (records.length === 0) {
      loadInitial(selectedType);
    }
  });

  const handleRefresh = useCallback(async () => {
    await loadInitial(selectedType);
  }, [loadInitial, selectedType]);

  const handleTypeChange = (type: RecordType) => {
    if (type === selectedType) return;
    setSelectedType(type);
    Taro.setStorageSync("history_selected_type", type);
    setRecords([]);
    setViewMode("records"); // Reset to records view when changing type
    loadInitial(type);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
  };

  const handleDateRangePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== "custom") {
      const days = parseInt(preset, 10);
      setCustomStartDate(getDateDaysAgo(days));
      setCustomEndDate(formatDate());
    }
  };

  const getEffectiveDateRange = () => {
    if (dateRangePreset === "custom") {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    const days = parseInt(dateRangePreset, 10);
    return { startDate: getDateDaysAgo(days), endDate: formatDate() };
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

  const { startDate: effectiveStartDate, endDate: effectiveEndDate } = getEffectiveDateRange();

  const renderStatsView = () => (
    <View className="stats-view">
      <View className="date-range-selector">
        <View
          className={`date-range-option ${dateRangePreset === "7" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("7")}
        >
          <Text>7天</Text>
        </View>
        <View
          className={`date-range-option ${dateRangePreset === "30" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("30")}
        >
          <Text>30天</Text>
        </View>
        <View
          className={`date-range-option ${dateRangePreset === "90" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("90")}
        >
          <Text>90天</Text>
        </View>
        <View
          className={`date-range-option ${dateRangePreset === "custom" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("custom")}
        >
          <Text>自定义</Text>
        </View>
      </View>

      {dateRangePreset === "custom" && (
        <View className="custom-date-range">
          <View className="date-picker" onClick={() => setStartCalendarVisible(true)}>
            <Text>{customStartDate}</Text>
          </View>
          <Text className="date-range-separator">至</Text>
          <View className="date-picker" onClick={() => setEndCalendarVisible(true)}>
            <Text>{customEndDate}</Text>
          </View>
        </View>
      )}

      <View className="stats-chart-placeholder">
        <Text className="placeholder-text">
          {effectiveStartDate} ~ {effectiveEndDate}
        </Text>
        <Text className="placeholder-text">图表开发中...</Text>
      </View>

      <CalendarPopup
        visible={startCalendarVisible}
        value={customStartDate}
        onChange={(date) => {
          setCustomStartDate(date);
          if (date > customEndDate) {
            setCustomEndDate(date);
          }
        }}
        onClose={() => setStartCalendarVisible(false)}
      />
      <CalendarPopup
        visible={endCalendarVisible}
        value={customEndDate}
        onChange={(date) => {
          setCustomEndDate(date);
          if (date < customStartDate) {
            setCustomStartDate(date);
          }
        }}
        onClose={() => setEndCalendarVisible(false)}
      />
    </View>
  );

  return (
    <View className="history-page">
      <View className="type-filter">
        {RECORD_TYPE_OPTIONS.map((option) => (
          <View
            key={option.value}
            className={`type-option ${selectedType === option.value ? "active" : ""}`}
            onClick={() => handleTypeChange(option.value)}
          >
            <Text className="type-icon">{option.icon}</Text>
            <Text className="type-label">{option.label}</Text>
          </View>
        ))}
      </View>

      {selectedType === "stool" && (
        <View className="view-mode-tabs">
          <View
            className={`view-mode-tab ${viewMode === "records" ? "active" : ""}`}
            onClick={() => handleViewModeChange("records")}
          >
            <Text>记录</Text>
          </View>
          <View
            className={`view-mode-tab ${viewMode === "stats" ? "active" : ""}`}
            onClick={() => handleViewModeChange("stats")}
          >
            <Text>统计</Text>
          </View>
        </View>
      )}

      {selectedType === "stool" && viewMode === "stats" ? (
        renderStatsView()
      ) : loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
        </View>
      ) : (
        <ScrollView
          className="records-scroll"
          scrollY
          refresherEnabled
          refresherTriggered={loading}
          onRefresherRefresh={handleRefresh}
          onScrollToLower={handleLoadMore}
          lowerThreshold={100}
        >
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
                    <RecordItem key={record._id} record={record} />
                  ))}
                </View>
              </View>
            ))}
          </View>
          {loadingMore && (
            <View className="loading-more">
              <Text>加载中...</Text>
            </View>
          )}
          {!hasMore && records.length > 0 && (
            <View className="no-more">
              <Text>没有更多了</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
