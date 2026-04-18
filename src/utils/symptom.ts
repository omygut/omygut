import type { SymptomItem, SymptomRecord } from "../types";

/**
 * Normalize symptom data from old or new format to SymptomItem[]
 * - New format: uses symptomItems field
 * - Old format: uses symptoms (string[]) + severity (shared)
 */
export function getSymptomItems(record: SymptomRecord): SymptomItem[] {
  // Prefer new field
  if (record.symptomItems && record.symptomItems.length > 0) {
    return record.symptomItems;
  }

  // Convert from old format
  if (record.symptoms && record.symptoms.length > 0) {
    const severity = record.severity ?? 1;
    return record.symptoms.map((name) => ({ name, severity }));
  }

  return [];
}
