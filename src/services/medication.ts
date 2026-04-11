import { getDatabase, getOpenId } from "../utils/cloud";
import type { MedicationRecord } from "../types";

const COLLECTION = "medication_records";

// 添加用药记录
export async function addMedicationRecord(
  data: Omit<MedicationRecord, "_id" | "userId" | "createdAt">,
): Promise<string> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db.collection(COLLECTION).add({
    data: {
      ...data,
      userId,
      createdAt: new Date(),
    },
  });

  return res._id as string;
}

// 获取最近的用药记录
export async function getRecentMedicationRecords(limit: number = 20): Promise<MedicationRecord[]> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db
    .collection(COLLECTION)
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return res.data as MedicationRecord[];
}

// 删除用药记录
export async function deleteMedicationRecord(id: string): Promise<void> {
  const db = getDatabase();

  await db.collection(COLLECTION).doc(id).remove();
}
