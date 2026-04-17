import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventService } from "./event";
import Taro from "@tarojs/taro";

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
