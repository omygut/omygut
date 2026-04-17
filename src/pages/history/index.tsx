import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback, useRef } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { examService } from "../../services/exam";
import { eventService } from "../../services/event";
import { findStandardIndicator, StandardIndicator } from "../../services/labtest-standards";
import { formatDisplayDate, getWeekday, formatDate } from "../../utils/date";
import IndicatorPicker from "../../components/IndicatorPicker";
import RecordItem, { AnyRecord } from "../../components/RecordItem";
import CalendarPopup from "../../components/CalendarPopup";
import EventFormPopup from "../../components/EventFormPopup";
import BarChart from "../../components/BarChart";
import LineChart, { LineChartData } from "../../components/LineChart";
import { RecordType, RECORD_TYPE_OPTIONS, LabTestRecord, ChartEvent } from "../../types";
import "./index.css";

// 默认指标：粪便钙卫蛋白
const DEFAULT_INDICATOR: StandardIndicator = {
  specimen: "粪便",
  category: "炎症标志物",
  nameZh: "粪便钙卫蛋白",
  abbr: "FCP",
  unit: "μg/g",
  refMax: 50,
};

type StoolViewTab = "score" | "count" | "records";
type LabtestViewTab = "chart" | "records";
type DateRangePreset = "7" | "30" | "365" | "all" | "custom";

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
  const [labtestViewTab, setLabtestViewTab] = useState<LabtestViewTab>("chart");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>(() => {
    return Taro.getStorageSync("history_date_range_preset") || "7";
  });
  const [customStartDate, setCustomStartDate] = useState(() => getDateDaysAgo(7));
  const [customEndDate, setCustomEndDate] = useState(() => formatDate());
  const [startCalendarVisible, setStartCalendarVisible] = useState(false);
  const [endCalendarVisible, setEndCalendarVisible] = useState(false);
  const [countData, setCountData] = useState<{ date: string; value: number }[]>([]);
  const [scoreData, setScoreData] = useState<{ date: string; value: number }[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Labtest stats state
  const [labtestChartData, setLabtestChartData] = useState<LineChartData[]>([]);
  const [labtestStatsLoading, setLabtestStatsLoading] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<StandardIndicator>(() => {
    const saved = Taro.getStorageSync("history_selected_indicator");
    return saved ? JSON.parse(saved) : DEFAULT_INDICATOR;
  });
  const [indicatorPickerVisible, setIndicatorPickerVisible] = useState(false);

  // Event state
  const [events, setEvents] = useState<ChartEvent[]>([]);
  const [eventFormVisible, setEventFormVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChartEvent | undefined>(undefined);

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
    if (dateRangePreset === "all") {
      return { startDate: "1900-01-01", endDate: formatDate() };
    }
    const days = parseInt(dateRangePreset, 10);
    return { startDate: getDateDaysAgo(days), endDate: formatDate() };
  }, [dateRangePreset, customStartDate, customEndDate]);

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

  const loadLabtestStatsData = useCallback(
    async (startDate: string, endDate: string, indicator: StandardIndicator) => {
      setLabtestStatsLoading(true);
      try {
        // Fetch labtest records in date range
        const allRecords = await labTestService.getByDateRange(startDate, endDate);

        // Extract indicator values
        const chartData: LineChartData[] = [];
        (allRecords as LabTestRecord[]).forEach((record) => {
          record.indicators.forEach((ind) => {
            const matched = findStandardIndicator(ind.name, record.specimen);
            if (matched && matched.nameZh === indicator.nameZh) {
              // Parse value, handling comparison symbols like >1800 or <10
              const valueStr = ind.value.trim();
              const numValue = parseFloat(valueStr.replace(/^[<>]/, ""));
              if (!isNaN(numValue)) {
                chartData.push({ date: record.date, value: numValue, displayValue: valueStr });
              }
            }
          });
        });

        // Sort by date ascending
        chartData.sort((a, b) => a.date.localeCompare(b.date));
        setLabtestChartData(chartData);
      } catch (error) {
        console.error("加载化验统计数据失败:", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
      } finally {
        setLabtestStatsLoading(false);
      }
    },
    [],
  );

  useDidShow(() => {
    // Load events
    setEvents(eventService.getAll());

    const { startDate, endDate } = getEffectiveDateRange();
    loadInitial(selectedType, startDate, endDate);
    // Load chart data for stool and labtest
    if (selectedType === "stool") {
      loadStatsData(startDate, endDate);
    } else if (selectedType === "labtest") {
      loadLabtestStatsData(startDate, endDate, selectedIndicator);
    }
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
    setLabtestViewTab("chart");
    // Reset labtest stats when switching types
    setLabtestChartData([]);
    const { startDate, endDate } = getEffectiveDateRange();
    loadInitial(type, startDate, endDate);
    // Load chart data for stool and labtest
    if (type === "stool") {
      loadStatsData(startDate, endDate);
    } else if (type === "labtest") {
      loadLabtestStatsData(startDate, endDate, selectedIndicator);
    }
  };

  const handleStoolViewTabChange = (tab: StoolViewTab) => {
    if (tab === stoolViewTab) return;
    setStoolViewTab(tab);
    if (tab !== "records" && countData.length === 0) {
      const { startDate, endDate } = getEffectiveDateRange();
      loadStatsData(startDate, endDate);
    }
  };

  const handleLabtestViewTabChange = (tab: LabtestViewTab) => {
    if (tab === labtestViewTab) return;
    setLabtestViewTab(tab);
    if (tab === "chart" && labtestChartData.length === 0) {
      const { startDate, endDate } = getEffectiveDateRange();
      loadLabtestStatsData(startDate, endDate, selectedIndicator);
    }
  };

  const handleIndicatorSelect = (indicator: StandardIndicator) => {
    setSelectedIndicator(indicator);
    Taro.setStorageSync("history_selected_indicator", JSON.stringify(indicator));
    setLabtestChartData([]);
    const { startDate, endDate } = getEffectiveDateRange();
    loadLabtestStatsData(startDate, endDate, indicator);
  };

  const handleDateRangePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    Taro.setStorageSync("history_date_range_preset", preset);
    if (preset !== "custom") {
      let startDate: string;
      const endDate = formatDate();
      if (preset === "all") {
        startDate = "1900-01-01";
      } else {
        const days = parseInt(preset, 10);
        startDate = getDateDaysAgo(days);
      }
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      setRecords([]);
      loadInitial(selectedType, startDate, endDate);
      if (selectedType === "stool" && stoolViewTab !== "records") {
        loadStatsData(startDate, endDate);
      }
      if (selectedType === "labtest" && labtestViewTab === "chart") {
        loadLabtestStatsData(startDate, endDate, selectedIndicator);
      }
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setRecords([]);
    loadInitial(selectedType, start, end);
    if (selectedType === "stool" && stoolViewTab !== "records") {
      loadStatsData(start, end);
    }
    if (selectedType === "labtest" && labtestViewTab === "chart") {
      loadLabtestStatsData(start, end, selectedIndicator);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setEventFormVisible(true);
  };

  const handleEventTap = (event: ChartEvent) => {
    Taro.showActionSheet({
      itemList: ["编辑", "删除"],
    })
      .then((res) => {
        if (res.tapIndex === 0) {
          setEditingEvent(event);
          setEventFormVisible(true);
        } else if (res.tapIndex === 1) {
          Taro.showModal({
            title: "确认删除",
            content: `确定要删除事件"${event.description}"吗？`,
          }).then((modalRes) => {
            if (modalRes.confirm) {
              eventService.remove(event.id);
              setEvents(eventService.getAll());
            }
          });
        }
      })
      .catch(() => {
        // User cancelled action sheet
      });
  };

  const handleEventFormConfirm = (date: string, description: string) => {
    if (editingEvent) {
      eventService.update(editingEvent.id, date, description);
    } else {
      eventService.add(date, description);
    }
    setEvents(eventService.getAll());
    setEventFormVisible(false);
    setEditingEvent(undefined);
  };

  const handleEventFormClose = () => {
    setEventFormVisible(false);
    setEditingEvent(undefined);
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
        <View className="stats-header-row">
          <Text className="stats-title">{title}</Text>
          <View className="add-event-btn" onClick={handleAddEvent}>
            <Text>+ 事件</Text>
          </View>
        </View>
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
          <BarChart
            data={data}
            maxValue={maxValue}
            higherIsBetter={higherIsBetter}
            events={events}
            onEventTap={handleEventTap}
          />
        )}
      </View>
    </View>
  );

  const renderLabtestStatsView = () => {
    const refRange =
      selectedIndicator.refMin !== undefined && selectedIndicator.refMax !== undefined
        ? `${selectedIndicator.refMin}-${selectedIndicator.refMax}`
        : selectedIndicator.refMax !== undefined
          ? `<${selectedIndicator.refMax}`
          : selectedIndicator.refMin !== undefined
            ? `>${selectedIndicator.refMin}`
            : "";

    const isOutOfRange = (value: number) => {
      if (selectedIndicator.refMin !== undefined && value < selectedIndicator.refMin) return true;
      if (selectedIndicator.refMax !== undefined && value > selectedIndicator.refMax) return true;
      return false;
    };

    return (
      <View className="stats-view">
        <View className="stats-header">
          <View className="stats-header-row">
            <View
              className="stats-title indicator-selector"
              onClick={() => setIndicatorPickerVisible(true)}
            >
              <Text>
                {selectedIndicator.nameZh} ({selectedIndicator.abbr})
              </Text>
              <Text className="indicator-selector-arrow">▼</Text>
            </View>
            <View className="add-event-btn" onClick={handleAddEvent}>
              <Text>+ 事件</Text>
            </View>
          </View>
          {refRange && (
            <Text className="stats-range">
              参考范围: {refRange} {selectedIndicator.unit}
            </Text>
          )}
        </View>
        <View className="stats-chart-container">
          {labtestStatsLoading ? (
            <View className="stats-loading">
              <Text>加载中...</Text>
            </View>
          ) : labtestChartData.length === 0 ? (
            <View className="stats-empty">
              <Text>暂无数据</Text>
            </View>
          ) : (
            <LineChart
              data={labtestChartData}
              unit={selectedIndicator.unit}
              refMin={selectedIndicator.refMin}
              refMax={selectedIndicator.refMax}
              events={events}
              onEventTap={handleEventTap}
            />
          )}
        </View>
        {labtestChartData.length > 0 && (
          <View className="stats-data-list">
            {[...labtestChartData].reverse().map((item, index) => (
              <View key={index} className="stats-data-item">
                <Text className="stats-data-date">{item.date}</Text>
                <Text
                  className={`stats-data-value ${isOutOfRange(item.value) ? "out-of-range" : ""}`}
                >
                  {item.displayValue || item.value} {selectedIndicator.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        <IndicatorPicker
          visible={indicatorPickerVisible}
          onSelect={handleIndicatorSelect}
          onClose={() => setIndicatorPickerVisible(false)}
        />
      </View>
    );
  };

  const renderRecordsList = () => {
    if (loading) {
      return <View className="loading">加载中...</View>;
    }
    if (records.length === 0) {
      return (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
        </View>
      );
    }
    return (
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
    );
  };

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
          className={`date-range-option ${dateRangePreset === "all" ? "active" : ""}`}
          onClick={() => handleDateRangePresetChange("all")}
        >
          <Text>所有</Text>
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

      {selectedType === "labtest" && (
        <View className="view-mode-tabs">
          <View
            className={`view-mode-tab ${labtestViewTab === "chart" ? "active" : ""}`}
            onClick={() => handleLabtestViewTabChange("chart")}
          >
            <Text>钙卫蛋白趋势</Text>
          </View>
          <View
            className={`view-mode-tab ${labtestViewTab === "records" ? "active" : ""}`}
            onClick={() => handleLabtestViewTabChange("records")}
          >
            <Text>原始数据</Text>
          </View>
        </View>
      )}

      {selectedType === "stool" && stoolViewTab === "score"
        ? renderChartView("每日排便得分", scoreData, 10, true)
        : selectedType === "stool" && stoolViewTab === "count"
          ? renderChartView("每日排便次数", countData)
          : selectedType === "labtest" && labtestViewTab === "chart"
            ? renderLabtestStatsView()
            : renderRecordsList()}

      <EventFormPopup
        visible={eventFormVisible}
        event={editingEvent}
        onConfirm={handleEventFormConfirm}
        onClose={handleEventFormClose}
      />
    </View>
  );
}
