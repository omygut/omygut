import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback, useRef, useEffect } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { examService } from "../../services/exam";
import { eventService } from "../../services/event";
import { findStandardIndicator, StandardIndicator } from "../../services/labtest-standards";
import { formatDate } from "../../utils/date";
import { AnyRecord } from "../../components/RecordItem";
import CalendarPopup from "../../components/CalendarPopup";
import EventFormPopup from "../../components/EventFormPopup";
import { LineChartData } from "../../components/LineChart";
import { RecordType, RECORD_TYPE_OPTIONS, LabTestRecord, ChartEvent } from "../../types";
import StoolChartView from "./components/StoolChartView";
import LabtestChartView from "./components/LabtestChartView";
import RecordsList from "./components/RecordsList";
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
type DateRangePreset = "30" | "90" | "365" | "1095" | "all" | "custom";

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

const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  "30": "近一月",
  "90": "近三月",
  "365": "近一年",
  "1095": "近三年",
  all: "所有",
  custom: "自定义",
};

function getTypeLabel(type: RecordType): string {
  return RECORD_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || "";
}

export default function Stats() {
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
    const saved = Taro.getStorageSync("history_date_range_preset");
    // Migrate old "7" preset to "30"
    if (saved === "7") return "30";
    return saved || "30";
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
      return { startDate: "2000-01-01", endDate: formatDate() };
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

  const needsRefreshRef = useRef(true);

  useEffect(() => {
    const handleRecordChange = () => {
      needsRefreshRef.current = true;
    };
    Taro.eventCenter.on("recordChange", handleRecordChange);
    return () => {
      Taro.eventCenter.off("recordChange", handleRecordChange);
    };
  }, []);

  useDidShow(() => {
    // Update navigation bar title
    Taro.setNavigationBarTitle({ title: `${getTypeLabel(selectedType)}数据` });

    // Load events (lightweight, always refresh)
    setEvents(eventService.getAll());

    // Only reload data if needed (first load or after record changes)
    if (!needsRefreshRef.current) return;
    needsRefreshRef.current = false;

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
    Taro.setNavigationBarTitle({ title: `${getTypeLabel(type)}数据` });
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
        startDate = "2000-01-01";
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

  const showDateRangePicker = () => {
    const presets: DateRangePreset[] = ["30", "90", "365", "1095", "all", "custom"];
    const labels = presets.map((p) => DATE_RANGE_LABELS[p]);
    Taro.showActionSheet({ itemList: labels })
      .then((res) => {
        handleDateRangePresetChange(presets[res.tapIndex]);
      })
      .catch(() => {});
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

  const { startDate: effectiveStartDate, endDate: effectiveEndDate } = getEffectiveDateRange();

  const renderDateRangeSelector = () => (
    <View className="chart-date-range">
      <View className="date-range-btn" onClick={showDateRangePicker}>
        <Text>{DATE_RANGE_LABELS[dateRangePreset]}</Text>
        <Text className="date-range-arrow">▼</Text>
      </View>
      {dateRangePreset === "custom" && (
        <View className="custom-date-range">
          <View className="date-picker" onClick={() => setStartCalendarVisible(true)}>
            <Text>{customStartDate}</Text>
          </View>
          <Text className="date-range-separator">~</Text>
          <View className="date-picker" onClick={() => setEndCalendarVisible(true)}>
            <Text>{customEndDate}</Text>
          </View>
        </View>
      )}
      {dateRangePreset !== "custom" && (
        <Text className="date-range-display">
          {effectiveStartDate} ~ {effectiveEndDate}
        </Text>
      )}
    </View>
  );

  return (
    <View className="stats-page">
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

      <View className="type-tabs">
        {RECORD_TYPE_OPTIONS.map((option) => (
          <View
            key={option.value}
            className={`type-tab ${selectedType === option.value ? "active" : ""}`}
            onClick={() => handleTypeChange(option.value)}
          >
            <Text className="type-tab-icon">{option.icon}</Text>
          </View>
        ))}
      </View>

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
            <Text>指标趋势</Text>
          </View>
          <View
            className={`view-mode-tab ${labtestViewTab === "records" ? "active" : ""}`}
            onClick={() => handleLabtestViewTabChange("records")}
          >
            <Text>原始数据</Text>
          </View>
        </View>
      )}

      {selectedType === "stool" && stoolViewTab === "score" ? (
        <StoolChartView
          title="每日排便得分"
          data={scoreData}
          maxValue={10}
          loading={statsLoading}
          showHelp
          events={events}
          onEventTap={handleEventTap}
          onAddEvent={handleAddEvent}
          dateRangeSelector={renderDateRangeSelector()}
        />
      ) : selectedType === "stool" && stoolViewTab === "count" ? (
        <StoolChartView
          title="每日排便次数"
          data={countData}
          loading={statsLoading}
          events={events}
          onEventTap={handleEventTap}
          onAddEvent={handleAddEvent}
          dateRangeSelector={renderDateRangeSelector()}
        />
      ) : selectedType === "labtest" && labtestViewTab === "chart" ? (
        <LabtestChartView
          chartData={labtestChartData}
          loading={labtestStatsLoading}
          selectedIndicator={selectedIndicator}
          indicatorPickerVisible={indicatorPickerVisible}
          events={events}
          onIndicatorSelect={handleIndicatorSelect}
          onIndicatorPickerOpen={() => setIndicatorPickerVisible(true)}
          onIndicatorPickerClose={() => setIndicatorPickerVisible(false)}
          onEventTap={handleEventTap}
          onAddEvent={handleAddEvent}
          dateRangeSelector={renderDateRangeSelector()}
        />
      ) : (
        <RecordsList
          records={records}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
        />
      )}

      <EventFormPopup
        visible={eventFormVisible}
        event={editingEvent}
        onConfirm={handleEventFormConfirm}
        onClose={handleEventFormClose}
      />
    </View>
  );
}
