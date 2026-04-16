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
import BarChart from "../../components/BarChart";
import { RecordType, RECORD_TYPE_OPTIONS } from "../../types";
import "./index.css";

type StoolViewTab = "score" | "count" | "records";
type DateRangePreset = "7" | "30" | "365" | "custom";

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
  const [stoolViewTab, setStoolViewTab] = useState<StoolViewTab>("score");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("7");
  const [customStartDate, setCustomStartDate] = useState(() => getDateDaysAgo(7));
  const [customEndDate, setCustomEndDate] = useState(() => formatDate());
  const [startCalendarVisible, setStartCalendarVisible] = useState(false);
  const [endCalendarVisible, setEndCalendarVisible] = useState(false);
  const [countData, setCountData] = useState<{ date: string; value: number }[]>([]);
  const [scoreData, setScoreData] = useState<{ date: string; value: number }[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const cursorRef = useRef({ date: "9999-12-31", time: "23:59" });
  const dateRangeRef = useRef({ startDate: "", endDate: "" });

  const loadMore = useCallback(async (type: RecordType, startDate: string, endDate: string) => {
    const service = services[type];
    const cursor = cursorRef.current;

    const data = await service.getByDateRangeBefore(
      startDate,
      endDate,
      cursor.date,
      cursor.time,
      PAGE_SIZE,
    );

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
    async (type: RecordType, startDate: string, endDate: string) => {
      setLoading(true);
      setHasMore(true);
      cursorRef.current = { date: "9999-12-31", time: "23:59" };
      dateRangeRef.current = { startDate, endDate };

      try {
        const newRecords = await loadMore(type, startDate, endDate);
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
      const { startDate, endDate } = dateRangeRef.current;
      const newRecords = await loadMore(selectedType, startDate, endDate);
      if (newRecords.length > 0) {
        setRecords((prev) => [...prev, ...newRecords]);
      }
    } catch (error) {
      console.error("加载更多失败:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadMore, selectedType, loadingMore, hasMore]);

  const getEffectiveDateRange = useCallback(() => {
    if (dateRangePreset === "custom") {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    const days = parseInt(dateRangePreset, 10);
    return { startDate: getDateDaysAgo(days), endDate: formatDate() };
  }, [dateRangePreset, customStartDate, customEndDate]);

  useDidShow(() => {
    const { startDate, endDate } = getEffectiveDateRange();
    loadInitial(selectedType, startDate, endDate);
  });

  const handleRefresh = useCallback(async () => {
    const { startDate, endDate } = getEffectiveDateRange();
    await loadInitial(selectedType, startDate, endDate);
  }, [loadInitial, selectedType, getEffectiveDateRange]);

  const handleTypeChange = (type: RecordType) => {
    if (type === selectedType) return;
    setSelectedType(type);
    Taro.setStorageSync("history_selected_type", type);
    setRecords([]);
    setStoolViewTab("score");
    const { startDate, endDate } = getEffectiveDateRange();
    loadInitial(type, startDate, endDate);
  };

  const loadStatsData = useCallback(async (startDate: string, endDate: string) => {
    setStatsLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: "stool-stats",
        data: { startDate, endDate },
      });
      const result = res.result as {
        data: { date: string; count: number; score: number }[];
      };
      const rawData = result.data || [];

      setCountData(rawData.map((d) => ({ date: d.date, value: d.count })));
      setScoreData(rawData.map((d) => ({ date: d.date, value: d.score })));
    } catch (error) {
      console.error("加载统计数据失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleStoolViewTabChange = (tab: StoolViewTab) => {
    if (tab === stoolViewTab) return;
    setStoolViewTab(tab);
    if (tab !== "records" && countData.length === 0) {
      const { startDate, endDate } = getEffectiveDateRange();
      loadStatsData(startDate, endDate);
    }
  };

  const handleDateRangePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== "custom") {
      const days = parseInt(preset, 10);
      const startDate = getDateDaysAgo(days);
      const endDate = formatDate();
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      setRecords([]);
      loadInitial(selectedType, startDate, endDate);
      if (selectedType === "stool" && stoolViewTab !== "records") {
        loadStatsData(startDate, endDate);
      }
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setRecords([]);
    loadInitial(selectedType, start, end);
    if (selectedType === "stool" && stoolViewTab !== "records") {
      loadStatsData(start, end);
    }
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

  const renderChartView = (
    title: string,
    data: { date: string; value: number }[],
    maxValue?: number,
    higherIsBetter?: boolean,
  ) => (
    <View className="stats-view">
      <View className="stats-header">
        <Text className="stats-title">{title}</Text>
        <Text className="stats-range">
          {effectiveStartDate} ~ {effectiveEndDate}
        </Text>
      </View>
      <View className="stats-chart-container">
        {statsLoading ? (
          <View className="stats-loading">
            <Text>加载中...</Text>
          </View>
        ) : data.length === 0 ? (
          <View className="stats-empty">
            <Text>暂无数据</Text>
          </View>
        ) : (
          <BarChart data={data} maxValue={maxValue} higherIsBetter={higherIsBetter} />
        )}
      </View>
    </View>
  );

  return (
    <View className="history-page">
      <View className="date-range-selector">
        <View
          className={`date-range-option ${dateRangePreset === "7" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("7")}
        >
          <Text>一周</Text>
        </View>
        <View
          className={`date-range-option ${dateRangePreset === "30" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("30")}
        >
          <Text>一月</Text>
        </View>
        <View
          className={`date-range-option ${dateRangePreset === "365" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("365")}
        >
          <Text>一年</Text>
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

      <CalendarPopup
        visible={startCalendarVisible}
        value={customStartDate}
        onChange={(date) => {
          const newEndDate = date > customEndDate ? date : customEndDate;
          setCustomStartDate(date);
          if (date > customEndDate) {
            setCustomEndDate(date);
          }
          handleCustomDateChange(date, newEndDate);
        }}
        onClose={() => setStartCalendarVisible(false)}
      />
      <CalendarPopup
        visible={endCalendarVisible}
        value={customEndDate}
        onChange={(date) => {
          const newStartDate = date < customStartDate ? date : customStartDate;
          setCustomEndDate(date);
          if (date < customStartDate) {
            setCustomStartDate(date);
          }
          handleCustomDateChange(newStartDate, date);
        }}
        onClose={() => setEndCalendarVisible(false)}
      />

      <ScrollView className="type-filter" scrollX scrollIntoView={`type-${selectedType}`}>
        {RECORD_TYPE_OPTIONS.map((option) => (
          <View
            key={option.value}
            id={`type-${option.value}`}
            className={`type-option ${selectedType === option.value ? "active" : ""}`}
            onClick={() => handleTypeChange(option.value)}
          >
            <Text className="type-icon">{option.icon}</Text>
            <Text className="type-label">{option.label}</Text>
          </View>
        ))}
      </ScrollView>

      {selectedType === "stool" && (
        <View className="view-mode-tabs">
          <View
            className={`view-mode-tab ${stoolViewTab === "score" ? "active" : ""}`}
            onClick={() => handleStoolViewTabChange("score")}
          >
            <Text>分数统计</Text>
          </View>
          <View
            className={`view-mode-tab ${stoolViewTab === "count" ? "active" : ""}`}
            onClick={() => handleStoolViewTabChange("count")}
          >
            <Text>次数统计</Text>
          </View>
          <View
            className={`view-mode-tab ${stoolViewTab === "records" ? "active" : ""}`}
            onClick={() => handleStoolViewTabChange("records")}
          >
            <Text>原始数据</Text>
          </View>
        </View>
      )}

      {selectedType === "stool" && stoolViewTab === "score" ? (
        renderChartView("每日肠道健康得分", scoreData, 10, true)
      ) : selectedType === "stool" && stoolViewTab === "count" ? (
        renderChartView("每日排便次数", countData)
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
