import { View, Text } from "@tarojs/components";
import { useState } from "react";
import BarChart from "../../../components/BarChart";
import type { ChartEvent } from "../../../types";

interface StoolChartViewProps {
  title: string;
  data: { date: string; value: number }[];
  maxValue?: number;
  loading: boolean;
  showHelp?: boolean;
  events: ChartEvent[];
  onEventTap: (event: ChartEvent) => void;
  onAddEvent: () => void;
  dateRangeSelector: React.ReactNode;
}

export default function StoolChartView({
  title,
  data,
  maxValue,
  loading,
  showHelp,
  events,
  onEventTap,
  onAddEvent,
  dateRangeSelector,
}: StoolChartViewProps) {
  const [scoreHelpVisible, setScoreHelpVisible] = useState(false);

  return (
    <View className="stats-view">
      <View className="stats-header">
        <View className="stats-header-row">
          <View className="stats-title-row">
            <Text className="stats-title">{title}</Text>
            {showHelp && (
              <View className="stats-help-btn" onClick={() => setScoreHelpVisible(true)}>
                <Text>?</Text>
              </View>
            )}
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
          <BarChart data={data} maxValue={maxValue} events={events} onEventTap={onEventTap} />
        )}
      </View>

      {scoreHelpVisible && (
        <View className="help-popup-mask" onClick={() => setScoreHelpVisible(false)}>
          <View className="help-popup" onClick={(e) => e.stopPropagation()}>
            <Text className="help-popup-title">排便得分计算规则</Text>
            <View className="help-popup-section">
              <Text className="help-popup-subtitle">Bristol 分型得分：</Text>
              <Text className="help-popup-item">3-4型（正常）：6分</Text>
              <Text className="help-popup-item">2型或5型：4分</Text>
              <Text className="help-popup-item">1型或6型：2分</Text>
              <Text className="help-popup-item">7型（水样）：0分</Text>
            </View>
            <View className="help-popup-section">
              <Text className="help-popup-subtitle">次数得分：</Text>
              <Text className="help-popup-item">
                1-2次：4分；3次：3分；4次：2分；5次：1分；6+次：0分
              </Text>
            </View>
            <View className="help-popup-section">
              <Text className="help-popup-item">每日得分 = 平均分型得分 + 次数得分</Text>
              <Text className="help-popup-item">得分越高越好，满分 10 分</Text>
            </View>
            <View className="help-popup-btn" onClick={() => setScoreHelpVisible(false)}>
              <Text>知道了</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
