import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useCallback } from "react";
import type { ChartEvent } from "../../types";
import "./index.css";

export interface BarChartData {
  date: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  events?: ChartEvent[];
  onEventTap?: (event: ChartEvent) => void;
  getBarColor?: (value: number) => string;
}

export default function BarChart({
  data,
  maxValue: propMaxValue,
  events = [],
  onEventTap,
  getBarColor,
}: BarChartProps) {
  const canvasId = useRef(`bar-chart-${Date.now()}`).current;
  const eventPositionsRef = useRef<{ event: ChartEvent; x: number }[]>([]);

  const handleTouchEnd = useCallback(
    (e: { changedTouches: { x: number }[] }) => {
      if (!onEventTap || eventPositionsRef.current.length === 0) return;

      const touchX = e.changedTouches[0].x;
      const hitThreshold = 20;

      for (const { event, x } of eventPositionsRef.current) {
        if (Math.abs(touchX - x) < hitThreshold) {
          onEventTap(event);
          break;
        }
      }
    },
    [onEventTap],
  );

  useEffect(() => {
    if (data.length === 0) return;

    const query = Taro.createSelectorQuery();
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const positions = drawChart(ctx, width, height, data, propMaxValue, events, getBarColor);
        eventPositionsRef.current = positions;
      });
  }, [data, propMaxValue, canvasId, events, getBarColor]);

  return (
    <Canvas type="2d" id={canvasId} className="bar-chart-canvas" onTouchEnd={handleTouchEnd} />
  );
}

