import { describe, it, expect, beforeEach, vi } from "vitest";
import { addStoolRecord, getRecentStoolRecords, deleteStoolRecord } from "./stool";

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

  describe("addStoolRecord", () => {
    it("should add a stool record and return id", async () => {
      const id = await addStoolRecord({
        date: "2026-04-11",
        time: "08:30",
        type: 4,
        color: "normal",
        amount: 2,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);
    });

    it("should add record with optional fields", async () => {
      const id = await addStoolRecord({
        date: "2026-04-11",
        time: "09:00",
        type: 6,
        color: "dark",
        amount: 1,
        hasBlood: true,
        hasMucus: false,
        note: "Not feeling well",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecentStoolRecords", () => {
    it("should return records for current user", async () => {
      await addStoolRecord({
        date: "2026-04-11",
        time: "08:30",
        type: 4,
        color: "normal",
        amount: 2,
      });

      const records = await getRecentStoolRecords(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should order by createdAt descending", async () => {
      const records = await getRecentStoolRecords(10);

      if (records.length >= 2) {
        for (let i = 0; i < records.length - 1; i++) {
          const current = new Date(records[i].createdAt).getTime();
          const next = new Date(records[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("deleteStoolRecord", () => {
    it("should delete a record", async () => {
      const id = await addStoolRecord({
        date: "2026-04-11",
        time: "10:00",
        type: 4,
        color: "normal",
        amount: 2,
      });

      const beforeRecords = await getRecentStoolRecords(100);
      const countBefore = beforeRecords.length;

      await deleteStoolRecord(id);

      const afterRecords = await getRecentStoolRecords(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });
  });
});
