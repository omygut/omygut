import { View, Text } from "@tarojs/components";
import { useCallback } from "react";
import BarChart from "../../../components/BarChart";
import SymptomPicker from "../../../components/SymptomPicker";
import type { ChartEvent } from "../../../types";

// 1: yellow (轻度), 2: brown-red (中度), 3: red (重度)
const getSeverityColor = (value: number): string => {
  if (value <= 1) return "#e6c84c"; // light yellow
  if (value <= 2) return "#a5442d"; // brown-red
  return "#f5222d"; // red
};

interface SymptomTrendChartViewProps {
  chartData: { date: string; value: number }[];
  loading: boolean;
  selectedSymptom: string;
  symptomPickerVisible: boolean;
  events: ChartEvent[];
  onSymptomSelect: (symptom: string) => void;
  onSymptomPickerOpen: () => void;
  onSymptomPickerClose: () => void;
  onEventTap: (event: ChartEvent) => void;
  onAddEvent: () => void;
  dateRangeSelector: React.ReactNode;
}

export default function SymptomTrendChartView({
  chartData,
  loading,
  selectedSymptom,
  symptomPickerVisible,
  events,
  onSymptomSelect,
  onSymptomPickerOpen,
  onSymptomPickerClose,
  onEventTap,
  onAddEvent,
  dateRangeSelector,
}: SymptomTrendChartViewProps) {
  const getBarColor = useCallback((value: number) => getSeverityColor(value), []);

  return (
    <View className="stats-view">
      <View className="stats-header">
        <View className="stats-header-row">
          <View className="stats-title indicator-selector" onClick={onSymptomPickerOpen}>
            <Text>{selectedSymptom || "选择症状"}</Text>
            <Text className="indicator-selector-arrow">▼</Text>
          </View>
          <View className="add-event-btn" onClick={onAddEvent}>
            <Text>+ 事件</Text>
          </View>
        </View>
        {dateRangeSelector}
      </View>
      <View className="stats-chart-container">
        {!selectedSymptom ? (
          <View className="stats-empty">
            <Text>请选择要查看的症状</Text>
          </View>
        ) : loading ? (
          <View className="stats-loading">
            <Text>加载中...</Text>
          </View>
        ) : chartData.length === 0 ? (
          <View className="stats-empty">
            <Text>暂无数据</Text>
          </View>
        ) : (
          <BarChart
            data={chartData}
            maxValue={3}
            events={events}
            onEventTap={onEventTap}
            getBarColor={getBarColor}
          />
        )}
      </View>
      {chartData.length > 0 && (
        <View className="stats-data-list">
          {[...chartData].reverse().map((item, index) => (
            <View key={index} className="stats-data-item">
              <Text className="stats-data-date">{item.date}</Text>
              <Text className="stats-data-value">
                {item.value === 1 ? "轻度" : item.value === 2 ? "中度" : "重度"}
              </Text>
            </View>
          ))}
        </View>
      )}

      <SymptomPicker
        visible={symptomPickerVisible}
        onSelect={onSymptomSelect}
        onClose={onSymptomPickerClose}
      />
    </View>
  );
}
