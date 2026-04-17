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
