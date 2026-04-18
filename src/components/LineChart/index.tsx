import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useCallback } from "react";
import { COLORS } from "../../constants/colors";
import type { ChartEvent } from "../../types";
import "./index.css";

export interface LineChartData {
  date: string;
  value: number;
  displayValue?: string; // Original display value (e.g., ">1800")
}

interface LineChartProps {
  data: LineChartData[];
  unit?: string;
  refMin?: number;
  refMax?: number;
  events?: ChartEvent[];
  onEventTap?: (event: ChartEvent) => void;
  startFromZero?: boolean; // Default true for backward compatibility
}

export default function LineChart({
  data,
  unit,
  refMin,
  refMax,
  events = [],
  onEventTap,
  startFromZero = true,
}: LineChartProps) {
  const canvasId = useRef(`line-chart-${Date.now()}`).current;
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

        const positions = drawChart(
          ctx,
          width,
          height,
          data,
          unit,
          refMin,
          refMax,
          events,
          startFromZero,
        );
        eventPositionsRef.current = positions;
      });
  }, [data, unit, refMin, refMax, canvasId, events, startFromZero]);

  return (
    <Canvas type="2d" id={canvasId} className="line-chart-canvas" onTouchEnd={handleTouchEnd} />
  );
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: LineChartData[],
  unit?: string,
  refMin?: number,
  refMax?: number,
  events: ChartEvent[] = [],
  startFromZero = true,
): { event: ChartEvent; x: number }[] {
  const padding = { top: 30, right: 16, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) return [];

  // Calculate value range
  const values = data.map((d) => d.value);
  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);

  // Include reference range in scale
  if (refMin !== undefined) minValue = Math.min(minValue, refMin);
  if (refMax !== undefined) maxValue = Math.max(maxValue, refMax);

  // Start from 0 unless there are negative values or startFromZero is false
  if (startFromZero && minValue >= 0) {
    minValue = 0;
  }

  // Add 10% padding to top
  const valueRange = maxValue - minValue || 1;
  maxValue = maxValue + valueRange * 0.1;

  // Helper to convert value to Y coordinate
  const valueToY = (v: number) => {
    return padding.top + chartHeight - ((v - minValue) / (maxValue - minValue)) * chartHeight;
  };

  // Calculate date range for proportional X positioning
  const timestamps = data.map((d) => new Date(d.date).getTime());
  const minTime = timestamps[0];
  const maxTime = timestamps[timestamps.length - 1];
  const timeRange = maxTime - minTime;

  // Helper to convert date to X coordinate (proportional to actual time)
  const dateToX = (date: string): number | null => {
    const time = new Date(date).getTime();
    if (time < minTime || time > maxTime) return null;
    if (timeRange === 0) return padding.left + chartWidth / 2;
    return padding.left + ((time - minTime) / timeRange) * chartWidth;
  };

  // Helper to get X coordinate for data point by index
  const dataPointX = (i: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return dateToX(data[i].date) ?? padding.left;
  };

  // Draw reference range area
  if (refMin !== undefined && refMax !== undefined) {
    const y1 = valueToY(refMax);
    const y2 = valueToY(refMin);
    ctx.fillStyle = "rgba(7, 193, 96, 0.1)";
    ctx.fillRect(padding.left, y1, chartWidth, y2 - y1);

    // Draw reference range lines
    ctx.strokeStyle = "rgba(7, 193, 96, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(padding.left, y1);
    ctx.lineTo(padding.left + chartWidth, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, y2);
    ctx.lineTo(padding.left + chartWidth, y2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // Draw Y axis grid lines and labels
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const value = minValue + ((maxValue - minValue) * i) / gridLines;
    const y = valueToY(value);

    // Label
    ctx.fillText(value.toFixed(1), padding.left - 8, y);

    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Draw unit label above Y axis
  if (unit) {
    ctx.fillStyle = "#999";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(unit, padding.left - 8, padding.top - 12);
  }

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

  // Draw line
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((point, i) => {
    const x = dataPointX(i);
    const y = valueToY(point.value);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  data.forEach((point, i) => {
    const x = dataPointX(i);
    const y = valueToY(point.value);

    // Determine if point is out of reference range
    const isOutOfRange =
      (refMin !== undefined && point.value < refMin) ||
      (refMax !== undefined && point.value > refMax);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isOutOfRange ? COLORS.red : COLORS.primary;
    ctx.fill();

    // White border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw X axis labels (dates) - select labels based on X position to avoid overlap
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textBaseline = "top";

  const labelWidth = 55; // Approximate width of YY-MM-DD label
  const labelsToShow: { i: number; x: number }[] = [];

  // Always try to show first and last
  if (data.length >= 1) {
    labelsToShow.push({ i: 0, x: dataPointX(0) });
  }
  if (data.length >= 2) {
    const lastX = dataPointX(data.length - 1);
    // Only add last if it doesn't overlap with first
    if (lastX - labelsToShow[0].x >= labelWidth) {
      labelsToShow.push({ i: data.length - 1, x: lastX });
    }
  }

  // Add middle labels if they don't overlap
  for (let i = 1; i < data.length - 1; i++) {
    const x = dataPointX(i);
    let canShow = true;
    for (const shown of labelsToShow) {
      if (Math.abs(x - shown.x) < labelWidth) {
        canShow = false;
        break;
      }
    }
    if (canShow) {
      labelsToShow.push({ i, x });
    }
  }

  // Sort by index for consistent rendering
  labelsToShow.sort((a, b) => a.i - b.i);

  labelsToShow.forEach(({ i, x }) => {
    const date = data[i].date;
    // Format: YY-MM-DD
    const dateLabel = date.slice(2);

    // Align first label left, last label right, others center
    if (i === 0) {
      ctx.textAlign = "left";
    } else if (i === data.length - 1) {
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "center";
    }
    ctx.fillText(dateLabel, x, height - padding.bottom + 8);
  });

  return eventPositions;
}
