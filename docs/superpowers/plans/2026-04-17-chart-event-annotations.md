# Chart Event Annotations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vertical annotation lines to mark important events/milestones on history charts, with labels always visible and tap-to-edit functionality.

**Architecture:** Events stored locally via `Taro.getStorageSync`/`setStorageSync`. Chart components receive events as props and draw vertical dashed lines with rotated labels. History page manages event CRUD and passes events to charts.

**Tech Stack:** Taro, React, Canvas 2D API, WeChat Mini Program storage

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/types/index.ts` | Add `ChartEvent` interface |
| `src/services/event.ts` | Event CRUD operations with local storage |
| `src/components/LineChart/index.tsx` | Draw event lines/labels, handle tap detection |
| `src/components/BarChart/index.tsx` | Draw event lines/labels, handle tap detection |
| `src/components/EventFormPopup/index.tsx` | Modal for adding/editing events |
| `src/components/EventFormPopup/index.css` | Styles for event form popup |
| `src/pages/history/index.tsx` | Event state management, add button, action sheet |
| `src/pages/history/index.css` | Styles for add event button |

---

### Task 1: Add ChartEvent Type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add ChartEvent interface**

Add at the end of `src/types/index.ts`:

```typescript
// 图表事件标注
export interface ChartEvent {
  id: string; // unique identifier (timestamp-based)
  date: string; // "2026-03-15"
  description: string; // "开始服用益生菌"
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "$(cat <<'EOF'
feat(chart): add ChartEvent type

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create Event Service

**Files:**
- Create: `src/services/event.ts`
- Create: `src/services/event.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/event.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { eventService } from "./event";
import Taro from "@tarojs/taro";
import { vi } from "vitest";

// Mock Taro storage
vi.mock("@tarojs/taro", () => ({
  default: {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
  },
}));

describe("eventService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Taro.getStorageSync as ReturnType<typeof vi.fn>).mockReturnValue([]);
  });

  describe("getAll", () => {
    it("returns empty array when no events stored", () => {
      const events = eventService.getAll();
      expect(events).toEqual([]);
    });

    it("returns stored events", () => {
      const mockEvents = [{ id: "1", date: "2026-03-15", description: "Test" }];
      (Taro.getStorageSync as ReturnType<typeof vi.fn>).mockReturnValue(mockEvents);

      const events = eventService.getAll();
      expect(events).toEqual(mockEvents);
    });
  });

  describe("add", () => {
    it("adds event and saves to storage", () => {
      const event = eventService.add("2026-03-15", "开始服用益生菌");

      expect(event.date).toBe("2026-03-15");
      expect(event.description).toBe("开始服用益生菌");
      expect(event.id).toBeDefined();
      expect(Taro.setStorageSync).toHaveBeenCalledWith(
        "chart_events",
        expect.arrayContaining([expect.objectContaining({ date: "2026-03-15" })]),
      );
    });
  });

  describe("update", () => {
    it("updates existing event", () => {
      const mockEvents = [{ id: "1", date: "2026-03-15", description: "Old" }];
      (Taro.getStorageSync as ReturnType<typeof vi.fn>).mockReturnValue(mockEvents);

      eventService.update("1", "2026-03-16", "New");

      expect(Taro.setStorageSync).toHaveBeenCalledWith("chart_events", [
        { id: "1", date: "2026-03-16", description: "New" },
      ]);
    });
  });

  describe("remove", () => {
    it("removes event by id", () => {
      const mockEvents = [
        { id: "1", date: "2026-03-15", description: "Keep" },
        { id: "2", date: "2026-03-16", description: "Remove" },
      ];
      (Taro.getStorageSync as ReturnType<typeof vi.fn>).mockReturnValue(mockEvents);

      eventService.remove("2");

      expect(Taro.setStorageSync).toHaveBeenCalledWith("chart_events", [
        { id: "1", date: "2026-03-15", description: "Keep" },
      ]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/event.test.ts`
Expected: FAIL with "Cannot find module './event'"

- [ ] **Step 3: Write minimal implementation**

Create `src/services/event.ts`:

```typescript
import Taro from "@tarojs/taro";
import type { ChartEvent } from "../types";

const STORAGE_KEY = "chart_events";

export const eventService = {
  getAll(): ChartEvent[] {
    return Taro.getStorageSync(STORAGE_KEY) || [];
  },

  add(date: string, description: string): ChartEvent {
    const events = this.getAll();
    const newEvent: ChartEvent = {
      id: Date.now().toString(),
      date,
      description,
    };
    events.push(newEvent);
    Taro.setStorageSync(STORAGE_KEY, events);
    return newEvent;
  },

  update(id: string, date: string, description: string): void {
    const events = this.getAll();
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      events[index] = { id, date, description };
      Taro.setStorageSync(STORAGE_KEY, events);
    }
  },

  remove(id: string): void {
    const events = this.getAll().filter((e) => e.id !== id);
    Taro.setStorageSync(STORAGE_KEY, events);
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/event.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/event.ts src/services/event.test.ts
git commit -m "$(cat <<'EOF'
feat(chart): add event service for local storage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create EventFormPopup Component

**Files:**
- Create: `src/components/EventFormPopup/index.tsx`
- Create: `src/components/EventFormPopup/index.css`

- [ ] **Step 1: Create component file**

Create `src/components/EventFormPopup/index.tsx`:

```typescript
import { View, Text, Input } from "@tarojs/components";
import { useState, useEffect } from "react";
import CalendarPopup from "../CalendarPopup";
import { formatDate } from "../../utils/date";
import type { ChartEvent } from "../../types";
import "./index.css";

interface EventFormPopupProps {
  visible: boolean;
  event?: ChartEvent; // if provided, we're editing
  onConfirm: (date: string, description: string) => void;
  onClose: () => void;
}

export default function EventFormPopup({
  visible,
  event,
  onConfirm,
  onClose,
}: EventFormPopupProps) {
  const [date, setDate] = useState(() => event?.date || formatDate());
  const [description, setDescription] = useState(() => event?.description || "");
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(event?.date || formatDate());
      setDescription(event?.description || "");
    }
  }, [visible, event]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (!description.trim()) return;
    onConfirm(date, description.trim());
  };

  return (
    <View className="event-form-mask" onClick={onClose}>
      <View className="event-form-popup" onClick={(e) => e.stopPropagation()}>
        <View className="event-form-header">
          <Text className="event-form-title">{event ? "编辑事件" : "添加事件"}</Text>
        </View>

        <View className="event-form-field">
          <Text className="event-form-label">日期</Text>
          <View className="event-form-date" onClick={() => setCalendarVisible(true)}>
            <Text>{date}</Text>
          </View>
        </View>

        <View className="event-form-field">
          <Text className="event-form-label">描述</Text>
          <Input
            className="event-form-input"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            placeholder="例如：开始服用益生菌"
            maxlength={20}
          />
        </View>

        <View className="event-form-actions">
          <View className="event-form-btn cancel" onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View
            className={`event-form-btn confirm ${!description.trim() ? "disabled" : ""}`}
            onClick={handleConfirm}
          >
            <Text>确定</Text>
          </View>
        </View>
      </View>

      <CalendarPopup
        visible={calendarVisible}
        value={date}
        onChange={setDate}
        onClose={() => setCalendarVisible(false)}
      />
    </View>
  );
}
```

- [ ] **Step 2: Create styles**

Create `src/components/EventFormPopup/index.css`:

```css
.event-form-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.event-form-popup {
  width: 80%;
  max-width: 600px;
  background-color: #fff;
  border-radius: 16px;
  padding: 32px;
}

