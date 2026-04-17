import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef } from "react";
import "./index.css";

export interface LineChartData {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  unit?: string;
  refMin?: number;
  refMax?: number;
}

export default function LineChart({ data, unit, refMin, refMax }: LineChartProps) {
  const canvasId = useRef(`line-chart-${Date.now()}`).current;

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

        drawChart(ctx, width, height, data, unit, refMin, refMax);
      });
  }, [data, unit, refMin, refMax, canvasId]);

  return <Canvas type="2d" id={canvasId} className="line-chart-canvas" />;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: LineChartData[],
  unit?: string,
  refMin?: number,
  refMax?: number,
) {
  const padding = { top: 20, right: 16, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) return;

  // Calculate value range
  const values = data.map((d) => d.value);
  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);

  // Include reference range in scale
  if (refMin !== undefined) minValue = Math.min(minValue, refMin);
  if (refMax !== undefined) maxValue = Math.max(maxValue, refMax);

  // Add 10% padding to value range
  const valueRange = maxValue - minValue || 1;
  minValue = minValue - valueRange * 0.1;
  maxValue = maxValue + valueRange * 0.1;

  // Helper to convert value to Y coordinate
  const valueToY = (v: number) => {
    return padding.top + chartHeight - ((v - minValue) / (maxValue - minValue)) * chartHeight;
  };

  // Helper to convert index to X coordinate
  const indexToX = (i: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (i / (data.length - 1)) * chartWidth;
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
  ctx.strokeStyle = "#e8e8e8";
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

  // Draw unit label
  if (unit) {
    ctx.fillStyle = "#999";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(unit, padding.left, 4);
  }

  // Draw line
  ctx.strokeStyle = "#07c160";
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((point, i) => {
    const x = indexToX(i);
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
    const x = indexToX(i);
    const y = valueToY(point.value);

    // Determine if point is out of reference range
    const isOutOfRange =
      (refMin !== undefined && point.value < refMin) ||
      (refMax !== undefined && point.value > refMax);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isOutOfRange ? "#fa5151" : "#07c160";
    ctx.fill();

    // White border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw X axis labels (dates)
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Show first, last, and some middle labels
  const labelIndices = getLabelIndices(data.length);
  labelIndices.forEach((i) => {
    const x = indexToX(i);
    const dateLabel = data[i].date.slice(5); // MM-DD
    ctx.fillText(dateLabel, x, height - padding.bottom + 8);
  });
}

function getLabelIndices(length: number): number[] {
  if (length <= 1) return [0];
  if (length <= 5) return Array.from({ length }, (_, i) => i);

  const indices = [0, length - 1];
  const step = Math.ceil((length - 2) / 3);
  for (let i = step; i < length - 1; i += step) {
    indices.push(i);
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}