// Aggregate data to ensure bar count doesn't exceed maxBars
function aggregateData(data: BarChartData[], maxBars: number): BarChartData[] {
  if (data.length <= maxBars) return data;

  // Calculate how many days to group together
  const groupSize = Math.ceil(data.length / maxBars);

  const result: BarChartData[] = [];
  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    const avgValue = group.reduce((sum, item) => sum + item.value, 0) / group.length;
    // Use first date of the group as label
    result.push({ date: group[0].date, value: avgValue });
  }

  return result;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rawData: BarChartData[],
  propMaxValue?: number,
  events: ChartEvent[] = [],
  getBarColor?: (value: number) => string,
): { event: ChartEvent; x: number }[] {
  const padding = { top: 30, right: 8, bottom: 40, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (rawData.length === 0) return [];

  // Aggregate data if too many bars
  const data = aggregateData(rawData, 60);

  // Calculate max value
  const maxDataValue = Math.max(...data.map((d) => d.value));
  const maxValue = propMaxValue ?? Math.max(maxDataValue, 5);

  // Draw horizontal grid lines with labels
  ctx.strokeStyle = "#e8e8e8";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const gridLines = Math.min(Math.round(maxValue), 5); // Show up to 5 grid lines
  for (let i = 0; i <= gridLines; i++) {
    const y = height - padding.bottom - (chartHeight * i) / gridLines;
    const value = Math.round((maxValue * i) / gridLines);

    // Label
    ctx.fillText(String(value), padding.left - 4, y);

    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Calculate bar width - adaptive based on data count
  const minBarWidth = 2;
  const maxBarWidth = 30;
  const minGap = 1;
  const maxGap = 4;

  // Calculate optimal bar width and gap
  let barWidth: number;
  let barGap: number;

  if (data.length === 1) {
    barWidth = maxBarWidth;
    barGap = 0;
  } else {
    // Start with max width and reduce if needed
    barWidth = Math.min(maxBarWidth, (chartWidth - minGap * (data.length - 1)) / data.length);
    barWidth = Math.max(minBarWidth, barWidth);

    // Calculate gap based on remaining space
    const totalBarWidth = barWidth * data.length;
    const remainingSpace = chartWidth - totalBarWidth;
    barGap = Math.min(maxGap, Math.max(minGap, remainingSpace / (data.length - 1)));
  }

  // Position bars - center if extra space, otherwise start at left edge
  const totalWidth = barWidth * data.length + barGap * (data.length - 1);
  const startX = padding.left + Math.max(0, (chartWidth - totalWidth) / 2);

  // Helper to convert date to X coordinate
  const dateToX = (date: string): number | null => {
    const index = data.findIndex((d) => d.date === date);
    if (index !== -1) {
      return startX + index * (barWidth + barGap) + barWidth / 2;
    }

    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    if (date < startDate || date > endDate) return null;

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].date <= date && date <= data[i + 1].date) {
        const x1 = startX + i * (barWidth + barGap) + barWidth / 2;
        const x2 = startX + (i + 1) * (barWidth + barGap) + barWidth / 2;
        const d1 = new Date(data[i].date).getTime();
        const d2 = new Date(data[i + 1].date).getTime();
        const d = new Date(date).getTime();
        const ratio = (d - d1) / (d2 - d1);
        return x1 + (x2 - x1) * ratio;
      }
    }
    return null;
  };

  // Draw event lines and collect positions
  const eventPositions: { event: ChartEvent; x: number }[] = [];
  const drawnEvents = events.filter((e) => dateToX(e.date) !== null);

  const eventsByX = new Map<number, ChartEvent[]>();
  for (const event of drawnEvents) {
    const x = dateToX(event.date)!;
    const roundedX = Math.round(x);
    if (!eventsByX.has(roundedX)) {
      eventsByX.set(roundedX, []);
    }
    eventsByX.get(roundedX)!.push(event);
  }

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.fillStyle = "#666";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (const [x, eventGroup] of eventsByX) {
    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    // Draw two-line label: date on top, description below
    const date = eventGroup[0].date.slice(2); // YY-MM-DD
    const label = eventGroup.map((e) => e.description).join(" / ");
    ctx.fillText(date, x, 2);
    ctx.fillText(label, x, 14);

    for (const event of eventGroup) {
      eventPositions.push({ event, x });
    }
  }

  ctx.setLineDash([]);

  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = startX + index * (barWidth + barGap);
    const y = height - padding.bottom - barHeight;

    ctx.fillStyle = getBarColor ? getBarColor(item.value) : "#5fcf9a";
    ctx.fillRect(x, y, barWidth, barHeight);
  });

  // Draw X axis labels - adaptive based on data count
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Determine label interval based on data count
  let labelInterval: number;
  if (data.length <= 7) {
    labelInterval = 1; // Show all labels
  } else if (data.length <= 31) {
    labelInterval = 7; // Weekly
  } else if (data.length <= 90) {
    labelInterval = 14; // Bi-weekly
  } else {
    labelInterval = 30; // Monthly
  }

  // Find the second-to-last interval label index and check if it would overlap with last label
  const secondToLastIntervalIndex = Math.floor((data.length - 2) / labelInterval) * labelInterval;
  const lastIndex = data.length - 1;

  // Calculate minimum spacing needed (label width ~50px for YY-MM-DD)
  const labelWidth = 50;
  const secondToLastX = startX + secondToLastIntervalIndex * (barWidth + barGap) + barWidth / 2;
  const lastX = startX + lastIndex * (barWidth + barGap) + barWidth / 2;
  const wouldOverlap = secondToLastIntervalIndex !== 0 && lastX - secondToLastX < labelWidth;

  data.forEach((item, index) => {
    // Skip second-to-last interval label only if it would overlap with last label
    if (index === secondToLastIntervalIndex && wouldOverlap) return;

    // Show first, last, and interval labels
    if (index === 0 || index === data.length - 1 || index % labelInterval === 0) {
      const x = startX + index * (barWidth + barGap) + barWidth / 2;
      // Format: YY-MM-DD
      const dateLabel = item.date.slice(2);

      // Align first label left, last label right, others center
      if (index === 0) {
        ctx.textAlign = "left";
      } else if (index === data.length - 1) {
        ctx.textAlign = "right";
      } else {
        ctx.textAlign = "center";
      }
      ctx.fillText(dateLabel, x, height - padding.bottom + 8);
    }
  });

  return eventPositions;
}
