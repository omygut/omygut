import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef } from "react";
import "./index.css";

export interface BarChartData {
  date: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  higherIsBetter?: boolean; // true: green for high values, false: green for low values
}

export default function BarChart({
  data,
  maxValue: propMaxValue,
  higherIsBetter = false,
}: BarChartProps) {
  const canvasId = useRef(`bar-chart-${Date.now()}`).current;

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

        drawChart(ctx, width, height, data, propMaxValue, higherIsBetter);
      });
  }, [data, propMaxValue, canvasId, higherIsBetter]);

  return <Canvas type="2d" id={canvasId} className="bar-chart-canvas" />;
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
  higherIsBetter?: boolean,
) {
  const padding = { top: 20, right: 8, bottom: 40, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (rawData.length === 0) return;

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

  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = startX + index * (barWidth + barGap);
    const y = height - padding.bottom - barHeight;

    // Bar color based on value
    let color: string;
    const ratio = item.value / maxValue;
    if (higherIsBetter) {
      // Higher is better: green for high, red for low
      if (ratio >= 0.7) {
        color = "#07c160"; // green
      } else if (ratio >= 0.4) {
        color = "#ffc300"; // yellow
      } else {
        color = "#fa5151"; // red
      }
    } else {
      // Lower is better: green for low, red for high
      if (ratio <= 0.3) {
        color = "#07c160"; // green
      } else if (ratio <= 0.6) {
        color = "#ffc300"; // yellow
      } else {
        color = "#fa5151"; // red
      }
    }

    ctx.fillStyle = color;
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

  // Find the second-to-last interval label index
  const secondToLastIntervalIndex = Math.floor((data.length - 2) / labelInterval) * labelInterval;

  data.forEach((item, index) => {
    // Skip second-to-last interval label to avoid overlap with last label
    if (index === secondToLastIntervalIndex && index !== 0) return;

    // Show first, last, and interval labels
    if (index === 0 || index === data.length - 1 || index % labelInterval === 0) {
      const x = startX + index * (barWidth + barGap) + barWidth / 2;
      const dateLabel = item.date.slice(5); // MM-DD
      ctx.fillText(dateLabel, x, height - padding.bottom + 8);
    }
  });
}
