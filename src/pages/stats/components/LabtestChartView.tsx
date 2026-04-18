import { View, Text } from "@tarojs/components";
import LineChart, { LineChartData } from "../../../components/LineChart";
import IndicatorPicker from "../../../components/IndicatorPicker";
import type { StandardIndicator } from "../../../services/labtest-standards";
import type { ChartEvent } from "../../../types";

interface LabtestChartViewProps {
  chartData: LineChartData[];
  loading: boolean;
  selectedIndicator: StandardIndicator;
  indicatorPickerVisible: boolean;
  events: ChartEvent[];
  onIndicatorSelect: (indicator: StandardIndicator) => void;
  onIndicatorPickerOpen: () => void;
  onIndicatorPickerClose: () => void;
  onEventTap: (event: ChartEvent) => void;
  onAddEvent: () => void;
  dateRangeSelector: React.ReactNode;
}

export default function LabtestChartView({
  chartData,
  loading,
  selectedIndicator,
  indicatorPickerVisible,
  events,
  onIndicatorSelect,
  onIndicatorPickerOpen,
  onIndicatorPickerClose,
  onEventTap,
  onAddEvent,
  dateRangeSelector,
}: LabtestChartViewProps) {
  const isOutOfRange = (value: number) => {
    if (selectedIndicator.refMin !== undefined && value < selectedIndicator.refMin) return true;
    if (selectedIndicator.refMax !== undefined && value > selectedIndicator.refMax) return true;
    return false;
  };

  return (
    <View className="stats-view">
      <View className="stats-header">
        <View className="stats-header-row">
          <View className="stats-title indicator-selector" onClick={onIndicatorPickerOpen}>
            <Text>
              {selectedIndicator.nameZh} ({selectedIndicator.abbr})
            </Text>
            <Text className="indicator-selector-arrow">▼</Text>
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
        ) : chartData.length === 0 ? (
          <View className="stats-empty">
            <Text>暂无数据</Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            unit={selectedIndicator.unit}
            refMin={selectedIndicator.refMin}
            refMax={selectedIndicator.refMax}
            events={events}
            onEventTap={onEventTap}
          />
        )}
      </View>
      {chartData.length > 0 && (
        <View className="stats-data-list">
          {[...chartData].reverse().map((item, index) => (
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
        onSelect={onIndicatorSelect}
        onClose={onIndicatorPickerClose}
      />
    </View>
  );
}
