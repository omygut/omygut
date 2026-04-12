import Taro from "@tarojs/taro";
import { createRecordService } from "./base";
import type { MedicationRecord } from "../types";

const baseService = createRecordService<MedicationRecord>("medication_records");

const RECENT_MEDICATIONS_KEY = "recent_medications";
const MAX_RECENT_MEDICATIONS = 50;

function getRecentMedications(): string[] {
  const stored = Taro.getStorageSync(RECENT_MEDICATIONS_KEY);
  return Array.isArray(stored) ? stored : [];
}

function addRecentMedications(medications: string[]) {
  const existing = getRecentMedications();
  const updated = [...medications, ...existing].slice(0, MAX_RECENT_MEDICATIONS);
  Taro.setStorageSync(RECENT_MEDICATIONS_KEY, updated);
}

export const medicationService = {
  ...baseService,

  async add(data: Omit<MedicationRecord, "_id" | "userId" | "createdAt">): Promise<string> {
    const id = await baseService.add(data);
    addRecentMedications([data.name]);
    return id;
  },

  getTopMedications(limit = 10): string[] {
    const recentMedications = getRecentMedications();
    const medicationCount = new Map<string, number>();
    for (const medication of recentMedications) {
      medicationCount.set(medication, (medicationCount.get(medication) || 0) + 1);
    }

    return [...medicationCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([medication]) => medication);
  },
};
