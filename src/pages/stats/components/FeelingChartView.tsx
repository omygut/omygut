import { View, Text } from "@tarojs/components";
import { useCallback } from "react";
import BarChart from "../../../components/BarChart";
import type { ChartEvent } from "../../../types";

// 1-2: red, 3-4: yellow, 5: green
const getFeelingColor = (value: number): string => {
  if (value <= 2) return "#fa5151"; // red
  if (value <= 4) return "#ffc300"; // yellow
  return "#5fcf9a"; // green
};

interface FeelingChartViewProps {
  data: { date: string; value: number }[];
  loading: boolean;
  events: ChartEvent[];
  onEventTap: (event: ChartEvent) => void;
  onAddEvent: () => void;
  dateRangeSelector: React.ReactNode;
}

export default function FeelingChartView({
  data,
  loading,
  events,
  onEventTap,
  onAddEvent,
  dateRangeSelector,
}: FeelingChartViewProps) {
  const getBarColor = useCallback((value: number) => getFeelingColor(value), []);

  return (
    <View className="stats-view">
      <View className="stats-header">
        <View className="stats-header-row">
          <View className="stats-title">
            <Text>整体感受趋势</Text>
          </View>
          <View className="add-event-btn" onClick={onAddEvent}>
            <Text>+ 事件</Text>
          </View>
        </View>
        {dateRangeSelector}
      </View>
      <View className="stats-chart-container">
        {loading ? (
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
            maxValue={5}
            events={events}
            onEventTap={onEventTap}
            getBarColor={getBarColor}
          />
        )}
      </View>
    </View>
  );
}
