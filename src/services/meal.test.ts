import { describe, it, expect, beforeEach, vi } from "vitest";
import { mealService } from "./meal";

// Mock getOpenId to return a test user
vi.mock("../utils/cloud", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/cloud")>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue("test_user_001"),
  };
});

describe("meal service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should add a meal record and return id", async () => {
      const id = await mealService.add({
        date: "2026-04-11",
        time: "12:00",
        foods: ["米饭", "青菜"],
        amount: 2,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);
    });

    it("should add record with note", async () => {
      const id = await mealService.add({
        date: "2026-04-11",
        time: "08:00",
        foods: ["面包", "牛奶"],
        amount: 1,
        note: "早餐吃得少",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecent", () => {
    it("should return records for current user", async () => {
      await mealService.add({
        date: "2026-04-11",
        time: "12:00",
        foods: ["米饭"],
        amount: 2,
      });

      const records = await mealService.getRecent(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should respect limit parameter", async () => {
      for (let i = 0; i < 5; i++) {
        await mealService.add({
          date: `2026-04-${10 + i}`,
          time: "12:00",
          foods: ["米饭"],
          amount: 2,
        });
      }

      const records = await mealService.getRecent(3);
      expect(records.length).toBeLessThanOrEqual(3);
    });
  });

  describe("delete", () => {
    it("should delete a record", async () => {
      const id = await mealService.add({
        date: "2026-04-11",
        time: "12:00",
        foods: ["米饭"],
        amount: 2,
      });

      const beforeRecords = await mealService.getRecent(100);
      const countBefore = beforeRecords.length;

      await mealService.delete(id);

      const afterRecords = await mealService.getRecent(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });
  });

  describe("getByDate", () => {
    it("should return records for specific date", async () => {
      await mealService.add({
        date: "2026-04-15",
        time: "08:00",
        foods: ["早餐"],
        amount: 2,
      });
      await mealService.add({
        date: "2026-04-15",
        time: "12:00",
        foods: ["午餐"],
        amount: 2,
      });
      await mealService.add({
        date: "2026-04-16",
        time: "08:00",
        foods: ["其他日期"],
        amount: 2,
      });

      const records = await mealService.getByDate("2026-04-15");
      expect(records.length).toBe(2);
      expect(records.every((r) => r.date === "2026-04-15")).toBe(true);
    });

    it("should return empty array for date with no records", async () => {
      const records = await mealService.getByDate("2020-01-01");
      expect(records).toEqual([]);
    });
  });
});
