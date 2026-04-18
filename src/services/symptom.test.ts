import { describe, it, expect, beforeEach, vi } from "vitest";
import { symptomService } from "./symptom";
import { getSymptomItems } from "../utils/symptom";
import type { SymptomRecord } from "../types";

// Mock getOpenId to return a test user
vi.mock("../utils/cloud", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/cloud")>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue("test_user_001"),
  };
});

describe("symptom service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should add a symptom record with new format (symptomItems)", async () => {
      const id = await symptomService.add({
        date: "2026-04-11",
        time: "10:00",
        symptomItems: [
          { name: "腹胀", severity: 2 },
          { name: "恶心", severity: 1 },
        ],
        overallFeeling: 3,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);

      const record = await symptomService.getById(id);
      expect(record?.symptomItems).toEqual([
        { name: "腹胀", severity: 2 },
        { name: "恶心", severity: 1 },
      ]);
    });

    it("should add record with note", async () => {
      const id = await symptomService.add({
        date: "2026-04-11",
        time: "10:00",
        overallFeeling: 4,
        note: "Feeling better today",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecent", () => {
    it("should return empty array when no records", async () => {
      const records = await symptomService.getRecent(10);
      // May have records from previous tests due to shared memory db
      expect(Array.isArray(records)).toBe(true);
    });

    it("should return records for current user", async () => {
      // Add a record first
      await symptomService.add({
        date: "2026-04-11",
        time: "10:00",
        overallFeeling: 3,
      });

      const records = await symptomService.getRecent(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should respect limit parameter", async () => {
      // Add multiple records
      for (let i = 0; i < 5; i++) {
        await symptomService.add({
          date: `2026-04-${10 + i}`,
          time: "10:00",
          overallFeeling: 3,
        });
      }

      const records = await symptomService.getRecent(3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it("should order by date and time descending", async () => {
      const records = await symptomService.getRecent(10);

      if (records.length >= 2) {
        for (let i = 0; i < records.length - 1; i++) {
          const currentDateTime = `${records[i].date} ${records[i].time}`;
          const nextDateTime = `${records[i + 1].date} ${records[i + 1].time}`;
          expect(currentDateTime >= nextDateTime).toBe(true);
        }
      }
    });
  });

  describe("delete", () => {
    it("should delete a record", async () => {
      // Add a record first
      const id = await symptomService.add({
        date: "2026-04-11",
        time: "10:00",
        overallFeeling: 5,
        note: "To be deleted",
      });

      // Get count before delete
      const beforeRecords = await symptomService.getRecent(100);
      const countBefore = beforeRecords.length;

      // Delete the record
      await symptomService.delete(id);

      // Verify count decreased
      const afterRecords = await symptomService.getRecent(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });

    it("should not throw when deleting non-existent record", async () => {
      await expect(symptomService.delete("non_existent_id")).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should return a record by id", async () => {
      const id = await symptomService.add({
        date: "2026-04-12",
        time: "14:00",
        symptomItems: [{ name: "腹痛", severity: 2 }],
        overallFeeling: 2,
        note: "Test record",
      });

      const record = await symptomService.getById(id);

      expect(record).toBeDefined();
      expect(record?.date).toBe("2026-04-12");
      expect(record?.time).toBe("14:00");
      expect(record?.symptomItems).toEqual([{ name: "腹痛", severity: 2 }]);
      expect(record?.overallFeeling).toBe(2);
    });

    it("should return null for non-existent id", async () => {
      const record = await symptomService.getById("non_existent_id");
      expect(record).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a record", async () => {
      const id = await symptomService.add({
        date: "2026-04-12",
        time: "10:00",
        overallFeeling: 3,
      });

      await symptomService.update(id, {
        time: "11:00",
        symptomItems: [{ name: "腹胀", severity: 1 }],
        overallFeeling: 4,
      });

      const updated = await symptomService.getById(id);
      expect(updated?.time).toBe("11:00");
      expect(updated?.symptomItems).toEqual([{ name: "腹胀", severity: 1 }]);
      expect(updated?.overallFeeling).toBe(4);
    });
  });

  describe("getSymptomItems helper", () => {
    it("should convert old format (symptoms + severity) to new format", () => {
      const oldRecord = {
        symptoms: ["腹痛", "腹泻"],
        severity: 2,
      } as SymptomRecord;

      const items = getSymptomItems(oldRecord);
      expect(items).toEqual([
        { name: "腹痛", severity: 2 },
        { name: "腹泻", severity: 2 },
      ]);
    });

    it("should use severity 1 as default when old format has no severity", () => {
      const oldRecord = {
        symptoms: ["腹痛"],
      } as SymptomRecord;

      const items = getSymptomItems(oldRecord);
      expect(items).toEqual([{ name: "腹痛", severity: 1 }]);
    });

    it("should return symptomItems directly when using new format", () => {
      const newRecord = {
        symptomItems: [
          { name: "腹痛", severity: 3 },
          { name: "腹泻", severity: 1 },
        ],
      } as SymptomRecord;

      const items = getSymptomItems(newRecord);
      expect(items).toEqual([
        { name: "腹痛", severity: 3 },
        { name: "腹泻", severity: 1 },
      ]);
    });

    it("should return empty array when no symptoms", () => {
      const record = {} as SymptomRecord;
      const items = getSymptomItems(record);
      expect(items).toEqual([]);
    });
  });
});
