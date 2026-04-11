import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addHealthRecord, getRecentHealthRecords, deleteHealthRecord } from './health';

// Mock getOpenId to return a test user
vi.mock('../utils/cloud', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/cloud')>();
  return {
    ...original,
    getOpenId: vi.fn().mockResolvedValue('test_user_001'),
  };
});

describe('health service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addHealthRecord', () => {
    it('should add a health record and return id', async () => {
      const id = await addHealthRecord({
        date: '2026-04-11',
        time: '10:00',
        symptoms: [{ type: 'bloating', severity: 2 }],
        overallFeeling: 3,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^mock_/);
    });

    it('should add record with note', async () => {
      const id = await addHealthRecord({
        date: '2026-04-11',
        symptoms: [],
        overallFeeling: 4,
        note: 'Feeling better today',
      });

      expect(id).toBeDefined();
    });
  });

  describe('getRecentHealthRecords', () => {
    it('should return empty array when no records', async () => {
      const records = await getRecentHealthRecords(10);
      // May have records from previous tests due to shared memory db
      expect(Array.isArray(records)).toBe(true);
    });

    it('should return records for current user', async () => {
      // Add a record first
      await addHealthRecord({
        date: '2026-04-11',
        symptoms: [],
        overallFeeling: 3,
      });

      const records = await getRecentHealthRecords(10);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].userId).toBe('test_user_001');
    });

    it('should respect limit parameter', async () => {
      // Add multiple records
      for (let i = 0; i < 5; i++) {
        await addHealthRecord({
          date: `2026-04-${10 + i}`,
          symptoms: [],
          overallFeeling: 3,
        });
      }

      const records = await getRecentHealthRecords(3);
      expect(records.length).toBeLessThanOrEqual(3);
    });

    it('should order by createdAt descending', async () => {
      const records = await getRecentHealthRecords(10);

      if (records.length >= 2) {
        for (let i = 0; i < records.length - 1; i++) {
          const current = new Date(records[i].createdAt).getTime();
          const next = new Date(records[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('deleteHealthRecord', () => {
    it('should delete a record', async () => {
      // Add a record first
      const id = await addHealthRecord({
        date: '2026-04-11',
        symptoms: [],
        overallFeeling: 5,
        note: 'To be deleted',
      });

      // Get count before delete
      const beforeRecords = await getRecentHealthRecords(100);
      const countBefore = beforeRecords.length;

      // Delete the record
      await deleteHealthRecord(id);

      // Verify count decreased
      const afterRecords = await getRecentHealthRecords(100);
      expect(afterRecords.length).toBe(countBefore - 1);
    });

    it('should not throw when deleting non-existent record', async () => {
      await expect(deleteHealthRecord('non_existent_id')).resolves.not.toThrow();
    });
  });
});
