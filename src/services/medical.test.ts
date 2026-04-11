import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMedicalRecord, getRecentMedicalRecords, deleteMedicalRecord } from "./medical";

// Mock getOpenId to return a test user
vi.mock("../utils/cloud", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils/cloud")>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue("test_user_001"),
  };
});

describe("medical service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addMedicalRecord", () => {
    it("should add a medical record and return id", async () => {
      const id = await addMedicalRecord({
        date: "2026-04-11",
        images: ["cloud://test/image1.jpg"],
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^fake_/);
    });

    it("should add record with note", async () => {
      const id = await addMedicalRecord({
        date: "2026-04-11",
        images: ["cloud://test/image1.jpg", "cloud://test/image2.jpg"],
        note: "肠镜检查报告",
      });

      expect(id).toBeDefined();
    });
  });

  describe("getRecentMedicalRecords", () => {
    it("should return records for current user", async () => {
      await addMedicalRecord({
        date: "2026-04-11",
        images: ["cloud://test/image1.jpg"],
      });

      const records = await getRecentMedicalRecords(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe("test_user_001");
    });

    it("should respect limit parameter", async () => {
      for (let i = 0; i < 5; i++) {
        await addMedicalRecord({
          date: `2026-04-${10 + i}`,
          images: ["cloud://test/image.jpg"],
        });
      }

      const records = await getRecentMedicalRecords(3);
      expect(records.length).toBeLessThanOrEqual(3);
    });
  });

  describe("deleteMedicalRecord", () => {
    it("should delete a record", async () => {
      const id = await addMedicalRecord({
        date: "2026-04-11",
        images: ["cloud://test/image1.jpg"],
      });

      const beforeRecords = await getRecentMedicalRecords(100);
      const countBefore = beforeRecords.length;

      await deleteMedicalRecord(id);

      const afterRecords = await getRecentMedicalRecords(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });
  });
});