.event-form-header {
  margin-bottom: 32px;
}

.event-form-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.event-form-field {
  margin-bottom: 24px;
}

.event-form-label {
  font-size: 26px;
  color: #666;
  margin-bottom: 12px;
  display: block;
}

.event-form-date {
  padding: 20px 24px;
  background-color: #f5f5f5;
  border-radius: 12px;
  font-size: 28px;
  color: #333;
}

.event-form-input {
  width: 100%;
  padding: 20px 24px;
  background-color: #f5f5f5;
  border-radius: 12px;
  font-size: 28px;
  color: #333;
}

.event-form-actions {
  display: flex;
  gap: 24px;
  margin-top: 32px;
}

.event-form-btn {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  border-radius: 12px;
  font-size: 28px;
}

.event-form-btn.cancel {
  background-color: #f5f5f5;
  color: #666;
}

.event-form-btn.confirm {
  background-color: #07c160;
  color: #fff;
}

.event-form-btn.confirm.disabled {
  background-color: #ccc;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EventFormPopup/index.tsx src/components/EventFormPopup/index.css
git commit -m "$(cat <<'EOF'
feat(chart): add EventFormPopup component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add Event Drawing to LineChart

**Files:**
- Modify: `src/components/LineChart/index.tsx`

- [ ] **Step 1: Update LineChart props interface**

In `src/components/LineChart/index.tsx`, update the imports and interface:

```typescript
import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useRef, useCallback } from "react";
import type { ChartEvent } from "../../types";
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
  events?: ChartEvent[];
  onEventTap?: (event: ChartEvent) => void;
}
```

- [ ] **Step 2: Update LineChart component to store event positions**

Update the component function to track event line positions and handle touch:

```typescript
export default function LineChart({
  data,
  unit,
  refMin,
  refMax,
  events = [],
  onEventTap,
}: LineChartProps) {
  const canvasId = useRef(`line-chart-${Date.now()}`).current;
  const eventPositionsRef = useRef<{ event: ChartEvent; x: number }[]>([]);
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  const handleTouchEnd = useCallback(
    (e: { changedTouches: { x: number }[] }) => {
      if (!onEventTap || eventPositionsRef.current.length === 0) return;

      const touchX = e.changedTouches[0].x;
      const hitThreshold = 20; // pixels

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

        canvasSizeRef.current = { width, height };
        const positions = drawChart(ctx, width, height, data, unit, refMin, refMax, events);
        eventPositionsRef.current = positions;
      });
  }, [data, unit, refMin, refMax, canvasId, events]);

  return (
    <Canvas
      type="2d"
      id={canvasId}
      className="line-chart-canvas"
      onTouchEnd={handleTouchEnd}
    />
  );
}
```

- [ ] **Step 3: Update drawChart function signature and add event drawing**

Update the `drawChart` function to accept events and return positions:

```typescript
function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: LineChartData[],
  unit?: string,
  refMin?: number,
  refMax?: number,
  events: ChartEvent[] = [],
): { event: ChartEvent; x: number }[] {
  const padding = { top: 20, right: 16, bottom: 50, left: 50 };
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

  // Helper to convert date to X coordinate
  const dateToX = (date: string): number | null => {
    const index = data.findIndex((d) => d.date === date);
    if (index !== -1) return indexToX(index);

    // Interpolate for dates between data points
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    if (date < startDate || date > endDate) return null;

    // Find surrounding dates
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].date <= date && date <= data[i + 1].date) {
        const x1 = indexToX(i);
        const x2 = indexToX(i + 1);
        // Simple linear interpolation based on date position
        const d1 = new Date(data[i].date).getTime();
        const d2 = new Date(data[i + 1].date).getTime();
        const d = new Date(date).getTime();
        const ratio = (d - d1) / (d2 - d1);
        return x1 + (x2 - x1) * ratio;
      }
    }
    return null;
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

  // Draw event lines and collect positions
  const eventPositions: { event: ChartEvent; x: number }[] = [];
  const drawnEvents = events.filter((e) => dateToX(e.date) !== null);

  // Group events by x position (same date)
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
  ctx.textBaseline = "top";

  for (const [x, eventGroup] of eventsByX) {
    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    // Draw labels (stacked vertically)
    ctx.save();
    ctx.translate(x - 4, height - padding.bottom - 8);
    ctx.rotate(-Math.PI / 2);

    let labelOffset = 0;
    for (const event of eventGroup) {
      ctx.fillText(event.description, labelOffset, 0);
      labelOffset += ctx.measureText(event.description).width + 8;
      eventPositions.push({ event, x });
    }

    ctx.restore();
  }

  ctx.setLineDash([]);

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

  return eventPositions;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LineChart/index.tsx
git commit -m "$(cat <<'EOF'
feat(chart): add event annotation support to LineChart

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Add Event Drawing to BarChart

**Files:**
- Modify: `src/components/BarChart/index.tsx`

- [ ] **Step 1: Update BarChart imports and props interface**

Update the imports and interface at the top of `src/components/BarChart/index.tsx`:

```typescript
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
  higherIsBetter?: boolean;
  events?: ChartEvent[];
  onEventTap?: (event: ChartEvent) => void;
}
```

- [ ] **Step 2: Update BarChart component function**

Update the component function:

```typescript
export default function BarChart({
  data,
  maxValue: propMaxValue,
  higherIsBetter = false,
  events = [],
  onEventTap,
}: BarChartProps) {
  const canvasId = useRef(`bar-chart-${Date.now()}`).current;
  const eventPositionsRef = useRef<{ event: ChartEvent; x: number }[]>([]);

  const handleTouchEnd = useCallback(
    (e: { changedTouches: { x: number }[] }) => {
      if (!onEventTap || eventPositionsRef.current.length === 0) return;

      const touchX = e.changedTouches[0].x;
      const hitThreshold = 20; // pixels

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

        const positions = drawChart(ctx, width, height, data, propMaxValue, higherIsBetter, events);
        eventPositionsRef.current = positions;
      });
  }, [data, propMaxValue, canvasId, higherIsBetter, events]);

  return (
    <Canvas
      type="2d"
      id={canvasId}
      className="bar-chart-canvas"
      onTouchEnd={handleTouchEnd}
    />
  );
}
```

- [ ] **Step 3: Update drawChart function signature and add event drawing**

Update `drawChart` to accept events and return positions:

```typescript
function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rawData: BarChartData[],
  propMaxValue?: number,
  higherIsBetter?: boolean,
  events: ChartEvent[] = [],
): { event: ChartEvent; x: number }[] {
  const padding = { top: 20, right: 8, bottom: 40, left: 16 };
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

  const gridLines = Math.min(Math.round(maxValue), 5);
  for (let i = 0; i <= gridLines; i++) {
    const y = height - padding.bottom - (chartHeight * i) / gridLines;
    const value = Math.round((maxValue * i) / gridLines);

    ctx.fillText(String(value), padding.left - 4, y);

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Calculate bar width
  const minBarWidth = 2;
  const maxBarWidth = 30;
  const minGap = 1;
  const maxGap = 4;

  let barWidth: number;
  let barGap: number;

  if (data.length === 1) {
    barWidth = maxBarWidth;
    barGap = 0;
  } else {
    barWidth = Math.min(maxBarWidth, (chartWidth - minGap * (data.length - 1)) / data.length);
    barWidth = Math.max(minBarWidth, barWidth);

    const totalBarWidth = barWidth * data.length;
    const remainingSpace = chartWidth - totalBarWidth;
    barGap = Math.min(maxGap, Math.max(minGap, remainingSpace / (data.length - 1)));
  }

  const totalWidth = barWidth * data.length + barGap * (data.length - 1);
  const startX = padding.left + Math.max(0, (chartWidth - totalWidth) / 2);

  // Helper to convert date to X coordinate
  const dateToX = (date: string): number | null => {
    const index = data.findIndex((d) => d.date === date);
    if (index !== -1) {
      return startX + index * (barWidth + barGap) + barWidth / 2;
    }

    // Check if date is within range
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    if (date < startDate || date > endDate) return null;

    // Interpolate
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

  // Group events by x position
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
  ctx.textBaseline = "top";

  for (const [x, eventGroup] of eventsByX) {
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    ctx.save();
    ctx.translate(x - 4, height - padding.bottom - 8);
    ctx.rotate(-Math.PI / 2);

    let labelOffset = 0;
    for (const event of eventGroup) {
      ctx.fillText(event.description, labelOffset, 0);
      labelOffset += ctx.measureText(event.description).width + 8;
      eventPositions.push({ event, x });
    }

    ctx.restore();
  }

  ctx.setLineDash([]);

  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = startX + index * (barWidth + barGap);
    const y = height - padding.bottom - barHeight;

    let color: string;
    const ratio = item.value / maxValue;
    if (higherIsBetter) {
      if (ratio >= 0.7) {
        color = "#07c160";
      } else if (ratio >= 0.4) {
        color = "#ffc300";
      } else {
        color = "#fa5151";
      }
    } else {
      if (ratio <= 0.3) {
        color = "#07c160";
      } else if (ratio <= 0.6) {
        color = "#ffc300";
      } else {
        color = "#fa5151";
      }
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barHeight);
  });

  // Draw X axis labels
  ctx.fillStyle = "#999";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  let labelInterval: number;
  if (data.length <= 7) {
    labelInterval = 1;
  } else if (data.length <= 31) {
    labelInterval = 7;
  } else if (data.length <= 90) {
    labelInterval = 14;
  } else {
    labelInterval = 30;
  }

  const secondToLastIntervalIndex = Math.floor((data.length - 2) / labelInterval) * labelInterval;

  data.forEach((item, index) => {
    if (index === secondToLastIntervalIndex && index !== 0) return;

    if (index === 0 || index === data.length - 1 || index % labelInterval === 0) {
      const x = startX + index * (barWidth + barGap) + barWidth / 2;
      const dateLabel = item.date.slice(5);
      ctx.fillText(dateLabel, x, height - padding.bottom + 8);
    }
  });

  return eventPositions;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BarChart/index.tsx
git commit -m "$(cat <<'EOF'
feat(chart): add event annotation support to BarChart

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Integrate Events into History Page

**Files:**
- Modify: `src/pages/history/index.tsx`
- Modify: `src/pages/history/index.css`

- [ ] **Step 1: Add imports and state**

Add at the top of `src/pages/history/index.tsx`, after existing imports:

```typescript
import EventFormPopup from "../../components/EventFormPopup";
import { eventService } from "../../services/event";
import type { ChartEvent } from "../../types";
```

Inside the `History` component function, add state after existing state declarations:

```typescript
// Event state
const [events, setEvents] = useState<ChartEvent[]>([]);
const [eventFormVisible, setEventFormVisible] = useState(false);
const [editingEvent, setEditingEvent] = useState<ChartEvent | undefined>(undefined);
```

- [ ] **Step 2: Load events on mount**

Update the `useDidShow` hook to load events:

```typescript
useDidShow(() => {
  // Load events
  setEvents(eventService.getAll());

  const { startDate, endDate } = getEffectiveDateRange();
  loadInitial(selectedType, startDate, endDate);
  if (selectedType === "stool") {
    loadStatsData(startDate, endDate);
  } else if (selectedType === "labtest") {
    loadLabtestStatsData(startDate, endDate);
  }
});
```

- [ ] **Step 3: Add event handlers**

Add event handler functions after the existing handlers:

```typescript
const handleAddEvent = () => {
  setEditingEvent(undefined);
  setEventFormVisible(true);
};

const handleEventTap = (event: ChartEvent) => {
  Taro.showActionSheet({
    itemList: ["编辑", "删除"],
  }).then((res) => {
    if (res.tapIndex === 0) {
      // Edit
      setEditingEvent(event);
      setEventFormVisible(true);
    } else if (res.tapIndex === 1) {
      // Delete
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
  }).catch(() => {
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
```

- [ ] **Step 4: Update renderChartView to include add button and pass events**

Replace the existing `renderChartView` function:

```typescript
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
```

- [ ] **Step 5: Update renderLabtestStatsView to include add button and pass events**

Replace the existing `renderLabtestStatsView` function:

```typescript
const renderLabtestStatsView = () => (
  <View className="stats-view">
    <View className="stats-header">
      <View className="stats-header-row">
        <Text className="stats-title">{FCP_INDICATOR.nameZh}趋势</Text>
        <View className="add-event-btn" onClick={handleAddEvent}>
          <Text>+ 事件</Text>
        </View>
      </View>
      <Text className="stats-range">
        参考范围: &lt;{FCP_INDICATOR.refMax} {FCP_INDICATOR.unit}
      </Text>
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
          unit={FCP_INDICATOR.unit}
          refMax={FCP_INDICATOR.refMax}
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
              className={`stats-data-value ${FCP_INDICATOR.refMax !== undefined && item.value > FCP_INDICATOR.refMax ? "out-of-range" : ""}`}
            >
              {item.value} {FCP_INDICATOR.unit}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
```

- [ ] **Step 6: Add EventFormPopup to the render**

At the end of the component's return statement, before the closing `</View>`, add:

```typescript
<EventFormPopup
  visible={eventFormVisible}
  event={editingEvent}
  onConfirm={handleEventFormConfirm}
  onClose={handleEventFormClose}
/>
```

- [ ] **Step 7: Add styles for add event button**

Add to `src/pages/history/index.css`:

```css
/* 统计视图头部行 */
.stats-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

/* 添加事件按钮 */
.add-event-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 24px;
  color: #666;
}

.add-event-btn:active {
  background-color: #e8e8e8;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/history/index.tsx src/pages/history/index.css
git commit -m "$(cat <<'EOF'
feat(chart): integrate event annotations into history page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Run Integration Tests

**Files:**
- None (testing only)

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Build the project**

Run: `pnpm build:weapp`
Expected: Build succeeds without errors

- [ ] **Step 3: Commit if any fixes were needed**

If any fixes were made:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(chart): address test/build issues

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```
