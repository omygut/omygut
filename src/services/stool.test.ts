import { describe, it, expect, beforeEach, vi } from "vitest";
import { stoolService } from "./stool";

vi.mock("../utils/cloud", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/cloud")>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue("test_user_001"),
  };
});

describe("stool service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should add a stool record and return id", async () => {
      const id = await stoolService.add({
        date: "2026-04-11",
        time: "08:30",
        type: 4,
        amount: 2,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);
    });

    it("should add record with optional fields", async () => {
      const id = await stoolService.add({
        date: "2026-04-11",
        time: "09:00",
        type: 6,
        amount: 1,
        note: "带血、带粘液",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecent", () => {
    it("should return records for current user", async () => {
      await stoolService.add({
        date: "2026-04-11",
        time: "08:30",
        type: 4,
        amount: 2,
      });

      const records = await stoolService.getRecent(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should order by date and time descending", async () => {
      const records = await stoolService.getRecent(10);

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
      const id = await stoolService.add({
        date: "2026-04-11",
        time: "10:00",
        type: 4,
        amount: 2,
      });

      const beforeRecords = await stoolService.getRecent(100);
      const countBefore = beforeRecords.length;

      await stoolService.delete(id);

      const afterRecords = await stoolService.getRecent(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });
  });

  describe("getByDateRange", () => {
    it("should return records within date range ordered by date desc", async () => {
      await stoolService.add({ date: "2026-04-01", time: "08:00", type: 4, amount: 2 });
      await stoolService.add({ date: "2026-04-05", time: "09:00", type: 3, amount: 3 });
      await stoolService.add({ date: "2026-04-10", time: "10:00", type: 5, amount: 2 });

      const records = await stoolService.getByDateRange("2026-04-01", "2026-04-10");

      expect(records.length).toBeGreaterThanOrEqual(3);
      // Verify order is date desc
      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date >= records[i + 1].date).toBe(true);
      }
    });

    it("should return empty array when no records in range", async () => {
      const records = await stoolService.getByDateRange("2099-01-01", "2099-12-31");
      expect(records).toEqual([]);
    });

    it("should include records on boundary dates", async () => {
      const startDate = "2026-05-01";
      const endDate = "2026-05-03";

      await stoolService.add({ date: startDate, time: "08:00", type: 4, amount: 2 });
      await stoolService.add({ date: "2026-05-02", time: "09:00", type: 4, amount: 2 });
      await stoolService.add({ date: endDate, time: "10:00", type: 4, amount: 2 });

      const records = await stoolService.getByDateRange(startDate, endDate);

      const dates = records.map((r) => r.date);
      expect(dates).toContain(startDate);
      expect(dates).toContain(endDate);
    });
  });
});
