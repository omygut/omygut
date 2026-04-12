import { describe, it, expect, beforeEach, vi } from "vitest";
import { medicationService } from "./medication";

// Mock getOpenId to return a test user
vi.mock("../utils/cloud", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/cloud")>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue("test_user_001"),
  };
});

describe("medication service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should add a medication record and return id", async () => {
      const id = await medicationService.add({
        date: "2026-04-11",
        time: "08:00",
        name: "美沙拉嗪",
        dosage: "1片",
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);
    });

    it("should add record without dosage", async () => {
      const id = await medicationService.add({
        date: "2026-04-11",
        time: "20:00",
        name: "益生菌",
        dosage: "",
      });

      expect(id).toBeDefined();
    });

    it("should add record with note", async () => {
      const id = await medicationService.add({
        date: "2026-04-11",
        time: "12:00",
        name: "奥美拉唑",
        dosage: "1粒",
        note: "饭前服用",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecent", () => {
    it("should return records for current user", async () => {
      await medicationService.add({
        date: "2026-04-11",
        time: "08:00",
        name: "美沙拉嗪",
        dosage: "1片",
      });

      const records = await medicationService.getRecent(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should respect limit parameter", async () => {
      for (let i = 0; i < 5; i++) {
        await medicationService.add({
          date: `2026-04-${10 + i}`,
          time: "08:00",
          name: "美沙拉嗪",
          dosage: "1片",
        });
      }

      const records = await medicationService.getRecent(3);
      expect(records.length).toBeLessThanOrEqual(3);
    });
  });

  describe("delete", () => {
    it("should delete a record", async () => {
      const id = await medicationService.add({
        date: "2026-04-11",
        time: "08:00",
        name: "美沙拉嗪",
        dosage: "1片",
      });

      const beforeRecords = await medicationService.getRecent(100);
      const countBefore = beforeRecords.length;

      await medicationService.delete(id);

      const afterRecords = await medicationService.getRecent(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });
  });
});
